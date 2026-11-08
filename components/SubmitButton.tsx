"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

// Drop-in replacement for a plain <button type="submit"> (or a button with a
// formAction override) inside a <form action={...}>. useFormStatus() reports
// pending=true for every button in that form while ANY submission from it is
// in flight — regardless of which button triggered it — so this blocks a
// double-click into firing the action twice (e.g. double-publishing a news
// article) and blocks other buttons in the same form (e.g. "Save Draft")
// until the in-flight one finishes, without each call site re-implementing
// its own useTransition/useActionState pending state.
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending && (
        <svg
          className="mr-1.5 inline h-3 w-3 animate-spin align-[-1px]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
