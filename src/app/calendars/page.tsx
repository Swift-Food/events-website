"use client";

import { useState, useEffect, useRef } from "react";
import { calendarsApi } from "@/services/calendars";
import { Calendar, CalendarType } from "@/types/calendar";
import { Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import CalendarCard from "@/components/CalendarCard";

export default function CalendarDiscoveryPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [calendarType, setCalendarType] = useState<CalendarType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const calendarsPerPage = 12;

  // Fetch calendars
  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await calendarsApi.findAll({
        search: searchTerm || undefined,
        calendarType: calendarType === "all" ? undefined : calendarType,
        isPublic: true, // Only show public calendars in discovery
        skip: (currentPage - 1) * calendarsPerPage,
        take: calendarsPerPage,
      });

      setCalendars(result.calendars ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
      setError("Failed to load calendars. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change (skip initial render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, calendarType]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchCalendars();
  }, [searchTerm, calendarType, currentPage]);

  const totalPages = Math.ceil(total / calendarsPerPage);

  // Calculate range for display
  const startIndex = (currentPage - 1) * calendarsPerPage + 1;
  const endIndex = Math.min(currentPage * calendarsPerPage, total);

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!searchTerm || calendarType !== "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Discover Calendars
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Browse and subscribe to calendars to stay updated on events
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search calendars by name or description..."
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

          {/* Type Filter */}
          {/* <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCalendarType("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                calendarType === "all"
                  ? "bg-primary text-white"
                  : "border border-white/10 bg-card-background text-foreground hover:border-white/20"
              }`}
            >
              All Calendars
            </button>
            <button
              onClick={() => setCalendarType(CalendarType.PERSONAL)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                calendarType === CalendarType.PERSONAL
                  ? "bg-primary text-white"
                  : "border border-white/10 bg-card-background text-foreground hover:border-white/20"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setCalendarType(CalendarType.TEAM)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                calendarType === CalendarType.TEAM
                  ? "bg-primary text-white"
                  : "border border-white/10 bg-card-background text-foreground hover:border-white/20"
              }`}
            >
              Team
            </button>
          </div> */}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading calendars..."
            ) : total > 0 ? (
              <>
                Showing {startIndex}-{endIndex} of {total} calendar
                {total !== 1 ? "s" : ""}
              </>
            ) : (
              "No calendars found"
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
              onClick={fetchCalendars}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && calendars.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
            <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No calendars found
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your search terms or filters"
                : "Check back later for new calendars"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCalendarType("all");
                  setCurrentPage(1);
                }}
                className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Calendar Grid */}
        {!loading && !error && calendars.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {calendars.map((calendar) => (
              <CalendarCard key={calendar.id} calendar={calendar} />
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
