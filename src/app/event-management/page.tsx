"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventService } from "@/services/event.service";
import { EventResponseDto } from "@/types/event";
import { Calendar, Plus, Loader2, Users, History } from "lucide-react";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import Link from "next/link";

type TabType = "upcoming" | "past";

export default function EventManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  // Track which date headers are stuck
  const [stuckHeaders, setStuckHeaders] = useState<Set<string>>(new Set());
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch events
  const fetchEvents = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const result = await eventService.getManagedEvents();
      setEvents(result.events ?? []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load your events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  // Filter events based on active tab
  const now = new Date();

  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.startDateTime) > now),
    [events]
  );

  const pastEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.startDateTime) <= now)
        .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()),
    [events]
  );

  const currentEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, EventResponseDto[]>();

    currentEvents.forEach((event) => {
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
  }, [currentEvents]);

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

  const tabs = [
    {
      id: "upcoming" as TabType,
      label: "Upcoming",
      icon: <Users className="h-4 w-4" />,
      count: upcomingEvents.length,
    },
    {
      id: "past" as TabType,
      label: "Past",
      icon: <History className="h-4 w-4" />,
      count: pastEvents.length,
    },
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Manage Events
            </h1>
            <p className="mt-2 text-md text-muted-foreground">
              View and manage your hosted events
            </p>
          </div>
          <Link
            href="/event-creation"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Event</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-card-secondary-background text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading events..."
            ) : currentEvents.length > 0 ? (
              <>
                {currentEvents.length} {activeTab} event
                {currentEvents.length !== 1 ? "s" : ""}
              </>
            ) : (
              `No ${activeTab} events`
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
        {!loading && !error && currentEvents.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === "upcoming"
                ? "No upcoming events"
                : "No past events"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === "upcoming"
                ? "You don't have any upcoming events. Create one to get started!"
                : "You haven't hosted any events that have ended yet."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/event-creation"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
            )}
          </div>
        )}

        {/* Events Grouped by Date */}
        {!loading && !error && currentEvents.length > 0 && (
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
                          isHostedEvent={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
