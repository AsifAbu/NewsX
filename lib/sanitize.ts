import sanitizeHtmlLib from "sanitize-html";
import { toBodyHtml } from "@/lib/richtext";

// The authoritative XSS gate for news body content — server-only (sanitize-
// html needs Node's DOM-less parser). Runs on every save AND on every
// render, so legacy rows, direct DB edits, and any future write path that
// forgets to call this are all still safe to render with
// dangerouslySetInnerHTML. Allowlist matches exactly the toolbar in
// components/RichTextEditor.tsx — nothing else is reachable through the
// editor, so nothing else needs to be allowed here.
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
    },
  });
}
