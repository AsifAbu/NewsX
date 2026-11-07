"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/require-role";
import { commentSchema } from "@/lib/validation/comment";

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

export async function reportCommentAction(commentId: string, slug: string) {
  await requireSession();
  await prisma.comment.update({ where: { id: commentId }, data: { status: "REPORTED" } });
  revalidatePath(`/news/${slug}`);
}

export async function deleteCommentAction(commentId: string, slug: string) {
  await requireRole(["ADMIN"]);
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/news/${slug}`);
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
