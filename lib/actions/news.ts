"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newsSchema, rejectSchema } from "@/lib/validation/news";
import { requireRole } from "@/lib/require-role";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import type { NewsRowItem } from "@/components/NewsRow";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export type NewsActionState = { error?: string } | undefined;

async function saveNews(formData: FormData, status: "DRAFT" | "PENDING" | "PUBLISHED") {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  const parsed = newsSchema.safeParse({
    title: formData.get("title"),
    categoryIds: formData.getAll("categoryIds"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (!parsed.success) {
    redirect(`/post?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const created = await prisma.news.create({
    data: {
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || null,
      sourceUrl: parsed.data.sourceUrl || null,
      categories: { connect: parsed.data.categoryIds.map((id) => ({ id })) },
      authorId: session.user.id,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  if (status === "PENDING") {
    await notifyAdmins(`New submission: "${created.title}"`, "/approvals");
  }

  revalidatePath("/");
  redirect(status === "DRAFT" ? "/my-submissions" : "/");
}

export async function saveDraftAction(formData: FormData) {
  return saveNews(formData, "DRAFT");
}

export async function submitForApprovalAction(formData: FormData) {
  return saveNews(formData, "PENDING");
}

export async function publishDirectlyAction(formData: FormData) {
  return saveNews(formData, "PUBLISHED");
}

async function updateNews(newsId: string, formData: FormData, status: "DRAFT" | "PENDING" | "PUBLISHED") {
  const session = await requireRole(["MODERATOR", "ADMIN"]);

  const existing = await prisma.news.findUnique({ where: { id: newsId } });
  if (!existing) {
    redirect("/post?error=That article no longer exists.");
  }
  // Any Moderator can edit any news (and it always goes back through
  // approval below) — not just their own submissions. Deleted/Hidden stays
  // Admin-only to edit, same as the visibility rule everywhere else.
  if (session.user.role !== "ADMIN" && (existing.status === "DELETED" || existing.status === "HIDDEN")) {
    redirect("/post?error=That article is no longer available to edit.");
  }

  const parsed = newsSchema.safeParse({
    title: formData.get("title"),
    categoryIds: formData.getAll("categoryIds"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (!parsed.success) {
    redirect(`/post?edit=${newsId}&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  await prisma.news.update({
    where: { id: newsId },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || null,
      sourceUrl: parsed.data.sourceUrl || null,
      categories: { set: parsed.data.categoryIds.map((id) => ({ id })) },
      status,
      rejectionReason: null,
      publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });

  if (status === "PENDING") {
    await notifyAdmins(`Updated submission: "${parsed.data.title}"`, "/approvals");
  }

  revalidatePath("/");
  revalidatePath(`/news/${existing.slug}`);
  revalidatePath("/approvals");
  revalidatePath("/my-submissions");
  redirect(status === "DRAFT" ? "/my-submissions" : `/news/${existing.slug}`);
}

export async function updateNewsAction(
  newsId: string,
  status: "DRAFT" | "PENDING" | "PUBLISHED",
  formData: FormData
) {
  return updateNews(newsId, formData, status);
}

export async function approveNewsAction(newsId: string) {
  const session = await requireRole(["ADMIN"]);

  const [updated] = await prisma.$transaction([
    prisma.news.update({
      where: { id: newsId },
      data: { status: "PUBLISHED", publishedAt: new Date(), rejectionReason: null },
    }),
    prisma.approvalLog.create({
      data: { newsId, adminId: session.user.id, decision: "APPROVED" },
    }),
  ]);

  await notifyUser(updated.authorId, `Your article "${updated.title}" was approved`, `/news/${updated.slug}`);

  revalidatePath("/approvals");
  revalidatePath("/");
}

export async function rejectNewsAction(
  newsId: string,
  _prevState: NewsActionState,
  formData: FormData
) {
  const session = await requireRole(["ADMIN"]);

  const parsed = rejectSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "A reason is required." };
  }

  const [updated] = await prisma.$transaction([
    prisma.news.update({
      where: { id: newsId },
      data: { status: "REJECTED", rejectionReason: parsed.data.reason },
    }),
    prisma.approvalLog.create({
      data: { newsId, adminId: session.user.id, decision: "REJECTED", reason: parsed.data.reason },
    }),
  ]);

  await notifyUser(updated.authorId, `Your article "${updated.title}" was rejected`, `/news/${updated.slug}`);

  revalidatePath("/approvals");
}

// Replaces the old hard-delete: Delete/Hide are now a reversible status
// change (never an actual row removal), so an Admin can always bring a news
// item back via the Archive page. "PUBLISHED" here is the Archive page's
// "Active" option.
export async function updateNewsArchiveStatusAction(
  newsId: string,
  status: "PUBLISHED" | "DELETED" | "HIDDEN"
) {
  const session = await requireRole(["ADMIN"]);
  const isRestoring = status === "PUBLISHED";

  const existing = await prisma.news.update({
    where: { id: newsId },
    data: {
      status,
      archivedAt: isRestoring ? null : new Date(),
      archivedById: isRestoring ? null : session.user.id,
    },
  });

  revalidatePath("/archive");
  revalidatePath("/");
  revalidatePath("/my-submissions");
  revalidatePath(`/news/${existing.slug}`);
}

export async function incrementViewAction(newsId: string) {
  await prisma.news.update({
    where: { id: newsId },
    data: { viewCount: { increment: 1 } },
  });
}

// Powers the "All" nav tab's paginated list (components/AllNewsList.tsx):
// 15 on first load, then 10 more per "More" click, newest first.
export async function loadMoreNewsAction(skip: number, take: number): Promise<NewsRowItem[]> {
  const items = await prisma.news.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    skip,
    take,
    include: { categories: true },
  });

  return items.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    body: n.body,
    imageUrl: n.imageUrl,
    publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
    categories: n.categories.map((c) => ({ name: c.name })),
  }));
}
