"use client";

import { Plus } from "lucide-react";

interface InvitationsSectionProps {
  onInviteClick: () => void;
}

export function InvitationsSection({ onInviteClick }: InvitationsSectionProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card-background border border-white/5 px-5 py-4">
      <div className="flex-1">
        <div className="flex items-center justify-between md:block">
          <h3 className="text-sm font-semibold text-foreground">Invitations</h3>
          <button
            onClick={onInviteClick}
            className="flex md:hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Invite
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Invite guests via CSV upload (auto-sends invitations) or shareable invitation link.
        </p>
      </div>
      <button
        onClick={onInviteClick}
        className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 shrink-0 ml-4"
      >
        <Plus className="h-4 w-4" />
        Invite Guests
      </button>
    </div>
  );
}
