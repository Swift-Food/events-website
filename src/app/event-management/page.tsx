"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventService } from "@/services/event.service";
import { calendarService } from "@/services/calendar.service";
import { EventResponseDto } from "@/types/event";
import { Calendar as CalendarType } from "@/types/calendar";
import {
  Calendar,
  CalendarDays,
  Plus,
  Loader2,
  Users,
  History,
  Sparkles,
} from "lucide-react";
import HorizontalCalendarCard from "@/components/HorizontalCalendarCard";
import CalendarCard from "@/components/CalendarCard";
import EventsTimeline from "@/components/EventsTimeline";
import Link from "next/link";

type PrimaryTab = "events" | "calendars";
type EventsFilter = "upcoming" | "past";

export default function EventManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <EventManagementContent />
    </Suspense>
  );
}

function EventManagementContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary tab from URL or default to events
  const tabParam = searchParams.get("tab");
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>(
    tabParam === "calendars" ? "calendars" : "events"
  );

  // Events state
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsFilter, setEventsFilter] = useState<EventsFilter>("upcoming");

  // Calendars state
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [calendarsError, setCalendarsError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Update URL when primary tab changes
  const handlePrimaryTabChange = (tab: PrimaryTab) => {
    setPrimaryTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Fetch calendars
  const fetchCalendars = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingCalendars(true);
      setCalendarsError(null);
      const result = await calendarService.getMyCalendars();
      setCalendars(result ?? []);
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
      setCalendarsError("Failed to load calendars");
    } finally {
      setLoadingCalendars(false);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    if (!isAuthenticated) return;

    setLoadingEvents(true);
    setEventsError(null);
    try {
      const result = await eventService.getManagedEvents();
      setEvents(result.events ?? []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEventsError("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      fetchCalendars();
    }
  }, [isAuthenticated]);

  // Filter events
  const now = new Date();

  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.endDateTime) >= now),
    [events]
  );

  const pastEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.endDateTime) < now)
        .sort(
          (a, b) =>
            new Date(b.endDateTime).getTime() - new Date(a.endDateTime).getTime()
        ),
    [events]
  );

  const filteredEvents =
    eventsFilter === "upcoming" ? upcomingEvents : pastEvents;

  // Counts with 99+ cap
  const formatCount = (count: number) => (count > 99 ? "99+" : count);
  const totalEventsCount = events.length;
  const calendarsCount = calendars.length;

  // Check if initial data is still loading
  const isInitialLoading = loadingEvents || loadingCalendars;

  // Check if both sections are empty (for unified empty state)
  // Only evaluate after loading completes
  const isFullyEmpty =
    !isInitialLoading && events.length === 0 && calendars.length === 0;

  // Loading state for auth
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(to bottom, #41296e 0%, #000000 15%)",
        }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 manage-stagger-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Management
          </h1>
        </div>

        {/* Initial Loading State - before we know if empty or not */}
        {isInitialLoading ? (
          <div className="manage-stagger-2">
            {/* Skeleton for tabs */}
            <div className="mb-8 flex gap-8 border-b border-white/10 pb-3">
              <div className="h-5 w-20 skeleton-shimmer rounded" />
              <div className="h-5 w-24 skeleton-shimmer rounded" />
            </div>
            {/* Skeleton for content */}
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : isFullyEmpty ? (
          /* Unified Empty State - when both events AND calendars are empty */
          <div className="manage-stagger-2">
            <div className="rounded-2xl border border-white/10 bg-card-background/50 backdrop-blur-sm p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                Create your first event
              </h2>
              <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
                Start by creating an event. You can organize them into calendars
                later.
              </p>
              <Link
                href="/event-creation"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Tabs - Underline Style */}
            <div className="mb-8 manage-stagger-2">
              <div className="flex gap-8 border-b border-white/10">
                <button
                  onClick={() => handlePrimaryTabChange("events")}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    primaryTab === "events"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    Events
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        primaryTab === "events"
                          ? "bg-primary/20 text-primary"
                          : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {formatCount(totalEventsCount)}
                    </span>
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      primaryTab === "events" ? "w-full" : "w-0"
                    }`}
                  />
                </button>
                <button
                  onClick={() => handlePrimaryTabChange("calendars")}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    primaryTab === "calendars"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    Calendars
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        primaryTab === "calendars"
                          ? "bg-primary/20 text-primary"
                          : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {formatCount(calendarsCount)}
                    </span>
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      primaryTab === "calendars" ? "w-full" : "w-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Events Tab Content */}
            {primaryTab === "events" && (
              <div className="manage-stagger-3">
                {/* Secondary Tabs + Create Button */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEventsFilter("upcoming")}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        eventsFilter === "upcoming"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Upcoming
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          eventsFilter === "upcoming"
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-white/5 text-muted-foreground"
                        }`}
                      >
                        {formatCount(upcomingEvents.length)}
                      </span>
                    </button>
                    <button
                      onClick={() => setEventsFilter("past")}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        eventsFilter === "past"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <History className="h-4 w-4" />
                      Past
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          eventsFilter === "past"
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-white/5 text-muted-foreground"
                        }`}
                      >
                        {formatCount(pastEvents.length)}
                      </span>
                    </button>
                  </div>
                  <Link
                    href="/event-creation"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </Link>
                </div>

                {/* Events Loading Skeleton */}
                {loadingEvents && (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 rounded-xl skeleton-shimmer"
                      />
                    ))}
                  </div>
                )}

                {/* Events Error */}
                {eventsError && !loadingEvents && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                    <p className="text-red-400">{eventsError}</p>
                    <button
                      onClick={fetchEvents}
                      className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Events Empty State */}
                {!loadingEvents && !eventsError && filteredEvents.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-card-background/50 p-10 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {eventsFilter === "upcoming"
                        ? "No upcoming events"
                        : "No past events"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {eventsFilter === "upcoming"
                        ? "Create an event to get started"
                        : "Events you've hosted will appear here"}
                    </p>
                    {eventsFilter === "upcoming" && (
                      <Link
                        href="/event-creation"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Create Event
                      </Link>
                    )}
                  </div>
                )}

                {/* Events Timeline */}
                {!loadingEvents && !eventsError && filteredEvents.length > 0 && (
                  <EventsTimeline
                    events={filteredEvents}
                    linkToManagement={true}
                    enablePreviewModal={false}
                    stickyTopClass="top-2"
                    observerRootMargin="-80px 0px 0px 0px"
                  />
                )}
              </div>
            )}

            {/* Calendars Tab Content */}
            {primaryTab === "calendars" && (
              <div className="manage-stagger-3">
                {/* Header + Create Button */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {loadingCalendars
                      ? "Loading..."
                      : `${calendars.length} calendar${calendars.length !== 1 ? "s" : ""}`}
                  </p>
                  <Link
                    href="/calendars/create"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </Link>
                </div>

                {/* Calendars Loading Skeleton */}
                {loadingCalendars && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[4/3] rounded-xl skeleton-shimmer"
                      />
                    ))}
                  </div>
                )}

                {/* Calendars Error */}
                {calendarsError && !loadingCalendars && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                    <p className="text-red-400">{calendarsError}</p>
                    <button
                      onClick={fetchCalendars}
                      className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Calendars Empty State */}
                {!loadingCalendars && !calendarsError && calendars.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-card-background/50 p-10 text-center">
                    <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      No calendars yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Organize your events into calendars
                    </p>
                    <Link
                      href="/calendars/create"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Create Calendar
                    </Link>
                  </div>
                )}

                {/* Calendars Grid */}
                {!loadingCalendars && !calendarsError && calendars.length > 0 && (
                  <>
                    {/* Mobile: Horizontal scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {calendars.map((calendar) => (
                        <div key={calendar.id} className="flex-shrink-0 w-[80vw]">
                          <HorizontalCalendarCard calendar={calendar} />
                        </div>
                      ))}
                    </div>
                    {/* Desktop: Grid */}
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {calendars.map((calendar) => (
                        <CalendarCard key={calendar.id} calendar={calendar} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
