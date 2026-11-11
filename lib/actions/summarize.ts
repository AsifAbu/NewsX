"use server";

import { requireSession } from "@/lib/require-role";
import {
  detectLanguage,
  getParaphraseModel,
  countWords,
  chunkByWords,
  stripRunawayRepetition,
  SAFE_WORDS_PER_PASS,
  type Lang,
} from "@/lib/ai-models";
import { checkRateLimit } from "@/lib/rate-limit";

export type SummarizeResult = { summary: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;

// 1 "line" ~= 22 words (confirmed with the user). The line-count target was
// lowered from 7-15 to 4-6 after direct testing against this model: pushed
// past ~120-140 words it visibly degrades (fragmented clauses, then filler
// words like "কিন্তু" repeated as connective tissue, before full token-level
// repetition at the extreme) - 7-15 lines (154-330 words) is not something
// this small on-device checkpoint can reliably produce.
const WORDS_PER_LINE = 22;
const MIN_LINES = 4;
const MAX_LINES = 6;
const SHORT_SUMMARY_LINES = 2;
const CHUNK_SUMMARY_WORDS = 60; // per-chunk compression target before the reduce pass

// Floors are aims, not guarantees - length_penalty does the work of biasing
// toward the fuller end, min_new_tokens just nudges it. The final pass gets
// a real nudge toward the line-count target; the chunk-reduce pass (an
// intermediate compression, not the user-facing output) only needs a small
// one. runSummarizePass clamps whichever is passed below its own max, so a
// short body's smaller ceiling can never create an invalid min > max call.
const FINAL_MIN_NEW_TOKENS = 100;
const CHUNK_MIN_NEW_TOKENS = 20;

async function runSummarizePass(lang: Lang, text: string, maxWords: number, minNewTokensAim: number): Promise<string> {
  const pipe = await getParaphraseModel(lang);
  const input = lang === "en" ? `summarize: ${text}` : text;
  const maxNewTokens = Math.round(maxWords * 1.6);
  const minNewTokens = Math.min(minNewTokensAim, Math.max(0, maxNewTokens - 10));
  const output = await pipe(input, {
    min_new_tokens: minNewTokens,
    max_new_tokens: maxNewTokens,
    length_penalty: 2.0,
    no_repeat_ngram_size: 3,
    num_beams: lang === "en" ? 5 : 4,
    early_stopping: true,
  });
  const result = Array.isArray(output) ? output[0] : output;
  return stripRunawayRepetition((result as { generated_text: string }).generated_text.trim());
}

// Trims to at most maxWords, cutting at the last full sentence that still
// fits rather than mid-sentence.
function trimToWordBudget(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  const truncated = words.slice(0, maxWords).join(" ");
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
    truncated.lastIndexOf("।")
  );
  return lastSentenceEnd > truncated.length * 0.5 ? truncated.slice(0, lastSentenceEnd + 1) : truncated;
}

// Map-reduce: the model can't see more than ~512 input tokens in one pass,
// so a long body is summarized chunk by chunk, then those chunk summaries
// are summarized again (recursively, if there were enough chunks that their
// summaries alone overflow one pass) down to a single combined text.
async function reduceToSinglePass(lang: Lang, text: string): Promise<string> {
  let combined = text;
  while (countWords(combined) > SAFE_WORDS_PER_PASS[lang]) {
    const chunks = chunkByWords(combined, SAFE_WORDS_PER_PASS[lang]);
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      chunkSummaries.push(await runSummarizePass(lang, chunk, CHUNK_SUMMARY_WORDS, CHUNK_MIN_NEW_TOKENS));
    }
    combined = chunkSummaries.join(" ");
  }
  return combined;
}

export async function summarizeAction(text: string): Promise<SummarizeResult> {
  const session = await requireSession();

  if (!text || text.trim().length === 0) {
    return { error: "Nothing to summarize." };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return { error: "That article is too long to summarize." };
  }
  if (!(await checkRateLimit("summarize", session.user.id, 20, 5 * 60 * 1000))) {
    return { error: "Too many requests. Please wait a bit and try again." };
  }

  const lang = detectLanguage(text);
  const bodyWords = countWords(text);
  const isShortBody = bodyWords < MIN_LINES * WORDS_PER_LINE;

  const targetMaxWords = isShortBody
    ? SHORT_SUMMARY_LINES * WORDS_PER_LINE
    : Math.min(MAX_LINES * WORDS_PER_LINE, Math.max(MIN_LINES * WORDS_PER_LINE, Math.round(bodyWords * 0.25)));

  try {
    const passText =
      bodyWords <= SAFE_WORDS_PER_PASS[lang] ? text : await reduceToSinglePass(lang, text);
    let summary = await runSummarizePass(lang, passText, targetMaxWords, FINAL_MIN_NEW_TOKENS);
    summary = trimToWordBudget(summary, targetMaxWords);

    if (!summary) {
      return { error: "Couldn't generate a summary for this article." };
    }
    return { summary };
  } catch (err) {
    console.error("summarizeAction failed:", err);
    return { error: "Couldn't summarize this article. Try again." };
  }
}
