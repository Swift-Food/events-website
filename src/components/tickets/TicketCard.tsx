// components/tickets/TicketCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { GuestTicketWithEventResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { Calendar, Ticket, QrCode, X, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import TicketQRCode from "./TicketQRCode";
import { format } from "date-fns";

interface TicketCardProps {
  ticket: GuestTicketWithEventResponseDto;
  onRefund?: (ticketId: string) => void;
  isRefunding?: boolean;
  onCompletePayment?: (ticketId: string) => void;
  isProcessingPayment?: boolean;
}

const statusConfig: Record<GuestTicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [GuestTicketStatus.ACTIVE]: {
    label: "Active",
    color: "bg-green-500/20 text-green-400",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  [GuestTicketStatus.PENDING_APPROVAL]: {
    label: "Pending Approval",
    color: "bg-yellow-500/20 text-yellow-400",
    icon: <Clock className="h-4 w-4" />,
  },
  [GuestTicketStatus.PENDING_PAYMENT]: {
    label: "Pending Payment",
    color: "bg-orange-500/20 text-orange-400",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  [GuestTicketStatus.CHECKED_IN]: {
    label: "Checked In",
    color: "bg-blue-500/20 text-blue-400",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  [GuestTicketStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-500/20 text-red-400",
    icon: <XCircle className="h-4 w-4" />,
  },
  [GuestTicketStatus.REFUNDED]: {
    label: "Refunded",
    color: "bg-gray-500/20 text-gray-400",
    icon: <XCircle className="h-4 w-4" />,
  },
  [GuestTicketStatus.WAITLISTED]: {
    label: "Waitlisted",
    color: "bg-purple-500/20 text-purple-400",
    icon: <Clock className="h-4 w-4" />,
  },
  [GuestTicketStatus.EXPIRED]: {
    label: "Expired",
    color: "bg-gray-500/20 text-gray-400",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function TicketCard({ ticket, onRefund, isRefunding, onCompletePayment, isProcessingPayment }: TicketCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  const status = statusConfig[ticket.status] || statusConfig[GuestTicketStatus.ACTIVE];
  const eventDate = new Date(ticket.eventStartDateTime);
  const isUpcoming = eventDate > new Date();
  const canShowQR = ticket.status === GuestTicketStatus.ACTIVE && ticket.qrCode;

  return (
    <>
      <div className="rounded-2xl bg-card-background backdrop-blur-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        {/* Event Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
          {ticket.eventImage && (
            <img
              src={ticket.eventImage}
              alt={ticket.eventName}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-3 right-3">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
            {ticket.eventName}
          </h3>

          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <Ticket className="h-4 w-4" />
            <span>{ticket.ticketName}</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{format(eventDate, "EEE, MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-foreground/10">
            {canShowQR && (
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center justify-center p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                aria-label="View QR Code"
              >
                <QrCode className="h-5 w-5" />
              </button>
            )}

            {ticket.status === GuestTicketStatus.PENDING_PAYMENT && onCompletePayment && (
              <button
                onClick={() => onCompletePayment(ticket.id)}
                disabled={isProcessingPayment}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </button>
            )}

            <Link
              href={`/events/${ticket.eventId}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground/10 text-foreground rounded-xl text-sm font-medium hover:bg-foreground/20 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              View Event
            </Link>

            {ticket.status === GuestTicketStatus.ACTIVE && isUpcoming && onRefund && (
              <button
                onClick={() => onRefund(ticket.id)}
                disabled={isRefunding}
                className="px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isRefunding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refund"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && ticket.qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card-background rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Your Ticket</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 rounded-full hover:bg-foreground/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <TicketQRCode
                qrCode={ticket.qrCode}
                ticketName={ticket.ticketName}
                eventName={ticket.eventName}
                size={220}
              />

              <div className="mt-6 text-center">
                <p className="text-foreground font-semibold">{ticket.eventName}</p>
                <p className="text-muted-foreground text-sm mt-1">{ticket.ticketName}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {format(eventDate, "EEE, MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
