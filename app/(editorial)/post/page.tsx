import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { saveDraftAction, submitForApprovalAction, publishDirectlyAction } from "@/lib/actions/news";

export default async function PostFormPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["MODERATOR", "ADMIN"]);
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <form action={saveDraftAction} className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-headline text-2xl font-bold">Write News</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <input name="title" placeholder="Title" required className="w-full rounded border border-black/10 p-2 text-sm" />

      <select name="categoryId" required className="w-full rounded border border-black/10 p-2 text-sm">
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        name="imageUrl"
        placeholder="Image URL (Cloudinary)"
        className="w-full rounded border border-black/10 p-2 text-sm"
      />

      <textarea
        name="body"
        rows={10}
        placeholder="Write the article in Markdown..."
        required
        className="w-full rounded border border-black/10 p-2 text-sm"
      />

      <div className="flex gap-2">
        <button type="submit" className="rounded border border-black/10 px-3 py-2 text-sm hover:border-accent">
          Save Draft
        </button>
        <button
          type="submit"
          formAction={submitForApprovalAction}
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90"
        >
          Submit for Approval
        </button>
        {session.user.role === "ADMIN" && (
          <button
            type="submit"
            formAction={publishDirectlyAction}
            className="rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Publish
          </button>
        )}
      </div>
    </form>
  );
}
