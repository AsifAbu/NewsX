import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { timeAgo, excerpt } from "@/lib/format";
import { NewsRowList } from "@/components/NewsRow";
import AllNewsList from "@/components/AllNewsList";

const ALL_PAGE_SIZE = 15;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  // "all" is a reserved sentinel (never a real Category cuid) for the "All" nav tab.
  const isAll = category === "all";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Hero cards, Most Viewed, and Latest Updates each have their own independent
  // ordering now: hero = today's most-viewed, Most Viewed = last-30-days most-viewed,
  // Latest Updates = site-wide newest-first (never scoped to a category/All).
  const [activeCategory, todayTop, latestNews, mostViewed, categoryNews, allNewsInitial] = await Promise.all([
    category && !isAll ? prisma.category.findUnique({ where: { id: category } }) : Promise.resolve(null),
    prisma.news.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: todayStart } },
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { categories: true },
    }),
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 8,
      include: { categories: true },
    }),
    prisma.news.findMany({
      // News.viewCount is a cumulative counter with no per-view timestamp, so
      // "last 30 days" is approximated the same way as the hero's "today": by
      // view count among articles published within that window.
      where: { status: "PUBLISHED", publishedAt: { gte: thirtyDaysAgo } },
      orderBy: { viewCount: "desc" },
      take: 10,
    }),
    category && !isAll
      ? prisma.news.findMany({
          where: { status: "PUBLISHED", categories: { some: { id: category } } },
          orderBy: { publishedAt: "desc" },
          take: 5,
          include: { categories: true },
        })
      : Promise.resolve(null),
    isAll
      ? prisma.news.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: ALL_PAGE_SIZE,
          include: { categories: true },
        })
      : Promise.resolve(null),
  ]);

  // Fewer than 5 articles published today? Fill the remaining hero slots with
  // the next most-viewed articles overall (any date), so the hero never looks sparse.
  let heroItems = todayTop;
  if (heroItems.length < 5) {
    const fallback = await prisma.news.findMany({
      where: { status: "PUBLISHED", id: { notIn: heroItems.map((n) => n.id) } },
      orderBy: { viewCount: "desc" },
      take: 5 - heroItems.length,
      include: { categories: true },
    });
    heroItems = [...heroItems, ...fallback];
  }

  // TC-RU-14: a logged-in user's interested categories give the hero a
  // stable re-sort boost — articles matching one of their interests move
  // first, but each group (matches / doesn't) keeps its existing
  // viewCount-descending order. Guests (no session) and users with no
  // preferences set see exactly the same heroItems as before this feature.
  const session = await auth();
  if (session?.user) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { interestedCategoryIds: true },
    });
    const interestedIds = currentUser?.interestedCategoryIds ?? [];
    if (interestedIds.length > 0) {
      const matching = heroItems.filter((n) => n.categories.some((c) => interestedIds.includes(c.id)));
      const rest = heroItems.filter((n) => !n.categories.some((c) => interestedIds.includes(c.id)));
      heroItems = [...matching, ...rest];
    }
  }

  const allNewsInitialItems =
    allNewsInitial?.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      body: n.body,
      imageUrl: n.imageUrl,
      publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
      categories: n.categories.map((c) => ({ name: c.name })),
    })) ?? [];
  const allNewsHasMore = allNewsInitialItems.length === ALL_PAGE_SIZE;

  // Hero: #1 today's-most-viewed (or fallback) is the big featured card, the
  // rest (up to 4) are the secondary cards — see FR-1.4 ordering in the SRS.
  const [featured, ...secondary] = heroItems;
  // Latest Updates: a fixed 8 items everywhere it appears, newest first.
  const latestList = latestNews;

  if (!featured) {
    return (
      <p className="text-neutral-600">
        No published articles yet. Once a Moderator or Admin publishes one, it shows up here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero block: featured story + 4 secondary cards, ranked by today's view count (left) |
          Most Viewed, last 30 days' view count, sized to its own content (right, self-start).
          With a category selected, the left side swaps to a list of that category's news, followed immediately
          by Latest Updates (site-wide, newest-first) in the same column. */}
      <section className="grid gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          {activeCategory || isAll ? (
            <>
              <div>
                <h2 className="mb-3 font-headline text-xl font-bold uppercase text-accent">
                  {isAll ? "All" : activeCategory!.name}
                </h2>
                {isAll ? (
                  <AllNewsList initialItems={allNewsInitialItems} initialHasMore={allNewsHasMore} />
                ) : categoryNews && categoryNews.length > 0 ? (
                  <NewsRowList items={categoryNews} />
                ) : (
                  <p className="text-neutral-500">No published articles in {activeCategory!.name} yet.</p>
                )}
              </div>

              {!isAll && latestList.length > 0 && (
                <div className="border-t border-black/10 pt-6">
                  <h2 className="mb-3 font-headline text-xl font-bold text-accent">Latest Updates</h2>
                  <NewsRowList items={latestList} />
                  <div className="mt-3 flex justify-end">
                    <Link
                      href="/?category=all"
                      className="rounded border border-accent px-4 py-1.5 text-sm text-accent hover:bg-accent hover:text-white"
                    >
                      More
                    </Link>
                  </div>
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

        <aside className="self-start rounded-lg border border-black/10 p-4">
          <h2 className="mb-3 font-headline text-lg font-bold text-accent">Most Viewed</h2>
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
            <h2 className="font-headline text-xl font-bold text-accent">Latest Updates</h2>
            <NewsRowList items={latestList} />
            {!isAll && (
              <div className="flex justify-end">
                <Link
                  href="/?category=all"
                  className="rounded border border-accent px-4 py-1.5 text-sm text-accent hover:bg-accent hover:text-white"
                >
                  More
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
