"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavLinks({
  categories,
  onNavigate,
}: {
  categories: { id: string; name: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activeCategory = useSearchParams().get("category");
  const isLatestActive = pathname === "/" && !activeCategory;

  const stateClass = (active: boolean) =>
    active ? "text-accent" : "text-neutral-700 hover:text-accent";

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className={`whitespace-nowrap text-sm font-medium ${stateClass(isLatestActive)}`}
      >
        Latest
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/?category=${c.id}`}
          onClick={onNavigate}
          className={`whitespace-nowrap text-sm font-medium ${stateClass(activeCategory === c.id)}`}
        >
          {c.name}
        </Link>
      ))}
    </>
  );
}
