"use client";

import { useState } from "react";
import { X, Ban, AlertTriangle } from "lucide-react";
import { GuestTicketResponseDto } from "@/types/guest-ticket";

interface BlacklistModalProps {
  isOpen: boolean;
  guest: GuestTicketResponseDto | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function BlacklistModal({
  isOpen,
  guest,
  onClose,
  onConfirm,
  isLoading = false,
}: BlacklistModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !guest) return null;

  const guestName = guest.guest?.firstName && guest.guest?.lastName
    ? `${guest.guest.firstName} ${guest.guest.lastName}`
    : guest.guest?.user?.email || "this user";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Please provide a reason for blacklisting");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }

    try {
      await onConfirm(reason.trim());
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to blacklist user");
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Ban className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Blacklist User
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-amber-500/10 p-3">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div className="text-sm text-amber-200">
              <p className="font-medium">This action will:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-200/80">
                <li>Cancel their ticket for this event</li>
                <li>Automatically refund if paid</li>
                <li>Send them an email notification</li>
                <li>Prevent them from registering again</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          You are about to blacklist <span className="font-medium text-foreground">{guestName}</span> from this event.
          They will be notified of this action with the reason you provide.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Reason for blacklisting
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear reason that will be shared with the user..."
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-red-500">{error}</span>}</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? "Blacklisting..." : "Blacklist User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
