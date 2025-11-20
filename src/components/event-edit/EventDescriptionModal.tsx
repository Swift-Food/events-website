"use client";

import { X } from "lucide-react";
import Tiptap from "@/components/tiptap";

interface EventDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDescriptionModal({
  isOpen,
  onClose,
}: EventDescriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-[#2a2a2d] p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Edit Event Description</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
          <Tiptap />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-6 py-3 font-medium transition hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
