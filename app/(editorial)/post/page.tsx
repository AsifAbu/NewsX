import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import NewsForm from "@/components/NewsForm";

export default async function PostFormPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const session = await requireRole(["MODERATOR", "ADMIN"]);
  const { error, edit } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const isAdmin = session.user.role === "ADMIN";

  if (edit) {
    const existing = await prisma.news.findUnique({
      where: { id: edit },
      include: { categories: true },
    });
    if (!existing) notFound();
    // Any Moderator can edit any news — not just their own submissions.
    // Deleted/Hidden stays Admin-only, same as everywhere else.
    if (!isAdmin && (existing.status === "DELETED" || existing.status === "HIDDEN")) {
      redirect("/post?error=That article is no longer available to edit.");
    }
    return (
      <NewsForm
        categories={categories}
        isAdmin={isAdmin}
        error={error}
        newsId={existing.id}
        initialTitle={existing.title}
        initialCategoryIds={existing.categories.map((c) => c.id)}
        initialImageUrl={existing.imageUrl ?? ""}
        initialBody={existing.body}
        initialSourceUrl={existing.sourceUrl ?? ""}
      />
    );
  }

  return <NewsForm categories={categories} isAdmin={isAdmin} error={error} />;
}
