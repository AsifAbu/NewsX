"use client";

import { useActionState } from "react";
import { addCommentAction, type CommentActionState } from "@/lib/actions/engagement";

export default function CommentForm({ newsId, slug }: { newsId: string; slug: string }) {
  const action = addCommentAction.bind(null, newsId, slug);
  const [state, formAction, pending] = useActionState<CommentActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="body"
        rows={3}
        placeholder="Add a comment..."
        className="w-full rounded border border-black/10 p-2 text-sm"
        required
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
