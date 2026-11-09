"use server";

import { requireSession } from "@/lib/require-role";
import { detectLanguage, getParaphraseModel } from "@/lib/ai-models";
import { checkRateLimit } from "@/lib/rate-limit";

export type SummarizeResult = { summary: string } | { error: string };

const MAX_INPUT_LENGTH = 20000;

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

  try {
    const pipe = await getParaphraseModel(lang);
    // These are paraphrase-tuned models, not dedicated summarizers — this is
    // a best-effort reuse of what's already loaded, not a trained summarizer.
    // Fed the whole article (not split by paragraph like Rephrase) so it
    // compresses across the piece rather than rewording each part in place.
    // English responds well to a "summarize:" prefix (likely retained from
    // T5's original pretraining); the Bangla checkpoint has no such prefix
    // convention, so it's given the plain text with a tight token budget.
    const input = lang === "en" ? `summarize: ${text}` : text;
    const output = await pipe(input, {
      max_new_tokens: 100,
      num_beams: lang === "en" ? 5 : 4,
      early_stopping: true,
    });
    const result = Array.isArray(output) ? output[0] : output;
    const summary = (result as { generated_text: string }).generated_text.trim();

    if (!summary) {
      return { error: "Couldn't generate a summary for this article." };
    }
    return { summary };
  } catch (err) {
    console.error("summarizeAction failed:", err);
    return { error: "Couldn't summarize this article. Try again." };
  }
}
