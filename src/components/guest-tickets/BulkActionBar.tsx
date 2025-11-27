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
      <div className="sticky top-4 z-40 mb-6 flex items-center justify-between rounded-2xl bg-primary p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 font-bold text-primary-foreground">
            {selectedCount}
          </div>
          <p className="font-medium text-primary-foreground">
            {selectedCount} guest{selectedCount !== 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve All
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <XCircle className="h-4 w-4" />
            Reject All
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl bg-primary-foreground/20 p-2.5 text-primary-foreground transition-colors hover:bg-primary-foreground/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card-secondary-background p-6">
            <h3 className="mb-4 text-xl font-bold text-foreground">
              Reject Selected Guests
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to reject {selectedCount} guest
              {selectedCount !== 1 ? "s" : ""}? You can optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="mb-4 w-full rounded-xl bg-input-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl bg-card-secondary-background px-4 py-3 font-medium text-foreground transition-colors hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};