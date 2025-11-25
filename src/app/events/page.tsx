"use client";

import { useState, useEffect } from "react";
import { eventsApi } from "@/services/events";
import {
  EventListResponseDto,
  EventResponseDto,
  EventStatus,
} from "@/types/event";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EventCataloguePage() {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const eventsPerPage = 12;

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

      setEvents(result.events);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [searchTerm, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(total / eventsPerPage);

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveSearch = !!searchTerm;

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Discover Events
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Find and join exciting events happening around you
          </p>
        </div>

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
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading events..."
            ) : (
              <>
                Showing {events.length} of {total} event
                {total !== 1 ? "s" : ""}
              </>
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

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-card-background transition-all hover:border-white/20 hover:shadow-2xl"
              >
                {/* Event Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-card-secondary-background">
                  {event.eventImage ? (
                    <Image
                      src={event.eventImage}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ backgroundColor: event.eventColor }}
                    >
                      <Calendar className="h-16 w-16 text-white/50" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute right-3 top-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                        event.status === EventStatus.PUBLISHED
                          ? "bg-green-500/80 text-white"
                          : event.status === EventStatus.CANCELLED
                          ? "bg-red-500/80 text-white"
                          : "bg-gray-500/80 text-white"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary">
                    {event.name}
                  </h3>

                  {/* Date */}
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.startDateTime)}</span>
                  </div>

                  {/* Location */}
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">
                      {event.address.city}, {event.address.zipcode}
                    </span>
                  </div>

                  {/* Categories */}
                  {event.categories && event.categories.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {event.categories.slice(0, 2).map((category) => (
                        <span
                          key={category.id}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {category.name}
                        </span>
                      ))}
                      {event.categories.length > 2 && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                          +{event.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.attendeesCount || 0} attendee
                        {event.attendeesCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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
    </div>
  );
}
