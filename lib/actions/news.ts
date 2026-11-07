"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newsSchema, rejectSchema } from "@/lib/validation/news";
import { requireRole } from "@/lib/require-role";

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
    categoryId: formData.get("categoryId"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
  });
  if (!parsed.success) {
    redirect(`/post?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  await prisma.news.create({
    data: {
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || null,
      sourceUrl: parsed.data.sourceUrl || null,
      categoryId: parsed.data.categoryId,
      authorId: session.user.id,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

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

export async function approveNewsAction(newsId: string) {
  const session = await requireRole(["ADMIN"]);

  await prisma.$transaction([
    prisma.news.update({
      where: { id: newsId },
      data: { status: "PUBLISHED", publishedAt: new Date(), rejectionReason: null },
    }),
    prisma.approvalLog.create({
      data: { newsId, adminId: session.user.id, decision: "APPROVED" },
    }),
  ]);

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

  await prisma.$transaction([
    prisma.news.update({
      where: { id: newsId },
      data: { status: "REJECTED", rejectionReason: parsed.data.reason },
    }),
    prisma.approvalLog.create({
      data: { newsId, adminId: session.user.id, decision: "REJECTED", reason: parsed.data.reason },
    }),
  ]);

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
