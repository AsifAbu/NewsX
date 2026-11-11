"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisitAction } from "@/lib/actions/traffic";

// Mounted once in the root layout - fires on every real navigation (initial
// load and every client-side route change alike), not on Link hover/
// prefetch, since prefetching doesn't run component effects.
export default function TrackVisit() {
  const pathname = usePathname();
  useEffect(() => {
    recordVisitAction();
  }, [pathname]);
  return null;
}
