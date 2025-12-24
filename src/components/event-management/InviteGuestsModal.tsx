"use client";

import { X, FileSpreadsheet, Link as LinkIcon } from "lucide-react";

interface InviteGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCsv: () => void;
  onSelectLink: () => void;
}

export function InviteGuestsModal({
  isOpen,
  onClose,
  onSelectCsv,
  onSelectLink,
}: InviteGuestsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Invite Guests</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Choose how you&apos;d like to invite guests to your event.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onSelectCsv();
            }}
            className="w-full flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
              <FileSpreadsheet className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-foreground">Upload CSV</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Bulk upload approved invitee emails from a CSV file
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectLink();
            }}
            className="w-full flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
              <LinkIcon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="font-medium text-foreground">Generate Invite Link</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Create a shareable link for guests to register
              </p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
