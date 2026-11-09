"use server";

import { requireRole } from "@/lib/require-role";
import { detectLanguage, getParaphraseModel, type Lang } from "@/lib/ai-models";
import { checkRateLimit } from "@/lib/rate-limit";

export type RephraseResult = { body: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;

async function rephraseParagraph(lang: Lang, text: string): Promise<string> {
  const pipe = await getParaphraseModel(lang);
  const input = lang === "en" ? `paraphrase: ${text}` : text;
  const output = await pipe(input, {
    max_new_tokens: 256,
    num_beams: lang === "en" ? 5 : 4,
    early_stopping: true,
  });
  const result = Array.isArray(output) ? output[0] : output;
  return (result as { generated_text: string }).generated_text.trim();
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
    const rephrased = await Promise.all(
      paragraphs.map((p) => (p.trim().length > 20 ? rephraseParagraph(lang, p.trim()) : p))
    );
    return { body: rephrased.join("\n\n") };
  } catch (err) {
    console.error("rephraseAction failed:", err);
    return { error: "Couldn't rephrase that text. Try again, or edit it manually." };
  }
}
