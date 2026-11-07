"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { deactivateUserAction, type UserActionState } from "@/lib/actions/users";

export default function DeactivateModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const action = deactivateUserAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-amber-600 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50"
      >
        Deactivate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h2 className="font-headline text-lg font-bold">Deactivate user</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Pick the date and time this account should become deactivated. A future time keeps it
              active until then; now or a past time deactivates it immediately on next login.
            </p>

            <form action={formAction} className="mt-4 space-y-3">
              <input
                type="datetime-local"
                name="deactivatedAt"
                required
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
                  className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Confirming..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
