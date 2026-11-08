"use client";

import { useActionState } from "react";
import { registerAction, type RegisterActionState } from "@/lib/actions/auth";

function fieldClass(hasError: boolean) {
  return `w-full rounded border p-2 text-sm ${
    hasError ? "border-red-500 bg-red-50" : "border-black/10"
  }`;
}

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterActionState, FormData>(
    registerAction,
    undefined
  );
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-3">
      <h1 className="font-headline text-2xl font-bold">Create account</h1>

      <div>
        <input
          name="name"
          placeholder="Name"
          required
          defaultValue={state?.values?.name}
          className={fieldClass(Boolean(fieldErrors.name))}
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          defaultValue={state?.values?.email}
          className={fieldClass(Boolean(fieldErrors.email))}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <input
          name="phone"
          type="tel"
          placeholder="Phone number"
          required
          defaultValue={state?.values?.phone}
          className={fieldClass(Boolean(fieldErrors.phone))}
        />
        {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
      </div>

      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className={fieldClass(Boolean(fieldErrors.password))}
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
      </div>

      <div>
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          className={fieldClass(Boolean(fieldErrors.confirmPassword))}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
}
