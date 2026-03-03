"use client";

import { useState, useEffect, useRef, useCallback, useMemo, use } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import { EventResponseDto } from "@/types/event";
import { Search, X, Calendar } from "lucide-react";
import EventsTimeline from "@/components/EventsTimeline";
import Image from "next/image";

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
      {/* Banner Section - full width until lg, then constrained */}
      <div className="mx-auto lg:max-w-5xl lg:px-6 mb-6">
        <div className="relative aspect-[2/1] w-full overflow-hidden lg:rounded-2xl bg-card-background">
          {/* Background - Banner Image */}
          {location?.bannerImage && (
            <Image
              src={location.bannerImage}
              alt={`${location.name} banner`}
              fill
              className="object-cover"
              priority
            />
          )}
          {/* Left blur overlay - fading gradient */}
          <div className="absolute inset-0 backdrop-blur-xl [mask-image:linear-gradient(to_right,black_20%,transparent_60%)]" />
          <div className="absolute inset-0 bg-black/40 [mask-image:linear-gradient(to_right,black_10%,transparent_50%)]" />
          {/* Text content */}
          <div className="relative z-10 flex flex-col justify-end h-full px-5 sm:px-8 pb-6 sm:pb-10 max-w-[60%]">
            {location ? (
              <>
                {/* Location Image */}
                {location.image && (
                  <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-lg overflow-hidden border-2 border-white/20 mb-3">
                    <Image
                      src={location.image}
                      alt={location.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-xs sm:text-sm text-white/60 mb-0.5">
                  What&apos;s Happening in
                </p>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
                  {location.name}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-white/50">
                  {location.eventCount} upcoming event{location.eventCount !== 1 ? "s" : ""}
                </p>
              </>
            ) : loading ? (
              <>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 animate-pulse mb-3" />
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                <div className="mt-3 h-4 w-24 bg-white/10 rounded animate-pulse" />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-8">

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
