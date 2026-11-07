import { prisma } from "@/lib/db";

export async function notifyAdmins(message: string, link: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, message, link })),
  });
}

export async function notifyUser(userId: string, message: string, link: string) {
  await prisma.notification.create({ data: { userId, message, link } });
}
