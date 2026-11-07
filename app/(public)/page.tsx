import Link from "next/link";
import { prisma } from "@/lib/db";
import { timeAgo, excerpt } from "@/lib/format";

export default async function DashboardPage() {
  const [latest, mostViewed] = await Promise.all([
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 9,
      include: { category: true },
    }),
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 6,
    }),
  ]);

  const [featured, ...rest] = latest;
  const headlines = rest.slice(0, 4);
  const grid = rest.slice(4);

  if (!featured) {
    return (
      <p className="text-neutral-600">
        No published articles yet. Once a Moderator or Admin publishes one, it shows up here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Headlines hero: featured story + headlines list, FR-1.1/1.4 */}
      <section className="grid gap-6 md:grid-cols-3">
        <Link
          href={`/news/${featured.slug}`}
          className="group relative block overflow-hidden rounded-lg md:col-span-2"
        >
          {featured.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="h-72 w-full object-cover transition group-hover:opacity-90"
            />
          )}
          <div className="mt-3">
            <p className="text-xs uppercase text-accent">
              {featured.category.name} · {timeAgo(featured.publishedAt)}
            </p>
            <h1 className="font-headline text-2xl font-bold leading-snug">{featured.title}</h1>
          </div>
        </Link>

        <div className="rounded-lg border border-black/10 p-4">
          <h2 className="mb-3 font-headline text-lg font-bold">Headlines</h2>
          <ul className="space-y-3">
            {headlines.map((n) => (
              <li key={n.id}>
                <p className="text-xs uppercase text-neutral-500">
                  {n.category.name} · {timeAgo(n.publishedAt)}
                </p>
                <Link href={`/news/${n.slug}`} className="text-sm font-medium hover:text-accent">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Body: Latest Updates list + Most Viewed sidebar, FR-1.1/1.6 */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <h2 className="font-headline text-xl font-bold">Latest Updates</h2>
          <ul className="divide-y divide-black/10">
            {grid.map((n) => (
              <li key={n.id}>
                <Link href={`/news/${n.slug}`} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="text-xs uppercase text-neutral-500">{n.category.name}</p>
                    <h3 className="font-medium leading-snug hover:text-accent">{n.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{excerpt(n.body)}</p>
                    <p className="mt-2 text-xs text-neutral-400">{timeAgo(n.publishedAt)}</p>
                  </div>
                  {n.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      className="h-24 w-32 shrink-0 rounded object-cover"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <h2 className="font-headline text-xl font-bold">Most Viewed</h2>
          <ol className="mt-3 space-y-3">
            {mostViewed.map((n, i) => (
              <li key={n.id} className="flex gap-3">
                <span className="font-headline text-xl text-neutral-300">{i + 1}</span>
                <div>
                  <Link href={`/news/${n.slug}`} className="text-sm font-medium hover:text-accent">
                    {n.title}
                  </Link>
                  <p className="text-xs text-neutral-500">{n.viewCount} views</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </div>
  );
}
