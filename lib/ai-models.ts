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

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Conservative word ceiling per model pass. The underlying T5-base checkpoint
// (see models/paraphrase-*/config.json: n_positions: 512) truncates silently
// past 512 input tokens - these leave headroom under that, more for Bangla
// since it tokenizes to more subwords per word than English.
export const SAFE_WORDS_PER_PASS: Record<Lang, number> = { en: 320, bn: 220 };

// Packs blank-line-separated paragraphs into chunks of at most maxWords each,
// so a long body can be fed to the model in pieces it can actually see in
// full, instead of being silently truncated past its input window. A single
// paragraph longer than maxWords on its own is split by sentence instead.
export function chunkByWords(text: string, maxWords: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flushCurrent = () => {
    if (current.length) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }
  };

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);
    if (paragraphWords > maxWords) {
      flushCurrent();
      const sentences = paragraph.split(/(?<=[.!?।])\s+/);
      let sentenceChunk: string[] = [];
      let sentenceWords = 0;
      for (const sentence of sentences) {
        const w = countWords(sentence);
        if (sentenceWords + w > maxWords && sentenceChunk.length) {
          chunks.push(sentenceChunk.join(" "));
          sentenceChunk = [];
          sentenceWords = 0;
        }
        sentenceChunk.push(sentence);
        sentenceWords += w;
      }
      if (sentenceChunk.length) chunks.push(sentenceChunk.join(" "));
      continue;
    }
    if (currentWords + paragraphWords > maxWords) flushCurrent();
    current.push(paragraph);
    currentWords += paragraphWords;
  }
  flushCurrent();
  return chunks;
}
