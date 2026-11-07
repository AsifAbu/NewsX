import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

export default async function ApprovalsPage() {
  await requireRole(["ADMIN"]);

  const pending = await prisma.news.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { categories: true, author: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Approval List</h1>
      <ul className="divide-y divide-black/10">
        {pending.map((n) => (
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
        {pending.length === 0 && <p className="text-neutral-500">Nothing pending.</p>}
      </ul>
    </div>
  );
}
