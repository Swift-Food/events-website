"use client";

import { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appealMessage: string) => Promise<void>;
  reason: string;
}

export function AppealModal({
  isOpen,
  onClose,
  onSubmit,
  reason,
}: AppealModalProps) {
  const [appealMessage, setAppealMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!appealMessage.trim()) {
      setError("Please explain why your blacklist should be reconsidered");
      return;
    }

    if (appealMessage.trim().length < 10) {
      setError("Appeal must be at least 10 characters");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(appealMessage.trim());
      setAppealMessage("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit appeal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAppealMessage("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Submit Appeal
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-red-500/10 p-3">
          <p className="text-sm text-red-200">
            <span className="font-medium">Reason for blacklist:</span> {reason}
          </p>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          You have one chance to appeal this decision. Please explain why you believe
          the blacklist should be reconsidered. The event organizer will review your appeal.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="appeal"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Your Appeal
            </label>
            <textarea
              id="appeal"
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Explain why this blacklist should be reconsidered..."
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              maxLength={1000}
              disabled={isLoading}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-red-500">{error}</span>}</span>
              <span>{appealMessage.length}/1000</span>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-amber-500/10 p-3">
            <p className="text-xs text-amber-200">
              <strong>Important:</strong> This is your only chance to appeal. If denied,
              you will be permanently blocked from this event.
            </p>
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
              disabled={isLoading || !appealMessage.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Submitting..." : "Submit Appeal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
