"use server";

import path from "node:path";
import { pipeline, type Text2TextGenerationPipeline } from "@huggingface/transformers";
import { requireRole } from "@/lib/require-role";

export type RephraseResult = { body: string } | { error: string };

// Bengali script Unicode block — anything with a meaningful share of these
// characters is treated as Bangla; everything else as English.
const BENGALI_RANGE = /[ঀ-৿]/g;

function detectLanguage(text: string): "bn" | "en" {
  const bengaliChars = text.match(BENGALI_RANGE)?.length ?? 0;
  return bengaliChars / Math.max(text.length, 1) > 0.15 ? "bn" : "en";
}

// Cached per warm server instance — loading a ~260MB model on every call
// would be far too slow. See lib/db.ts for the same singleton pattern.
const pipelineCache: Partial<Record<"bn" | "en", Promise<Text2TextGenerationPipeline>>> = {};

function getPipeline(lang: "bn" | "en") {
  if (!pipelineCache[lang]) {
    const modelDir = path.join(process.cwd(), "models", lang === "bn" ? "paraphrase-bn" : "paraphrase-en");
    pipelineCache[lang] = pipeline("text2text-generation", modelDir, {
      local_files_only: true,
      dtype: "q8",
    }) as Promise<Text2TextGenerationPipeline>;
  }
  return pipelineCache[lang]!;
}

async function rephraseParagraph(lang: "bn" | "en", text: string): Promise<string> {
  const pipe = await getPipeline(lang);
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
  await requireRole(["MODERATOR", "ADMIN"]);

  if (!text || text.trim().length === 0) {
    return { error: "Nothing to rephrase yet — write or pull some content first." };
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
