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
        <EditorContent
          editor={editor}
          className="tiptap-editor"
        />
      </div>

      <style jsx global>{`
        .tiptap-editor {
          color: white;
        }

        .tiptap-editor .ProseMirror {
          outline: none;
          min-height: 280px;
        }

        .tiptap-editor h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 2.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: white;
        }

        .tiptap-editor h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 2.25rem;
          margin-top: 0.875rem;
          margin-bottom: 0.875rem;
          color: white;
        }

        .tiptap-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 2rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          color: white;
        }

        .tiptap-editor p {
          font-size: 1rem;
          line-height: 1.75rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .tiptap-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tiptap-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tiptap-editor li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .tiptap-editor hr {
          border: none;
          border-top: 2px solid rgba(255, 255, 255, 0.2);
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .tiptap-editor blockquote {
          border-left: 4px solid rgba(255, 255, 255, 0.3);
          padding-left: 1rem;
          margin-left: 0;
          margin-top: 1rem;
          margin-bottom: 1rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
        }

        .tiptap-editor strong {
          font-weight: 700;
        }

        .tiptap-editor em {
          font-style: italic;
        }

        .tiptap-editor code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default Tiptap;
