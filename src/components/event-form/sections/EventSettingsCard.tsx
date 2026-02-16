"use client";

import { useState } from "react";
import { Ticket, Lock, UserCheck, ExternalLink, ChevronDown } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";

interface EventSettingsCardProps {
  isCreateMode: boolean;
}

export default function EventSettingsCard({
  isCreateMode,
}: EventSettingsCardProps) {
  const { isPrivate, setIsPrivate, requireApproval, setRequireApproval, externalEventUrl, setExternalEventUrl } =
    useEventCreation();
  const [isExternalUrlExpanded, setIsExternalUrlExpanded] = useState(!!externalEventUrl);

  return (
    <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-1">
      {/* Tickets info - Create mode only */}
      {isCreateMode && (
        <div className="flex items-start gap-2.5">
          <Ticket className="h-4 w-4 text-muted-foreground mt-2.5 flex-shrink-0" />
          <div className="flex-1 py-2 border-b border-foreground/10 -mr-4 pr-4">
            <p className="text-sm font-medium text-foreground">Tickets</p>
            <p className="text-xs text-muted-foreground">
              Default &quot;General Admission&quot; ticket · Edit after creating
            </p>
          </div>
        </div>
      )}

      {/* External Ticketing URL */}
      <div className="flex items-start gap-2.5">
        <ExternalLink className="h-4 w-4 text-muted-foreground mt-2.5 flex-shrink-0" />
        <div className="flex-1 py-2 border-b border-foreground/10 -mr-4 pr-4">
          <button
            type="button"
            onClick={() => setIsExternalUrlExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">External Ticketing URL</p>
              {!isExternalUrlExpanded && !externalEventUrl && (
                <p className="text-xs text-muted-foreground">
                  Selling tickets on another platform?
                </p>
              )}
              {!isExternalUrlExpanded && externalEventUrl && (
                <p className="text-xs text-primary truncate max-w-[250px]">
                  {externalEventUrl}
                </p>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isExternalUrlExpanded ? "rotate-180" : ""}`}
            />
          </button>
          {isExternalUrlExpanded && (
            <div className="mt-2">
              <input
                type="url"
                value={externalEventUrl}
                onChange={(e) => setExternalEventUrl(e.target.value)}
                className="w-full rounded-lg bg-card-secondary-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
                placeholder="https://eventbrite.com/e/your-event"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Attendees will be redirected to this URL to purchase tickets.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Private Event Toggle */}
      <div className="flex items-center gap-2.5">
        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2 border-b border-foreground/10 -mr-4 pr-4">
          <p className="text-sm font-medium text-foreground">Private Event</p>
          <button
            type="button"
            onClick={() => setIsPrivate((prev) => !prev)}
            className={`h-5 w-10 rounded-full transition-all ${isPrivate ? "bg-primary" : "bg-card-secondary-background"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full transition-all ${isPrivate ? "translate-x-5.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"}`}
            />
          </button>
        </div>
      </div>

      {/* Require Approval Toggle */}
      <div className="flex items-center gap-2.5">
        <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2">
          <p className="text-sm font-medium text-foreground">
            Require Approval
          </p>
          <button
            type="button"
            onClick={() => setRequireApproval((prev) => !prev)}
            className={`h-5 w-10 rounded-full transition-all ${requireApproval ? "bg-primary" : "bg-card-secondary-background"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full transition-all ${requireApproval ? "translate-x-5.5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
