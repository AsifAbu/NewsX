import path from "node:path";
import { pipeline, type Text2TextGenerationPipeline } from "@huggingface/transformers";

export type Lang = "bn" | "en";

// Bengali script Unicode block — anything with a meaningful share of these
// characters is treated as Bangla; everything else as English.
const BENGALI_RANGE = /[ঀ-৿]/g;

export function detectLanguage(text: string): Lang {
  const bengaliChars = text.match(BENGALI_RANGE)?.length ?? 0;
  return bengaliChars / Math.max(text.length, 1) > 0.15 ? "bn" : "en";
}

// Cached per warm server instance and shared across every feature that uses
// these models (Rephrase, Summarize) — loading a ~260MB model more than
// once would double memory use for no reason. See lib/db.ts for the same
// singleton pattern applied to the Prisma client.
const pipelineCache: Partial<Record<Lang, Promise<Text2TextGenerationPipeline>>> = {};

export function getParaphraseModel(lang: Lang) {
  if (!pipelineCache[lang]) {
    const modelDir = path.join(process.cwd(), "models", lang === "bn" ? "paraphrase-bn" : "paraphrase-en");
    pipelineCache[lang] = pipeline("text2text-generation", modelDir, {
      local_files_only: true,
      dtype: "q8",
    }) as Promise<Text2TextGenerationPipeline>;
  }
  return pipelineCache[lang]!;
}
