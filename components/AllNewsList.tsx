"use client";

import { useState, useTransition } from "react";
import { loadMoreNewsAction } from "@/lib/actions/news";
import { NewsRowList, type NewsRowItem } from "@/components/NewsRow";

const PAGE_SIZE = 10;

export default function AllNewsList({
  initialItems,
  initialHasMore,
}: {
  initialItems: NewsRowItem[];
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleMore() {
    startTransition(async () => {
      const next = await loadMoreNewsAction(items.length, PAGE_SIZE);
      setItems((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    });
  }

  if (items.length === 0) {
    return <p className="text-neutral-500">No published articles yet.</p>;
  }

  return (
    <div>
      <NewsRowList items={items} />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={hasMore ? handleMore : undefined}
          disabled={!hasMore || isPending}
          className={`rounded border px-4 py-1.5 text-sm transition ${
            hasMore
              ? "border-accent text-accent hover:bg-accent hover:text-white disabled:opacity-50"
              : "cursor-not-allowed border-neutral-300 text-neutral-400"
          }`}
        >
          {isPending ? "Loading..." : "More"}
        </button>
      </div>
    </div>
  );
}
