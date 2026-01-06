"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { eventsApi } from "@/services/events";
import { EventResponseDto, EventListResponseDto, EventStatus } from "@/types/event";
import { OrganizerProfile } from "@/types/organizer";
import EventsTimeline from "@/components/EventsTimeline";
import { User, Calendar } from "lucide-react";

type EventTab = "upcoming" | "past";

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
  const [activeTab, setActiveTab] = useState<EventTab>("upcoming");

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

  // Filter events based on active tab
  // Upcoming: endDateTime >= now (includes ongoing events), sorted ascending
  // Past: endDateTime < now, sorted descending (most recent first)
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const filtered = events.filter((event) => {
      const endDate = new Date(event.endDateTime);
      if (activeTab === "upcoming") {
        return endDate >= now;
      } else {
        return endDate < now;
      }
    });

    // Sort: upcoming ascending (soonest first), past descending (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.startDateTime).getTime();
      const dateB = new Date(b.startDateTime).getTime();
      return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
    });
  }, [events, activeTab]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return events.filter((event) => new Date(event.endDateTime) >= now).length;
  }, [events]);

  const pastCount = useMemo(() => {
    const now = new Date();
    return events.filter((event) => new Date(event.endDateTime) < now).length;
  }, [events]);

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
        includePast: true,
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
        includePast: true,
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
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Events by {displayName}
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              Upcoming{!loading && ` (${upcomingCount})`}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "past"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              Past{!loading && ` (${pastCount})`}
            </button>
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
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {events.length === 0
                  ? "No events yet"
                  : activeTab === "upcoming"
                  ? "No upcoming events"
                  : "No past events"}
              </h3>
              <p className="text-muted-foreground">
                {events.length === 0
                  ? "This organizer hasn't published any events yet."
                  : activeTab === "upcoming"
                  ? "Check back later for new events."
                  : "This organizer hasn't had any past events."}
              </p>
            </div>
          )}

          {/* Events Timeline */}
          {!loading && !error && filteredEvents.length > 0 && (
            <EventsTimeline events={filteredEvents} stickyTopClass="top-20"/>
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
          {!loading && !hasMore && filteredEvents.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              You&apos;ve reached the end
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
