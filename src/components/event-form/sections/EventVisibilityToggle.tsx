"use client";

import { Eye, EyeOff } from "lucide-react";
import { EventStatus } from "@/types";

interface EventVisibilityToggleProps {
  eventStatus?: EventStatus;
  onPublishToggle?: () => void;
  isPublishLoading?: boolean;
}

export default function EventVisibilityToggle({
  eventStatus,
  onPublishToggle,
  isPublishLoading,
}: EventVisibilityToggleProps) {
  if (!onPublishToggle) return null;

  return (
    <div className="rounded-xl bg-card-background backdrop-blur-xl p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {eventStatus === EventStatus.PUBLISHED ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
              <Eye className="h-5 w-5 text-green-400" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <EyeOff className="h-5 w-5 text-amber-400" />
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-foreground">
              {eventStatus === EventStatus.PUBLISHED ? "Published" : "Draft"}
            </p>
            <p className="text-sm text-muted-foreground">
              {eventStatus === EventStatus.PUBLISHED
                ? "Visible to everyone"
                : "Only visible to you"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onPublishToggle}
          disabled={isPublishLoading}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            eventStatus === EventStatus.PUBLISHED
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          }`}
        >
          {isPublishLoading
            ? "..."
            : eventStatus === EventStatus.PUBLISHED
              ? "Unpublish"
              : "Publish"}
        </button>
      </div>
    </div>
  );
}
