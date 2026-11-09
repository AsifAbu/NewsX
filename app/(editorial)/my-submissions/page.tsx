import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";
import { Prisma } from "@/app/generated/prisma/client";

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = parsePage(pageParam);
  const sort = parseSort(sortParam, "desc");
  // Deleted/Hidden is Admin-only visibility — never shown here either,
  // even for the Moderator who authored it.
  const where: Prisma.NewsWhereInput = {
    authorId: session.user.id,
    status: { notIn: ["DELETED", "HIDDEN"] },
  };
  const [submissions, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { createdAt: sort },
      include: { categories: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.news.count({ where }),
  ]);

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/my-submissions?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">My Submissions</h1>
      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Title</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>
                <SortableHeader
                  label="Submitted"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {submissions.map((n) => (
              <tr key={n.id}>
                <td className={tdClass}>
                  <p className="font-medium">{n.title}</p>
                  {n.status === "REJECTED" && n.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600">Reason: {n.rejectionReason}</p>
                  )}
                </td>
                <td className={`${tdClass} text-neutral-600`}>
                  {n.categories.map((c) => c.name).join(", ")}
                </td>
                <td className={tdClass}>{n.status}</td>
                <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                  {n.createdAt.toLocaleDateString()}
                </td>
                <td className={tdClass}>
                  {n.status === "PUBLISHED" && (
                    <Link href={`/news/${n.slug}`} className="text-accent hover:underline">
                      View live
                    </Link>
                  )}
                  {n.status !== "PUBLISHED" && (
                    <Link href={`/post?edit=${n.id}`} className="text-accent hover:underline">
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={5}>
                  <span className="text-neutral-500">No submissions yet.</span>
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
