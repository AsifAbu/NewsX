import Link from "next/link";
import { prisma } from "@/lib/db";
import { timeAgo, excerpt } from "@/lib/format";

type NewsListItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  categories: { name: string }[];
};

function NewsListRows({ items }: { items: NewsListItem[] }) {
  return (
    <ul className="divide-y divide-black/10">
      {items.map((n) => (
        <li key={n.id}>
          <Link href={`/news/${n.slug}`} className="flex items-start justify-between gap-4 py-4">
            <div>
              <p className="text-xs uppercase text-neutral-500">
                {n.categories.map((c) => c.name).join(", ")}
              </p>
              <h3 className="font-bold leading-snug hover:text-accent">{n.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{excerpt(n.body)}</p>
              <p className="mt-2 text-xs text-neutral-400">{timeAgo(n.publishedAt)}</p>
            </div>
            {n.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.imageUrl}
                alt={n.title}
                className="h-24 w-32 shrink-0 rounded bg-neutral-100 object-contain"
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // Most Viewed and Latest Updates always show site-wide news — only the
  // hero area (5-card grid, or a category list in its place) is scoped.
  const [activeCategory, latest, mostViewed, categoryNews] = await Promise.all([
    category ? prisma.category.findUnique({ where: { id: category } }) : Promise.resolve(null),
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 9,
      include: { categories: true },
    }),
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 10,
    }),
    category
      ? prisma.news.findMany({
          where: { status: "PUBLISHED", categories: { some: { id: category } } },
          orderBy: { publishedAt: "desc" },
          take: 5,
          include: { categories: true },
        })
      : Promise.resolve(null),
  ]);

  const [featured, ...rest] = latest;
  const secondary = rest.slice(0, 4);
  // Unfiltered: the 4 secondary cards already used items 2-5, so Latest
  // Updates picks up from item 6. Filtered: the hero area shows category
  // news instead of secondary cards, so Latest Updates shows all of `rest`.
  const latestList = activeCategory ? rest : rest.slice(4);

  if (!featured) {
    return (
      <p className="text-neutral-600">
        No published articles yet. Once a Moderator or Admin publishes one, it shows up here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero block: featured story + 4 secondary cards (left) | Most Viewed, full block height (right).
          With a category selected, the left side swaps to a list of that category's news, followed
          immediately by Latest Updates in the same column — so a short category list doesn't leave a
          dead gap under the (taller, site-wide) Most Viewed column it's stretched to match. */}
      <section className="grid gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          {activeCategory ? (
            <>
              <div>
                <h2 className="mb-3 font-headline text-xl font-bold uppercase text-accent">
                  {activeCategory.name}
                </h2>
                {categoryNews && categoryNews.length > 0 ? (
                  <NewsListRows items={categoryNews} />
                ) : (
                  <p className="text-neutral-500">No published articles in {activeCategory.name} yet.</p>
                )}
              </div>

              {latestList.length > 0 && (
                <div className="border-t border-black/10 pt-6">
                  <h2 className="mb-3 font-headline text-xl font-bold">Latest Updates</h2>
                  <NewsListRows items={latestList} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <Link
                  href={`/news/${featured.slug}`}
                  className="group block overflow-hidden rounded-lg border border-black/10 md:col-span-2"
                >
                  {featured.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.imageUrl}
                      alt={featured.title}
                      className="h-72 w-full bg-neutral-100 object-contain transition group-hover:opacity-90"
                    />
                  )}
                  <div className="p-4">
                    <p className="text-xs uppercase text-accent">
                      {featured.categories.map((c) => c.name).join(", ")}
                    </p>
                    <h1 className="font-headline text-2xl font-bold leading-snug">{featured.title}</h1>
                    <p className="mt-2 text-sm text-neutral-600">
                      {excerpt(featured.body, 240, "")} <span>...</span>
                      <span className="font-bold">details</span>
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">{timeAgo(featured.publishedAt)}</p>
                  </div>
                </Link>

                {secondary[0] && (
                  <Link
                    href={`/news/${secondary[0].slug}`}
                    className="group block overflow-hidden rounded-lg border border-black/10"
                  >
                    {secondary[0].imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={secondary[0].imageUrl}
                        alt={secondary[0].title}
                        className="aspect-square w-full bg-neutral-100 object-contain"
                      />
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-bold leading-snug group-hover:text-accent">
                        {secondary[0].title}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-600">
                        {excerpt(secondary[0].body, 140, "")} <span>...</span>
                        <span className="font-bold">details</span>
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">{timeAgo(secondary[0].publishedAt)}</p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {secondary.slice(1).map((n) => (
                  <Link
                    key={n.id}
                    href={`/news/${n.slug}`}
                    className="group block overflow-hidden rounded-lg border border-black/10"
                  >
                    {n.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="aspect-square w-full bg-neutral-100 object-contain"
                      />
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-bold leading-snug group-hover:text-accent">{n.title}</h3>
                      <p className="mt-1 text-xs text-neutral-600">
                        {excerpt(n.body, 140, "")} <span>...</span>
                        <span className="font-bold">details</span>
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.publishedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="rounded-lg border border-black/10 p-4">
          <h2 className="mb-3 font-headline text-lg font-bold">Most Viewed</h2>
          <ol className="divide-y divide-black/10">
            {mostViewed.map((n, i) => (
              <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="font-headline text-xl text-neutral-300">{i + 1}</span>
                <div>
                  <Link href={`/news/${n.slug}`} className="text-sm font-bold hover:text-accent">
                    {n.title}
                  </Link>
                  <p className="text-xs text-neutral-500">{timeAgo(n.publishedAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Latest Updates: unfiltered only — the filtered case renders it inline above instead. */}
      {!activeCategory && (
        <section className="grid gap-6 border-t border-black/10 pt-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-3">
            <h2 className="font-headline text-xl font-bold">Latest Updates</h2>
            <NewsListRows items={latestList} />
          </div>
        </section>
      )}
    </div>
  );
}
