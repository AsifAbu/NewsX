"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

export type UserActionState = { error?: string } | undefined;

export async function deactivateUserAction(
  userId: string,
  _prevState: UserActionState,
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const raw = formData.get("deactivatedAt");
  if (!raw || typeof raw !== "string") {
    return { error: "Pick a date and time." };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { error: "That date/time isn't valid." };
  }

  await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: date } });
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

export async function reactivateUserAction(userId: string) {
  await requireRole(["ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: null } });
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

export async function deleteUserAction(userId: string) {
  await requireRole(["ADMIN"]);

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    // Foreign key constraint — they've authored news, comments, etc.
    redirect(
      `/users/${userId}?error=${encodeURIComponent(
        "Can't delete — this user has published content (news, comments, or approvals on record). Deactivate them instead."
      )}`
    );
  }

  revalidatePath("/users");
  redirect("/users");
}
