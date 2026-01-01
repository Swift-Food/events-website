"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { EventResponseDto } from "@/types/event";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import EventPreviewModal from "@/components/EventPreviewModal";

interface EventsTimelineProps {
  events: EventResponseDto[];
  /** Whether clicking opens a modal preview (true) or navigates directly (false) */
  enablePreviewModal?: boolean;
  /** Whether to link to management page instead of public event page */
  linkToManagement?: boolean;
  /** Top position for sticky headers (e.g., "top-36" or "top-20") */
  stickyTopClass?: string;
  /** Root margin for intersection observer (adjusts when headers become "stuck") */
  observerRootMargin?: string;
}

export default function EventsTimeline({
  events,
  enablePreviewModal = true,
  linkToManagement = false,
  stickyTopClass = "top-36",
  observerRootMargin = "-144px 0px 0px 0px",
}: EventsTimelineProps) {
  // Track which date headers are stuck
  const [stuckHeaders, setStuckHeaders] = useState<Set<string>>(new Set());
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Group events by date (preserving order received from API)
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, EventResponseDto[]>();

    (events ?? []).forEach((event) => {
      const date = new Date(event.startDateTime);
      const dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return Array.from(groups.entries());
  }, [events]);

  // Intersection observer to detect when headers become stuck
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const dateKey = entry.target.getAttribute("data-date-key");
          if (dateKey) {
            setStuckHeaders((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.delete(dateKey);
              } else {
                next.add(dateKey);
              }
              return next;
            });
          }
        });
      },
      {
        rootMargin: observerRootMargin,
        threshold: 0,
      }
    );

    sentinelRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [groupedEvents, observerRootMargin]);

  const handleEventClick = (_e: React.MouseEvent, event: EventResponseDto) => {
    if (enablePreviewModal) {
      setSelectedEventId(event.id);
    }
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        {groupedEvents.map(([dateKey, dateEvents]) => {
          const firstEventDate = new Date(dateEvents[0].startDateTime);
          const monthAbbrev = firstEventDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const dayNum = firstEventDate.getDate();
          const dayName = firstEventDate.toLocaleDateString("en-US", {
            weekday: "long",
          });

          return (
            <div key={dateKey} className="relative flex">
              {/* Timeline column - continuous line */}
              <div className="hidden sm:block sm:w-8 relative">
                {/* Continuous line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/20" />
                {/* Dot positioned at header level */}
                <div className={`sticky ${stickyTopClass} z-40 flex h-8 items-center justify-center`}>
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${
                      stuckHeaders.has(dateKey)
                        ? "bg-primary"
                        : "bg-muted-foreground"
                    }`}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-8">
                {/* Sentinel for detecting stuck state */}
                <div
                  ref={(el) => {
                    if (el) sentinelRefs.current.set(dateKey, el);
                  }}
                  data-date-key={dateKey}
                  className="h-0"
                />

                {/* Sticky Date Header */}
                <div className={`sticky ${stickyTopClass} z-30 pb-3`}>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                      stuckHeaders.has(dateKey)
                        ? "border border-white/10 bg-card-background"
                        : ""
                    }`}
                  >
                    {/* Mobile dot - only show on mobile */}
                    <div
                      className={`h-2 w-2 flex-shrink-0 rounded-full transition-colors sm:hidden ${
                        stuckHeaders.has(dateKey)
                          ? "bg-primary"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {monthAbbrev} {dayNum}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {dayName}
                    </span>
                  </div>
                </div>

                {/* Events for this date */}
                <div className="min-w-0 space-y-3">
                  {dateEvents.map((event) => (
                    <HorizontalEventCard
                      key={event.id}
                      event={event}
                      linkToManagement={linkToManagement}
                      onClick={enablePreviewModal ? handleEventClick : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Preview Modal */}
      {enablePreviewModal && (
        <EventPreviewModal
          eventId={selectedEventId}
          isOpen={!!selectedEventId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
