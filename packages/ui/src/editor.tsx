"use client";

import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { tiptapToMarkdown } from "./editor-markdown";
import { Input } from "./field";

type TipTapEditor = NonNullable<ReturnType<typeof useEditor>>;

type EditorProps = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onMarkdownChange?: (markdown: string) => void;
};

const emptyMarks = {
  bold: false,
  italic: false,
  h2: false,
  h3: false,
  bullet: false,
  ordered: false,
  link: false,
  code: false,
};

export function RichTextEditor({
  placeholder = "Write the copy the agent should know…",
  disabled,
  className,
  onMarkdownChange,
}: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class: "signal-editor-doc",
        role: "textbox",
        "aria-label": "Content",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onMarkdownChange?.(tiptapToMarkdown(instance.getJSON()));
    },
  });

  return (
    <div
      className={cn(
        "signal-editor overflow-hidden rounded-sm border border-[#2c3038] bg-[#0e1014]",
        "transition-[border-color] duration-[var(--dur-press)] ease-[var(--ease-out)]",
        "focus-within:border-[var(--accent)]",
        disabled && "opacity-40",
        className,
      )}
    >
      {editor ? <EditorToolbar editor={editor} /> : <ToolbarSkeleton />}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-[280px] px-5 py-4 text-[14px] text-[var(--mute)]">{placeholder}</div>
      )}
    </div>
  );
}

function ToolbarSkeleton() {
  return <div className="h-10 border-b border-[#2c3038] bg-[#14161b]" />;
}

function EditorToolbar({ editor }: { editor: TipTapEditor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("https://");
  const marks = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      h2: instance.isActive("heading", { level: 2 }),
      h3: instance.isActive("heading", { level: 3 }),
      bullet: instance.isActive("bulletList"),
      ordered: instance.isActive("orderedList"),
      link: instance.isActive("link"),
      code: instance.isActive("code"),
    }),
  }) ?? emptyMarks;

  function applyLink() {
    const next = href.trim();
    if (!next) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run();
    setLinkOpen(false);
  }

  function toggleLink() {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      setLinkOpen(false);
      return;
    }
    setHref(String(editor.getAttributes("link").href ?? "https://"));
    setLinkOpen((open) => !open);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#2c3038] bg-[#14161b] px-2 py-1.5">
      <MarkButton
        label="Bold"
        active={marks.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton
        label="Italic"
        active={marks.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton
        label="Heading 2"
        active={marks.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton
        label="Heading 3"
        active={marks.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={14} strokeWidth={1.75} />
      </MarkButton>
      <span aria-hidden className="mx-1 h-4 w-px bg-[#2c3038]" />
      <MarkButton
        label="Bullet list"
        active={marks.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton
        label="Numbered list"
        active={marks.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton label="Link" active={marks.link || linkOpen} onClick={toggleLink}>
        <LinkIcon size={14} strokeWidth={1.75} />
      </MarkButton>
      <MarkButton
        label="Inline code"
        active={marks.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} strokeWidth={1.75} />
      </MarkButton>
      {linkOpen ? (
        <div className="ml-1 flex min-w-[12rem] flex-1 items-center gap-1.5">
          <Input
            value={href}
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://"
            aria-label="Link URL"
            className="h-7 py-1 text-[13px]"
          />
          <Button type="button" size="sm" className="h-7 px-2.5" onClick={applyLink}>
            Link
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MarkButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 min-w-7 px-2 text-[var(--mute)]",
        active && "border-[var(--accent)] text-[var(--accent)]",
      )}
    >
      {children}
    </Button>
  );
}
