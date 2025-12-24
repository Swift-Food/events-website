"use client";

import { X, CheckCircle2, XCircle, User, Mail, Ticket, Calendar } from "lucide-react";
import { format } from "date-fns";
import { GuestTicketResponseDto, AdminTicketResponseDto } from "@/types/guest-ticket";
import { useState } from "react";

type ReviewableGuest = GuestTicketResponseDto | AdminTicketResponseDto;

interface ReviewGuestModalProps {
  isOpen: boolean;
  guest: ReviewableGuest | null;
  onClose: () => void;
  onApprove: (ticketId: string, reason?: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  isLoading?: boolean;
}

function getGuestName(guest: ReviewableGuest): string {
  if ("guestName" in guest && guest.guestName) {
    return guest.guestName;
  }
  if ("guest" in guest && guest.guest) {
    const g = guest.guest;
    const name = `${g.firstName || ""} ${g.lastName || ""}`.trim();
    if (name) return name;
    if (g.user) {
      const userName = `${g.user.firstName || ""} ${g.user.lastName || ""}`.trim();
      if (userName) return userName;
      if (g.user.username) return g.user.username;
    }
  }
  return "Guest";
}

function getGuestEmail(guest: ReviewableGuest): string {
  if ("guestEmail" in guest && guest.guestEmail) {
    return guest.guestEmail;
  }
  if ("guest" in guest && guest.guest?.user?.email) {
    return guest.guest.user.email;
  }
  return "No email";
}

function getRegistrationDate(guest: ReviewableGuest): Date {
  if ("registeredAt" in guest) {
    return new Date(guest.registeredAt);
  }
  return new Date(guest.createdAt);
}

function getTicketName(guest: ReviewableGuest): string {
  return guest.ticketName || "Unknown Ticket";
}

export function ReviewGuestModal({
  isOpen,
  guest,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: ReviewGuestModalProps) {
  const [reason, setReason] = useState("");
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(null);

  if (!isOpen || !guest) return null;

  const questionAnswers = guest.questionAnswers;
  const hasQuestions = questionAnswers && Object.keys(questionAnswers).length > 0;

  const handleApprove = () => {
    if (activeAction === "approve") {
      onApprove(guest.id, reason || undefined);
      setReason("");
      setActiveAction(null);
    } else {
      setActiveAction("approve");
    }
  };

  const handleReject = () => {
    if (activeAction === "reject") {
      onReject(guest.id, reason || undefined);
      setReason("");
      setActiveAction(null);
    } else {
      setActiveAction("reject");
    }
  };

  const handleClose = () => {
    setReason("");
    setActiveAction(null);
    onClose();
  };

  const handleCancelAction = () => {
    setReason("");
    setActiveAction(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-foreground">Review Guest</h3>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Guest Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{getGuestName(guest)}</p>
                <p className="text-sm text-muted-foreground">{getGuestEmail(guest)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm rounded-lg bg-white/5 p-2.5">
                <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Ticket:</span>
                <span className="text-foreground">{getTicketName(guest)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm rounded-lg bg-white/5 p-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Registered:</span>
                <span className="text-foreground">
                  {format(getRegistrationDate(guest), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Question Answers */}
          {hasQuestions ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Registration Answers</h4>
              <div className="space-y-3">
                {Object.entries(questionAnswers).map(([question, answer]) => (
                  <div
                    key={question}
                    className="rounded-xl bg-white/5 border border-white/10 p-4"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {question}
                    </p>
                    <p className="text-foreground">
                      {typeof answer === "object" ? JSON.stringify(answer) : String(answer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No registration questions were answered.
              </p>
            </div>
          )}

          {/* Reason Form */}
          {activeAction && (
            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium text-foreground">
                {activeAction === "approve" ? "Approval" : "Rejection"} Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter a reason for ${activeAction === "approve" ? "approval" : "rejection"}...`}
                className="w-full rounded-xl bg-input-background border border-white/10 p-3 text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          {activeAction ? (
            <>
              <button
                onClick={handleCancelAction}
                disabled={isLoading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              {activeAction === "approve" ? (
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Approve
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Confirm Reject
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600/20 border border-red-600/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
