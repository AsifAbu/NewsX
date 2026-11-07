"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, undefined);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-3">
      <h1 className="font-headline text-2xl font-bold">Log in</h1>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full rounded border border-black/10 p-2 text-sm"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full rounded border border-black/10 p-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
