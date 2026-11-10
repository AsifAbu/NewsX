"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { uploadImageAction } from "@/lib/actions/upload";
import {
  ListBulletIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  PhotoIcon,
  UndoIcon,
  RedoIcon,
  ClearFormatIcon,
} from "@/components/icons";

// Word/Notion/Gutenberg all drop to a normal paragraph after Enter at the
// end of a heading line — plain ProseMirror instead continues the heading.
// Mid-heading Enter still splits normally (falls through to the default).
const ExitingHeading = Heading.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;
        if (!empty || $from.parent.type.name !== this.name) return false;
        const isAtEnd = $from.parentOffset === $from.parent.content.size;
        if (!isAtEnd) return false;
        return this.editor.chain().insertContentAt($from.pos, { type: "paragraph" }).focus().run();
      },
    };
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-medium disabled:opacity-40 ${
        active ? "bg-accent text-white" : "text-neutral-700 hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 w-px shrink-0 self-stretch bg-black/10" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleSetLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function handleImageFile(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadImageAction(formData);
      if ("error" in result) {
        window.alert(result.error);
        return;
      }
      // setImage() alone can leave the selection as a NodeSelection on the
      // image itself (confirmed live), so the next keystroke replaces it
      // outright instead of typing after it. Inserting a paragraph right
      // along with the image guarantees the cursor lands in real text.
      const insertAt = editor.state.selection.from;
      editor
        .chain()
        .focus()
        .insertContentAt(insertAt, [
          { type: "image", attrs: { src: result.url, alt: "" } },
          { type: "paragraph" },
        ])
        .run();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t border border-b-0 border-black/10 bg-neutral-50 p-1.5">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <ListBulletIcon />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrderedIcon />
      </ToolbarButton>
      <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <QuoteIcon />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={handleSetLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton label="Insert image" disabled={isUploading} onClick={() => imageInputRef.current?.click()}>
        <PhotoIcon />
      </ToolbarButton>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      <ToolbarDivider />

      <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <ClearFormatIcon />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon />
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the article...",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  // Tracks the HTML this editor instance itself last emitted via onUpdate —
  // used below to tell "value changed because we typed/edited" apart from
  // "value changed from outside" without relying on render/effect ordering
  // (a one-shot boolean flag isn't safe here: fast keystrokes can fire
  // several onUpdate calls before React gets around to running the effect
  // for the first one, so a flag gets consumed by the wrong render pass —
  // confirmed live: that race was wiping a just-inserted image).
  const lastEmittedHtml = useRef(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Tiptap v3's StarterKit already bundles Link and Underline — only
      // Heading needs swapping out for the Enter-exits-heading variant.
      StarterKit.configure({ heading: false, link: { openOnClick: false, autolink: true } }),
      ExitingHeading.configure({ levels: [2, 3] }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[240px] rounded-b border border-black/10 p-3 text-sm focus:outline-none [&_img]:rounded [&_img]:max-h-96",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
  });

  // Keeps the editor in sync when `value` changes from outside (AI
  // rephrase, "Pull" from a source URL, loading an existing draft) — a
  // no-op when `value` just reflects this editor's own last onUpdate.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedHtml.current) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      lastEmittedHtml.current = value;
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[240px] rounded border border-black/10 p-3 text-sm text-neutral-400">{placeholder}</div>;
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
