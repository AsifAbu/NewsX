import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import { removeBookmarkAction } from "@/lib/actions/engagement";
import SubmitButton from "@/components/SubmitButton";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const session = await requireSession();

  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = parsePage(pageParam);
  const sort = parseSort(sortParam, "desc");

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: sort },
      include: { news: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bookmark.count({ where: { userId: session.user.id } }),
  ]);

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/bookmarks?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">My Bookmarks</h1>
      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Title</th>
              <th className={thClass}>
                <SortableHeader
                  label="Bookmarked on"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {bookmarks.map((b) => (
              <tr key={b.id}>
                <td className={tdClass}>
                  <Link href={`/news/${b.news.slug}`} className="font-medium hover:text-accent">
                    {b.news.title}
                  </Link>
                </td>
                <td className={`${tdClass} text-neutral-600`}>
                  {b.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </td>
                <td className={`${tdClass} text-right`}>
                  <form action={removeBookmarkAction.bind(null, b.id)}>
                    <SubmitButton
                      pendingLabel="Removing..."
                      className="rounded border border-black/10 px-2 py-1 text-xs hover:border-accent hover:text-accent"
                    >
                      Remove
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {bookmarks.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={3}>
                  <span className="text-neutral-500">No bookmarks yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
      <Pagination
        page={page}
        totalPages={totalPagesFor(total)}
        buildHref={(p) => buildHref({ page: p })}
      />
    </div>
  );
}
