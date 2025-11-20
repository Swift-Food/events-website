"use client";

import { useEffect } from "react";
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

  // Update editor content when the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return <EditorContent editor={editor} />;
};

export default Tiptap;
