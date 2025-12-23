import { CheckCircle2, XCircle, X } from "lucide-react";
import { useState } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export const BulkActionBar = ({
  selectedCount,
  onApprove,
  onReject,
  onCancel,
}: BulkActionBarProps) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    onReject();
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <>
      <div className="sticky top-4 z-40 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {selectedCount}
          </div>
          <p className="text-sm font-medium text-foreground">
            {selectedCount} guest{selectedCount !== 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onApprove}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Approve All</span>
            <span className="sm:hidden">Approve</span>
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reject All</span>
            <span className="sm:hidden">Reject</span>
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg bg-white/10 p-1.5 text-muted-foreground transition-colors hover:bg-white/20 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card-background border border-white/5 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">
                Reject Selected Guests
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to reject {selectedCount} guest
              {selectedCount !== 1 ? "s" : ""}? You can optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="mb-4 w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};