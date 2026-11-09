import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { deleteCommentAction, dismissReportsAction } from "@/lib/actions/engagement";
import SubmitButton from "@/components/SubmitButton";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = parsePage(pageParam);
  const sort = parseSort(sortParam, "desc");

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: sort },
      include: {
        reporter: true,
        comment: {
          include: {
            user: true,
            news: { select: { slug: true } },
          },
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.report.count(),
  ]);

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/reports?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">Reported Comments</h1>
      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Reported User</th>
              <th className={thClass}>Comment</th>
              <th className={thClass}>Reported By</th>
              <th className={thClass}>Reason</th>
              <th className={thClass}>
                <SortableHeader
                  label="Date/Time"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className={tdClass}>
                  <Link href={`/users/${r.comment.user.id}`} className="font-medium hover:text-accent">
                    {r.comment.user.name}
                  </Link>
                </td>
                <td className={tdClass}>
                  <Link
                    href={`/news/${r.comment.news.slug}#comment-${r.comment.id}`}
                    className="hover:text-accent hover:underline"
                  >
                    View comment →
                  </Link>
                </td>
                <td className={tdClass}>
                  <Link href={`/users/${r.reporter.id}`} className="font-medium hover:text-accent">
                    {r.reporter.name}
                  </Link>
                </td>
                <td className={`${tdClass} text-neutral-700`}>{r.reason ?? "—"}</td>
                <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                  {r.createdAt.toLocaleString()}
                </td>
                <td className={tdClass}>
                  <div className="flex gap-3">
                    <form action={dismissReportsAction.bind(null, r.comment.id)}>
                      <SubmitButton
                        pendingLabel="Dismissing..."
                        className="rounded border border-black/10 px-2 py-1 text-xs hover:border-accent"
                      >
                        Dismiss
                      </SubmitButton>
                    </form>
                    <form action={deleteCommentAction.bind(null, r.comment.id, r.comment.news.slug)}>
                      <SubmitButton
                        pendingLabel="Deleting..."
                        className="rounded border border-red-600 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={6}>
                  <span className="text-neutral-500">No reported comments.</span>
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
