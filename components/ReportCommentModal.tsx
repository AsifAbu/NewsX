"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { reportCommentAction, type CommentActionState } from "@/lib/actions/engagement";

export default function ReportCommentModal({ commentId, slug }: { commentId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const action = reportCommentAction.bind(null, commentId, slug);
  const [state, formAction, pending] = useActionState<CommentActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hover:text-accent">
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h2 className="font-headline text-lg font-bold">Report comment</h2>
            <p className="mt-1 text-sm text-neutral-600">Tell us why this comment should be reviewed.</p>

            <form action={formAction} className="mt-4 space-y-3">
              <textarea
                name="reason"
                rows={3}
                required
                placeholder="e.g. harassment, spam, misinformation..."
                className="w-full rounded border border-black/10 p-2 text-sm"
              />
              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-black/10 px-3 py-1.5 text-sm hover:border-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Reporting..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
