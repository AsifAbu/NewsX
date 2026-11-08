"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { UserCircleIcon } from "@/components/icons";

export default function UserMenu({
  name,
  role,
  avatarUrl,
}: {
  name: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isAdmin = role === "ADMIN";
  const canWrite = role === "MODERATOR" || role === "ADMIN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Account menu for ${name}`}
        title={name}
        className="flex items-center text-neutral-600 hover:text-accent"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <UserCircleIcon className="h-7 w-7" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
            <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
              Profile
            </Link>
            <Link href="/bookmarks" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
              Bookmarks
            </Link>
            {canWrite && (
              <Link href="/post" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                Write
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/approvals" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                  Approvals
                </Link>
                <Link href="/users" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                  Users
                </Link>
                <Link href="/reports" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                  Reports
                </Link>
              </>
            )}
            <form action={logoutAction}>
              <button type="submit" className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50">
                Logout
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
