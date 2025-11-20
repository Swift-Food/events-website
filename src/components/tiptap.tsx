"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  Minus,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

interface TiptapProps {
  content?: string;
  onChange?: (content: string) => void;
}

const Tiptap = ({ content = "", onChange }: TiptapProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Update editor content when the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-[#2a2a2d] p-3">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
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
      </div>

      <div className="min-h-[300px] rounded-xl border border-white/10 bg-[#131315] p-4">
        <EditorContent editor={editor} className="prose prose-invert max-w-none" />
      </div>
    </div>
  );
};

export default Tiptap;
