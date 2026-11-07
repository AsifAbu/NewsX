"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export default function UserMenu({
  name,
  role,
}: {
  name: string;
  role: "USER" | "MODERATOR" | "ADMIN";
}) {
  const [open, setOpen] = useState(false);
  const isAdmin = role === "ADMIN";
  const canWrite = role === "MODERATOR" || role === "ADMIN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap text-neutral-600 hover:text-accent"
      >
        {name} ▾
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
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
