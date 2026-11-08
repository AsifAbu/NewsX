"use client";

import { useState } from "react";
import Link from "next/link";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { BellIcon } from "@/components/icons";

type NotificationItem = {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const badge = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded px-1.5 py-1 text-neutral-700 hover:text-accent"
      >
        <BellIcon className="h-6 w-6" />
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-black/10 bg-white shadow-lg">
            <div className="border-b border-black/10 p-3 font-headline text-sm font-bold">
              Notifications
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-black/5 last:border-0">
                  <Link
                    href={n.link}
                    onClick={() => {
                      setOpen(false);
                      if (!n.isRead) markNotificationReadAction(n.id);
                    }}
                    className={`block px-3 py-2 text-sm hover:bg-neutral-50 ${
                      n.isRead ? "text-neutral-500" : "font-medium text-neutral-900"
                    }`}
                  >
                    {!n.isRead && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />}
                    {n.message}
                    <div className="text-xs font-normal text-neutral-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
              {notifications.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-neutral-500">No notifications yet.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
