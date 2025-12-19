"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
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
  Link2Off,
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

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmedUrl })
      .run();
  };

  const unsetLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
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
      className={`rounded-lg p-2 transition ${
        isActive
          ? "bg-white text-black"
          : "bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      {editable && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-[#2a2a2d] p-3">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            title="Paragraph"
          >
            <Type className="h-5 w-5" />
          </ToolbarButton>

          <div className="w-px bg-white/10" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-5 w-5" />
          </ToolbarButton>

          <div className="w-px bg-white/10" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-5 w-5" />
          </ToolbarButton>

          <div className="w-px bg-white/10" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="h-5 w-5" />
          </ToolbarButton>

          <div className="w-px bg-white/10" />

          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="Add Link"
          >
            <Link2 className="h-5 w-5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={unsetLink}
            isActive={editor.isActive("link")}
            title="Remove Link"
          >
            <Link2Off className="h-5 w-5" />
          </ToolbarButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#131315] p-4">
        <EditorContent
          editor={editor}
          className={`tiptap-editor ${!editable ? "tiptap-view-mode" : ""}`}
        />
      </div>
    </div>
  );
};

export default Tiptap;
