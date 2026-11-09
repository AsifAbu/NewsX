import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import type { NewsStatus } from "@/app/generated/prisma/client";

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
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { status: statusParam } = await searchParams;
  const status: NewsStatus = isFilterableStatus(statusParam) ? statusParam : DEFAULT_STATUS;

  const news = await prisma.news.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: { categories: true, author: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
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
      <ul className="divide-y divide-black/10">
        {news.map((n) => (
          <li key={n.id} className="py-3">
            <p className="text-xs uppercase text-neutral-500">
              {n.categories.map((c) => c.name).join(", ")}
            </p>
            <Link href={`/news/${n.slug}`} className="font-medium hover:text-accent">
              {n.title}
            </Link>
            <p className="text-xs text-neutral-500">
              by {n.author.name} · submitted {n.createdAt.toLocaleDateString()}
            </p>
          </li>
        ))}
        {news.length === 0 && (
          <p className="text-neutral-500">No {status.toLowerCase()} articles.</p>
        )}
      </ul>
    </div>
  );
}
