import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

type Role = "USER" | "MODERATOR" | "ADMIN";

// Centralized authorization check — RULES.md: every Moderator/Admin action
// calls this first instead of re-implementing role checks ad hoc.
export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    redirect("/login");
  }
  return session;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
