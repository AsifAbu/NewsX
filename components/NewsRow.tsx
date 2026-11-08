import Link from "next/link";
import { timeAgo, excerpt } from "@/lib/format";

// Shared with app/(public)/page.tsx (category lists, Latest Updates) and
// components/AllNewsList.tsx (the paginated "All" view) so every news list
// row looks identical regardless of whether it's rendered server-side with a
// real Date, or client-side from a Server Action's serialized ISO string.
export type NewsRowItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: Date | string | null;
  categories: { name: string }[];
};

export function NewsRow({ item }: { item: NewsRowItem }) {
  const publishedAt =
    typeof item.publishedAt === "string" ? new Date(item.publishedAt) : item.publishedAt;

  return (
    <Link href={`/news/${item.slug}`} className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-xs uppercase text-neutral-500">
          {item.categories.map((c) => c.name).join(", ")}
        </p>
        <h3 className="font-bold leading-snug hover:text-accent">{item.title}</h3>
        <p className="mt-1 text-sm text-neutral-600">{excerpt(item.body)}</p>
        <p className="mt-2 text-xs text-neutral-400">{timeAgo(publishedAt)}</p>
      </div>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-24 w-32 shrink-0 rounded bg-neutral-100 object-contain"
        />
      )}
    </Link>
  );
}

export function NewsRowList({ items }: { items: NewsRowItem[] }) {
  return (
    <ul className="divide-y divide-black/10">
      {items.map((n) => (
        <li key={n.id}>
          <NewsRow item={n} />
        </li>
      ))}
    </ul>
  );
}
