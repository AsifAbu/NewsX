import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import { removeBookmarkAction } from "@/lib/actions/engagement";

export default async function BookmarksPage() {
  const session = await requireSession();

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { news: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">My Bookmarks</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-neutral-500">
            <th className="py-2">Title</th>
            <th className="py-2">Bookmarked on</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {bookmarks.map((b) => (
            <tr key={b.id}>
              <td className="py-2">
                <Link href={`/news/${b.news.slug}`} className="font-medium hover:text-accent">
                  {b.news.title}
                </Link>
              </td>
              <td className="py-2 text-neutral-600">
                {b.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </td>
              <td className="py-2 text-right">
                <form action={removeBookmarkAction.bind(null, b.id)}>
                  <button className="rounded border border-black/10 px-2 py-1 text-xs hover:border-accent hover:text-accent">
                    Remove
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookmarks.length === 0 && <p className="text-neutral-500">No bookmarks yet.</p>}
    </div>
  );
}
