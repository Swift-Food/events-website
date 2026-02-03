"use client";

import { useState, forwardRef } from "react";
import {
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  AlignLeft,
  CircleDot,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";
import TicketTypeModal from "@/components/event-edit/TicketTypeModal";
import FormFieldModal from "@/components/event-edit/FormFieldModal";
import { TicketType, FormField } from "@/types";
import type { StripeConnectStatus } from "@/types/payment";
import { toast } from "sonner";

interface StripeConnect {
  status: StripeConnectStatus | null;
  isLoading: boolean;
  isStartingOnboarding: boolean;
  startOnboarding: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

interface TicketTypesSectionProps {
  stripeConnect: StripeConnect;
  stripeConnectError?: string;
}

// Question type helpers
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

const TicketTypesSection = forwardRef<HTMLDivElement, TicketTypesSectionProps>(
  ({ stripeConnect, stripeConnectError }, ref) => {
    const {
      ticketTypes,
      addTicketType,
      updateTicketType,
      deleteTicketType,
    } = useEventCreation();

    // Local UI state
    const [isTicketTypeModalOpen, setIsTicketTypeModalOpen] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<TicketType | null>(null);
    const [isTicketListExpanded, setIsTicketListExpanded] = useState(true);
    const [collapsedTickets, setCollapsedTickets] = useState<Set<string>>(
      new Set(),
    );
    const [isFormFieldModalOpen, setIsFormFieldModalOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState<FormField | null>(null);
    const [activeTicketIdForQuestions, setActiveTicketIdForQuestions] = useState<
      string | null
    >(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<
      number | null
    >(null);

    // Check if user has any paid tickets
    const hasPaidTickets = ticketTypes.some(
      (ticket) => !ticket.isFree && ticket.price > 0,
    );

    const handleAddTicketClick = () => {
      setTicketToEdit(null);
      setIsTicketTypeModalOpen(true);
    };

    const handleEditTicketClick = (ticket: TicketType) => {
      setTicketToEdit(ticket);
      setIsTicketTypeModalOpen(true);
    };

    const handleSaveTicket = (ticket: TicketType) => {
      if (ticketToEdit) {
        updateTicketType(ticket);
      } else {
        addTicketType(ticket);
      }
    };

    const handleDeleteTicket = (ticketId: string) => {
      const ticketToDelete = ticketTypes.find((t) => t.id === ticketId);
      if (!ticketToDelete) return;

      const ticketName = ticketToDelete.name;
      if (confirm(`Are you sure you want to remove "${ticketName}"?`)) {
        deleteTicketType(ticketId);
      }
    };

    const toggleTicketCollapse = (ticketId: string) => {
      setCollapsedTickets((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(ticketId)) {
          newSet.delete(ticketId);
        } else {
          newSet.add(ticketId);
        }
        return newSet;
      });
    };

    // Question management handlers
    const handleAddQuestion = (ticketId: string) => {
      setActiveTicketIdForQuestions(ticketId);
      setFieldToEdit(null);
      setEditingQuestionIndex(null);
      setIsFormFieldModalOpen(true);
    };

    const handleEditQuestion = (ticketId: string, questionIndex: number) => {
      const ticket = ticketTypes.find((t) => t.id === ticketId);
      if (!ticket || !ticket.questionForm || !ticket.questionForm[questionIndex])
        return;

      const question = ticket.questionForm[questionIndex];
      setActiveTicketIdForQuestions(ticketId);
      setFieldToEdit({ ...question, id: `question-${questionIndex}` });
      setEditingQuestionIndex(questionIndex);
      setIsFormFieldModalOpen(true);
    };

    const handleSaveQuestion = (field: FormField) => {
      if (!activeTicketIdForQuestions) return;

      const ticket = ticketTypes.find((t) => t.id === activeTicketIdForQuestions);
      if (!ticket) return;

      const currentQuestions = ticket.questionForm || [];

      // Check for duplicate question
      const normalizedNewQuestion = field.question.trim().toLowerCase();
      const isDuplicate = currentQuestions.some((q, idx) => {
        if (editingQuestionIndex !== null && idx === editingQuestionIndex) {
          return false;
        }
        return q.question.trim().toLowerCase() === normalizedNewQuestion;
      });

      if (isDuplicate) {
        toast.error("This question already exists for this ticket");
        return;
      }

      let updatedQuestions: FormField[];
      if (editingQuestionIndex !== null) {
        updatedQuestions = currentQuestions.map((q, idx) =>
          idx === editingQuestionIndex ? field : q,
        );
      } else {
        updatedQuestions = [...currentQuestions, field];
      }

      updateTicketType({
        ...ticket,
        questionForm: updatedQuestions,
      });

      setIsFormFieldModalOpen(false);
      setActiveTicketIdForQuestions(null);
      setFieldToEdit(null);
      setEditingQuestionIndex(null);
    };

    const handleDeleteQuestion = (ticketId: string, questionIndex: number) => {
      const ticket = ticketTypes.find((t) => t.id === ticketId);
      if (!ticket || !ticket.questionForm) return;

      const question = ticket.questionForm[questionIndex];
      const confirmed = confirm(
        `Are you sure you want to delete the question "${question.question}"?`,
      );
      if (!confirmed) return;

      const updatedQuestions = ticket.questionForm.filter(
        (_, idx) => idx !== questionIndex,
      );
      updateTicketType({
        ...ticket,
        questionForm: updatedQuestions,
      });
    };

    const handleMoveQuestion = (
      ticketId: string,
      fromIndex: number,
      direction: "up" | "down",
    ) => {
      const ticket = ticketTypes.find((t) => t.id === ticketId);
      if (!ticket || !ticket.questionForm) return;

      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= ticket.questionForm.length) return;

      const reorderedQuestions = [...ticket.questionForm];
      [reorderedQuestions[fromIndex], reorderedQuestions[toIndex]] = [
        reorderedQuestions[toIndex],
        reorderedQuestions[fromIndex],
      ];

      updateTicketType({
        ...ticket,
        questionForm: reorderedQuestions,
      });
    };

    return (
      <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">
              Ticket Types
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {ticketTypes.length === 0
                ? "No tickets added"
                : `${ticketTypes.length} ticket type${
                    ticketTypes.length > 1 ? "s" : ""
                  }`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTicketClick}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            Add Ticket
          </button>
        </div>

        {/* Stripe Connect Warning for Paid Tickets */}
        {hasPaidTickets &&
          stripeConnect.status &&
          !stripeConnect.status.onboardingComplete && (
            <div
              ref={ref}
              className={`mt-5 rounded-2xl p-4 ${stripeConnectError ? "bg-red-950 border border-red-500/30" : "bg-amber-950 border border-amber-500/30"}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${stripeConnectError ? "text-red-400" : "text-amber-400"}`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${stripeConnectError ? "text-red-400" : "text-amber-400"}`}
                  >
                    Payment Setup Required
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    To create events with paid tickets, you need to complete
                    Stripe payment setup first.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={stripeConnect.startOnboarding}
                      disabled={stripeConnect.isStartingOnboarding}
                      className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeConnect.isStartingOnboarding ? (
                        "Opening..."
                      ) : (
                        <>
                          Set Up Payments
                          <ExternalLink className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={stripeConnect.refreshStatus}
                      disabled={stripeConnect.isLoading}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {stripeConnect.isLoading
                        ? "Checking..."
                        : "I've completed setup"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* List of Ticket Types */}
        {ticketTypes.length > 0 && isTicketListExpanded && (
          <div className="mt-5 space-y-3">
            {ticketTypes.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl bg-card-secondary-background backdrop-blur-xl overflow-hidden"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleTicketCollapse(ticket.id)}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors mt-0.5"
                    aria-label={
                      collapsedTickets.has(ticket.id)
                        ? "Expand ticket"
                        : "Collapse ticket"
                    }
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${collapsedTickets.has(ticket.id) ? "-rotate-90" : ""}`}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {ticket.name}
                      </p>
                      {ticket.isSingleUse && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          Single-use
                        </span>
                      )}
                    </div>
                    {(ticket.maxGroupSize || 1) > 1 && (
                      <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 mt-1">
                        Groups
                      </span>
                    )}
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-sm font-medium text-foreground">
                        {ticket.isFree ? "Free" : `£${ticket.price.toFixed(2)}`}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">
                        {ticket.quantity >= 100000
                          ? "Unlimited"
                          : `${ticket.quantity.toLocaleString()} available`}
                      </p>
                      {collapsedTickets.has(ticket.id) &&
                        ticket.questionForm &&
                        ticket.questionForm.length > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <p className="text-sm text-muted-foreground">
                              {ticket.questionForm.length} question
                              {ticket.questionForm.length > 1 ? "s" : ""}
                            </p>
                          </>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTicketClick(ticket)}
                      className="rounded-full p-2 transition-all hover:bg-white/10"
                      aria-label="Edit ticket"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="rounded-full p-2 transition-all hover:bg-red-500/20"
                      aria-label="Delete ticket"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Registration Questions - hidden when collapsed */}
                {!collapsedTickets.has(ticket.id) && (
                  <div className="border-t border-foreground/10 bg-card-background/50 px-2 py-2 md:px-4 md:py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Registration Questions (
                          {ticket.questionForm?.length || 0})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(ticket.id)}
                        className="flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Question
                      </button>
                    </div>
                    {ticket.questionForm && ticket.questionForm.length > 0 ? (
                      <div className="space-y-2">
                        {ticket.questionForm.map((question, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 sm:gap-3 rounded-md bg-card-background p-3 group"
                          >
                            {/* Mobile ordering buttons - left side */}
                            <div className="flex flex-col gap-0.5 sm:hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveQuestion(ticket.id, index, "up")
                                }
                                disabled={index === 0}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveQuestion(ticket.id, index, "down")
                                }
                                disabled={
                                  index ===
                                  (ticket.questionForm?.length || 0) - 1
                                }
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-center rounded bg-primary/10 p-1.5 text-primary">
                              {getQuestionTypeIcon(question.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-foreground">
                                  {question.question}
                                </p>
                                {question.required && (
                                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                                    Required
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {getQuestionTypeLabel(question.type)}
                                  {question.options &&
                                    question.options.length > 0 && (
                                      <>
                                        {" "}
                                        • {question.options.length} options
                                      </>
                                    )}
                                </span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {/* Desktop ordering buttons */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveQuestion(ticket.id, index, "up")
                                }
                                disabled={index === 0}
                                className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Move up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveQuestion(ticket.id, index, "down")
                                }
                                disabled={
                                  index ===
                                  (ticket.questionForm?.length || 0) - 1
                                }
                                className="hidden sm:block rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                title="Move down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditQuestion(ticket.id, index)
                                }
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                                title="Edit question"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteQuestion(ticket.id, index)
                                }
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
                                title="Delete question"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No questions added yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Expand/Collapse Button */}
        {ticketTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setIsTicketListExpanded(!isTicketListExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 transition-all hover:bg-white/5 rounded-xl cursor-pointer"
          >
            {isTicketListExpanded ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Hide tickets
                </span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  Show {ticketTypes.length} ticket
                  {ticketTypes.length > 1 ? "s" : ""}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>
        )}

        {/* Modals */}
        <TicketTypeModal
          isOpen={isTicketTypeModalOpen}
          onClose={() => setIsTicketTypeModalOpen(false)}
          onSave={handleSaveTicket}
          ticketToEdit={ticketToEdit}
        />

        <FormFieldModal
          isOpen={isFormFieldModalOpen}
          onClose={() => {
            setIsFormFieldModalOpen(false);
            setActiveTicketIdForQuestions(null);
            setFieldToEdit(null);
            setEditingQuestionIndex(null);
          }}
          onSave={handleSaveQuestion}
          fieldToEdit={fieldToEdit}
        />
      </div>
    );
  },
);

TicketTypesSection.displayName = "TicketTypesSection";

export default TicketTypesSection;
