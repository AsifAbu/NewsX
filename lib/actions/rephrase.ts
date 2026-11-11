"use server";

import { JSDOM } from "jsdom";
import { requireRole } from "@/lib/require-role";
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

export type RephraseResult = { body: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;
// Text-bearing block tags - anything else (img, br, empty paragraphs) is
// left in place untouched, so images never move or disappear.
const TEXT_BLOCK_SELECTOR = "p, h2, h3, li, blockquote";

async function rephraseChunk(lang: Lang, text: string): Promise<string> {
  const pipe = await getParaphraseModel(lang);
  const input = lang === "en" ? `paraphrase: ${text}` : text;
  const output = await pipe(input, {
    // Sized to the input, not a fixed cap - the model needs room to
    // paraphrase in full without truncating.
    max_new_tokens: Math.max(256, Math.round(countWords(text) * 2)),
    no_repeat_ngram_size: 3,
    num_beams: lang === "en" ? 5 : 4,
    early_stopping: true,
  });
  const result = Array.isArray(output) ? output[0] : output;
  return stripRunawayRepetition((result as { generated_text: string }).generated_text.trim());
}

async function rephraseBlockText(lang: Lang, text: string): Promise<string> {
  const safeWords = SAFE_WORDS_PER_PASS[lang];
  if (countWords(text) <= safeWords) {
    return rephraseChunk(lang, text);
  }
  // Block alone exceeds the model's ~512-token input window - split by
  // sentence first so no part of it is silently dropped before paraphrasing.
  const subChunks = chunkByWords(text, safeWords);
  const rephrasedChunks: string[] = [];
  for (const chunk of subChunks) {
    rephrasedChunks.push(await rephraseChunk(lang, chunk));
  }
  return rephrasedChunks.join(" ");
}

export async function rephraseAction(bodyHtml: string): Promise<RephraseResult> {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  if (!bodyHtml || bodyHtml.trim().length === 0) {
    return { error: "Nothing to rephrase yet — write or pull some content first." };
  }
  if (bodyHtml.length > MAX_INPUT_LENGTH) {
    return { error: "That article is too long to rephrase." };
  }
  if (!(await checkRateLimit("rephrase", session.user.id, 20, 5 * 60 * 1000))) {
    return { error: "Too many requests. Please wait a bit and try again." };
  }

  try {
    const dom = new JSDOM(bodyHtml);
    const body = dom.window.document.body;
    const lang = detectLanguage(body.textContent || "");

    for (const block of Array.from(body.querySelectorAll(TEXT_BLOCK_SELECTOR))) {
      const text = (block.textContent || "").trim();
      // Below this, it's not worth a model call (an empty paragraph left
      // after an inserted image, a one-word heading) - leave it as-is.
      if (text.length <= 20) continue;
      block.textContent = await rephraseBlockText(lang, text);
    }

    // Images and anything outside the selector above were never touched,
    // so they stay exactly where they were in the document.
    return { body: body.innerHTML };
  } catch (err) {
    console.error("rephraseAction failed:", err);
    return { error: "Couldn't rephrase that text. Try again, or edit it manually." };
  }
}
