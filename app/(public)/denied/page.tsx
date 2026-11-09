import Link from "next/link";

// Shown when a logged-in user hits a page their role doesn't permit —
// distinct from the normal /login redirect used for not-logged-in-at-all,
// so a legitimate session never looks like it "expired". See lib/require-role.ts.
export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Access Denied</h1>
      <p className="text-neutral-700">
        You&apos;re logged in, but don&apos;t have permission to view that page.
      </p>
      <Link href="/" className="font-medium text-accent hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
