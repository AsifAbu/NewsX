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
    const existing = await prisma.news.findUnique({ where: { id: edit } });
    if (!existing) notFound();
    if (!isAdmin && existing.authorId !== session.user.id) {
      redirect("/post?error=You can only edit your own submissions.");
    }
    return (
      <NewsForm
        categories={categories}
        isAdmin={isAdmin}
        error={error}
        newsId={existing.id}
        initialTitle={existing.title}
        initialCategoryId={existing.categoryId}
        initialImageUrl={existing.imageUrl ?? ""}
        initialBody={existing.body}
        initialSourceUrl={existing.sourceUrl ?? ""}
      />
    );
  }

  return <NewsForm categories={categories} isAdmin={isAdmin} error={error} />;
}
