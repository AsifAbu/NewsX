"use client";

import { useState, useTransition } from "react";
import { summarizeAction } from "@/lib/actions/summarize";

export default function SummarizeToggle({
  bodyHtml,
  bodyText,
  children,
}: {
  // Pre-sanitized HTML, safe to render directly — see lib/sanitize.ts.
  bodyHtml: string;
  // Plain-text version, for the AI model (which shouldn't see markup).
  bodyText: string;
  children?: React.ReactNode;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (summary) {
      setSummary(null);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await summarizeAction(bodyText);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSummary(result.summary);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {children}
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="rounded border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-white disabled:opacity-50"
        >
          {isPending ? "Summarizing..." : summary ? "Hide Summary" : "Summarize"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {summary && (
        <div className="rounded border border-accent/30 bg-accent/5 p-4">
          <p className="mb-1 text-xs font-medium uppercase text-accent">Summary</p>
          <p className="text-neutral-800">{summary}</p>
        </div>
      )}

      <div
        className="prose max-w-none text-neutral-800"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}
