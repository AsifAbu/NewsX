import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import NotificationList from "@/components/NotificationList";
import SubmitButton from "@/components/SubmitButton";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import Pagination from "@/components/Pagination";

// "Today" / "Yesterday" / full date for anything older — same relative-label
// convention a phone's own notification center uses.
function dayLabel(date: Date, now: Date) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireSession();

  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  // Notifications already arrive newest-first, so partitioning them in place
  // by day label naturally produces day clusters in descending order, each
  // cluster itself newest-first.
  const now = new Date();
  const groups: { label: string; items: { id: string; message: string; link: string; isRead: boolean; createdAt: string }[] }[] = [];
  for (const n of notifications) {
    const label = dayLabel(n.createdAt, now);
    const item = {
      id: n.id,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold">Notifications</h1>
        <form action={markAllNotificationsReadAction}>
          <SubmitButton
            pendingLabel="Marking..."
            className="rounded border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-white"
          >
            Mark all as read
          </SubmitButton>
        </form>
      </div>
      <NotificationList groups={groups} />
      <Pagination
        page={page}
        totalPages={totalPagesFor(total)}
        buildHref={(p) => `/notifications?page=${p}`}
      />
    </div>
  );
}
