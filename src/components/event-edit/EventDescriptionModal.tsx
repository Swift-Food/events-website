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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white/95 dark:bg-black/90 backdrop-blur-2xl p-8 text-foreground shadow-2xl border border-black/10 dark:border-white/10">
        <div className="mb-6 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-3xl font-bold">
            {isEditMode
              ? "Edit Event Description"
              : "Preview Event Description"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md px-5 py-2.5 text-sm font-medium transition-all hover:bg-black/15 dark:hover:bg-white/15 shadow-lg"
              aria-label={
                isEditMode ? "Switch to preview mode" : "Switch to edit mode"
              }
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
              className="rounded-full p-2 transition-all hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl p-4 shadow-lg">
          <Tiptap
            content={localDescription}
            onChange={setLocalDescription}
            editable={isEditMode}
          />
        </div>

        <div className="mt-6 flex flex-shrink-0 justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md px-8 py-4 font-semibold transition-all hover:bg-black/15 dark:hover:bg-white/15 shadow-lg hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 shadow-xl shadow-primary/30 hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
