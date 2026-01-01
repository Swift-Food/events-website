"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { eventsApi } from "@/services/events";
import { EventResponseDto } from "@/types/event";
import { Calendar, ChevronRight } from "lucide-react";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import EventPreviewModal from "@/components/EventPreviewModal";

interface UpcomingEventsSectionProps {
  title?: string;
  subtitle?: string;
  maxEvents?: number;
}

export default function UpcomingEventsSection({
  title = "Upcoming Events",
  subtitle = "Don't miss out on these exciting events",
  maxEvents = 6,
}: UpcomingEventsSectionProps) {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const result = await eventsApi.findAll({
          startDate: now,
          sortBy: "startDateTime",
          sortOrder: "asc",
          take: maxEvents,
        });
        setEvents(result.events ?? []);
      } catch (err) {
        console.error("Failed to fetch upcoming events:", err);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [maxEvents]);

  // Group events by date
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

  const handleEventClick = (_e: React.MouseEvent, event: EventResponseDto) => {
    setSelectedEventId(event.id);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

  // Don't render if loading or error or no events
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href="/events"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Events Timeline */}
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
              {/* Timeline column */}
              <div className="hidden sm:block sm:w-8 relative">
                {/* Continuous line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/20" />
                {/* Dot */}
                <div className="flex h-8 items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-6">
                {/* Date Header */}
                <div className="pb-3">
                  <div className="inline-flex items-center gap-2">
                    {/* Mobile dot */}
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground sm:hidden" />
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
                      onClick={handleEventClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Events Button */}
      <div className="mt-6 text-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-white/20 hover:bg-card-background/80"
        >
          <Calendar className="h-4 w-4" />
          View All Events
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Event Preview Modal */}
      <EventPreviewModal
        eventId={selectedEventId}
        isOpen={!!selectedEventId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
