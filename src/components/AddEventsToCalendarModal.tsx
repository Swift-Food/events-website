"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Plus, Check, Calendar, Loader2, MapPin } from "lucide-react";
import { eventsApi } from "@/services/events";
import { calendarService } from "@/services/calendar.service";
import { EventResponseDto } from "@/types/event";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/lib/auth/authContext";

interface AddEventsToCalendarModalProps {
  calendarId: string;
  calendarName: string;
  existingEventIds: string[];
  onClose: () => void;
  onEventsAdded: () => void;
}

export default function AddEventsToCalendarModal({
  calendarId,
  calendarName,
  existingEventIds,
  onClose,
  onEventsAdded,
}: AddEventsToCalendarModalProps) {
  const { user: currentUser} = useAuth();
  if (!currentUser){
    return null
  }
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedEventIds, setAddedEventIds] = useState<Set<string>>(
    new Set(existingEventIds)
  );
  const [addingEventId, setAddingEventId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const skipRef = useRef(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventsPerPage = 10;

  const fetchEvents = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      skipRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    try {
      // Use authenticated my-events endpoint to include private events
      const result = await eventsApi.findMyEvents({
        search: searchQuery || undefined,
        skip: reset ? 0 : skipRef.current,
        take: eventsPerPage,
        sortBy: "startDateTime",
        sortOrder: "asc",
      });

      const newEvents = result.events ?? [];
      if (reset) {
        setEvents(newEvents);
      } else {
        setEvents((prev) => [...prev, ...newEvents]);
      }
      setTotal(result.total ?? 0);
      setHasMore(
        newEvents.length === eventsPerPage &&
          (reset ? newEvents.length : skipRef.current + newEvents.length) <
            (result.total ?? 0)
      );
      skipRef.current = reset ? newEvents.length : skipRef.current + newEvents.length;
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchEvents(true);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchEvents(true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchEvents]);

  const handleAddEvent = async (eventId: string) => {
    if (addedEventIds.has(eventId)) return;

    try {
      setAddingEventId(eventId);
      await calendarService.addEventToCalendar(calendarId, { eventId });
      setAddedEventIds((prev) => new Set(prev).add(eventId));
      toast.success("Event added to calendar");
      onEventsAdded();
    } catch (error: any) {
      console.error("Failed to add event:", error);
      if (error.response?.status === 409) {
        setAddedEventIds((prev) => new Set(prev).add(eventId));
        toast.info("Event is already in this calendar");
      } else {
        toast.error(error.response?.data?.message || "Failed to add event");
      }
    } finally {
      setAddingEventId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/10 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add Events to Calendar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Search and add events to {calendarName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-2">
              {total} event{total !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "No events match your search" : "No events found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const isAdded = addedEventIds.has(event.id);
                const isAdding = addingEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      isAdded
                        ? "border-primary/30 bg-primary/5"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {/* Event Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-card-secondary-background">
                      {event.eventImage ? (
                        <Image
                          src={event.eventImage}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {event.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(event.startDateTime)} at{" "}
                        {formatTime(event.startDateTime)}
                      </p>
                      {event.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {event.address.city || event.address.addressLine1}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleAddEvent(event.id)}
                      disabled={isAdded || isAdding}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        isAdded
                          ? "bg-primary/20 text-primary cursor-default"
                          : "bg-primary text-white hover:bg-primary/80"
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="h-4 w-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={() => fetchEvents(false)}
                  disabled={loadingMore}
                  className="w-full py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load More Events"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-white/5 px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
