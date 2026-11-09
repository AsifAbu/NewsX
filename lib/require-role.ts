import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

type Role = "USER" | "MODERATOR" | "ADMIN";

// Centralized authorization check — RULES.md: every Moderator/Admin action
// calls this first instead of re-implementing role checks ad hoc.
//
// Not logged in at all -> /login (session genuinely missing/expired).
// Logged in but wrong role -> /denied (distinct "access denied" message,
// so a legitimate session never looks like it expired — TC-ADM-15).
export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!roles.includes(session.user.role)) {
    redirect("/denied");
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
