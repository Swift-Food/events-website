"use client";

import { forwardRef } from "react";
import { Trash2 } from "lucide-react";
import { useEventCreation } from "@/context/EventCreationContext";

interface EventNameInputProps {
  error?: string;
  onClearError?: () => void;
  showClearButton?: boolean;
  onClear?: () => void;
}

const EventNameInput = forwardRef<HTMLInputElement, EventNameInputProps>(
  ({ error, onClearError, showClearButton, onClear }, ref) => {
    const { eventName, setEventName } = useEventCreation();

    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <input
            ref={ref}
            type="text"
            value={eventName}
            onChange={(e) => {
              setEventName(e.target.value.slice(0, 80));
              if (error && onClearError) {
                onClearError();
              }
            }}
            placeholder="Event Name"
            maxLength={80}
            className={`w-full bg-transparent text-3xl md:text-5xl font-bold text-foreground outline-none placeholder:text-muted-foreground/90 ${error ? "text-red-400 placeholder:text-red-400/40" : ""}`}
          />
          <div
            className={`text-xs ${error ? "text-red-400" : eventName.length >= 80 ? "text-amber-400" : "text-muted-foreground"}`}
          >
            {error || `${eventName.length}/80 characters`}
          </div>
        </div>
        {showClearButton && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Clear form"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  },
);

EventNameInput.displayName = "EventNameInput";

export default EventNameInput;
