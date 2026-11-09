import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import type { NewsStatus } from "@/app/generated/prisma/client";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";

// Statuses an Admin would actually want to review in this queue. DRAFT isn't
// submitted yet, and DELETED/HIDDEN are handled on the separate /archive page.
const FILTERABLE_STATUSES = ["PENDING", "PUBLISHED", "REJECTED"] as const;
const DEFAULT_STATUS: NewsStatus = "PENDING";

function isFilterableStatus(value: string | undefined): value is (typeof FILTERABLE_STATUSES)[number] {
  return !!value && (FILTERABLE_STATUSES as readonly string[]).includes(value);
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; sort?: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { status: statusParam, page: pageParam, sort: sortParam } = await searchParams;
  const status: NewsStatus = isFilterableStatus(statusParam) ? statusParam : DEFAULT_STATUS;
  const page = parsePage(pageParam);
  // Oldest-first by default — this is a FIFO review queue, not a feed.
  const sort = parseSort(sortParam, "asc");

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where: { status },
      orderBy: { createdAt: sort },
      include: { categories: true, author: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.news.count({ where: { status } }),
  ]);

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/approvals?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">Approval List</h1>
      <nav className="flex gap-2 text-sm">
        {FILTERABLE_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/approvals?status=${s}`}
            className={`rounded px-3 py-1.5 ${
              s === status ? "bg-accent text-white" : "bg-neutral-100 hover:bg-neutral-200"
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Title</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Author</th>
              <th className={thClass}>
                <SortableHeader
                  label="Submitted"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {news.map((n) => (
              <tr key={n.id}>
                <td className={tdClass}>
                  <Link href={`/news/${n.slug}`} className="font-medium hover:text-accent">
                    {n.title}
                  </Link>
                </td>
                <td className={`${tdClass} text-neutral-600`}>
                  {n.categories.map((c) => c.name).join(", ")}
                </td>
                <td className={`${tdClass} text-neutral-600`}>{n.author.name}</td>
                <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                  {n.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {news.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={4}>
                  <span className="text-neutral-500">No {status.toLowerCase()} articles.</span>
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
