export function timeAgo(date: Date | null | undefined): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function excerpt(body: string, length = 140, suffix = "…"): string {
  // body may be rich-text HTML now — strip markup before trimming so card
  // previews show plain text, not raw tags.
  const clean = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > length ? clean.slice(0, length).trimEnd() + suffix : clean;
}
