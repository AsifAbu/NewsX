"use client";

import { useEffect, useRef } from "react";
import { incrementViewAction } from "@/lib/actions/news";

export default function IncrementView({ newsId }: { newsId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    incrementViewAction(newsId);
  }, [newsId]);
  return null;
}
