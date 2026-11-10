"use client";

import Link from "next/link";
import { markNotificationReadAction } from "@/lib/actions/notifications";

type NotificationItem = {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

type Group = { label: string; items: NotificationItem[] };

// Full notifications page, grouped into day clusters (newest day first, see
// the grouping logic in page.tsx) — the bell dropdown's "View all" opens
// here for the complete history instead of the dropdown's capped list.
export default function NotificationList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return <p className="text-neutral-500">No notifications yet.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{g.label}</h2>
          <ul className="divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 bg-white">
            {g.items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link}
                  onClick={() => {
                    if (!n.isRead) markNotificationReadAction(n.id);
                  }}
                  className={`flex items-start gap-2 px-4 py-3 text-sm hover:bg-neutral-50 ${
                    n.isRead ? "text-neutral-500" : "font-medium text-neutral-900"
                  }`}
                >
                  {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  <div>
                    {n.message}
                    <div className="mt-0.5 text-xs font-normal text-neutral-400">
                      {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
