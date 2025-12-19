"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Type,
  Minus,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  Underline as UnderlineIcon,
} from "lucide-react";

interface TiptapProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
}

const Tiptap = ({ content = "", onChange, editable = true }: TiptapProps) => {
  const [, setForceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Link.configure({
        openOnClick: !editable,
        linkOnPaste: true,
        shouldAutoLink: (url) => /^https?:\/\//.test(url),
        HTMLAttributes: {
          class: editable
            ? "text-blue-400 underline decoration-blue-400/70 hover:text-blue-300 cursor-text"
            : "text-blue-400 underline decoration-blue-400/70 hover:text-blue-300 cursor-pointer",
        },
      }),
    ],
    editable,
    editorProps: {
      handleClick(view, pos, event) {
        if (editable) {
          const target = event.target as HTMLElement | null;
          if (target && target.closest("a")) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
    content,
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update toolbar button states
      setForceUpdate((prev) => prev + 1);
    },
  });

  // Update editor content when the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Update editor editable state when the editable prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    if (!editor) return;

    // If already a link, unset it
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    // Otherwise, prompt for URL and set link
    const url = window.prompt("Enter a URL", "https://");

    if (url === null) {
      return;
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl === "") {
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmedUrl })
      .run();
  };

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-md p-1.5 transition ${
        isActive
          ? "bg-white/20 text-white"
          : "text-zinc-400 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="h-5 w-px bg-zinc-700 mx-1" />
  );

  const isLinkActive = editor.isActive("link");

  return (
    <div className="flex h-full flex-col space-y-3">
      {editable && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-0.5">
          {/* Headings group */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text formatting group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists group */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link and divider group */}
          <ToolbarButton
            onClick={toggleLink}
            isActive={isLinkActive}
            title={isLinkActive ? "Remove Link" : "Add Link"}
          >
            {isLinkActive ? (
              <Unlink className="h-4 w-4" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <EditorContent
          editor={editor}
          className={`tiptap-editor ${!editable ? "tiptap-view-mode" : ""}`}
        />
      </div>
    </div>
  );
};

export default Tiptap;
