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
  /** Sticky top offset in pixels for date headers */
  stickyTopOffset?: number;
}

export default function EventsTimeline({
  events,
  enablePreviewModal = true,
  linkToManagement = false,
  stickyTopOffset = 8,
}: EventsTimelineProps) {
  const stickyStyle = useMemo(() => ({ top: stickyTopOffset }), [stickyTopOffset]);
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

  // Find the scroll container (nearest ancestor with overflow-y: auto/scroll)
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Detect stuck headers using IntersectionObserver rooted in the scroll container
  useEffect(() => {
    // Find the scroll container from the first sentinel
    const firstSentinel = sentinelRefs.current.values().next().value;
    if (firstSentinel && !scrollContainerRef.current) {
      let el: HTMLElement | null = firstSentinel.parentElement;
      while (el) {
        const style = getComputedStyle(el);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          scrollContainerRef.current = el;
          break;
        }
        el = el.parentElement;
      }
    }

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
        root: scrollContainerRef.current,
        rootMargin: `-${stickyTopOffset}px 0px 0px 0px`,
        threshold: 0,
      }
    );

    sentinelRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [groupedEvents, stickyTopOffset]);

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
                <div className="sticky z-10 flex h-8 items-center justify-center" style={stickyStyle}>
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
                <div className="sticky z-10 pb-3" style={stickyStyle}>
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
                    <span className="text-sm font-medium text-muted-foreground">
                      {monthAbbrev} {dayNum}
                    </span>
                    <span className="text-sm text-muted-foreground/60">
                      {dayName}
                    </span>
                  </div>
                </div>

                {/* Events for this date */}
                <div className="min-w-0">
                  {dateEvents.map((event, index) => (
                    <div key={event.id}>
                      <HorizontalEventCard
                        event={event}
                        linkToManagement={linkToManagement}
                        onClick={enablePreviewModal ? handleEventClick : undefined}
                      />
                      {index < dateEvents.length - 1 && (
                        <div className="ml-[104px] sm:ml-[120px] border-b border-white/10" />
                      )}
                    </div>
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
