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
  const [today, thisWeek, thisMonth, allTime] = await Promise.all([
    prisma.siteVisit.count({ where: { visitedAt: { gte: startOfToday(now) } } }),
    prisma.siteVisit.count({ where: { visitedAt: { gte: startOfWeek(now) } } }),
    prisma.siteVisit.count({ where: { visitedAt: { gte: startOfMonth(now) } } }),
    prisma.siteVisit.count(),
  ]);

  const stats = [
    { label: "Today", value: today },
    { label: "This Week", value: thisWeek },
    { label: "This Month", value: thisMonth },
    { label: "All Time", value: allTime },
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
          </div>
        ))}
      </div>
    </div>
  );
}
