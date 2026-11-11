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
import { approveNewsAction, updateNewsArchiveStatusAction } from "@/lib/actions/news";
import { timeAgo } from "@/lib/format";
import { sanitizeNewsBody } from "@/lib/sanitize";
import { htmlToPlainText } from "@/lib/richtext";
import NewsUpdateMenu from "@/components/NewsUpdateMenu";
import SubmitButton from "@/components/SubmitButton";
import { NewsThumb } from "@/components/NewsThumb";

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
      comments: {
        where: { status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
        include: { user: true },
      },
    },
  });

  if (!news) notFound();
  const isAdmin = session?.user?.role === "ADMIN";
  const isModerator = session?.user?.role === "MODERATOR";
  const isArchived = news.status === "DELETED" || news.status === "HIDDEN";
  // Gates viewing non-published content, and the "Update" control: Admin;
  // the article's own (non-archived) author; or — since any Moderator can
  // edit any news now, always resubmitting it for approval — any Moderator,
  // for any non-archived article. Without this, a Moderator who edits
  // someone else's article would get a dead-end 404 redirecting back to it
  // once it flips to Pending. Deleted/Hidden stays Admin-only regardless.
  const canPreview =
    session?.user &&
    (isAdmin || (!isArchived && (session.user.id === news.authorId || isModerator)));
  if (news.status !== "PUBLISHED" && !canPreview) notFound();

  const canUpdate = canPreview;
  // Re-sanitized at render time too (not just on save) — cheap, and covers
  // legacy/plain-text rows and any future write path that skips the gate.
  const bodyHtml = sanitizeNewsBody(news.body);
  const bodyText = htmlToPlainText(bodyHtml);

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
    <div className="grid gap-8 md:grid-cols-7">
    <article className="space-y-6 md:col-span-5">
      <IncrementView newsId={news.id} />

      <p className="text-xs uppercase text-accent">{news.categories.map((c) => c.name).join(", ")}</p>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-headline text-3xl font-bold leading-tight">{news.title}</h1>
        {canUpdate && <NewsUpdateMenu newsId={news.id} canArchive={isAdmin} />}
      </div>
      <p className="text-sm text-neutral-500">
        By <span className="font-medium text-neutral-700">NewsX</span>
        {news.newsSource && <> · Source: {news.newsSource}</>}
        {" · "}
        {news.publishedAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        {" · "}
        {news.viewCount} views
      </p>

      <NewsThumb src={news.imageUrl} alt={news.title} className="h-96 w-full rounded-lg" />

      {isAdmin && isArchived && (
        <div className="space-y-2 rounded border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            This article is currently {news.status === "DELETED" ? "Deleted" : "Hidden"}
            {news.archivedAt ? ` (since ${news.archivedAt.toLocaleString()})` : ""} — Guests, Users,
            and Moderators cannot see it. Manage it here or from the Archive page.
          </p>
          <form action={updateNewsArchiveStatusAction.bind(null, news.id, "PUBLISHED")}>
            <SubmitButton
              pendingLabel="Restoring..."
              className="rounded border border-green-700 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
            >
              Restore to Active
            </SubmitButton>
          </form>
        </div>
      )}

      {isAdmin && news.status === "PENDING" && (
        <div className="space-y-3 rounded border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-medium">Pending approval</p>
          <div className="flex items-center gap-3">
            <form action={approveNewsAction.bind(null, news.id)}>
              <SubmitButton
                pendingLabel="Approving..."
                className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              >
                Approve
              </SubmitButton>
            </form>
            <RejectForm newsId={news.id} />
          </div>
        </div>
      )}

      <SummarizeToggle bodyHtml={bodyHtml} bodyText={bodyText}>
        {session?.user && (
          <form action={toggleBookmarkAction.bind(null, news.id, news.slug)}>
            <SubmitButton
              pendingLabel="..."
              className={`rounded border px-3 py-1.5 text-sm transition ${
                isBookmarked
                  ? "border-accent bg-accent text-white"
                  : "border-accent text-accent hover:bg-accent hover:text-white"
              }`}
            >
              {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
            </SubmitButton>
          </form>
        )}
      </SummarizeToggle>

      <section className="space-y-4 border-t border-black/10 pt-6">
        <h2 className="font-headline text-xl font-bold text-accent">Comments</h2>

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
                      <SubmitButton pendingLabel="Deleting..." className="hover:text-accent">
                        Delete
                      </SubmitButton>
                    </form>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </article>

    <aside className="md:col-span-2">
      <div className="rounded-lg border border-black/10 p-4">
        <h2 className="mb-3 font-headline text-xl font-bold text-accent">Read More</h2>
        <ul className="divide-y divide-black/10">
          {moreNews.map((n) => (
            <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <NewsThumb src={n.imageUrl} alt={n.title} className="h-16 w-20 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/news/${n.slug}`}
                  className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent"
                >
                  {n.title}
                </Link>
                <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.publishedAt)}</p>
              </div>
            </li>
          ))}
          {moreNews.length === 0 && (
            <li className="py-3 text-sm text-neutral-500">No other articles in this category yet.</li>
          )}
        </ul>
        <div className="mt-3 flex justify-end">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            More..
          </Link>
        </div>
      </div>
    </aside>
    </div>
  );
}
