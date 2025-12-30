"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calendarService } from "@/services/calendar.service";
import { useAuth } from "@/lib/auth/authContext";
import { Calendar, CalendarRole } from "@/types/calendar";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import CalendarCard from "@/components/CalendarCard";
import Link from "next/link";

type TabType = "owned" | "subscribed" | "collaborated";

export default function MyCalendarsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [ownedCalendars, setOwnedCalendars] = useState<Calendar[]>([]);
  const [subscribedCalendars, setSubscribedCalendars] = useState<Calendar[]>([]);
  const [collaboratedCalendars, setCollaboratedCalendars] = useState<Calendar[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("owned");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth?redirect=/calendars/me");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch all calendar data
  useEffect(() => {
    const fetchCalendars = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch owned calendars
        const owned = await calendarService.getMyCalendars();
        setOwnedCalendars(owned);

        // Fetch subscribed calendars
        const subscribed = await calendarService.getMySubscriptions();
        setSubscribedCalendars(subscribed);

        // Fetch collaborated calendars
        // We need to filter calendars where user is a collaborator but not owner
        const allCalendars = await calendarService.getAllCalendars();
        const collaborated: Calendar[] = [];

        for (const calendar of allCalendars.calendars) {
          // Skip if user owns this calendar
          if (calendar.owner?.user?.id === user?.id) continue;

          try {
            const collaborators = await calendarService.getCollaborators(calendar.id);
            const isCollaborator = collaborators.some(
              (collab) =>
                collab.inviteAccepted && collab.eventUser?.id === user?.eventUser?.id
            );
            if (isCollaborator) {
              collaborated.push(calendar);
            }
          } catch (err) {
            // User might not have permission to view collaborators
            continue;
          }
        }
        setCollaboratedCalendars(collaborated);
      } catch (err) {
        console.error("Failed to fetch calendars:", err);
        setError("Failed to load calendars. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, [isAuthenticated, authLoading, user]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, return null (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const getCurrentCalendars = () => {
    switch (activeTab) {
      case "owned":
        return ownedCalendars;
      case "subscribed":
        return subscribedCalendars;
      case "collaborated":
        return collaboratedCalendars;
      default:
        return [];
    }
  };

  const currentCalendars = getCurrentCalendars();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My Calendars
            </h1>
            <p className="mt-2 text-md text-muted-foreground">
              Manage your calendars and subscriptions
            </p>
          </div>
          <Link
            href="/calendars/create"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Calendar</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("owned")}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === "owned"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Calendars
            {ownedCalendars.length > 0 && (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {ownedCalendars.length}
              </span>
            )}
            {activeTab === "owned" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("subscribed")}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === "subscribed"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subscribed
            {subscribedCalendars.length > 0 && (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {subscribedCalendars.length}
              </span>
            )}
            {activeTab === "subscribed" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("collaborated")}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === "collaborated"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Collaborated
            {collaboratedCalendars.length > 0 && (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {collaboratedCalendars.length}
              </span>
            )}
            {activeTab === "collaborated" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
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
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && currentCalendars.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === "owned"
                ? "No calendars yet"
                : activeTab === "subscribed"
                ? "No subscriptions"
                : "No collaborations"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "owned"
                ? "Create your first calendar to get started"
                : activeTab === "subscribed"
                ? "Subscribe to calendars to see them here"
                : "You haven't been invited to collaborate on any calendars yet"}
            </p>
            {activeTab === "owned" && (
              <Link
                href="/calendars/create"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                <Plus className="h-4 w-4" />
                Create Calendar
              </Link>
            )}
            {activeTab === "subscribed" && (
              <Link
                href="/calendars"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                Discover Calendars
              </Link>
            )}
          </div>
        )}

        {/* Calendar Grid */}
        {!loading && !error && currentCalendars.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentCalendars.map((calendar) => (
              <CalendarCard
                key={calendar.id}
                calendar={calendar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
