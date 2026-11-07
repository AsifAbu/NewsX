import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import NewsForm from "@/components/NewsForm";

export default async function PostFormPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["MODERATOR", "ADMIN"]);
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return <NewsForm categories={categories} isAdmin={session.user.role === "ADMIN"} error={error} />;
}
