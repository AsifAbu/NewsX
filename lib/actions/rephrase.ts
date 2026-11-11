"use server";

import { requireRole } from "@/lib/require-role";
import { detectLanguage, getParaphraseModel, countWords, chunkByWords, SAFE_WORDS_PER_PASS, type Lang } from "@/lib/ai-models";
import { checkRateLimit } from "@/lib/rate-limit";

export type RephraseResult = { body: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;

async function rephraseChunk(lang: Lang, text: string): Promise<string> {
  const pipe = await getParaphraseModel(lang);
  const input = lang === "en" ? `paraphrase: ${text}` : text;
  const output = await pipe(input, {
    // Sized to the input, not a fixed cap - per the "no shortening" rule,
    // the model needs room to paraphrase in full without truncating.
    max_new_tokens: Math.max(256, Math.round(countWords(text) * 2)),
    num_beams: lang === "en" ? 5 : 4,
    early_stopping: true,
  });
  const result = Array.isArray(output) ? output[0] : output;
  return (result as { generated_text: string }).generated_text.trim();
}

async function rephraseParagraph(lang: Lang, text: string): Promise<string> {
  const safeWords = SAFE_WORDS_PER_PASS[lang];
  if (countWords(text) <= safeWords) {
    return rephraseChunk(lang, text);
  }
  // Paragraph alone exceeds the model's ~512-token input window - split by
  // sentence first so no part of it is silently dropped before paraphrasing.
  const subChunks = chunkByWords(text, safeWords);
  const rephrasedChunks: string[] = [];
  for (const chunk of subChunks) {
    rephrasedChunks.push(await rephraseChunk(lang, chunk));
  }
  return rephrasedChunks.join(" ");
}

export async function rephraseAction(text: string): Promise<RephraseResult> {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  if (!text || text.trim().length === 0) {
    return { error: "Nothing to rephrase yet — write or pull some content first." };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return { error: "That article is too long to rephrase." };
  }
  if (!(await checkRateLimit("rephrase", session.user.id, 20, 5 * 60 * 1000))) {
    return { error: "Too many requests. Please wait a bit and try again." };
  }

  const lang = detectLanguage(text);

  try {
    const paragraphs = text.split(/\n\s*\n/);
    // Sequential, not concurrent - each pass can now generate well past the
    // old fixed 256-token cap, so running many of these at once per request
    // would stack up memory on a tightly capped (Hobby-tier) host.
    const rephrased: string[] = [];
    for (const p of paragraphs) {
      rephrased.push(p.trim().length > 20 ? await rephraseParagraph(lang, p.trim()) : p);
    }
    return { body: rephrased.join("\n\n") };
  } catch (err) {
    console.error("rephraseAction failed:", err);
    return { error: "Couldn't rephrase that text. Try again, or edit it manually." };
  }
}
