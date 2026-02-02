"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Eye, Pencil, AlertTriangle } from "lucide-react";
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
  const [isVisible, setIsVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Update localDescription whenever the modal opens or description changes
  useEffect(() => {
    setLocalDescription(description);
    setIsEditMode(true); // Reset to edit mode when modal opens
  }, [isOpen, description]);

  // Handle animation on open/close
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Track visual viewport height and offset for mobile keyboard
  const updateViewport = useCallback(() => {
    if (window.visualViewport) {
      setViewportHeight(window.visualViewport.height);
      setViewportOffset(window.visualViewport.offsetTop);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const viewport = window.visualViewport;
    if (viewport) {
      updateViewport();
      viewport.addEventListener("resize", updateViewport);
      viewport.addEventListener("scroll", updateViewport);
      return () => {
        viewport.removeEventListener("resize", updateViewport);
        viewport.removeEventListener("scroll", updateViewport);
      };
    }
  }, [isOpen, updateViewport]);

  if (!isOpen) return null;

  const handleSave = () => {
    setDescription(localDescription);
    onClose();
  };

  const hasUnsavedChanges = localDescription !== description;

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
      return;
    }
    setLocalDescription(description); // Reset to saved value
    onClose();
  };

  const handleDiscardConfirm = () => {
    setShowDiscardModal(false);
    setLocalDescription(description); // Reset to saved value
    onClose();
  };

  const handleDiscardCancel = () => {
    setShowDiscardModal(false);
  };

  // Only apply dynamic positioning on mobile (below sm breakpoint)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const hasKeyboard = isMobile && viewportHeight;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-lg sm:p-4"
      style={hasKeyboard ? { height: `${viewportHeight}px`, top: `${viewportOffset}px` } : {}}
    >
      <div
        style={hasKeyboard ? { maxHeight: `${viewportHeight}px` } : {}}
        className={`flex h-full sm:h-[90vh] w-full sm:max-w-4xl flex-col rounded-t-2xl sm:rounded-2xl bg-card-background/80 shadow-2xl p-4 sm:p-6 text-foreground transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full sm:translate-y-0"
        }`}
      >
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <h2 className="text-md sm:text-xl font-semibold">
            Edit Event Description
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
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

        <div className="mt-4 flex flex-shrink-0 justify-end gap-3 pt-4 border-t border-foreground/10">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Discard Changes Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-lg">
          <div className="w-full max-w-sm mx-4 rounded-xl bg-card-background shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Discard Changes?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardCancel}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleDiscardConfirm}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
