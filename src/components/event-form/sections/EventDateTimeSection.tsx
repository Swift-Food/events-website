"use client";

import DateTimePicker from "@/components/ui/DateTimePicker";
import { useEventCreation } from "@/context/EventCreationContext";

interface EventDateTimeSectionProps {
  startError?: string;
  endError?: string;
  onClearStartError?: () => void;
  onClearEndError?: () => void;
  startRef?: React.RefObject<HTMLDivElement | null>;
  endRef?: React.RefObject<HTMLDivElement | null>;
}

export default function EventDateTimeSection({
  startError,
  endError,
  onClearStartError,
  onClearEndError,
  startRef,
  endRef,
}: EventDateTimeSectionProps) {
  const { start, setStart, end, setEnd, externalEventUrl } = useEventCreation();

  return (
    <div className="rounded-xl backdrop-blur-xl pl-4 py-4">
      <div className="flex gap-5">
        <div className="flex flex-col items-center py-3">
          <div className="h-3.5 w-3.5 rounded-full bg-primary"></div>
          <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
          <div className="h-3.5 w-3.5 rounded-full bg-primary/30"></div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div
            ref={startRef}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label
              className={`text-sm font-medium sm:w-14 ${startError ? "text-red-400" : "text-muted-foreground"}`}
            >
              Start
            </label>
            <div className="flex-1">
              <DateTimePicker
                value={start}
                onChange={(value) => {
                  setStart(value);
                  if (startError && onClearStartError) {
                    onClearStartError();
                  }
                }}
                minDate={externalEventUrl ? undefined : new Date()}
                error={!!startError}
                placeholder="Select start date & time"
              />
              {startError && (
                <p className="text-xs text-red-400 mt-1">{startError}</p>
              )}
            </div>
          </div>

          <div
            ref={endRef}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label
              className={`text-sm font-medium sm:w-14 ${endError ? "text-red-400" : "text-muted-foreground"}`}
            >
              End
            </label>
            <div className="flex-1">
              <DateTimePicker
                value={end}
                onChange={(value) => {
                  setEnd(value);
                  if (endError && onClearEndError) {
                    onClearEndError();
                  }
                }}
                error={!!endError}
                placeholder="Select end date & time"
              />
              {endError && (
                <p className="text-xs text-red-400 mt-1">{endError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
