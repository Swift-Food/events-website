"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, XCircle, User, Mail } from "lucide-react";
import { BlacklistEntryDto } from "@/types/blacklist";
import { format } from "date-fns";

interface AppealReviewModalProps {
  isOpen: boolean;
  entry: BlacklistEntryDto | null;
  onClose: () => void;
  onRespond: (approved: boolean, responseMessage: string) => Promise<void>;
}

export function AppealReviewModal({
  isOpen,
  entry,
  onClose,
  onRespond,
}: AppealReviewModalProps) {
  const [responseMessage, setResponseMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !entry) return null;

  const handleResponse = async (approved: boolean) => {
    setError("");

    if (!responseMessage.trim()) {
      setError("Please provide a response message");
      return;
    }

    try {
      setIsLoading(true);
      await onRespond(approved, responseMessage.trim());
      setResponseMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to process appeal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResponseMessage("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Review Appeal
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="mb-4 rounded-lg bg-card-secondary-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              {entry.blockedUser ? (
                <>
                  <p className="font-medium text-foreground">
                    {entry.blockedUser.firstName} {entry.blockedUser.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.blockedUser.email}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">{entry.blockedEmail}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Original Blacklist Reason */}
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
            Original Blacklist Reason
          </h4>
          <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">
            {entry.reason}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Blocked on {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Appeal Message */}
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
            User's Appeal
          </h4>
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-foreground">
            {entry.appealMessage || "No message provided"}
          </p>
          {entry.appealedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted on {format(new Date(entry.appealedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        {/* Response Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Your Response
          </label>
          <textarea
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder="Provide a response explaining your decision..."
            className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{error && <span className="text-red-500">{error}</span>}</span>
            <span>{responseMessage.length}/500</span>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 rounded-lg bg-amber-500/10 p-3">
          <p className="text-xs text-amber-200">
            <strong>Warning:</strong> Denying this appeal will result in a permanent ban.
            The user will not be able to appeal again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleResponse(false)}
            disabled={isLoading || !responseMessage.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Deny Appeal
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={isLoading || !responseMessage.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Appeal
          </button>
        </div>
      </div>
    </div>
  );
}
