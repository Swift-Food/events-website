"use client";

import { MapPin, Video, Pencil, Trash2 } from "lucide-react";

// Platform detection for virtual meeting URLs
const detectPlatform = (url: string): { name: string; icon: string } => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("zoom.us")) return { name: "Zoom", icon: "🎥" };
  if (lowerUrl.includes("meet.google.com")) return { name: "Google Meet", icon: "📹" };
  if (lowerUrl.includes("teams.microsoft.com")) return { name: "Microsoft Teams", icon: "💼" };
  if (lowerUrl.includes("webex.com")) return { name: "Webex", icon: "🌐" };
  return { name: "Virtual Meeting", icon: "🔗" };
};

// Truncate URL for display
const truncateUrl = (url: string, maxLength: number = 40): string => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};

interface VenueCardProps {
  venueName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  hideFullAddress: boolean;
  onToggleHideAddress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function VenueCard({
  venueName,
  addressLine1,
  addressLine2,
  city,
  postcode,
  hideFullAddress,
  onToggleHideAddress,
  onEdit,
  onDelete,
}: VenueCardProps) {
  // Build address summary
  const addressParts = [addressLine1, addressLine2, city, postcode].filter(Boolean);
  const addressSummary = addressParts.join(", ");
  const displayName = venueName || addressLine1;

  return (
    <div className="rounded-xl bg-card-background/60 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="p-4">
        {/* Header with venue info and actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {displayName}
              </p>
              {venueName && addressLine1 !== venueName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {addressSummary}
                </p>
              )}
              {!venueName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[city, postcode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Edit venue"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-muted-foreground hover:text-red-400"
              aria-label="Delete venue"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hide address toggle */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          <div>
            <p className="text-sm font-medium text-foreground">
              Hide until registered
            </p>
            <p className="text-xs text-muted-foreground">
              Only reveal address after sign-up
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleHideAddress}
            className={`h-6 w-11 rounded-full transition-all ${
              hideFullAddress
                ? "bg-primary"
                : "bg-card-secondary-background"
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full transition-all ${
                hideFullAddress
                  ? "translate-x-5 bg-primary-foreground"
                  : "translate-x-0.5 bg-foreground"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

interface VirtualLinkCardProps {
  virtualMeetingUrl: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function VirtualLinkCard({
  virtualMeetingUrl,
  onEdit,
  onDelete,
}: VirtualLinkCardProps) {
  const platform = detectPlatform(virtualMeetingUrl);

  return (
    <div className="rounded-xl bg-card-background/60 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="p-4">
        {/* Header with link info and actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Video className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {platform.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {truncateUrl(virtualMeetingUrl)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Edit virtual link"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-muted-foreground hover:text-red-400"
              aria-label="Delete virtual link"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
