"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventService } from "@/services/event.service";
import { calendarService } from "@/services/calendar.service";
import { EventResponseDto } from "@/types/event";
import { Calendar as CalendarType } from "@/types/calendar";
import { Calendar, CalendarPlus2, Plus, Loader2, Users, History, CalendarDays, ChevronRight } from "lucide-react";
import HorizontalCalendarCard from "@/components/HorizontalCalendarCard";
import CalendarCard from "@/components/CalendarCard";
import EventsTimeline from "@/components/EventsTimeline";
import Link from "next/link";

type TabType = "upcoming" | "past";

export default function EventManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  // Calendars state
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch calendars
  const fetchCalendars = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingCalendars(true);
      const result = await calendarService.getMyCalendars();
      setCalendars(result ?? []);
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    } finally {
      setLoadingCalendars(false);
    }
  };

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
      fetchCalendars();
    }
  }, [isAuthenticated]);

  // Filter events based on active tab
  // Past = events where endDateTime has passed
  // Upcoming = everything else (not started yet + currently ongoing)
  const now = new Date();

  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.endDateTime) >= now),
    [events]
  );

  const pastEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.endDateTime) < now)
        .sort((a, b) => new Date(b.endDateTime).getTime() - new Date(a.endDateTime).getTime()),
    [events]
  );

  const currentEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Management
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Manage your calendars and events
          </p>
        </div>

        {/* Calendars Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Your Calendars
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href="/calendars/me"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/calendars/create"
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </Link>
            </div>
          </div>

          {/* Calendars Timeline View */}
          {loadingCalendars ? (
            <div className="flex min-h-[100px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calendars.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card-background p-6 text-center">
              <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-base font-semibold text-foreground">
                No calendars yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first calendar to organize events
              </p>
              <Link
                href="/calendars/create"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Calendar
              </Link>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Events Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarPlus2 className="h-5 w-5" />
            Your Events
          </h2>
          <Link
            href="/event-creation"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
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

        {/* Events Timeline */}
        {!loading && !error && currentEvents.length > 0 && (
          <EventsTimeline
            events={currentEvents}
            linkToManagement={true}
            enablePreviewModal={false}
            stickyTopClass="top-20"
            observerRootMargin="-80px 0px 0px 0px"
          />
        )}
      </div>
    </div>
  );
}
