"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const VISITOR_COOKIE = "nx_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// No auth check - Guests count toward traffic too (confirmed requirement).
// Fired once per page visited, from components/TrackVisit.tsx.
export async function recordVisitAction() {
  const session = await auth();
  const cookieStore = await cookies();

  // Logged-in users are identified by account id (stable across browsers/
  // devices); Guests get a random, non-identifying id from a long-lived
  // cookie instead, so unique counts can include them too.
  let visitorKey = session?.user?.id;
  if (!visitorKey) {
    visitorKey = cookieStore.get(VISITOR_COOKIE)?.value;
    if (!visitorKey) {
      visitorKey = randomUUID();
      cookieStore.set(VISITOR_COOKIE, visitorKey, {
        maxAge: VISITOR_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  await prisma.siteVisit.create({ data: { visitorKey } });
}
