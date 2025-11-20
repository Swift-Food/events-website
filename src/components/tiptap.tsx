"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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

  return <EditorContent editor={editor} />;
};

export default Tiptap;
