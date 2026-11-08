"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAvatarAction } from "@/lib/actions/profile";
import { UserCircleIcon } from "@/components/icons";

export default function AvatarUpload({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [isUploading, startUploading] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    startUploading(async () => {
      try {
        const result = await uploadAvatarAction(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setUrl(result.url);
      } catch {
        // Without this, an unexpected throw from the action would leave the
        // upload looking like it silently did nothing — no new image, no error.
        setError("Upload failed. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile picture"
        className="h-20 w-20 overflow-hidden rounded-full border border-black/10 bg-neutral-100 text-neutral-300 disabled:opacity-50"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <UserCircleIcon className="h-full w-full" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="text-xs text-accent hover:underline disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Change photo"}
      </button>
      {error && <p className="w-28 text-center text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
