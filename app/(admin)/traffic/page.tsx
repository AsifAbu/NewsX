import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Monday as the start of the week (ISO 8601 convention) - change here if
// NewsX should use a Sunday-start week instead.
function startOfWeek(now: Date): Date {
  const start = startOfToday(now);
  const day = start.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  return start;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function TrafficPage() {
  await requireRole(["ADMIN"]);

  const now = new Date();
  const [today, thisWeek, thisMonth, allTime, uniqueToday, uniqueThisWeek, uniqueThisMonth, uniqueAllTime] =
    await Promise.all([
      prisma.siteVisit.count({ where: { visitedAt: { gte: startOfToday(now) } } }),
      prisma.siteVisit.count({ where: { visitedAt: { gte: startOfWeek(now) } } }),
      prisma.siteVisit.count({ where: { visitedAt: { gte: startOfMonth(now) } } }),
      prisma.siteVisit.count(),
      // Prisma has no direct COUNT(DISTINCT col) aggregate - groupBy the
      // visitor key and take the row count instead.
      prisma.siteVisit.groupBy({ by: ["visitorKey"], where: { visitedAt: { gte: startOfToday(now) } } }),
      prisma.siteVisit.groupBy({ by: ["visitorKey"], where: { visitedAt: { gte: startOfWeek(now) } } }),
      prisma.siteVisit.groupBy({ by: ["visitorKey"], where: { visitedAt: { gte: startOfMonth(now) } } }),
      prisma.siteVisit.groupBy({ by: ["visitorKey"] }),
    ]);

  const stats = [
    { label: "Today", value: today, unique: uniqueToday.length },
    { label: "This Week", value: thisWeek, unique: uniqueThisWeek.length },
    { label: "This Month", value: thisMonth, unique: uniqueThisMonth.length },
    { label: "All Time", value: allTime, unique: uniqueAllTime.length },
  ];

  return (
    <div className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">Site Traffic</h1>
      <p className="text-sm text-neutral-500">
        Every page visit, Guests included, counted once per page viewed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-black/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{s.label}</p>
            <p className="mt-1 font-headline text-3xl font-bold text-accent">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {s.unique.toLocaleString()} unique visitor{s.unique === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
