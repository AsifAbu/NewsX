import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import AvatarUpload from "@/components/AvatarUpload";

// Self-service view of FR-3.4/3.5 — same fields/layout as the Admin user
// detail page (app/(admin)/users/[id]/page.tsx), minus the Admin-only
// Deactivate/Delete actions, plus the avatar upload (Admin's page has none).
export default async function ProfilePage() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { news: true, comments: true } } },
  });
  if (!user) {
    // Session points at a user row that no longer exists (e.g. deleted
    // elsewhere mid-session).
    redirect("/login");
  }

  const isDeactivated = Boolean(user.deactivatedAt && user.deactivatedAt <= new Date());
  // Role/News authored/Status are only meaningful for editorial accounts —
  // a plain Registered User never authors news or gets deactivated by role,
  // so those rows are hidden for them and shown for Moderator/Admin viewing
  // their own profile (Admin viewing other users still sees everything, via
  // the separate /users/[id] page).
  const showEditorialInfo = user.role !== "USER";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-4">
        <AvatarUpload initialUrl={user.avatarUrl} />
        <h1 className="font-headline text-2xl font-bold">{user.name}</h1>
      </div>

      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-neutral-500">Email: </dt>
          <dd className="inline">{user.email}</dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Phone: </dt>
          <dd className="inline">{user.phone || "—"}</dd>
        </div>
        {showEditorialInfo && (
          <div>
            <dt className="inline text-neutral-500">Role: </dt>
            <dd className="inline">{user.role}</dd>
          </div>
        )}
        <div>
          <dt className="inline text-neutral-500">Joined: </dt>
          <dd className="inline">{user.createdAt.toLocaleDateString()}</dd>
        </div>
        {showEditorialInfo && (
          <div>
            <dt className="inline text-neutral-500">News authored: </dt>
            <dd className="inline">{user._count.news}</dd>
          </div>
        )}
        <div>
          <dt className="inline text-neutral-500">Comments posted: </dt>
          <dd className="inline">{user._count.comments}</dd>
        </div>
        {showEditorialInfo && (
          <div>
            <dt className="inline text-neutral-500">Status: </dt>
            <dd className="inline">
              {isDeactivated ? (
                <span className="text-red-600">Deactivated</span>
              ) : (
                <span className="text-green-700">Active</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
