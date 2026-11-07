"use client";

import { useActionState } from "react";
import { rejectNewsAction, type NewsActionState } from "@/lib/actions/news";

export default function RejectForm({ newsId }: { newsId: string }) {
  const action = rejectNewsAction.bind(null, newsId);
  const [state, formAction, pending] = useActionState<NewsActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="reason"
        placeholder="Rejection reason"
        required
        className="flex-1 rounded border border-black/10 p-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
