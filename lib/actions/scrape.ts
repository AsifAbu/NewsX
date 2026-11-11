"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { requireRole } from "@/lib/require-role";
import { safeFetchHtml } from "@/lib/safe-fetch";
import { sanitizeNewsBody } from "@/lib/sanitize";
import { htmlToPlainText } from "@/lib/richtext";

export type PulledArticle =
  | { title: string; imageUrl: string | null; body: string; sourceName: string }
  | { error: string };

// Fallback when the page has no og:site_name — only handles hyphenated
// hosts ("the-daily-star.net" -> "The Daily Star"); a concatenated host
// ("thedailystar.net") just comes back capitalized as one word. The editor
// can always correct the pre-filled News Source field before publishing.
function deriveSourceNameFromHost(hostname: string): string {
  const host = hostname.replace(/^www\./, "");
  const base = host.split(".")[0] || host;
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Same photo, different CDN size variant, has a different full URL but the
// same filename — used to dedupe the hero image against itself and against
// whatever Readability happened to keep.
function imageKey(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() ?? url).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

const DECORATIVE = /avatar|logo|icon|thumbnail|social|share|sponsor|advert|\bad\b|widget|nav|menu|footer|header|sidebar|comment|related|banner/i;

// True for a byline avatar, logo, nav/footer icon, related-article-card
// thumbnail, ad slot, etc. — checked on the image itself and up to 6
// ancestors, since the giveaway class is usually on a wrapping container
// ("related-card-news", "author-avatar") rather than the <img> itself.
function isDecorativeImage(img: HTMLImageElement): boolean {
  if (DECORATIVE.test(img.className)) return true;
  let ancestor: Element | null = img.parentElement;
  let depth = 0;
  while (ancestor && depth < 6) {
    if (
      DECORATIVE.test(ancestor.className) ||
      DECORATIVE.test(ancestor.id || "") ||
      ["HEADER", "FOOTER", "NAV", "ASIDE"].includes(ancestor.tagName)
    ) {
      return true;
    }
    ancestor = ancestor.parentElement;
    depth++;
  }
  return false;
}

type ContentBlock = { type: "p"; text: string } | { type: "img"; src: string };

// Readability's own content-scoring strips <div>s that wrap only an image
// with no paragraph text, treating them as decorative/ad blocks — fine for
// genuine ad slots, but it misfires on sites that mark up every inline
// photo that way (confirmed on thedailystar.net: an 11-image photo essay
// came back with only the lead image). This walks the raw, unstripped page
// (Readability mutates the document it's given, so this must be a separate
// parse, not a post-hoc scan of the same `doc`) recording paragraphs and
// "content-sized" images in document order, so each recovered image can
// later be reinserted next to the paragraph it actually appeared beside —
// not just dumped at the end of the article.
function buildContentSequence(doc: Document, maxImages = 30): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const seenImg = new Set<string>();
  let imgCount = 0;
  for (const el of Array.from(doc.querySelectorAll("p, img"))) {
    if (el.tagName === "P") {
      const text = normalizeText(el.textContent || "");
      if (text.length >= 20) blocks.push({ type: "p", text });
      continue;
    }
    if (imgCount >= maxImages) continue;
    const img = el as HTMLImageElement;
    const src = img.src;
    if (!src || !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(src)) continue;
    const width = parseInt(img.getAttribute("width") || "0", 10);
    if (width && width < 200) continue;
    if (isDecorativeImage(img)) continue;
    const key = imageKey(src);
    if (seenImg.has(key)) continue;
    seenImg.add(key);
    blocks.push({ type: "img", src });
    imgCount++;
  }
  return blocks;
}

type ImageAnchor = { src: string; afterText: string | null; beforeText: string | null };

// For each image, the nearest paragraph text before it in the original
// flow (to insert the image right after that paragraph) — or, if it had no
// preceding paragraph, the nearest one after it (to insert right before).
function computeImageAnchors(blocks: ContentBlock[]): ImageAnchor[] {
  const anchors: ImageAnchor[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type !== "img") continue;
    let afterText: string | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const candidate = blocks[j];
      if (candidate.type === "p") {
        afterText = candidate.text;
        break;
      }
    }
    let beforeText: string | null = null;
    if (!afterText) {
      for (let j = i + 1; j < blocks.length; j++) {
        const candidate = blocks[j];
        if (candidate.type === "p") {
          beforeText = candidate.text;
          break;
        }
      }
    }
    anchors.push({ src: block.src, afterText, beforeText });
  }
  return anchors;
}

// Finds the matching paragraph in Readability's (differently-structured,
// but not differently-worded) output and inserts the image there. Several
// images anchored to the same paragraph (a mini-gallery) are chained in
// order after it, via `lastInsertedAfter`, rather than each one re-inserting
// right after the paragraph and reversing their relative order.
function insertImageAtAnchor(
  doc: Document,
  anchor: ImageAnchor,
  lastInsertedAfter: Map<Element, ChildNode>
): boolean {
  const matchText = anchor.afterText ?? anchor.beforeText;
  if (!matchText) return false;
  const prefix = matchText.slice(0, 60);
  const match = Array.from(doc.querySelectorAll("p")).find((p) => {
    const text = normalizeText(p.textContent || "");
    // Guards the fuzzy checks below: an empty/short candidate's sliced
    // prefix is "", and every string starts with "" — without this, every
    // anchor would vacuously "match" the first blank <p> in the document.
    if (text.length < 20) return false;
    return text === matchText || text.startsWith(prefix) || matchText.startsWith(text.slice(0, 60));
  });
  if (!match || !match.parentNode) return false;

  const img = doc.createElement("img");
  img.setAttribute("src", anchor.src);
  img.setAttribute("alt", "");

  if (anchor.afterText) {
    const afterNode = lastInsertedAfter.get(match) ?? match;
    match.parentNode.insertBefore(img, afterNode.nextSibling);
    lastInsertedAfter.set(match, img);
  } else {
    match.parentNode.insertBefore(img, match);
  }
  return true;
}

export async function pullArticleAction(url: string): Promise<PulledArticle> {
  await requireRole(["MODERATOR", "ADMIN"]);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }

  let html: string;
  try {
    html = await safeFetchHtml(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reach that URL." };
  }

  try {
    const dom = new JSDOM(html, { url: parsedUrl.toString() });
    const doc = dom.window.document;

    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content");

    // Readability mutates the document it's given, so this needs its own
    // independent parse of the same raw HTML — scanning `doc` after
    // `.parse()` would see Readability's already-stripped DOM.
    const harvestDom = new JSDOM(html, { url: parsedUrl.toString() });
    const contentBlocks = buildContentSequence(harvestDom.window.document);
    const imageAnchors = computeImageAnchors(contentBlocks);

    // keepClasses: Readability strips class attributes from its output by
    // default, which would make isDecorativeImage() below blind to images
    // it kept (e.g. a byline avatar) — sanitizeNewsBody() strips class
    // attributes again before anything is saved, so this doesn't leak into
    // stored content.
    const parsed = new Readability(doc, { keepClasses: true }).parse();
    if (!parsed || !parsed.content) {
      return { error: "Couldn't extract article content from that page. Try pasting it manually." };
    }

    // Readability's output already keeps whatever images, lists, and basic
    // inline formatting it decided to — sanitize it with the same allowlist
    // gate used for editor-authored content instead of flattening to plain
    // text, which used to throw every in-body image away.
    const articleDom = new JSDOM(parsed.content);
    const keptKeys = new Set<string>();
    if (ogImage) keptKeys.add(imageKey(ogImage));
    articleDom.window.document.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      const key = imageKey(src);
      // Readability often repeats the lead/hero image as the first inline
      // image too — drop that occurrence so it isn't shown twice. Also drop
      // byline avatars etc. that Readability kept as part of the content.
      if (key === imageKey(ogImage ?? "") || isDecorativeImage(img)) {
        img.remove();
        return;
      }
      keptKeys.add(key);
    });

    // Reinsert each recovered image next to the paragraph it actually
    // appeared beside in the original article, instead of dumping them all
    // at the end — anything that can't be matched (its anchor paragraph
    // wasn't kept by Readability either) still gets appended as a fallback.
    const lastInsertedAfter = new Map<Element, ChildNode>();
    const unplaced: string[] = [];
    for (const anchor of imageAnchors) {
      if (keptKeys.has(imageKey(anchor.src))) continue;
      const placed = insertImageAtAnchor(articleDom.window.document, anchor, lastInsertedAfter);
      if (placed) {
        keptKeys.add(imageKey(anchor.src));
      } else {
        unplaced.push(anchor.src);
      }
    }
    const extraImagesHtml = unplaced.map((src) => `<img src="${src}" alt="">`).join("");

    const body = sanitizeNewsBody(articleDom.window.document.body.innerHTML + extraImagesHtml);
    const title = parsed.title || ogTitle || doc.title || "";

    if (!title || !htmlToPlainText(body).trim()) {
      return { error: "Couldn't extract a title or body from that page. Try pasting it manually." };
    }

    const sourceName = ogSiteName?.trim() || deriveSourceNameFromHost(parsedUrl.hostname);

    return { title, imageUrl: ogImage ?? null, body, sourceName };
  } catch {
    return { error: "Something went wrong parsing that page. Try pasting it manually." };
  }
}
