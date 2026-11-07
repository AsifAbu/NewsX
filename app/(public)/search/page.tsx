import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const results = query
    ? await prisma.news.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { publishedAt: "desc" },
        include: { categories: true },
        take: 20,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">
        {query ? `Results for "${query}"` : "Search"}
      </h1>

      {query && results.length === 0 && (
        <p className="text-neutral-500">No results found.</p>
      )}

      <ul className="divide-y divide-black/10">
        {results.map((n) => (
          <li key={n.id} className="py-3">
            <p className="text-xs uppercase text-neutral-500">
              {n.categories.map((c) => c.name).join(", ")}
            </p>
            <Link href={`/news/${n.slug}`} className="font-medium hover:text-accent">
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
