"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { UserCircleIcon, ChevronDownIcon } from "@/components/icons";
import SubmitButton from "@/components/SubmitButton";

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
    <div className="relative flex items-center gap-0.5">
      {/* Avatar/icon navigates directly to the profile page */}
      <Link
        href="/profile"
        title={name}
        aria-label={`Go to profile: ${name}`}
        className="flex items-center text-neutral-600 hover:text-accent"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <UserCircleIcon className="h-7 w-7" />
        )}
      </Link>

      {/* Chevron button opens the dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="text-neutral-400 hover:text-accent"
      >
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
            <Link href="/bookmarks" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
              Bookmarks
            </Link>
            {canWrite && (
              <>
                <Link href="/post" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                  Write
                </Link>
                <Link
                  href="/my-submissions"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  My Submissions
                </Link>
              </>
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
                <Link href="/archive" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-neutral-50">
                  Archive
                </Link>
              </>
            )}
            <form action={logoutAction}>
              <SubmitButton
                pendingLabel="Logging out..."
                className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
              >
                Logout
              </SubmitButton>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
