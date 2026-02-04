"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { eventsApi } from "@/services/events";
import { EventResponseDto } from "@/types/event";
import { ChevronRight } from "lucide-react";
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
        // const now = new Date().toISOString();
        const result = await eventsApi.findAll({
          // startDate: now,
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
            <div className="h-6 w-40 skeleton-shimmer mb-2" />
            <div className="h-4 w-60 skeleton-shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-xl" />
          ))}
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
          <h2 className="text-lg font-semibold text-foreground discover-section-header">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href="/events"
          className="view-all-link text-sm text-primary hover:text-primary/80"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Events Grid - 1 column on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.map((event) => (
          <div key={event.id} className="discover-card">
            <HorizontalEventCard
              event={event}
              showDate
              showCategories={false}
              onClick={handleEventClick}
            />
          </div>
        ))}
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
