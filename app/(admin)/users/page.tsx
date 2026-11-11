import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { parseSort, toggle } from "@/lib/sort";
import Pagination from "@/components/Pagination";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";
import SortableHeader from "@/components/SortableHeader";
import type { Prisma } from "@/app/generated/prisma/client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { page: pageParam, sort: sortParam, q: qParam } = await searchParams;
  const page = parsePage(pageParam);
  const sort = parseSort(sortParam, "desc");
  const q = (qParam ?? "").trim();

  const where: Prisma.UserWhereInput = q ? { email: { contains: q, mode: "insensitive" } } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  const now = new Date();

  function buildHref(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
    return `/users?${params.toString()}`;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-headline text-2xl font-bold">Users</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/users/create"
            className="whitespace-nowrap rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            + Create user
          </Link>

          <form action="/users" method="GET" className="flex">
            <input type="hidden" name="sort" value={sort} />
            <div className="flex overflow-hidden rounded-md border border-black/10">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by email"
                className="w-56 px-3 py-1.5 text-sm outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center justify-center bg-accent px-3 text-white hover:opacity-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Name</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Role</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>
                <SortableHeader
                  label="Joined"
                  direction={sort}
                  href={buildHref({ sort: toggle(sort), page: 1 })}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {users.map((u) => {
              const deactivated = u.deactivatedAt && u.deactivatedAt <= now;
              const scheduled = u.deactivatedAt && u.deactivatedAt > now;
              return (
                <tr key={u.id}>
                  <td className={tdClass}>
                    <Link href={`/users/${u.id}`} className="font-medium hover:text-accent">
                      {u.name}
                    </Link>
                  </td>
                  <td className={`${tdClass} text-neutral-600`}>{u.email}</td>
                  <td className={tdClass}>{u.role}</td>
                  <td className={tdClass}>
                    {deactivated && <span className="text-red-600">Deactivated</span>}
                    {scheduled && (
                      <span className="text-amber-600">
                        Scheduled {u.deactivatedAt!.toLocaleString()}
                      </span>
                    )}
                    {!u.deactivatedAt && <span className="text-green-700">Active</span>}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                    {u.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td className={tdClass} colSpan={5}>
                  <span className="text-neutral-500">
                    {q ? `No users match "${q}".` : "No users."}
                  </span>
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
