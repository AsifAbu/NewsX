// Pure string helpers for the news body's HTML <-> plain-text boundary — no
// server-only deps, so this is safe to import from client components too.
// The actual security gate (sanitize-html) lives in lib/sanitize.ts.

const BLOCK_CLOSE_TAGS = /<\/(p|h2|h3|li|blockquote)>/gi;
const BR_TAGS = /<br\s*\/?>/gi;
const ANY_TAG = /<[^>]+>/g;

// Old rows (pre-rich-text, plus scraped/rephrased plain text) have no markup
// at all — distinguishes those from real HTML so each can be handled right.
export function looksLikeHtml(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}

// Legacy plain text (blank-line-separated paragraphs) -> basic HTML, so it
// renders correctly through the same HTML pipeline as newly authored content.
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// HTML -> plain text, for feeding the AI summarize/rephrase models and for
// the "visible characters" length check — neither should see raw markup.
export function htmlToPlainText(html: string): string {
  return html
    .replace(BLOCK_CLOSE_TAGS, "\n\n")
    .replace(BR_TAGS, "\n")
    .replace(ANY_TAG, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Normalizes any stored body (old plain text or new HTML) to HTML, ready to
// sanitize and render.
export function toBodyHtml(body: string): string {
  return looksLikeHtml(body) ? body : plainTextToHtml(body);
}
