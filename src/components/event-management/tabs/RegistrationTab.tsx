"use client";

import { EventResponseDto } from "@/types";
import { Ticket, Plus, Edit, Lock, Unlock, Trash2, MessageSquare, AlignLeft, CircleDot, CheckSquare, HelpCircle } from "lucide-react";

interface RegistrationTabProps {
  eventData: EventResponseDto;
  onCreateTicket?: () => void;
  onEditTicket?: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

export function RegistrationTab({ eventData, onCreateTicket, onEditTicket, onDeleteTicket }: RegistrationTabProps) {
  const tickets = eventData.eventTickets || [];

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (numPrice === 0) return "Free";
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

  return (
    <div className="space-y-6">
      {/* Ticket Types Card */}
      <div className="rounded-xl border border-neutral-700 bg-card-background p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ticket Types</h2>
          </div>
          <button
            onClick={onCreateTicket}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Ticket</span>
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 rounded-full bg-card-secondary-background p-4 w-fit">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-2">No ticket types yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first ticket type to start accepting registrations.
            </p>
            <button
              onClick={onCreateTicket}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Ticket Type
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-lg border border-neutral-700 bg-card-secondary-background overflow-hidden transition-colors hover:border-neutral-600"
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
                        {ticket.quantitySold} / {ticket.quantityTotal} sold
                      </span>
                      <span className="text-muted-foreground">
                        {ticket.quantityLeft} remaining
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditTicket?.(ticket.id)}
                      className="flex items-center gap-2 rounded-md border border-neutral-700 bg-card-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-background/80"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteTicket?.(ticket.id)}
                      className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Registration Questions */}
                {ticket.questionForm && ticket.questionForm.length > 0 && (
                  <div className="border-t border-neutral-700 bg-card-background/50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Registration Questions ({ticket.questionForm.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {ticket.questionForm.map((question, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-md bg-card-background p-3"
                        >
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
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {getQuestionTypeLabel(question.type)}
                              </span>
                              {question.options && question.options.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  • {question.options.length} options
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
