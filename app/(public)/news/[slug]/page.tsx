import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CommentForm from "@/components/CommentForm";
import IncrementView from "@/components/IncrementView";
import RejectForm from "@/components/RejectForm";
import ReportCommentModal from "@/components/ReportCommentModal";
import SummarizeToggle from "@/components/SummarizeToggle";
import { deleteCommentAction, toggleBookmarkAction } from "@/lib/actions/engagement";
import { approveNewsAction } from "@/lib/actions/news";
import { timeAgo } from "@/lib/format";

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const news = await prisma.news.findUnique({
    where: { slug },
    include: {
      categories: true,
      author: true,
      comments: {
        where: { status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
        include: { user: true },
      },
    },
  });

  if (!news) notFound();
  const canPreview =
    session?.user && (session.user.role === "ADMIN" || session.user.id === news.authorId);
  if (news.status !== "PUBLISHED" && !canPreview) notFound();

  const [isBookmarked, moreNews] = await Promise.all([
    session?.user
      ? prisma.bookmark
          .findUnique({ where: { userId_newsId: { userId: session.user.id, newsId: news.id } } })
          .then(Boolean)
      : Promise.resolve(false),
    // Same "Latest Updates" pool as the Dashboard — not scoped to this
    // article's category — just excluding the article currently open.
    prisma.news.findMany({
      where: { status: "PUBLISHED", NOT: { id: news.id } },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="grid gap-8 md:grid-cols-5">
    <article className="space-y-6 md:col-span-4">
      <IncrementView newsId={news.id} />

      <p className="text-xs uppercase text-accent">{news.categories.map((c) => c.name).join(", ")}</p>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-headline text-3xl font-bold leading-tight">{news.title}</h1>
        {canPreview && (
          <Link
            href={`/post?edit=${news.id}`}
            className="shrink-0 rounded border border-black/10 px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            Edit
          </Link>
        )}
      </div>
      <p className="text-sm text-neutral-500">
        By {news.author.name} ·{" "}
        {news.publishedAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        {" · "}
        {news.viewCount} views
      </p>

      {news.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={news.imageUrl}
          alt={news.title}
          className="h-96 w-full rounded-lg bg-neutral-100 object-contain"
        />
      )}

      {session?.user?.role === "ADMIN" && news.status === "PENDING" && (
        <div className="space-y-3 rounded border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-medium">Pending approval</p>
          <div className="flex items-center gap-3">
            <form action={approveNewsAction.bind(null, news.id)}>
              <button className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90">
                Approve
              </button>
            </form>
            <RejectForm newsId={news.id} />
          </div>
        </div>
      )}

      <SummarizeToggle body={news.body}>
        {session?.user && (
          <form action={toggleBookmarkAction.bind(null, news.id, news.slug)}>
            <button className="rounded border border-black/10 px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
              {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
            </button>
          </form>
        )}
      </SummarizeToggle>

      <section className="space-y-4 border-t border-black/10 pt-6">
        <h2 className="font-headline text-xl font-bold">Comments</h2>

        {session?.user ? (
          <CommentForm newsId={news.id} slug={news.slug} />
        ) : (
          <p className="text-sm text-neutral-500">Log in to comment.</p>
        )}

        <ul className="space-y-4">
          {news.comments.map((c) => (
            <li key={c.id} id={`comment-${c.id}`} className="scroll-mt-20 rounded border border-black/10 p-3 text-sm">
              <p className="font-medium">{c.user.name}</p>
              <p className="text-neutral-700">{c.body}</p>
              {session?.user && (
                <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                  <ReportCommentModal commentId={c.id} slug={news.slug} />
                  {session.user.role === "ADMIN" && (
                    <form action={deleteCommentAction.bind(null, c.id, news.slug)}>
                      <button className="hover:text-accent">Delete</button>
                    </form>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </article>

    <aside>
      <h2 className="font-headline text-xl font-bold">Read More</h2>
      <ul className="mt-3 divide-y divide-black/10">
        {moreNews.map((n) => (
          <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            {n.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.imageUrl}
                alt={n.title}
                className="h-16 w-20 shrink-0 rounded bg-neutral-100 object-contain"
              />
            )}
            <div>
              <Link href={`/news/${n.slug}`} className="text-sm font-medium leading-snug hover:text-accent">
                {n.title}
              </Link>
              <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.publishedAt)}</p>
            </div>
          </li>
        ))}
        {moreNews.length === 0 && (
          <li className="text-sm text-neutral-500">No other articles in this category yet.</li>
        )}
      </ul>
      <div className="mt-3 flex justify-end">
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          More..
        </Link>
      </div>
    </aside>
    </div>
  );
}
