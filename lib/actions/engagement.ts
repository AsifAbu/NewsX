"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/require-role";
import { commentSchema } from "@/lib/validation/comment";
import { notifyAdmins } from "@/lib/notify";

export type CommentActionState = { error?: string } | undefined;

export async function addCommentAction(
  newsId: string,
  slug: string,
  _prevState: CommentActionState,
  formData: FormData
) {
  const session = await requireSession();

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  await prisma.comment.create({
    data: { newsId, userId: session.user.id, body: parsed.data.body },
  });

  revalidatePath(`/news/${slug}`);
}

export async function reportCommentAction(
  commentId: string,
  slug: string,
  _prevState: CommentActionState,
  formData: FormData
) {
  const session = await requireSession();
  const reason = (formData.get("reason") as string | null)?.trim();
  if (!reason) {
    return { error: "Please say why you're reporting this comment." };
  }

  await prisma.report.create({ data: { commentId, reporterId: session.user.id, reason } });
  await notifyAdmins("A comment was reported", "/reports");
  revalidatePath(`/news/${slug}`);
  revalidatePath("/reports");
}

export async function deleteCommentAction(commentId: string, slug: string) {
  await requireRole(["ADMIN"]);
  await prisma.report.deleteMany({ where: { commentId } });
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/news/${slug}`);
  revalidatePath("/reports");
}

export async function dismissReportsAction(commentId: string) {
  await requireRole(["ADMIN"]);
  await prisma.report.deleteMany({ where: { commentId } });
  revalidatePath("/reports");
}

export async function toggleBookmarkAction(newsId: string, slug: string) {
  const session = await requireSession();

  const existing = await prisma.bookmark.findUnique({
    where: { userId_newsId: { userId: session.user.id, newsId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: session.user.id, newsId } });
  }

  revalidatePath(`/news/${slug}`);
}
