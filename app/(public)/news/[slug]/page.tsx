import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CommentForm from "@/components/CommentForm";
import IncrementView from "@/components/IncrementView";
import RejectForm from "@/components/RejectForm";
import {
  reportCommentAction,
  deleteCommentAction,
  toggleBookmarkAction,
} from "@/lib/actions/engagement";
import { approveNewsAction } from "@/lib/actions/news";

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
      category: true,
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

  const isBookmarked = session?.user
    ? Boolean(
        await prisma.bookmark.findUnique({
          where: { userId_newsId: { userId: session.user.id, newsId: news.id } },
        })
      )
    : false;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <IncrementView newsId={news.id} />

      <p className="text-xs uppercase text-accent">{news.category.name}</p>
      <h1 className="font-headline text-3xl font-bold leading-tight">{news.title}</h1>
      <p className="text-sm text-neutral-500">
        By {news.author.name} ·{" "}
        {news.publishedAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        {" · "}
        {news.viewCount} views
      </p>

      {news.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={news.imageUrl} alt={news.title} className="w-full rounded-lg object-cover" />
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

      {session?.user && (
        <form action={toggleBookmarkAction.bind(null, news.id, news.slug)}>
          <button className="rounded border border-black/10 px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
            {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        </form>
      )}

      <div className="prose max-w-none whitespace-pre-wrap text-neutral-800">{news.body}</div>

      <section className="space-y-4 border-t border-black/10 pt-6">
        <h2 className="font-headline text-xl font-bold">Comments</h2>

        {session?.user ? (
          <CommentForm newsId={news.id} slug={news.slug} />
        ) : (
          <p className="text-sm text-neutral-500">Log in to comment.</p>
        )}

        <ul className="space-y-4">
          {news.comments.map((c) => (
            <li key={c.id} className="rounded border border-black/10 p-3 text-sm">
              <p className="font-medium">{c.user.name}</p>
              <p className="text-neutral-700">{c.body}</p>
              {session?.user && (
                <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                  <form action={reportCommentAction.bind(null, c.id, news.slug)}>
                    <button className="hover:text-accent">Report</button>
                  </form>
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
  );
}
