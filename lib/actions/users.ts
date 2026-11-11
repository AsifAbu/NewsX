"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { adminCreateUserSchema } from "@/lib/validation/user";
import type { Role } from "@/app/generated/prisma/client";

export type UserActionState = { error?: string } | undefined;

export type CreateUserFieldErrors = Partial<
  Record<"name" | "email" | "phone" | "password" | "confirmPassword" | "role", string>
>;

export type CreateUserActionState =
  | {
      error?: string;
      fieldErrors?: CreateUserFieldErrors;
      values?: { name: string; email: string; phone: string; role: string };
    }
  | undefined;

// Admin-only: creates a User/Moderator/Admin account directly (no self-signup
// flow, no email verification — mirrors registerAction's shape so the form
// can reuse the same field-error/echo pattern).
export async function createUserAction(
  _prevState: CreateUserActionState,
  formData: FormData
): Promise<CreateUserActionState> {
  await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
  };
  const values = {
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    role: typeof raw.role === "string" ? raw.role : "USER",
  };

  const parsed = adminCreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: CreateUserFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof CreateUserFieldErrors] = issue.message;
      }
    }
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", fieldErrors, values };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return {
      error: "That email is already registered.",
      fieldErrors: { email: "That email is already registered." },
      values,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role as Role,
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function deactivateUserAction(
  userId: string,
  _prevState: UserActionState,
  formData: FormData
) {
  const session = await requireRole(["ADMIN"]);

  if (session.user.id === userId) {
    return { error: "You cannot deactivate your own account." };
  }

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

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (target?.role === "ADMIN") {
    redirect(
      `/users/${userId}?error=${encodeURIComponent("Admin accounts cannot be deleted.")}`
    );
  }

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
