import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { deleteUserAction, reactivateUserAction } from "@/lib/actions/users";
import DeactivateModal from "@/components/DeactivateModal";
import SubmitButton from "@/components/SubmitButton";


export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { id } = await params;
  const { error } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { news: true, comments: true } } },
  });
  if (!user) notFound();

  const now = new Date();
  const isDeactivated = user.deactivatedAt && user.deactivatedAt <= now;
  const isScheduled = user.deactivatedAt && user.deactivatedAt > now;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">{user.name}</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-neutral-500">Email: </dt>
          <dd className="inline">{user.email}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Role: </dt>
          <dd className="inline">{user.role}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Joined: </dt>
          <dd className="inline">{user.createdAt.toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">News authored: </dt>
          <dd className="inline">{user._count.news}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Comments posted: </dt>
          <dd className="inline">{user._count.comments}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Status: </dt>
          <dd className="inline">
            {isDeactivated && <span className="text-red-600">Deactivated since {user.deactivatedAt!.toLocaleString()}</span>}
            {isScheduled && <span className="text-amber-600">Scheduled to deactivate {user.deactivatedAt!.toLocaleString()}</span>}
            {!user.deactivatedAt && <span className="text-green-700">Active</span>}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2 pt-2">
        {session.user.id !== user.id && (
          user.deactivatedAt ? (
            <form action={reactivateUserAction.bind(null, user.id)}>
              <SubmitButton
                pendingLabel="Reactivating..."
                className="rounded border border-green-700 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
              >
                Reactivate
              </SubmitButton>
            </form>
          ) : (
            <DeactivateModal userId={user.id} />
          )
        )}

        {user.role !== "ADMIN" && (
          <form action={deleteUserAction.bind(null, user.id)}>
            <SubmitButton
              pendingLabel="Deleting..."
              className="rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
