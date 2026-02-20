"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Ticket, Plus, Edit, Trash2, ChevronUp, ChevronDown, ChevronRight, HelpCircle, MessageSquare, AlignLeft, CircleDot, CheckSquare, Infinity, Users, Settings, ExternalLink } from "lucide-react";
import { TicketType, FormField } from "@/types";
import FormFieldModal from "./FormFieldModal";

interface TicketTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: TicketType) => void | Promise<void>;
  ticketToEdit?: TicketType | null;
  readOnly?: boolean;
}

// Small component for group size input with validation warning
function GroupSizeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toString());
  const numValue = parseInt(inputValue);
  const showWarning = !isNaN(numValue) && numValue < 2;

  const validateAndApply = () => {
    const val = parseInt(inputValue) || 5;
    const clamped = Math.min(50, Math.max(2, val));
    onChange(clamped);
    setInputValue(clamped.toString());
  };

  return (
    <div className="pl-6 space-y-1">
      <div className="flex items-center gap-3">
        <label className="text-sm text-white/60">
          Max group size:
        </label>
        <input
          type="number"
          min="2"
          max="50"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={validateAndApply}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              validateAndApply();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={`w-20 h-9 rounded-lg bg-white/10 px-3 text-white text-sm outline-none focus:ring-2 transition-all ${
            showWarning ? "ring-2 ring-red-500/50 focus:ring-red-500/50" : "focus:ring-accent/50"
          }`}
        />
      </div>
      {showWarning && (
        <p className="text-xs text-red-400">
          Group size must be at least 2. Use the toggle to disable group purchases.
        </p>
      )}
    </div>
  );
}

export default function TicketTypeModal({
  isOpen,
  onClose,
  onSave,
  ticketToEdit,
  readOnly = false,
}: TicketTypeModalProps) {
  const [localName, setLocalName] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localIsFree, setLocalIsFree] = useState(true);
  const [localPrice, setLocalPrice] = useState("0");
  const [localIsSingleUse, setLocalIsSingleUse] = useState(false);
  const [localQuantity, setLocalQuantity] = useState("100");
  const [localIsUnlimited, setLocalIsUnlimited] = useState(true);
  const [localQuestions, setLocalQuestions] = useState<FormField[]>([]);
  const [localMaxGroupSize, setLocalMaxGroupSize] = useState(1);
  const [localExternalTicketUrl, setLocalExternalTicketUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount state for portal (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Collapsible section state
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);

  // FormFieldModal state
  const [isFormFieldModalOpen, setIsFormFieldModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<FormField | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Update local state when modal opens or when editing a ticket
  useEffect(() => {
    if (isOpen) {
      if (ticketToEdit) {
        setLocalName(ticketToEdit.name);
        setLocalDescription(ticketToEdit.description);
        setLocalIsFree(ticketToEdit.isFree);
        setLocalPrice(ticketToEdit.price.toString());
        setLocalIsSingleUse(ticketToEdit.isSingleUse);
        const qty = ticketToEdit.quantity ?? 100;
        const isUnlimited = qty >= 100000;
        setLocalIsUnlimited(isUnlimited);
        setLocalQuantity(isUnlimited ? "100" : qty.toString());
        setLocalQuestions(ticketToEdit.questionForm || []);
        setLocalMaxGroupSize(ticketToEdit.maxGroupSize || 1);
        setLocalExternalTicketUrl(ticketToEdit.externalTicketUrl || "");
        // Smart auto-expand: expand sections with non-default values
        const hasAdvancedSettings = ticketToEdit.isSingleUse || (ticketToEdit.maxGroupSize || 1) > 1 || !!ticketToEdit.externalTicketUrl;
        const hasQuestions = ticketToEdit.questionForm && ticketToEdit.questionForm.length > 0;
        setSettingsExpanded(hasAdvancedSettings);
        setQuestionsExpanded(!!hasQuestions);
      } else {
        // Reset for new ticket
        setLocalName("");
        setLocalDescription("");
        setLocalIsFree(true);
        setLocalPrice("0");
        setLocalIsSingleUse(false);
        setLocalQuantity("100");
        setLocalIsUnlimited(true);
        setLocalQuestions([]);
        setLocalMaxGroupSize(1);
        setLocalExternalTicketUrl("");
        setSettingsExpanded(false);
        setQuestionsExpanded(false);
      }
    }
  }, [isOpen, ticketToEdit]);

  if (!isOpen || !mounted) return null;

  const handleSave = async () => {
    // Validate
    if (!localName.trim()) {
      alert("Please enter a ticket name");
      return;
    }

    const quantity = localIsUnlimited ? 100000 : (parseInt(localQuantity) || 100);
    if (!localIsUnlimited) {
      if (quantity < 1) {
        alert("Quantity must be at least 1");
        return;
      }

      if (quantity > 100000) {
        alert("Quantity cannot exceed 100,000");
        return;
      }
    }

    const price = parseFloat(localPrice) || 0;
    if (!localIsFree && price < 0.30) {
      alert("Minimum price for paid tickets is £0.30");
      return;
    }

    const ticket: TicketType = {
      id: ticketToEdit?.id || Date.now().toString(),
      name: localName.trim(),
      description: localDescription.trim(),
      isFree: localIsFree,
      price: localIsFree ? 0 : price,
      quantity: quantity,
      isSingleUse: localIsSingleUse,
      questionForm: localQuestions,
      maxGroupSize: localMaxGroupSize,
      externalTicketUrl: localExternalTicketUrl.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await onSave(ticket);
      onClose();
    } catch (error) {
      // Error is already handled in the parent component
      console.error("Error saving ticket:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Question management helpers
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "short-text":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "long-text":
        return <AlignLeft className="h-3.5 w-3.5" />;
      case "single-select":
        return <CircleDot className="h-3.5 w-3.5" />;
      case "multi-select":
        return <CheckSquare className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "short-text":
        return "Short Text";
      case "long-text":
        return "Long Text";
      case "single-select":
        return "Single Select";
      case "multi-select":
        return "Multi Select";
      default:
        return type;
    }
  };

  const handleAddQuestion = () => {
    setQuestionToEdit(null);
    setEditingQuestionIndex(null);
    setIsFormFieldModalOpen(true);
  };

  const handleEditQuestion = (index: number) => {
    const question = localQuestions[index];
    setQuestionToEdit({ ...question, id: `question-${index}` });
    setEditingQuestionIndex(index);
    setIsFormFieldModalOpen(true);
  };

  const handleSaveQuestion = (field: FormField) => {
    // Check for duplicate question (case-insensitive comparison)
    const normalizedNewQuestion = field.question.trim().toLowerCase();
    const isDuplicate = localQuestions.some((q, idx) => {
      // If editing, exclude the current question from duplicate check
      if (editingQuestionIndex !== null && idx === editingQuestionIndex) {
        return false;
      }
      return q.question.trim().toLowerCase() === normalizedNewQuestion;
    });

    if (isDuplicate) {
      alert("This question already exists for this ticket");
      return;
    }

    if (editingQuestionIndex !== null) {
      // Editing existing question
      setLocalQuestions((prev) =>
        prev.map((q, idx) => (idx === editingQuestionIndex ? field : q))
      );
    } else {
      // Adding new question
      setLocalQuestions((prev) => [...prev, field]);
    }

    setIsFormFieldModalOpen(false);
    setQuestionToEdit(null);
    setEditingQuestionIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    const question = localQuestions[index];
    if (confirm(`Are you sure you want to delete the question "${question.question}"?`)) {
      setLocalQuestions((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleMoveQuestion = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= localQuestions.length) return;

    setLocalQuestions((prev) => {
      const reordered = [...prev];
      [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
      return reordered;
    });
  };

  return createPortal(
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
            <div className="rounded-full bg-accent/20 p-2.5">
              <Ticket className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">
              {readOnly ? "Ticket Details" : ticketToEdit ? "Edit Ticket" : "Add Ticket Type"}
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
          {/* Ticket Name */}
          <div>
            <label className="text-sm font-medium text-white block mb-1.5">
              Ticket Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              readOnly={readOnly}
              className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-accent/50 border border-white/10 transition-all placeholder:text-white/40 ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder="e.g., General Admission, VIP, Early Bird"
            />
          </div>

          {/* Ticket Description */}
          <div>
            <label className="text-sm font-medium text-white block mb-1.5">
              Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              readOnly={readOnly}
              rows={3}
              className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-accent/50 border border-white/10 transition-all resize-none placeholder:text-white/40 ${readOnly ? "opacity-70 cursor-default" : ""}`}
              placeholder="Optional description of this ticket type..."
            />
          </div>

          {/* Price Toggle */}
          <div>
            <label className="text-sm font-medium text-white block mb-1.5">
              Price
            </label>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {localIsFree ? (
                  <div className="h-11 flex items-center rounded-xl bg-white/10 px-4">
                    <p className="text-base md:text-sm font-medium text-white">
                      Free Ticket
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-base md:text-sm font-medium">
                        £
                      </span>
                      <input
                        type="number"
                        min="0.30"
                        step="0.01"
                        value={localPrice}
                        onChange={(e) => setLocalPrice(e.target.value)}
                        readOnly={readOnly}
                        className={`w-full h-11 rounded-xl bg-white/10 pl-8 pr-4 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-accent/50 border border-white/10 transition-all ${readOnly ? "opacity-70 cursor-default" : ""}`}
                        placeholder="0.30"
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1.5">
                      Minimum £0.30
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => !readOnly && setLocalIsFree(true)}
                  className={`h-11 rounded-xl px-4 text-sm font-medium transition-all ${
                    localIsFree
                      ? "bg-accent-dark text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  } ${readOnly ? "cursor-default" : ""}`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => !readOnly && setLocalIsFree(false)}
                  className={`h-11 rounded-xl px-4 text-sm font-medium transition-all ${
                    !localIsFree
                      ? "bg-accent-dark text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  } ${readOnly ? "cursor-default" : ""}`}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-white">
                Quantity Available {!localIsUnlimited && <span className="text-red-400">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Unlimited</span>
                <button
                  type="button"
                  onClick={() => !readOnly && setLocalIsUnlimited(!localIsUnlimited)}
                  className={`h-6 w-11 rounded-full transition-all flex-shrink-0 ${
                    localIsUnlimited
                      ? "bg-accent-dark"
                      : "bg-white/10"
                  } ${readOnly ? "cursor-default opacity-70" : ""}`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full transition-all ${
                      localIsUnlimited
                        ? "translate-x-5 bg-white"
                        : "translate-x-0.5 bg-white/60"
                    }`}
                  />
                </button>
              </div>
            </div>
            {localIsUnlimited ? (
              <div className="h-11 flex items-center gap-2 rounded-xl bg-white/10 px-4">
                <Infinity className="h-4 w-4 text-accent" />
                <p className="text-base md:text-sm text-white/60">
                  Unlimited tickets available
                </p>
              </div>
            ) : (
              <>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={localQuantity}
                  onChange={(e) => setLocalQuantity(e.target.value)}
                  readOnly={readOnly}
                  className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-accent/50 border border-white/10 transition-all ${readOnly ? "opacity-70 cursor-default" : ""}`}
                  placeholder="100"
                />
                <p className="text-xs text-white/60 mt-1.5">
                  Number of tickets available must be within 1 - 100,000
                </p>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* COLLAPSIBLE SECTIONS - Style A: Bordered Accordion             */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Additional Settings - Collapsible */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-white/60" />
                <span className="text-sm font-medium text-white">Additional Settings</span>
                {(localIsSingleUse || localMaxGroupSize > 1 || localExternalTicketUrl) && (
                  <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {[localIsSingleUse && "Single-use", localMaxGroupSize > 1 && "Group", localExternalTicketUrl && "External"].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <ChevronRight className={`h-4 w-4 text-white/60 transition-transform ${settingsExpanded ? "rotate-90" : ""}`} />
            </button>

            {settingsExpanded && (
              <div className="px-4 py-3 space-y-4 border-t border-white/10">
                {/* Single Use Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Single-Use Ticket
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">
                      Ticket will be invalidated after first check in
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !readOnly && setLocalIsSingleUse(!localIsSingleUse)}
                    className={`h-6 w-11 rounded-full transition-all ${
                      localIsSingleUse
                        ? "bg-accent-dark"
                        : "bg-white/10"
                    } ${readOnly ? "cursor-default opacity-70" : ""}`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full transition-all ${
                        localIsSingleUse
                          ? "translate-x-5 bg-white"
                          : "translate-x-0.5 bg-white/60"
                      }`}
                    />
                  </button>
                </div>

                {/* Group Tickets - Toggle + Size Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/60" />
                        <p className="text-sm font-medium text-white">
                          Allow Group Purchases
                        </p>
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">
                        {localMaxGroupSize > 1
                          ? `Attendees can buy up to ${localMaxGroupSize} tickets`
                          : "Each person must purchase their own ticket"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !readOnly && setLocalMaxGroupSize(localMaxGroupSize > 1 ? 1 : 5)}
                      className={`h-6 w-11 rounded-full transition-all flex-shrink-0 ${
                        localMaxGroupSize > 1
                          ? "bg-accent-dark"
                          : "bg-white/10"
                      } ${readOnly ? "cursor-default opacity-70" : ""}`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full transition-all ${
                          localMaxGroupSize > 1
                            ? "translate-x-5 bg-white"
                            : "translate-x-0.5 bg-white/60"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Group size input - only shown when enabled */}
                  {localMaxGroupSize > 1 && (
                    <GroupSizeInput
                      value={localMaxGroupSize}
                      onChange={setLocalMaxGroupSize}
                    />
                  )}
                </div>

                {/* External Ticket URL */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <ExternalLink className="h-4 w-4 text-white/60" />
                    <p className="text-sm font-medium text-white">
                      External Ticket URL
                    </p>
                  </div>
                  <p className="text-xs text-white/60 mb-2">
                    If tickets are sold on another platform, paste the link here. Attendees will be redirected to this URL.
                  </p>
                  <input
                    type="url"
                    value={localExternalTicketUrl}
                    onChange={(e) => setLocalExternalTicketUrl(e.target.value)}
                    readOnly={readOnly}
                    className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white text-base md:text-sm outline-none focus:ring-2 focus:ring-accent/50 border border-white/10 transition-all placeholder:text-white/40 ${readOnly ? "opacity-70 cursor-default" : ""}`}
                    placeholder="https://eventbrite.com/e/your-event"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Registration Questions - Collapsible */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQuestionsExpanded(!questionsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-white/60" />
                <span className="text-sm font-medium text-white">Registration Questions</span>
                {localQuestions.length > 0 && (
                  <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {localQuestions.length}
                  </span>
                )}
              </div>
              <ChevronRight className={`h-4 w-4 text-white/60 transition-transform ${questionsExpanded ? "rotate-90" : ""}`} />
            </button>

            {questionsExpanded && (
              <div className="px-4 py-3 border-t border-white/10">
                {!readOnly && (
                  <div className="flex items-center justify-end mb-3">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-dark/30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Question
                    </button>
                  </div>
                )}

                {localQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                {localQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg bg-white/10 p-3 group"
                  >
                    {/* Mobile ordering buttons - left side, vertically stacked */}
                    {!readOnly && (
                      <div className="flex flex-col gap-0.5 md:hidden">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "up")}
                          disabled={index === 0}
                          className="rounded p-0.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "down")}
                          disabled={index === localQuestions.length - 1}
                          className="rounded p-0.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-center rounded bg-accent/10 p-1.5 text-accent flex-shrink-0">
                      {getQuestionTypeIcon(question.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white truncate">{question.question}</p>
                        {question.required && (
                          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400 flex-shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/60">
                          {getQuestionTypeLabel(question.type)}
                          {question.options && question.options.length > 0 && (
                            <> • {question.options.length} options</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!readOnly && (
                      <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {/* Desktop ordering buttons */}
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "up")}
                          disabled={index === 0}
                          className="hidden md:block rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "down")}
                          disabled={index === localQuestions.length - 1}
                          className="hidden md:block rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(index)}
                          className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                          title="Edit question"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(index)}
                          className="rounded p-1 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
                          title="Delete question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/60 text-center py-6 px-4 bg-white/10 rounded-lg">
                    No questions added yet. Add questions to collect information from attendees.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {readOnly ? (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl bg-white/10 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-white/15"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-accent-dark py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : ticketToEdit ? "Update Ticket" : "Add Ticket"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* FormFieldModal for adding/editing questions */}
      <FormFieldModal
        isOpen={isFormFieldModalOpen}
        onClose={() => {
          setIsFormFieldModalOpen(false);
          setQuestionToEdit(null);
          setEditingQuestionIndex(null);
        }}
        onSave={handleSaveQuestion}
        fieldToEdit={questionToEdit}
      />
    </div>,
    document.body
  );
}