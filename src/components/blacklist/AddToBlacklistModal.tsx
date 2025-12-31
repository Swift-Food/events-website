"use client";

import { useState } from "react";
import { X, Ban, Mail } from "lucide-react";

interface AddToBlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, reason: string) => Promise<void>;
}

export function AddToBlacklistModal({
  isOpen,
  onClose,
  onConfirm,
}: AddToBlacklistModalProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters");
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm(email.trim(), reason.trim());
      setEmail("");
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to add to blacklist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
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
              Add to Blacklist
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Preemptively block a user by email. They will not be able to register for this event.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for blacklisting (will be shown to the user if they try to register)..."
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
              disabled={isLoading || !email.trim() || !reason.trim()}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add to Blacklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
