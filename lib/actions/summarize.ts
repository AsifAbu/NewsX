"use server";

import { requireSession } from "@/lib/require-role";
import {
  detectLanguage,
  getParaphraseModel,
  countWords,
  chunkByWords,
  SAFE_WORDS_PER_PASS,
  type Lang,
} from "@/lib/ai-models";
import { checkRateLimit } from "@/lib/rate-limit";

export type SummarizeResult = { summary: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;

// 1 "line" ~= 22 words (confirmed with the user) - turns the 7-15 line
// summary requirement into a word budget the model can actually be given.
const WORDS_PER_LINE = 22;
const MIN_LINES = 7;
const MAX_LINES = 15;
const SHORT_SUMMARY_LINES = 3;
const CHUNK_SUMMARY_WORDS = 60; // per-chunk compression target before the reduce pass

async function runSummarizePass(lang: Lang, text: string, minWords: number, maxWords: number): Promise<string> {
  const pipe = await getParaphraseModel(lang);
  const input = lang === "en" ? `summarize: ${text}` : text;
  const output = await pipe(input, {
    // ~1.3-1.6 subword tokens per word on this tokenizer for short news
    // prose - generous on purpose so generation isn't cut off before the
    // word-budget trim below ever runs.
    min_new_tokens: Math.round(minWords * 1.3),
    max_new_tokens: Math.round(maxWords * 1.6),
    num_beams: lang === "en" ? 5 : 4,
    early_stopping: true,
  });
  const result = Array.isArray(output) ? output[0] : output;
  return (result as { generated_text: string }).generated_text.trim();
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
      chunkSummaries.push(await runSummarizePass(lang, chunk, 20, CHUNK_SUMMARY_WORDS));
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
  const targetMinWords = isShortBody ? Math.round(targetMaxWords * 0.6) : MIN_LINES * WORDS_PER_LINE;

  try {
    const passText =
      bodyWords <= SAFE_WORDS_PER_PASS[lang] ? text : await reduceToSinglePass(lang, text);
    let summary = await runSummarizePass(lang, passText, targetMinWords, targetMaxWords);
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
