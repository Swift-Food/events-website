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
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleCancel}
      />

      {/* Panel - slides from right on desktop, from bottom on mobile */}
      <div
        className={`absolute bg-[#1a1a1a]/70 backdrop-blur-sm text-white border-white/10 overflow-y-auto transition-transform duration-300 ease-out
          left-0 right-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t px-5 py-6
          md:left-auto md:inset-y-0 md:right-0 md:w-full md:max-w-lg md:max-h-none md:rounded-t-none md:rounded-l-2xl md:border-t-0 md:border-l md:px-8 md:py-8
          ${isAnimating ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
        `}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-600/20 p-2.5">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">
              {fieldToEdit ? "Edit Question" : "Add Question"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full p-2 transition-all hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question */}
          <div>
            <label className="text-sm font-medium text-white block mb-1.5">
              Question <span className="text-red-400">*</span>
            </label>
            <textarea
              value={localQuestion}
              onChange={(e) => setLocalQuestion(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-amber-500/50 border border-white/10 transition-all resize-none placeholder:text-white/40"
              placeholder="e.g., What is your dietary preference?"
            />
          </div>

          {/* Field Type */}
          <div>
            <label className="text-sm font-medium text-white block mb-1.5">
              Field Type
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    localType === type.value
                      ? "bg-amber-600 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options - only shown for select types */}
          {isSelectType && (
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">
                Options <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {/* List of options */}
                {localOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5"
                  >
                    <span className="flex-1 text-sm text-white">{option}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="rounded-full p-1 transition-all hover:bg-red-500/20"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
                    className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-amber-500/50 border border-white/10 transition-all placeholder:text-white/40"
                    placeholder="Add an option..."
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-xl bg-amber-600 px-3 py-2.5 text-white transition-all hover:bg-amber-500"
                    aria-label="Add option"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">
                Required Field
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Users must answer this question
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocalRequired(!localRequired)}
              className={`h-6 w-11 rounded-full transition-all ${
                localRequired
                  ? "bg-amber-600"
                  : "bg-white/10"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full transition-all ${
                  localRequired
                    ? "translate-x-5 bg-white"
                    : "translate-x-0.5 bg-white/60"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl bg-white/10 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fieldToEdit ? "Update" : "Add"} Question
          </button>
        </div>
      </div>
    </div>
  );
}
