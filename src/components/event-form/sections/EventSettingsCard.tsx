"use client";

import { Ticket, Lock, UserCheck } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";

interface EventSettingsCardProps {
  isCreateMode: boolean;
}

export default function EventSettingsCard({
  isCreateMode,
}: EventSettingsCardProps) {
  const { isPrivate, setIsPrivate, requireApproval, setRequireApproval } =
    useEventCreation();

  return (
    <div className="rounded-xl bg-card-background backdrop-blur-xl px-4 py-1">
      {/* Tickets info - Create mode only */}
      {isCreateMode && (
        <div className="flex items-start gap-2.5">
          <Ticket className="h-4 w-4 text-muted-foreground mt-2.5 flex-shrink-0" />
          <div className="flex-1 py-2 border-b border-foreground/10">
            <p className="text-sm font-medium text-foreground">Tickets</p>
            <p className="text-xs text-muted-foreground">
              Default &quot;General Admission&quot; ticket · Edit after creating
            </p>
          </div>
        </div>
      )}

      {/* Private Event Toggle */}
      <div className="flex items-center gap-2.5">
        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between py-2 border-b border-foreground/10">
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
