"use server";

import { prisma } from "@/lib/db";

// No auth check - Guests count toward traffic too (confirmed requirement).
// Fired once per page visited, from components/TrackVisit.tsx.
export async function recordVisitAction() {
  await prisma.siteVisit.create({ data: {} });
}
