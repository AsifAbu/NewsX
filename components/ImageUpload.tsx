"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/lib/actions/upload";

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isUploading, startUploading] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    startUploading(async () => {
      const result = await uploadImageAction(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onChange(result.url);
      setName(result.name);
    });
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) upload(file);
  }

  function handleRemove() {
    onChange("");
    setName("");
    setError("");
  }

  return (
    <div className="space-y-2" onPaste={handlePaste} tabIndex={0}>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL (or upload / paste an image below)"
          className="flex-1 rounded border border-black/10 p-2 text-sm"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded border border-black/10 px-3 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <p className="text-xs text-neutral-500">
        Click &ldquo;Choose file&rdquo; to upload from your machine, or click in this area and paste
        (Ctrl/Cmd+V) an image copied to your clipboard.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {value && (
        <div className="flex items-center justify-between rounded border border-black/10 p-2 text-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
            <span className="truncate text-neutral-700">{name || value}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded border border-black/10 px-2 py-1 text-xs hover:border-red-600 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
