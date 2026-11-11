import sanitizeHtmlLib from "sanitize-html";
import { toBodyHtml } from "@/lib/richtext";

// The authoritative XSS gate for news body content — server-only (sanitize-
// html needs Node's DOM-less parser). Runs on every save AND on every
// render, so legacy rows, direct DB edits, and any future write path that
// forgets to call this are all still safe to render with
// dangerouslySetInnerHTML. Also the gate for content pulled from an external
// URL (lib/actions/scrape.ts) — the allowlist matches what
// components/RichTextEditor.tsx's toolbar can produce, plus heading levels
// a pulled article may use that the toolbar itself never emits (h1/h4-h6,
// remapped below rather than silently flattened to plain text).
export function sanitizeNewsBody(body: string): string {
  return sanitizeHtmlLib(toBodyHtml(body), {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
      h1: "h2",
      h4: "h3",
      h5: "h3",
      h6: "h3",
    },
  });
}
