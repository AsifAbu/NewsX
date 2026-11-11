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
import RichTextEditor from "@/components/RichTextEditor";
import SubmitButton from "@/components/SubmitButton";
import { toBodyHtml } from "@/lib/richtext";

type Category = { id: string; name: string };

export default function NewsForm({
  categories,
  isAdmin,
  error,
  newsId,
  initialTitle = "",
  initialCategoryIds = [],
  initialImageUrl = "",
  initialBody = "",
  initialSourceUrl = "",
  initialNewsSource = "",
}: {
  categories: Category[];
  isAdmin: boolean;
  error?: string;
  newsId?: string;
  initialTitle?: string;
  initialCategoryIds?: string[];
  initialImageUrl?: string;
  initialBody?: string;
  initialSourceUrl?: string;
  initialNewsSource?: string;
}) {
  const isEditing = Boolean(newsId);
  const [useLink, setUseLink] = useState(Boolean(initialSourceUrl));
  const [link, setLink] = useState(initialSourceUrl);
  const [title, setTitle] = useState(initialTitle);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [newsSource, setNewsSource] = useState(initialNewsSource);
  // initialBody may be legacy plain text (pre-rich-text rows) or HTML — the
  // editor always works in HTML.
  const [body, setBody] = useState(() => toBodyHtml(initialBody));
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
      // Scraper now returns already-sanitized HTML (images/lists/formatting
      // preserved) — set it directly, no plain-text conversion needed.
      setBody(result.body);
      setNewsSource(result.sourceName);
    });
  }

  function handleRephrase() {
    setRephraseError("");
    startRephrasing(async () => {
      // rephraseAction works on the HTML directly and rephrases only the
      // text blocks, leaving images (and anything else non-text) in place.
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
    <form action={draftAction} className="w-full space-y-4">
      <h1 className="font-headline text-2xl font-bold">{isEditing ? "Edit News" : "Write News"}</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <fieldset className="rounded border border-black/10 p-2">
        <legend className="px-1 text-xs text-neutral-500">Categories (select one or more)</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={c.id}
                defaultChecked={initialCategoryIds.includes(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

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

      <div className="space-y-1">
        <input
          name="newsSource"
          value={newsSource}
          onChange={(e) => setNewsSource(e.target.value)}
          placeholder="News Source (e.g. World Economic Forum: Future of Jobs Report 2025)"
          className="w-full rounded border border-black/10 p-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          Shown on the article as &ldquo;Source: ...&rdquo;. Auto-filled when you Pull from a link —
          edit freely either way. Leave blank to show no source line.
        </p>
      </div>

      <input type="hidden" name="imageUrl" value={imageUrl} />
      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <input type="hidden" name="body" value={body} />
      <RichTextEditor value={body} onChange={setBody} />

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
        <SubmitButton
          pendingLabel="Saving..."
          className="rounded border border-black/10 px-3 py-2 text-sm hover:border-accent"
        >
          Save Draft
        </SubmitButton>
        <SubmitButton
          formAction={submitAction}
          pendingLabel="Submitting..."
          className="rounded bg-accent px-3 py-2 text-sm text-white hover:opacity-90"
        >
          Submit for Approval
        </SubmitButton>
        {isAdmin && (
          <SubmitButton
            formAction={publishAction}
            pendingLabel="Publishing..."
            className="rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Publish
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
