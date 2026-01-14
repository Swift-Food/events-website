"use client";

import { useState } from "react";
import { ExternalLink, AlertTriangle, X } from "lucide-react";

interface ExternalLinkConfirmModalProps {
  url: string;
  onClose: () => void;
}

export default function ExternalLinkConfirmModal({
  url,
  onClose,
}: ExternalLinkConfirmModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleProceed = () => {
    setIsNavigating(true);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  // Extract domain for display
  let displayDomain = "";
  try {
    const parsedUrl = new URL(url);
    displayDomain = parsedUrl.hostname;
  } catch {
    displayDomain = url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-card-background p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
          External Website
        </h3>

        {/* Description */}
        <p className="mb-4 text-center text-sm text-muted-foreground">
          You are about to leave Prismo and navigate to an external website. We
          cannot guarantee the safety or content of external sites.
        </p>

        {/* URL display */}
        <div className="mb-6 rounded-lg bg-background/50 p-3">
          <p className="mb-1 text-xs text-muted-foreground">
            You will be redirected to:
          </p>
          <p className="break-all text-sm font-medium text-foreground">
            {displayDomain}
          </p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={isNavigating}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" />
            {isNavigating ? "Opening..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
