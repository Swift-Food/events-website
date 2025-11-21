"use client";

import { useState, useEffect } from "react";
import { X, Eye, Pencil } from "lucide-react";
import Tiptap from "@/components/Tiptap";
import { useEventCreation } from "@/context/EventCreationContext";

interface EventDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDescriptionModal({
  isOpen,
  onClose,
}: EventDescriptionModalProps) {
  const { description, setDescription } = useEventCreation();
  const [localDescription, setLocalDescription] = useState(description);
  const [isEditMode, setIsEditMode] = useState(true);

  // Update localDescription whenever the modal opens or description changes
  useEffect(() => {
    setLocalDescription(description);
    setIsEditMode(true); // Reset to edit mode when modal opens
  }, [isOpen, description]);

  if (!isOpen) return null;

  const handleSave = () => {
    setDescription(localDescription);
    onClose();
  };

  const handleCancel = () => {
    setLocalDescription(description); // Reset to saved value
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-[#2a2a2d] p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit Event Description" : "Preview Event Description"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
              aria-label={isEditMode ? "Switch to preview mode" : "Switch to edit mode"}
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Edit
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full p-2 transition hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1f1f21] p-4">
          <Tiptap
            content={localDescription}
            onChange={setLocalDescription}
            editable={isEditMode}
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full bg-white/10 px-6 py-3 font-medium transition hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
