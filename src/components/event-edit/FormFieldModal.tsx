"use client";

import { useState, useEffect } from "react";
import { X, FileText, Plus, Trash2 } from "lucide-react";
import { FormField, FormFieldType } from "@/types";

interface FormFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
  fieldToEdit?: FormField | null;
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "short-text", label: "Short Text" },
  { value: "long-text", label: "Long Text" },
  { value: "single-select", label: "Single Select" },
  { value: "multi-select", label: "Multi Select" },
];

export default function FormFieldModal({
  isOpen,
  onClose,
  onSave,
  fieldToEdit,
}: FormFieldModalProps) {
  const [localQuestion, setLocalQuestion] = useState("");
  const [localType, setLocalType] = useState<FormFieldType>("short-text");
  const [localRequired, setLocalRequired] = useState(false);
  const [localOptions, setLocalOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Update local state when modal opens or when editing a field
  useEffect(() => {
    if (isOpen) {
      if (fieldToEdit) {
        setLocalQuestion(fieldToEdit.question);
        setLocalType(fieldToEdit.type);
        setLocalRequired(fieldToEdit.required);
        setLocalOptions(fieldToEdit.options || []);
      } else {
        // Reset for new field
        setLocalQuestion("");
        setLocalType("short-text");
        setLocalRequired(false);
        setLocalOptions([]);
        setNewOption("");
      }
    }
  }, [isOpen, fieldToEdit]);

  if (!isOpen) return null;

  const isSelectType =
    localType === "single-select" || localType === "multi-select";

  const handleAddOption = () => {
    if (newOption.trim()) {
      setLocalOptions((prev) => [...prev, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setLocalOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validate
    if (!localQuestion.trim()) {
      alert("Please enter a question");
      return;
    }

    if (isSelectType && localOptions.length === 0) {
      alert("Please add at least one option for select fields");
      return;
    }

    const field: FormField = {
      id: fieldToEdit?.id || Date.now().toString(),
      question: localQuestion.trim(),
      type: localType,
      required: localRequired,
      options: isSelectType ? localOptions : undefined,
    };

    onSave(field);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleCancel}
      />

      {/* Panel - slides from right on desktop, from bottom on mobile */}
      <div
        className={`absolute bg-background text-foreground border-white/10 overflow-y-auto transition-transform duration-300 ease-out
          left-0 right-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t px-4 py-6
          md:left-auto md:inset-y-0 md:right-0 md:w-full md:max-w-lg md:max-h-none md:rounded-t-none md:rounded-l-2xl md:border-t-0 md:border-l md:px-8 md:py-8
          ${isAnimating ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {fieldToEdit ? "Edit Form Field" : "Add Form Field"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full p-2 transition-all hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <label className="text-base font-semibold text-foreground block mb-3">
              Question <span className="text-red-400">*</span>
            </label>
            <textarea
              value={localQuestion}
              onChange={(e) => setLocalQuestion(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-md font-semibold outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="e.g., What is your dietary preference?"
            />
          </div>

          {/* Field Type */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <label className="text-base font-semibold text-foreground block mb-3">
              Field Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setLocalType(type.value);
                    // Clear options if switching to a non-select type
                    if (
                      type.value !== "single-select" &&
                      type.value !== "multi-select"
                    ) {
                      setLocalOptions([]);
                    }
                  }}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    localType === type.value
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-card-secondary-background text-muted-foreground hover:bg-white/15"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options - only shown for select types */}
          {isSelectType && (
            <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
              <label className="text-base font-semibold text-foreground block mb-3">
                Options <span className="text-red-400">*</span>
              </label>
              <div className="space-y-3">
                {/* List of options */}
                {localOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl bg-card-secondary-background p-3"
                  >
                    <span className="flex-1 text-foreground">{option}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="rounded-full p-1.5 transition-all hover:bg-red-500/20"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}

                {/* Add new option */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    className="flex-1 rounded-xl bg-input-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Add an option..."
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-xl bg-primary px-4 py-3 text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
                    aria-label="Add option"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="rounded-xl bg-card-background backdrop-blur-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Required Field
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Users must answer this question
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalRequired(!localRequired)}
                className={`h-7 w-14 rounded-full transition-all ${
                  localRequired
                    ? "bg-primary"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all ${
                    localRequired
                      ? "translate-x-7 bg-primary-foreground"
                      : "translate-x-0.5 bg-foreground"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl bg-white/10 backdrop-blur-md py-3 text-center font-semibold text-foreground transition-all hover:bg-white/15 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {fieldToEdit ? "Update" : "Add"} Field
          </button>
        </div>
      </div>
    </div>
  );
}
