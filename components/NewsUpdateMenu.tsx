"use client";

import { useState } from "react";
import Link from "next/link";
import { updateNewsArchiveStatusAction } from "@/lib/actions/news";
import SubmitButton from "@/components/SubmitButton";

// "Update" opens a dropdown. Admin sees Edit / Delete / Hide for any news;
// a Moderator sees Edit only (for any news, not just their own — editing
// always routes back through approval, see lib/actions/news.ts).
export default function NewsUpdateMenu({
  newsId,
  canArchive,
}: {
  newsId: string;
  canArchive: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-white"
      >
        Update
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-36 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
            <Link
              href={`/post?edit=${newsId}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Edit
            </Link>
            {canArchive && (
              <>
                <form action={updateNewsArchiveStatusAction.bind(null, newsId, "DELETED")}>
                  <SubmitButton
                    pendingLabel="Deleting..."
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50"
                  >
                    Delete
                  </SubmitButton>
                </form>
                <form action={updateNewsArchiveStatusAction.bind(null, newsId, "HIDDEN")}>
                  <SubmitButton
                    pendingLabel="Hiding..."
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    Hide
                  </SubmitButton>
                </form>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
