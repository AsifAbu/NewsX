"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/user";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export type ActionState = { error?: string } | undefined;

export type RegisterFieldErrors = Partial<
  Record<"name" | "email" | "phone" | "password" | "confirmPassword", string>
>;

export type RegisterActionState =
  | {
      error?: string;
      fieldErrors?: RegisterFieldErrors;
      values?: { name: string; email: string; phone: string };
    }
  | undefined;

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
  // Echoed back on failure so the form can repopulate itself — password
  // fields are deliberately excluded (never echo a submitted password).
  const values = {
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: RegisterFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof RegisterFieldErrors] = issue.message;
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

  // MVP: no email verification — account is active immediately (see docs/Architecture.md).
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
    },
  });

  redirect("/login");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
