"use client";

import { useState, useEffect } from "react";
import { X, FileText, Plus, Trash2 } from "lucide-react";
import { FormField, FormFieldType } from "@/types/event";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl bg-background backdrop-blur-2xl p-8 text-foreground shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">
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

        <div className="space-y-6">
          {/* Question */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
            <label className="text-base font-semibold text-foreground block mb-3">
              Question <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={localQuestion}
              onChange={(e) => setLocalQuestion(e.target.value)}
              className="w-full rounded-xl bg-input-background px-4 py-3.5 text-foreground text-lg font-semibold outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="e.g., What is your dietary preference?"
            />
          </div>

          {/* Field Type */}
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
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
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
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
            <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
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
                    className="flex-1 rounded-xl bg-input-background px-4 py-3 text-foreground outline-none shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
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
          <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 shadow-lg">
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
                className={`h-7 w-14 rounded-full transition-all shadow-inner ${
                  localRequired
                    ? "bg-primary shadow-lg shadow-primary/30"
                    : "bg-card-secondary-background"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full transition-all shadow-lg ${
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
            className="flex-1 rounded-full bg-white/10 backdrop-blur-md py-4 text-center font-semibold text-foreground transition-all hover:bg-white/15 shadow-lg hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-full bg-primary py-4 text-center font-bold text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 shadow-xl shadow-primary/30 hover:bg-primary/90"
          >
            {fieldToEdit ? "Update" : "Add"} Field
          </button>
        </div>
      </div>
    </div>
  );
}
