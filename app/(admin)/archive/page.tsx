import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { updateNewsArchiveStatusAction } from "@/lib/actions/news";
import SubmitButton from "@/components/SubmitButton";

export default async function ArchivePage() {
  await requireRole(["ADMIN"]);

  const items = await prisma.news.findMany({
    where: { status: { in: ["DELETED", "HIDDEN"] } },
    orderBy: { archivedAt: "desc" },
    include: { archivedBy: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Archive</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-neutral-500">
            <th className="py-2 pr-4">Title</th>
            <th className="py-2 pr-4">Date of operation</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Updated by</th>
            <th className="py-2">Change to</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {items.map((n) => (
            <tr key={n.id}>
              <td className="py-3 pr-4 align-top">
                <Link href={`/news/${n.slug}`} className="font-medium hover:text-accent">
                  {n.title}
                </Link>
              </td>
              <td className="py-3 pr-4 align-top whitespace-nowrap text-neutral-500">
                {n.archivedAt ? n.archivedAt.toLocaleString() : "—"}
              </td>
              <td className="py-3 pr-4 align-top">
                <span className={n.status === "DELETED" ? "text-red-600" : "text-amber-600"}>
                  {n.status === "DELETED" ? "Deleted" : "Hidden"}
                </span>
              </td>
              <td className="py-3 pr-4 align-top">
                {n.archivedBy ? (
                  <Link href={`/users/${n.archivedBy.id}`} className="hover:text-accent hover:underline">
                    {n.archivedBy.name}
                  </Link>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="py-3 align-top">
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
        </tbody>
      </table>
      {items.length === 0 && <p className="text-neutral-500">Nothing archived.</p>}
    </div>
  );
}
