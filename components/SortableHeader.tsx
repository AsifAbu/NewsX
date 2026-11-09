import Link from "next/link";
import type { SortDir } from "@/lib/sort";

// Renders inside a <th>. The arrow shows the CURRENT sort direction; the
// link toggles to the opposite one.
export default function SortableHeader({
  label,
  href,
  direction,
}: {
  label: string;
  href: string;
  direction: SortDir;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 hover:underline">
      {label}
      <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span>
    </Link>
  );
}
