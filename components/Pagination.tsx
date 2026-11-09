import Link from "next/link";
import { paginationRange } from "@/lib/pagination";

const base = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm";
const idleClass = `${base} border-neutral-200 text-neutral-600 hover:bg-neutral-50`;
const activeClass = `${base} border-accent bg-accent text-white`;
const inertClass = `${base} border-neutral-200 text-neutral-300 cursor-default select-none`;

export default function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  // Always render the control, even with a single page, so the UI is
  // consistent as a list grows — but with nothing to navigate to, every
  // element is an inert <span>, not a clickable <Link>.
  const disabled = totalPages <= 1;
  const pages = disabled ? [1] : paginationRange(page, totalPages);

  function arrow(symbol: string, target: number, atBoundary: boolean, label: string) {
    if (disabled || atBoundary) {
      return (
        <span key={label} aria-disabled="true" aria-label={label} className={inertClass}>
          {symbol}
        </span>
      );
    }
    return (
      <Link key={label} href={buildHref(target)} aria-label={label} className={idleClass}>
        {symbol}
      </Link>
    );
  }

  return (
    <nav className="flex items-center justify-end gap-1.5 pt-4 text-sm" aria-label="Pagination">
      {arrow("«", 1, page === 1, "First page")}
      {arrow("‹", Math.max(1, page - 1), page === 1, "Previous page")}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-neutral-400">
            …
          </span>
        ) : disabled ? (
          <span key={p} aria-current="page" aria-disabled="true" className={`${activeClass} cursor-default select-none`}>
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? activeClass : idleClass}
          >
            {p}
          </Link>
        )
      )}

      {arrow("›", Math.min(totalPages, page + 1), page === totalPages, "Next page")}
      {arrow("»", totalPages, page === totalPages, "Last page")}
    </nav>
  );
}
