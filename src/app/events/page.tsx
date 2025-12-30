"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { eventsApi } from "@/services/events";
import { calendarsApi } from "@/services/calendars";
import { EventListResponseDto, EventResponseDto } from "@/types/event";
import { Calendar as CalendarType } from "@/types/calendar";
import { Search, Calendar, ChevronLeft, ChevronRight, X, ChevronRight as ArrowRight } from "lucide-react";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import CalendarCard from "@/components/CalendarCard";
import HorizontalCalendarCard from "@/components/HorizontalCalendarCard";
import EventPreviewModal from "@/components/EventPreviewModal";
import Link from "next/link";

export default function EventCataloguePage() {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Track which date headers are stuck
  const [stuckHeaders, setStuckHeaders] = useState<Set<string>>(new Set());
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Calendars state
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);

  const eventsPerPage = 12;

  // Fetch calendars
  const fetchCalendars = async () => {
    try {
      setLoadingCalendars(true);
      const result = await calendarsApi.findAll({
        isPublic: true,
        take: 10, // Show top 10 calendars
      });
      setCalendars(result.calendars ?? []);
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    } finally {
      setLoadingCalendars(false);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: EventListResponseDto = await eventsApi.findAll({
        search: searchTerm || undefined,
        skip: (currentPage - 1) * eventsPerPage,
        take: eventsPerPage,
      });

      setEvents(result.events ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search changes (skip initial render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch calendars on mount
  useEffect(() => {
    fetchCalendars();
  }, []);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [searchTerm, currentPage]);

  const totalPages = Math.ceil(total / eventsPerPage);

  // Calculate range for display
  const startIndex = (currentPage - 1) * eventsPerPage + 1;
  const endIndex = Math.min(currentPage * eventsPerPage, total);

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

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveSearch = !!searchTerm;

  const handleEventClick = (e: React.MouseEvent, event: EventResponseDto) => {
    setSelectedEventId(event.id);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

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
        rootMargin: "-80px 0px 0px 0px",
        threshold: 0,
      }
    );

    sentinelRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [groupedEvents]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Discover Events
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Find and join exciting events happening around you
          </p>
        </div>

        {/* Calendars Section */}
        {!loadingCalendars && calendars.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Browse Calendars
              </h2>
              <Link
                href="/calendars"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Mobile: Horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {calendars.slice(0, 5).map((calendar) => (
                <div key={calendar.id} className="flex-shrink-0 w-[80vw]">
                  <HorizontalCalendarCard calendar={calendar} />
                </div>
              ))}
            </div>
            {/* Desktop: 3-column grid */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3">
              {calendars.slice(0, 3).map((calendar) => (
                <CalendarCard key={calendar.id} calendar={calendar} />
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-card-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {hasActiveSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading events..."
            ) : total > 0 ? (
              <>
                Showing {startIndex}-{endIndex} of {total} event
                {total !== 1 ? "s" : ""}
              </>
            ) : (
              "No events found"
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No events found
            </h3>
            <p className="text-muted-foreground">
              {hasActiveSearch
                ? "Try adjusting your search terms"
                : "Check back later for new events"}
            </p>
            {hasActiveSearch && (
              <button
                onClick={clearSearch}
                className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Events Grouped by Date */}
        {!loading && !error && events.length > 0 && (
          <div>
            {groupedEvents.map(([dateKey, dateEvents], index) => {
              const firstEventDate = new Date(dateEvents[0].startDateTime);
              const monthAbbrev = firstEventDate.toLocaleDateString("en-US", {
                month: "short",
              });
              const dayNum = firstEventDate.getDate();
              const dayName = firstEventDate.toLocaleDateString("en-US", {
                weekday: "long",
              });
              const isLast = index === groupedEvents.length - 1;

              return (
                <div key={dateKey} className="relative flex">
                  {/* Timeline column - continuous line */}
                  <div className="hidden sm:block sm:w-8 relative">
                    {/* Continuous line */}
                    {!isLast && (
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/20" />
                    )}
                    {/* Dot positioned at header level */}
                    <div className="sticky top-20 z-40 flex h-8 items-center justify-center">
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
                    <div className="sticky top-20 z-30 pb-3">
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
                          onClick={handleEventClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-card-background text-foreground transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "border-primary bg-primary text-white"
                        : "border-white/10 bg-card-background text-foreground hover:border-white/20"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-card-background text-foreground transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
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
