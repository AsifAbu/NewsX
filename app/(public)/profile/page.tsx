import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import AvatarUpload from "@/components/AvatarUpload";
import SubmitButton from "@/components/SubmitButton";
import { updateInterestedCategoriesAction } from "@/lib/actions/profile";

// Self-service view of FR-3.4/3.5 — same fields/layout as the Admin user
// detail page (app/(admin)/users/[id]/page.tsx), minus the Admin-only
// Deactivate/Delete actions, plus the avatar upload (Admin's page has none).
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;

  const [user, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { _count: { select: { news: true, comments: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
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

      {/* TC-RU-14: visible to every logged-in user (Registered User,
          Moderator, Admin), unlike the Role/News-authored/Status rows
          above which are gated to showEditorialInfo. */}
      <div className="border-t border-black/10 pt-4">
        <h2 className="font-headline text-lg font-bold text-accent">Interested Categories</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Articles in these categories are boosted to the top of the Dashboard&apos;s featured row.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{decodeURIComponent(error)}</p>}
        <form action={updateInterestedCategoriesAction} className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={user.interestedCategoryIds.includes(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
          <SubmitButton className="rounded bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90">
            Save preferences
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
