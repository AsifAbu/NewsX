"use client";

import { useState, useTransition } from "react";
import {
  saveDraftAction,
  submitForApprovalAction,
  publishDirectlyAction,
  updateNewsAction,
} from "@/lib/actions/news";
import { pullArticleAction } from "@/lib/actions/scrape";
import { rephraseAction } from "@/lib/actions/rephrase";
import ImageUpload from "@/components/ImageUpload";

type Category = { id: string; name: string };

export default function NewsForm({
  categories,
  isAdmin,
  error,
  newsId,
  initialTitle = "",
  initialCategoryId = "",
  initialImageUrl = "",
  initialBody = "",
  initialSourceUrl = "",
}: {
  categories: Category[];
  isAdmin: boolean;
  error?: string;
  newsId?: string;
  initialTitle?: string;
  initialCategoryId?: string;
  initialImageUrl?: string;
  initialBody?: string;
  initialSourceUrl?: string;
}) {
  const isEditing = Boolean(newsId);
  const [useLink, setUseLink] = useState(Boolean(initialSourceUrl));
  const [link, setLink] = useState(initialSourceUrl);
  const [title, setTitle] = useState(initialTitle);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [body, setBody] = useState(initialBody);
  const [pullError, setPullError] = useState("");
  const [rephraseError, setRephraseError] = useState("");
  const [isPulling, startPulling] = useTransition();
  const [isRephrasing, startRephrasing] = useTransition();

  function handlePull() {
    setPullError("");
    startPulling(async () => {
      const result = await pullArticleAction(link);
      if ("error" in result) {
        setPullError(result.error);
        return;
      }
      setTitle(result.title);
      setImageUrl(result.imageUrl ?? "");
      setBody(result.body);
    });
  }

  function handleRephrase() {
    setRephraseError("");
    startRephrasing(async () => {
      const result = await rephraseAction(body);
      if ("error" in result) {
        setRephraseError(result.error);
        return;
      }
      setBody(result.body);
    });
  }

  const draftAction = isEditing ? updateNewsAction.bind(null, newsId!, "DRAFT") : saveDraftAction;
  const submitAction = isEditing
    ? updateNewsAction.bind(null, newsId!, "PENDING")
    : submitForApprovalAction;
  const publishAction = isEditing
    ? updateNewsAction.bind(null, newsId!, "PUBLISHED")
    : publishDirectlyAction;

  return (
    <form action={draftAction} className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-headline text-2xl font-bold">{isEditing ? "Edit News" : "Write News"}</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <select
        name="categoryId"
        required
        defaultValue={initialCategoryId}
        className="w-full rounded border border-black/10 p-2 text-sm"
      >
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex w-fit items-center gap-2 text-sm">
        <button
          type="button"
          role="switch"
          aria-checked={useLink}
          onClick={() => setUseLink((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            useLink ? "bg-accent" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              useLink ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span>{useLink ? "Link" : "Manual"}</span>
      </div>

      {useLink && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://your-blog.com/post-url"
              className="flex-1 rounded border border-black/10 p-2 text-sm"
            />
            <button
              type="button"
              onClick={handlePull}
              disabled={isPulling || !link}
              className="rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPulling ? "Pulling..." : "Pull"}
            </button>
          </div>
          {pullError && <p className="text-sm text-red-600">{pullError}</p>}
          <p className="text-xs text-neutral-500">
            Pulls title, image, and body from the page below for you to review and edit before submitting.
          </p>
          <input type="hidden" name="sourceUrl" value={link} />
        </div>
      )}

      <input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="w-full rounded border border-black/10 p-2 text-sm"
      />

      <input type="hidden" name="imageUrl" value={imageUrl} />
      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        placeholder="Write the article in Markdown..."
        required
        className="w-full rounded border border-black/10 p-2 text-sm"
      />

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRephrase}
            disabled={isRephrasing || !body.trim()}
            className="rounded border border-black/10 px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
          >
            {isRephrasing ? "Rephrasing..." : "Rephrase"}
          </button>
          {rephraseError && <p className="text-sm text-red-600">{rephraseError}</p>}
        </div>
        <p className="text-xs text-amber-600">
          ⚠️ Rephrase with AI can make mistakes — please review carefully before submitting or publishing.
        </p>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="rounded border border-black/10 px-3 py-2 text-sm hover:border-accent">
          Save Draft
        </button>
        <button
          type="submit"
          formAction={submitAction}
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90"
        >
          Submit for Approval
        </button>
        {isAdmin && (
          <button
            type="submit"
            formAction={publishAction}
            className="rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Publish
          </button>
        )}
      </div>
    </form>
  );
}
