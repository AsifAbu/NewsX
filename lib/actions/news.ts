"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newsSchema, rejectSchema } from "@/lib/validation/news";
import { requireRole } from "@/lib/require-role";
import { notifyAdmins, notifyUser } from "@/lib/notify";

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
  if (session.user.role !== "ADMIN" && existing.authorId !== session.user.id) {
    redirect("/post?error=You can only edit your own submissions.");
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

export async function deleteNewsAction(newsId: string) {
  await requireRole(["ADMIN"]);
  await prisma.news.delete({ where: { id: newsId } });
  revalidatePath("/");
}

export async function incrementViewAction(newsId: string) {
  await prisma.news.update({
    where: { id: newsId },
    data: { viewCount: { increment: 1 } },
  });
}
