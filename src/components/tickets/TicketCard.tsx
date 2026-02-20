// components/tickets/TicketCard.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GuestTicketWithEventResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { Calendar, Ticket, QrCode, X, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import TicketQRCode from "./TicketQRCode";
import { format } from "date-fns";
import { guestTicketService } from "@/services/guest-ticket.service";
import { getEffectiveTicketStatus } from "@/lib/ticket-utils";

interface TicketCardProps {
  ticket: GuestTicketWithEventResponseDto;
  onRefund?: (ticketId: string) => void;
  isRefunding?: boolean;
  onCompletePayment?: (ticketId: string) => void;
  isProcessingPayment?: boolean;
  onCancel?: (ticketId: string) => void;
  isCancelling?: boolean;
  onLeaveWaitlist?: (ticketId: string) => void;
  isLeavingWaitlist?: boolean;
  waitlistPosition?: number;
  waitlistTotal?: number;
  autoShowQR?: boolean;
  onQRClose?: () => void;
}

// Confirmation Modal Component
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  loadingText,
  isLoading,
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  loadingText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}) {
  if (!isOpen) return null;

  const iconBg = variant === "danger" ? "bg-red-500/20" : "bg-amber-500/20";
  const iconColor = variant === "danger" ? "text-red-400" : "text-amber-400";
  const buttonBg = variant === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card-background rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-full ${iconBg}`}>
            {variant === "danger" ? (
              <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <RotateCcw className={`h-5 w-5 ${iconColor}`} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-foreground/10 text-foreground rounded-xl text-sm font-medium hover:bg-foreground/20 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 ${buttonBg} text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingText || "Processing..."}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
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

export default function TicketCard({
  ticket,
  onRefund,
  isRefunding,
  onCompletePayment,
  isProcessingPayment,
  onCancel,
  isCancelling,
  onLeaveWaitlist,
  isLeavingWaitlist,
  waitlistPosition,
  waitlistTotal,
  autoShowQR = false,
  onQRClose,
}: TicketCardProps) {
  const [showQRModal, setShowQRModal] = useState(autoShowQR);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showLeaveWaitlistModal, setShowLeaveWaitlistModal] = useState(false);

  const eventDate = new Date(ticket.eventStartDateTime);
  const isUpcoming = eventDate > new Date();

  const effectiveStatus = getEffectiveTicketStatus(
    ticket.status,
    ticket.eventStartDateTime,
    ticket.eventEndDateTime,
  );
  const status = statusConfig[effectiveStatus];
  const canShowQR = ticket.status === GuestTicketStatus.ACTIVE && ticket.qrCode;
  const isPendingPayment = ticket.status === GuestTicketStatus.PENDING_PAYMENT;
  const isActive = ticket.status === GuestTicketStatus.ACTIVE;
  const isWaitlisted = ticket.status === GuestTicketStatus.WAITLISTED;
  const isPaidTicket = ticket.ticketPrice > 0;
  const canCancel = (ticket.status === GuestTicketStatus.PENDING_PAYMENT ||
    ticket.status === GuestTicketStatus.PENDING_APPROVAL) && isUpcoming && onCancel;
  // For active tickets: paid tickets can refund, free tickets can cancel
  const canRefund = isActive && isUpcoming && isPaidTicket && onRefund;
  const canCancelActive = isActive && isUpcoming && !isPaidTicket && onCancel;
  const canLeaveWaitlist = isWaitlisted && isUpcoming && onLeaveWaitlist;

  // Check if there's a claim deadline (for promoted paid tickets)
  const hasClaimDeadline = isPendingPayment && ticket.claimDeadline && ticket.wasWaitlisted;
  const claimDeadline = ticket.claimDeadline ? new Date(ticket.claimDeadline) : null;
  const isClaimExpiringSoon = claimDeadline && (claimDeadline.getTime() - Date.now()) < 3600000; // Less than 1 hour

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (onCancel) {
      onCancel(ticket.id);
    }
    setShowCancelModal(false);
  };

  const handleRefundClick = () => {
    setShowRefundModal(true);
  };

  const handleConfirmRefund = () => {
    if (onRefund) {
      onRefund(ticket.id);
    }
    setShowRefundModal(false);
  };

  const handleConfirmLeaveWaitlist = () => {
    if (onLeaveWaitlist) {
      onLeaveWaitlist(ticket.id);
    }
    setShowLeaveWaitlistModal(false);
  };

  return (
    <>
      <div className="rounded-xl bg-card-background border border-white/5 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:border-white/10 hover:scale-[1.01]">
        {/* Event Image - Aspect ratio 4:1 = 25% height relative to width */}
        <div className="relative aspect-[4/1] bg-gradient-to-br from-primary/20 to-primary/5">
          {ticket.eventImage ? (
            <img
              src={ticket.eventImage}
              alt={ticket.eventName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Ticket className="h-8 w-8 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card-background/90 to-transparent" />
          <div className="absolute top-2 right-2">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {/* Ticket Info - Compact */}
        <div className="p-3.5">
          <h3 className="text-base font-semibold text-foreground mb-0.5 line-clamp-1">
            {ticket.eventName}
          </h3>

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
            <Ticket className="h-3.5 w-3.5 text-primary/60" />
            <span className="truncate">{ticket.ticketName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span>{format(eventDate, "EEE, MMM d 'at' h:mm a")}</span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/5">
            {/* Active ticket layout */}
            {isActive && (
              <div className="space-y-2">
                {canShowQR && (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    aria-label="View QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                    Show Ticket
                  </button>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/events/${ticket.eventId}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Event Details
                  </Link>
                  {canRefund && (
                    <button
                      onClick={handleRefundClick}
                      disabled={isRefunding}
                      className="flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isRefunding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {isRefunding ? "Processing..." : "Request Refund"}
                    </button>
                  )}
                  {canCancelActive && (
                    <button
                      onClick={handleCancelClick}
                      disabled={isCancelling}
                      className="flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isCancelling ? "Cancelling..." : "Cancel Ticket"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pending payment layout */}
            {isPendingPayment && (
              <div className="space-y-2">
                {/* Claim deadline warning for promoted waitlist tickets */}
                {hasClaimDeadline && claimDeadline && (
                  <div className={`flex items-center gap-1.5 p-2 rounded-lg text-xs ${
                    isClaimExpiringSoon
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {isClaimExpiringSoon ? "Expires soon! " : ""}
                      Pay by {format(claimDeadline, "MMM d, h:mm a")}
                    </span>
                  </div>
                )}
                {onCompletePayment && (
                  <button
                    onClick={() => onCompletePayment(ticket.id)}
                    disabled={isProcessingPayment}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-warning text-white rounded-lg text-sm font-semibold hover:bg-warning/90 transition-all disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Complete Payment"
                    )}
                  </button>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/events/${ticket.eventId}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Event Details
                  </Link>
                  {canCancel && (
                    <button
                      onClick={handleCancelClick}
                      disabled={isCancelling}
                      className="flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isCancelling ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Waitlisted layout */}
            {isWaitlisted && (
              <div className="space-y-2">
                {/* Waitlist position info */}
                {waitlistPosition !== undefined && waitlistPosition > 0 && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-500/20 text-purple-400 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      #{waitlistPosition}
                      {waitlistTotal ? ` of ${waitlistTotal}` : ""} on waitlist
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/events/${ticket.eventId}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Event Details
                  </Link>
                  {canLeaveWaitlist && (
                    <button
                      onClick={() => setShowLeaveWaitlistModal(true)}
                      disabled={isLeavingWaitlist}
                      className="flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isLeavingWaitlist ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isLeavingWaitlist ? "Leaving..." : "Leave Waitlist"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Other status layout (not active, not pending payment, not waitlisted) */}
            {!isActive && !isPendingPayment && !isWaitlisted && (
              <div className="space-y-2">
                <Link
                  href={`/events/${ticket.eventId}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 text-foreground rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Event
                </Link>
                {canCancel && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleCancelClick}
                      disabled={isCancelling}
                      className="flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isCancelling ? "Cancelling..." : "Cancel Ticket"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Ticket"
        message="Are you sure you want to cancel this ticket? This action cannot be undone."
        confirmText="Yes, Cancel"
        loadingText="Cancelling..."
        isLoading={isCancelling}
        variant="danger"
      />

      {/* Refund Confirmation Modal */}
      <ConfirmModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onConfirm={handleConfirmRefund}
        title="Request Refund"
        message="Are you sure you want to request a refund for this ticket? The refund amount will be credited back to your original payment method."
        confirmText="Yes, Refund"
        loadingText="Processing..."
        isLoading={isRefunding}
        variant="warning"
      />

      {/* Leave Waitlist Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveWaitlistModal}
        onClose={() => setShowLeaveWaitlistModal(false)}
        onConfirm={handleConfirmLeaveWaitlist}
        title="Leave Waitlist"
        message="Are you sure you want to leave the waitlist? You will lose your position and will need to join again if you change your mind."
        confirmText="Yes, Leave"
        loadingText="Leaving..."
        isLoading={isLeavingWaitlist}
        variant="danger"
      />

      {/* QR Code Modal - portaled to body to avoid transform containment */}
      {showQRModal && ticket.qrCode && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card-background rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Your Ticket</h3>
              <button
                onClick={() => { setShowQRModal(false); onQRClose?.(); }}
                className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <TicketQRCode
                qrCode={ticket.qrCode}
                ticketName={ticket.ticketName}
                eventName={ticket.eventName}
                size={200}
              />

              <div className="mt-5 text-center">
                <p className="text-foreground font-semibold text-sm">{ticket.eventName}</p>
                <p className="text-muted-foreground text-xs mt-1">{ticket.ticketName}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {format(eventDate, "EEE, MMM d 'at' h:mm a")}
                </p>
              </div>

              {/* Manual entry code - subtle fallback */}
              {ticket.checkInCodeFormatted && (
                <div className="mt-4 pt-4 border-t border-white/5 w-full text-center">
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Manual Entry Code</p>
                  <p className="font-mono text-sm text-muted-foreground mt-0.5">{ticket.checkInCodeFormatted}</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
