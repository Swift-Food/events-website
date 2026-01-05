"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { eventsApi } from "@/services/events";
import { EventResponseDto, EventListResponseDto, EventStatus } from "@/types/event";
import { OrganizerProfile } from "@/types/organizer";
import EventsTimeline from "@/components/EventsTimeline";
import { User, Calendar } from "lucide-react";

interface OrganizerProfileClientProps {
  initialProfile: OrganizerProfile;
  userId: string;
}

export default function OrganizerProfileClient({
  initialProfile,
  userId,
}: OrganizerProfileClientProps) {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);
  const eventsPerPage = 12;

  const displayName =
    initialProfile.organizationName ||
    [initialProfile.firstName, initialProfile.lastName]
      .filter(Boolean)
      .join(" ") ||
    initialProfile.user?.username ||
    "Organizer";

  const profileImage = initialProfile.profilePicture || initialProfile.user?.profilePicture;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    skipRef.current = 0;

    try {
      const result: EventListResponseDto = await eventsApi.findByOwnerId(userId, {
        status: EventStatus.PUBLISHED,
        sortBy: "startDateTime",
        sortOrder: "asc",
        skip: 0,
        take: eventsPerPage,
      });

      const newEvents = result.events ?? [];
      setEvents(newEvents);
      setTotal(result.total ?? 0);
      setHasMore(
        newEvents.length === eventsPerPage &&
          newEvents.length < (result.total ?? 0)
      );
      skipRef.current = newEvents.length;
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result: EventListResponseDto = await eventsApi.findByOwnerId(userId, {
        status: EventStatus.PUBLISHED,
        sortBy: "startDateTime",
        sortOrder: "asc",
        skip: skipRef.current,
        take: eventsPerPage,
      });

      const newEvents = result.events ?? [];
      setEvents((prev) => [...prev, ...newEvents]);
      setHasMore(
        newEvents.length === eventsPerPage &&
          skipRef.current + newEvents.length < (result.total ?? 0)
      );
      skipRef.current += newEvents.length;
    } catch (err) {
      console.error("Failed to load more events:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, loadingMore, hasMore]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {displayName}
              </h1>
              {initialProfile.organizationName &&
                initialProfile.user?.username && (
                  <p className="text-sm text-muted-foreground">
                    @{initialProfile.user.username}
                  </p>
                )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {initialProfile.totalEventsCreated}
                    </span>{" "}
                    events created
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Events by {displayName}
            </h2>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {total} event{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
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
                No events yet
              </h3>
              <p className="text-muted-foreground">
                This organizer hasn&apos;t published any events yet.
              </p>
            </div>
          )}

          {/* Events Timeline */}
          {!loading && !error && events.length > 0 && (
            <EventsTimeline events={events} stickyTopClass="top-20"/>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          )}

          {/* End of results */}
          {!loading && !hasMore && events.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              You&apos;ve reached the end
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
