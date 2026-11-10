"use client";

import { Fragment } from "react";
import Link from "next/link";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import TableCard, { tableHeadRowClass, thClass, tdClass } from "@/components/TableCard";

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
// Single full-width table (same TableCard convention as every other list
// page), with each day's label as its own separator row inside the table
// rather than separate boxes per day.
export default function NotificationList({ groups }: { groups: Group[] }) {
  return (
    <TableCard>
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRowClass}>
            <th className={thClass}>Notification</th>
            <th className={thClass}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {groups.length === 0 && (
            <tr>
              <td className={tdClass} colSpan={2}>
                <span className="text-neutral-500">No notifications yet.</span>
              </td>
            </tr>
          )}
          {groups.map((g) => (
            <Fragment key={g.label}>
              <tr>
                <td
                  colSpan={2}
                  className="bg-neutral-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-neutral-500"
                >
                  {g.label}
                </td>
              </tr>
              {g.items.map((n) => (
                <tr key={n.id}>
                  <td className={tdClass}>
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (!n.isRead) markNotificationReadAction(n.id);
                      }}
                      className={`block hover:text-accent ${
                        n.isRead ? "text-neutral-500" : "font-medium text-neutral-900"
                      }`}
                    >
                      {!n.isRead && (
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                      {n.message}
                    </Link>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-neutral-500`}>
                    {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
