import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { updateNewsArchiveStatusAction } from "@/lib/actions/news";
import SubmitButton from "@/components/SubmitButton";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";
import { Prisma } from "@/app/generated/prisma/client";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = parsePage(pageParam);
  const sort = parseSort(sortParam, "desc");
  const archiveWhere: Prisma.NewsWhereInput = { status: { in: ["DELETED", "HIDDEN"] } };

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where: archiveWhere,
      orderBy: { archivedAt: sort },
      include: { archivedBy: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.news.count({ where: archiveWhere }),
  ]);

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/archive?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">Archive</h1>
      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Title</th>
              <th className={thClass}>
                <SortableHeader
                  label="Date of operation"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Updated by</th>
              <th className={thClass}>Change to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {items.map((n) => (
              <tr key={n.id}>
                <td className={tdClass}>
                  <Link href={`/news/${n.slug}`} className="font-medium hover:text-accent">
                    {n.title}
                  </Link>
                </td>
                <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                  {n.archivedAt ? n.archivedAt.toLocaleString() : "—"}
                </td>
                <td className={tdClass}>
                  <span className={n.status === "DELETED" ? "text-red-600" : "text-amber-600"}>
                    {n.status === "DELETED" ? "Deleted" : "Hidden"}
                  </span>
                </td>
                <td className={tdClass}>
                  {n.archivedBy ? (
                    <Link href={`/users/${n.archivedBy.id}`} className="hover:text-accent hover:underline">
                      {n.archivedBy.name}
                    </Link>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <form action={updateNewsArchiveStatusAction.bind(null, n.id, "PUBLISHED")}>
                      <SubmitButton
                        pendingLabel="..."
                        className="rounded border border-green-700 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        Active
                      </SubmitButton>
                    </form>
                    <form action={updateNewsArchiveStatusAction.bind(null, n.id, "DELETED")}>
                      <SubmitButton
                        pendingLabel="..."
                        disabled={n.status === "DELETED"}
                        className="rounded border border-red-600 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </SubmitButton>
                    </form>
                    <form action={updateNewsArchiveStatusAction.bind(null, n.id, "HIDDEN")}>
                      <SubmitButton
                        pendingLabel="..."
                        disabled={n.status === "HIDDEN"}
                        className="rounded border border-amber-600 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50"
                      >
                        Hide
                      </SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={5}>
                  <span className="text-neutral-500">Nothing archived.</span>
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
