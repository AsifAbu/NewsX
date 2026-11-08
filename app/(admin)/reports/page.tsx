import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { deleteCommentAction, dismissReportsAction } from "@/lib/actions/engagement";
import SubmitButton from "@/components/SubmitButton";

export default async function ReportsPage() {
  await requireRole(["ADMIN"]);

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: true,
      comment: {
        include: {
          user: true,
          news: { select: { slug: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Reported Comments</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-neutral-500">
            <th className="py-2 pr-4">Reported User</th>
            <th className="py-2 pr-4">Comment</th>
            <th className="py-2 pr-4">Reported By</th>
            <th className="py-2 pr-4">Reason</th>
            <th className="py-2 pr-4">Date/Time</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="py-3 pr-4 align-top">
                <Link href={`/users/${r.comment.user.id}`} className="font-medium hover:text-accent">
                  {r.comment.user.name}
                </Link>
              </td>
              <td className="py-3 pr-4 align-top">
                <Link
                  href={`/news/${r.comment.news.slug}#comment-${r.comment.id}`}
                  className="hover:text-accent hover:underline"
                >
                  View comment →
                </Link>
              </td>
              <td className="py-3 pr-4 align-top">
                <Link href={`/users/${r.reporter.id}`} className="font-medium hover:text-accent">
                  {r.reporter.name}
                </Link>
              </td>
              <td className="py-3 pr-4 align-top text-neutral-700">{r.reason ?? "—"}</td>
              <td className="py-3 pr-4 align-top whitespace-nowrap text-neutral-500">
                {r.createdAt.toLocaleString()}
              </td>
              <td className="py-3 align-top">
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
        </tbody>
      </table>
      {reports.length === 0 && <p className="text-neutral-500">No reported comments.</p>}
    </div>
  );
}
