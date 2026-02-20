"use client";

import { useState, useEffect } from "react";
import { EventResponseDto, EventStatus, TicketType, FormField, QuestionType } from "@/types";
import { EventTicketResponseDto, QuestionBlock } from "@/types/event-ticket/response/ticket.dto";
import { Ticket, Plus, Edit, Lock, Unlock, Trash2, MessageSquare, AlignLeft, CircleDot, CheckSquare, HelpCircle, ScanLine, ChevronUp, ChevronDown, Eye } from "lucide-react";
import TicketTypeModal from "@/components/event-edit/TicketTypeModal";
import FormFieldModal from "@/components/event-edit/FormFieldModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { eventTicketService } from "@/services/event-ticket.service";
import { toast } from "sonner";

interface RegistrationTabProps {
  eventData: EventResponseDto;
  onRefresh?: () => void | Promise<void>;
  onScanClick?: () => void;
}

export function RegistrationTab({ eventData, onRefresh, onScanClick }: RegistrationTabProps) {
  const isExpired = eventData.status === EventStatus.EXPIRED;
  const [tickets, setTickets] = useState<EventTicketResponseDto[]>(eventData.eventTickets || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<TicketType | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<EventTicketResponseDto | null>(null);

  // Form field modal state for editing questions
  const [isFormFieldModalOpen, setIsFormFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<FormField | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  // Sync tickets when eventData changes from parent
  useEffect(() => {
    setTickets(eventData.eventTickets || []);
  }, [eventData.eventTickets]);

  // Convert backend ticket to frontend TicketType for the modal
  const convertToTicketType = (ticket: EventTicketResponseDto): TicketType => {
    const price = parseFloat(ticket.price) || 0;
    return {
      id: ticket.id,
      name: ticket.name,
      description: ticket.description || "",
      isFree: price === 0,
      price: price,
      isSingleUse: ticket.isSingleUse ?? true,
      quantity: ticket.quantityTotal ?? 0,
    };
  };

  const handleCreateTicket = () => {
    setTicketToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setTicketToEdit(convertToTicketType(ticket));
      setIsModalOpen(true);
    }
  };

  const handleSaveTicket = async (ticket: TicketType) => {
    const isEditing = ticketToEdit !== null;

    const payload = {
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.isFree ? 0 : ticket.price,
      isPaid: !ticket.isFree,
      isSingleUse: ticket.isSingleUse ?? true,
      quantityTotal: ticket.quantity || 100,
      isPrivate: false,
    };

    console.log("Creating/updating ticket with payload:", payload);
    console.log("Event ID:", eventData.id);

    try {
      if (isEditing) {
        const updated = await eventTicketService.updateTicket(ticket.id, payload);
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
        toast.success(`"${ticket.name}" updated successfully`);
      } else {
        const created = await eventTicketService.createTicket(eventData.id, payload);
        setTickets((prev) => [...prev, created]);
        toast.success(`"${ticket.name}" created successfully`);
      }
      setIsModalOpen(false);
      onRefresh?.();
    } catch (error: any) {
      console.error("Failed to save ticket:", error);
      console.error("Error response data:", error.response?.data);
      const errorMessage = error.response?.data?.message
        || (Array.isArray(error.response?.data?.errors) ? error.response.data.errors.join(", ") : null)
        || `Failed to save "${ticket.name}"`;
      toast.error(errorMessage);
      throw error; // Re-throw so the modal stays open
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    setTicketToDelete(ticket);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(ticketToDelete.id);
    try {
      await eventTicketService.deleteTicket(ticketToDelete.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      toast.success(`"${ticketToDelete.name}" deleted successfully`);
      onRefresh?.();
    } catch (error: any) {
      console.error("Failed to delete ticket:", error);
      toast.error(error.response?.data?.message || `Failed to delete "${ticketToDelete.name}"`);
    } finally {
      setIsDeleting(null);
      setTicketToDelete(null);
    }
  };

  const formatPrice = (price: string | number | undefined | null) => {
    if (price === undefined || price === null) return "Free";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return "Free";
    return `£${numPrice.toFixed(2)}`;
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "shortText":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "longText":
        return <AlignLeft className="h-3.5 w-3.5" />;
      case "singleSelect":
        return <CircleDot className="h-3.5 w-3.5" />;
      case "multiSelect":
        return <CheckSquare className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "shortText":
        return "Short Text";
      case "longText":
        return "Long Text";
      case "singleSelect":
        return "Single Select";
      case "multiSelect":
        return "Multi Select";
      default:
        return type;
    }
  };

  // Convert backend QuestionBlock to frontend FormField
  const convertQuestionBlockToFormField = (question: QuestionBlock, index: number): FormField => {
    let fieldType: "short-text" | "long-text" | "single-select" | "multi-select" = "short-text";
    if (question.type === "longText") fieldType = "long-text";
    else if (question.type === "singleSelect") fieldType = "single-select";
    else if (question.type === "multiSelect") fieldType = "multi-select";
    else if (question.type === "shortText") fieldType = "short-text";

    return {
      id: `question-${index}`,
      question: question.question,
      type: fieldType,
      options: question.options || [],
      required: question.required,
    };
  };

  // Convert frontend FormField type to backend QuestionType
  const mapFieldTypeToQuestionType = (fieldType: string): QuestionType => {
    switch (fieldType) {
      case "short-text":
        return QuestionType.SHORT_TEXT;
      case "long-text":
        return QuestionType.LONG_TEXT;
      case "single-select":
        return QuestionType.SINGLE_SELECT;
      case "multi-select":
        return QuestionType.MULTI_SELECT;
      default:
        return QuestionType.SHORT_TEXT;
    }
  };

  const handleAddQuestion = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setFieldToEdit(null);
    setEditingQuestionIndex(null);
    setIsFormFieldModalOpen(true);
  };

  const handleEditQuestion = (ticketId: string, questionIndex: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm || !ticket.questionForm[questionIndex]) return;

    const question = ticket.questionForm[questionIndex];
    const formField = convertQuestionBlockToFormField(question, questionIndex);

    setActiveTicketId(ticketId);
    setFieldToEdit(formField);
    setEditingQuestionIndex(questionIndex);
    setIsFormFieldModalOpen(true);
  };

  // Convert backend question type string to QuestionType enum
  const mapBackendTypeToQuestionType = (type: string): QuestionType => {
    switch (type) {
      case "shortText":
        return QuestionType.SHORT_TEXT;
      case "longText":
        return QuestionType.LONG_TEXT;
      case "singleSelect":
        return QuestionType.SINGLE_SELECT;
      case "multiSelect":
        return QuestionType.MULTI_SELECT;
      default:
        return QuestionType.SHORT_TEXT;
    }
  };

  const handleSaveQuestion = async (field: FormField) => {
    if (!activeTicketId) return;

    const ticket = tickets.find((t) => t.id === activeTicketId);
    if (!ticket) return;

    // Check for duplicate question (case-insensitive comparison)
    const normalizedNewQuestion = field.question.trim().toLowerCase();
    const isDuplicate = (ticket.questionForm || []).some((q, idx) => {
      // If editing, exclude the current question from duplicate check
      if (editingQuestionIndex !== null && idx === editingQuestionIndex) {
        return false;
      }
      return q.question.trim().toLowerCase() === normalizedNewQuestion;
    });

    if (isDuplicate) {
      toast.error("This question already exists for this ticket");
      return;
    }

    // Build updated question form - convert existing questions to proper DTO format
    const currentQuestions = (ticket.questionForm || []).map((q) => ({
      question: q.question,
      type: mapBackendTypeToQuestionType(q.type),
      options: q.options,
      required: q.required,
    }));

    const newQuestion = {
      question: field.question,
      type: mapFieldTypeToQuestionType(field.type),
      options: field.options,
      required: field.required,
    };

    let updatedQuestions;
    if (editingQuestionIndex !== null) {
      // Editing existing question
      updatedQuestions = currentQuestions.map((q, idx) =>
        idx === editingQuestionIndex ? newQuestion : q
      );
    } else {
      // Adding new question
      updatedQuestions = [...currentQuestions, newQuestion];
    }

    try {
      const updated = await eventTicketService.updateTicket(activeTicketId, {
        questionForm: updatedQuestions,
      });
      setTickets((prev) => prev.map((t) => (t.id === activeTicketId ? updated : t)));
      toast.success(editingQuestionIndex !== null ? "Question updated successfully" : "Question added successfully");
      setIsFormFieldModalOpen(false);
      onRefresh?.();
    } catch (error: any) {
      console.error("Failed to save question:", error);
      toast.error(error.response?.data?.message || "Failed to save question");
    }
  };

  const handleDeleteQuestion = async (ticketId: string, questionIndex: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm) return;

    const question = ticket.questionForm[questionIndex];
    const confirmed = confirm(
      `Are you sure you want to delete the question "${question.question}"?`
    );
    if (!confirmed) return;

    // Remove the question at the given index and convert to proper DTO format
    const updatedQuestions = ticket.questionForm
      .filter((_, idx) => idx !== questionIndex)
      .map((q) => ({
        question: q.question,
        type: mapBackendTypeToQuestionType(q.type),
        options: q.options,
        required: q.required,
      }));

    try {
      const updated = await eventTicketService.updateTicket(ticketId, {
        questionForm: updatedQuestions,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      toast.success("Question deleted successfully");
      onRefresh?.();
    } catch (error: any) {
      console.error("Failed to delete question:", error);
      toast.error(error.response?.data?.message || "Failed to delete question");
    }
  };

  const handleMoveQuestion = async (ticketId: string, fromIndex: number, direction: "up" | "down") => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !ticket.questionForm) return;

    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;

    // Check bounds
    if (toIndex < 0 || toIndex >= ticket.questionForm.length) return;

    // Create a copy and swap positions
    const reorderedQuestions = [...ticket.questionForm];
    [reorderedQuestions[fromIndex], reorderedQuestions[toIndex]] =
      [reorderedQuestions[toIndex], reorderedQuestions[fromIndex]];

    // Convert to DTO format
    const updatedQuestions = reorderedQuestions.map((q) => ({
      question: q.question,
      type: mapBackendTypeToQuestionType(q.type),
      options: q.options,
      required: q.required,
    }));

    try {
      const updated = await eventTicketService.updateTicket(ticketId, {
        questionForm: updatedQuestions,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      onRefresh?.();
    } catch (error: any) {
      console.error("Failed to reorder questions:", error);
      toast.error(error.response?.data?.message || "Failed to reorder questions");
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Types Header */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ticket Types</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onScanClick}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-card-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-background/80"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
            {!isExpired && (
              <button
                onClick={handleCreateTicket}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Ticket</span>
              </button>
            )}
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 rounded-full bg-card-background p-4 w-fit">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-2">No ticket types yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isExpired
                ? "This event had no ticket types."
                : "Create your first ticket type to start accepting registrations."}
            </p>
            {!isExpired && (
              <button
                onClick={handleCreateTicket}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Ticket Type
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-white/10 bg-card-background overflow-hidden"
              >
                {/* Ticket Header */}
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{ticket.name}</h3>
                      {ticket.isPrivate ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          <Unlock className="h-3 w-3" />
                          Public
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-foreground font-semibold">
                        {formatPrice(ticket.price)}
                      </span>
                      <span className="text-muted-foreground">
                        {(ticket.quantityTotal ?? 0) >= 100000
                          ? `${ticket.quantitySold} sold`
                          : `${ticket.quantitySold} / ${ticket.quantityTotal} sold`}
                      </span>
                      {(ticket.quantityTotal ?? 0) >= 100000 ? (
                        <span className="text-primary">Unlimited</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {ticket.quantityLeft} remaining
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpired ? (
                    <button
                      onClick={() => handleEditTicket(ticket.id)}
                      className="flex items-center gap-2 rounded-md border border-white/10 bg-card-secondary-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTicket(ticket.id)}
                        className="flex items-center gap-2 rounded-md border border-white/10 bg-card-secondary-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        disabled={isDeleting === ticket.id}
                        className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {isDeleting === ticket.id ? "Deleting..." : "Delete"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Registration Questions */}
                <div className="border-t border-white/10 bg-card-secondary-background/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Registration Questions ({ticket.questionForm?.length || 0})
                      </span>
                    </div>
                    {!isExpired && (
                      <button
                        onClick={() => handleAddQuestion(ticket.id)}
                        className="flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Question
                      </button>
                    )}
                  </div>
                  {ticket.questionForm && ticket.questionForm.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.questionForm.map((question, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 sm:gap-3 rounded-md bg-card-secondary-background p-3 group"
                        >
                          {/* Mobile ordering buttons - left side, vertically stacked */}
                          {!isExpired && (
                            <div className="flex flex-col gap-0.5 sm:hidden">
                              <button
                                onClick={() => handleMoveQuestion(ticket.id, index, "up")}
                                disabled={index === 0}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleMoveQuestion(ticket.id, index, "down")}
                                disabled={index === (ticket.questionForm?.length || 0) - 1}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-center rounded bg-primary/10 p-1.5 text-primary">
                            {getQuestionTypeIcon(question.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-foreground">{question.question}</p>
                              {question.required && (
                                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getQuestionTypeLabel(question.type)}
                                {question.options && question.options.length > 0 && (
                                  <> • {question.options.length} options</>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons - edit/delete always, ordering on desktop only */}
                          {!isExpired && (
                            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {/* Desktop ordering buttons */}
                              <button
                                onClick={() => handleMoveQuestion(ticket.id, index, "up")}
                                disabled={index === 0}
                                className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Move up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveQuestion(ticket.id, index, "down")}
                                disabled={index === (ticket.questionForm?.length || 0) - 1}
                                className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Move down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditQuestion(ticket.id, index)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                                title="Edit question"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(ticket.id, index)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
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
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No questions added yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      <TicketTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTicket}
        ticketToEdit={ticketToEdit}
        readOnly={isExpired}
      />

      <FormFieldModal
        isOpen={isFormFieldModalOpen}
        onClose={() => {
          setIsFormFieldModalOpen(false);
          setActiveTicketId(null);
          setFieldToEdit(null);
          setEditingQuestionIndex(null);
        }}
        onSave={handleSaveQuestion}
        fieldToEdit={fieldToEdit}
      />

      <ConfirmModal
        isOpen={ticketToDelete !== null}
        onClose={() => setTicketToDelete(null)}
        onConfirm={confirmDeleteTicket}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${ticketToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting !== null}
        variant="danger"
      />
    </div>
  );
}
