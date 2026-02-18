"use client";

import { useState, useEffect, useRef, useCallback, useMemo, use } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import { EventResponseDto } from "@/types/event";
import { Search, X, Calendar, MapPin, ArrowLeft } from "lucide-react";
import EventsTimeline from "@/components/EventsTimeline";
import Link from "next/link";

export default function LocationEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [location, setLocation] = useState<EventLocationResponseDto | null>(null);
  const [allEvents, setAllEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const eventsPerPage = 20;

  // Fetch location details + first page of events
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    pageRef.current = 1;

    try {
      const [locationData, eventsData] = await Promise.all([
        locationsApi.findById(id),
        locationsApi.findEvents(id, { page: 1, limit: eventsPerPage }),
      ]);

      setLocation(locationData);
      const newEvents = eventsData.events ?? [];
      setAllEvents(newEvents);
      setHasMore(eventsData.pagination.page < eventsData.pagination.totalPages);
      pageRef.current = 2;
    } catch (err) {
      console.error("Failed to fetch location events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load more events
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const eventsData = await locationsApi.findEvents(id, {
        page: pageRef.current,
        limit: eventsPerPage,
      });

      const newEvents = eventsData.events ?? [];
      setAllEvents((prev) => [...prev, ...newEvents]);
      setHasMore(eventsData.pagination.page < eventsData.pagination.totalPages);
      pageRef.current += 1;
    } catch (err) {
      console.error("Failed to load more events:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, loadingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreEvents();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMoreEvents]);

  // Client-side search filtering
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return allEvents;
    const term = searchTerm.toLowerCase();
    return allEvents.filter((event) =>
      event.name.toLowerCase().includes(term)
    );
  }, [allEvents, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>
          {location ? (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                  {location.name}
                </h1>
              </div>
              <p className="mt-2 text-sm sm:text-md text-muted-foreground">
                {location.eventCount} upcoming event{location.eventCount !== 1 ? "s" : ""}
              </p>
            </>
          ) : loading ? (
            <>
              <div className="h-8 w-48 bg-card-background rounded animate-pulse" />
              <div className="mt-2 h-5 w-32 bg-card-background rounded animate-pulse" />
            </>
          ) : null}
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-card-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
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
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length > 0
                ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}${searchTerm ? " found" : ""}`
                : "No events found"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchInitial}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">No events found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No upcoming events at this location"}
            </p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Events Timeline */}
        {!loading && !error && filteredEvents.length > 0 && (
          <EventsTimeline events={filteredEvents} stickyTopOffset={60} />
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {/* End of results */}
        {!loading && !hasMore && allEvents.length > 0 && !searchTerm && (
          <p className="text-center text-sm text-muted-foreground py-8">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
