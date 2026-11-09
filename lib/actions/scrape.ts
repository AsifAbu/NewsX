"use server";

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { requireRole } from "@/lib/require-role";
import { safeFetchHtml } from "@/lib/safe-fetch";

export type PulledArticle =
  | { title: string; imageUrl: string | null; body: string }
  | { error: string };

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

    const parsed = new Readability(doc).parse();
    if (!parsed || !parsed.content) {
      return { error: "Couldn't extract article content from that page. Try pasting it manually." };
    }

    const articleDom = new JSDOM(parsed.content);
    const blocks = Array.from(articleDom.window.document.body.querySelectorAll("p, h2, h3, li"))
      .map((el) => el.textContent?.trim())
      .filter((t): t is string => Boolean(t && t.length > 0));

    const body = blocks.join("\n\n");
    const title = parsed.title || ogTitle || doc.title || "";

    if (!title || !body) {
      return { error: "Couldn't extract a title or body from that page. Try pasting it manually." };
    }

    return { title, imageUrl: ogImage ?? null, body };
  } catch {
    return { error: "Something went wrong parsing that page. Try pasting it manually." };
  }
}
