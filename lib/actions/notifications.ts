"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession();
  // Scope to the current user so one user can't mark another's as read.
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });
  // The bell/badge live in the Navbar, which is part of the root layout —
  // without this, the DB write succeeds but the unread dot/count never
  // visibly clears until a hard reload.
  revalidatePath("/", "layout");
}
