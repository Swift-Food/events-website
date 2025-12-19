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
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-zinc-900 p-6 text-foreground border border-zinc-800">
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-md sm:text-xl font-semibold">
            Edit Event Description
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
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
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tiptap
            content={localDescription}
            onChange={setLocalDescription}
            editable={isEditMode}
          />
        </div>

        <div className="mt-4 flex flex-shrink-0 justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
