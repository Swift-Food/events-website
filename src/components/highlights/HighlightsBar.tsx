"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { HighlightResponseDto } from "@/types/highlight";
import HighlightViewer from "./HighlightViewer";

interface HighlightsBarProps {
  highlights: HighlightResponseDto[];
  showAddButton?: boolean;
  onAddClick?: () => void;
  className?: string;
}

export default function HighlightsBar({
  highlights,
  showAddButton = false,
  onAddClick,
  className = "",
}: HighlightsBarProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Calculate time remaining until expiration
  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt){
      return ''
    }
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return null; // Expired

    const hours = Math.floor(diffMs / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m`;
    }
    return `${hours}h`;
  };

  const openViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  if (highlights.length === 0 && !showAddButton) {
    return null;
  }

  return (
    <>
      <div className={`overflow-x-auto ${className}`}>
        <div className="flex gap-4 pb-2">
          {/* Add highlight button (for owners) */}
          {showAddButton && (
            <button
              onClick={onAddClick}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/30 bg-card-secondary-background transition-colors hover:border-primary hover:bg-primary/10">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Add</span>
            </button>
          )}

          {/* Highlight items */}
          {highlights.map((highlight, index) => {
            const timeRemaining = getTimeRemaining(highlight.expiresAt);
            const firstMedia = highlight.mediaItems[0];
            const thumbnailUrl =
              firstMedia?.type === "video" && firstMedia?.thumbnailUrl
                ? firstMedia.thumbnailUrl
                : firstMedia?.url;

            return (
              <button
                key={highlight.id}
                onClick={() => openViewer(index)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className="relative">
                  {/* Gradient ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 p-[2px]">
                    <div className="h-full w-full rounded-full bg-background p-[2px]">
                      <div className="h-full w-full rounded-full bg-card-secondary-background" />
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 overflow-hidden rounded-full p-[3px]">
                    <div className="h-full w-full overflow-hidden rounded-full">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-card-secondary-background">
                          <span className="text-lg font-semibold text-muted-foreground">
                            {highlight.owner?.organizationName?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media count badge */}
                  {highlight.mediaItems.length > 1 && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                      {highlight.mediaItems.length}
                    </div>
                  )}
                </div>

                {/* Time remaining label */}
                <span className="text-xs text-muted-foreground">
                  {timeRemaining || ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Highlight Viewer Modal */}
      {viewerOpen && highlights.length > 0 && (
        <HighlightViewer
          highlights={highlights}
          initialHighlightIndex={selectedIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
