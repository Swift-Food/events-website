"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [baselineDescription, setBaselineDescription] = useState(description);
  const isInitializing = useRef(true);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Update localDescription whenever the modal opens or description changes
  useEffect(() => {
    setLocalDescription(description);
    setBaselineDescription(description);
    isInitializing.current = true;
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

  // Wrap onChange to capture the editor-normalized baseline on first update
  const handleDescriptionChange = useCallback(
    (newContent: string) => {
      if (isInitializing.current) {
        setBaselineDescription(newContent);
        isInitializing.current = false;
      }
      setLocalDescription(newContent);
    },
    [],
  );

  if (!isOpen) return null;

  const handleSave = () => {
    setDescription(localDescription);
    onClose();
  };

  const hasUnsavedChanges = localDescription !== baselineDescription;

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
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      style={hasKeyboard ? { height: `${viewportHeight}px`, top: `${viewportOffset}px` } : {}}
    >
      <div
        style={hasKeyboard ? { maxHeight: `${viewportHeight}px` } : {}}
        className={`flex h-full sm:h-[90vh] w-full sm:max-w-4xl flex-col rounded-t-2xl sm:rounded-2xl bg-[#1a1a1a]/70 backdrop-blur-sm border border-white/10 shadow-2xl p-4 sm:p-6 text-white transition-transform duration-300 ease-out ${
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
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
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
              className="p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tiptap
            content={localDescription}
            onChange={handleDescriptionChange}
            editable={isEditMode}
          />
        </div>

        <div className="mt-4 flex flex-shrink-0 justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent-dark px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-dark/70 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Discard Changes Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl bg-[#1a1a1a]/70 backdrop-blur-sm border border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent">
                  <AlertTriangle className="h-5 w-5 text-accent-dark" />
                </div>
                <h3 className="text-lg font-semibold text-white">Discard Changes?</h3>
              </div>
              <p className="text-sm text-white/60 mb-6">
                You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardCancel}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
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
