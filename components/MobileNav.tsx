"use client";

import { useState } from "react";
import NavLinks from "@/components/NavLinks";
import { SearchIcon } from "@/components/icons";

export default function MobileNav({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex h-8 w-8 shrink-0 flex-col items-center justify-center gap-1 rounded border border-black/10 md:hidden"
      >
        <span className="block h-0.5 w-5 bg-neutral-700" />
        <span className="block h-0.5 w-5 bg-neutral-700" />
        <span className="block h-0.5 w-5 bg-neutral-700" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-full z-50 border-t border-black/10 bg-white px-4 py-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-3">
              <NavLinks categories={categories} onNavigate={() => setOpen(false)} />
            </nav>
            <form action="/search" className="mt-4">
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3 py-2 transition focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20">
                <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  name="q"
                  placeholder="Search news..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
