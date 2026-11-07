import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

export default async function MySubmissionsPage() {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  const submissions = await prisma.news.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { categories: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">My Submissions</h1>
      <ul className="divide-y divide-black/10">
        {submissions.map((n) => (
          <li key={n.id} className="py-3">
            <p className="text-xs uppercase text-neutral-500">
              {n.categories.map((c) => c.name).join(", ")} · {n.status}
            </p>
            <p className="font-medium">{n.title}</p>
            {n.status === "REJECTED" && n.rejectionReason && (
              <p className="mt-1 text-sm text-red-600">Reason: {n.rejectionReason}</p>
            )}
            {n.status === "PUBLISHED" && (
              <Link href={`/news/${n.slug}`} className="text-sm text-accent hover:underline">
                View live
              </Link>
            )}
          </li>
        ))}
        {submissions.length === 0 && <p className="text-neutral-500">No submissions yet.</p>}
      </ul>
    </div>
  );
}
