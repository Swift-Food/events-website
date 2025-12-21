"use client";

import { EventResponseDto } from "@/types";
import { Ticket, Plus, Edit, Lock, Unlock, Trash2 } from "lucide-react";

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
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-700 bg-card-secondary-background p-4 transition-colors hover:border-neutral-600"
              >
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
            ))}
          </div>
        )}
      </div>

      {/* Registration Questions Card - placeholder */}
      <div className="rounded-xl border border-neutral-700 bg-card-background p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Registration Questions</h2>
        <p className="text-muted-foreground text-sm">
          Custom registration questions coming soon. You&apos;ll be able to add custom questions
          that attendees must answer when registering for tickets.
        </p>
      </div>
    </div>
  );
}
