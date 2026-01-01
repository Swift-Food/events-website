"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { eventsApi } from "@/services/events";
import { EventListResponseDto, EventResponseDto } from "@/types/event";
import { Search, Calendar, ChevronLeft, ChevronRight, X, SlidersHorizontal, Check } from "lucide-react";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import EventPreviewModal from "@/components/EventPreviewModal";

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Track which date headers are stuck
  const [stuckHeaders, setStuckHeaders] = useState<Set<string>>(new Set());
  const sentinelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Filter dropdown ref
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  const eventsPerPage = 12;

  // Calculate date filters based on selected filter
  const getDateFilters = () => {
    let startDate: string | undefined;
    let endDate: string | undefined;
    let today: boolean | undefined;
    let currentMonth: boolean | undefined;

    switch (dateFilter) {
      case 'today':
        today = true;
        break;
      case 'month':
        currentMonth = true;
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate).toISOString() : undefined;
        endDate = customEndDate ? new Date(customEndDate).toISOString() : undefined;
        break;
      case 'all':
      default:
        startDate = undefined;
        endDate = undefined;
    }

    return { startDate, endDate, today, currentMonth };
  };

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate, today, currentMonth } = getDateFilters();

      const result: EventListResponseDto = await eventsApi.findAll({
        search: searchTerm || undefined,
        startDate,
        endDate,
        today,
        currentMonth,
        sortBy: 'startDateTime',
        sortOrder,
        skip: (currentPage - 1) * eventsPerPage,
        take: eventsPerPage,
      });

      setEvents(result.events ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or filters change (skip initial render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, dateFilter, customStartDate, customEndDate, sortOrder]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [searchTerm, currentPage, dateFilter, customStartDate, customEndDate, sortOrder]);

  const totalPages = Math.ceil(total / eventsPerPage);

  // Calculate range for display
  const startIndex = (currentPage - 1) * eventsPerPage + 1;
  const endIndex = Math.min(currentPage * eventsPerPage, total);

  // Group events by date (preserving order received from API)
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, EventResponseDto[]>();

    (events ?? []).forEach((event) => {
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
  }, [events]);

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleDateFilterChange = (filter: 'all' | 'today' | 'month' | 'custom') => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const hasActiveSearch = !!searchTerm;

  const handleEventClick = (_e: React.MouseEvent, event: EventResponseDto) => {
    setSelectedEventId(event.id);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

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
        rootMargin: "-144px 0px 0px 0px",
        threshold: 0,
      }
    );

    sentinelRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [groupedEvents]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            All Events
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Browse and search through all upcoming events
          </p>
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-16 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-4 pb-4 bg-gradient-to-b from-background via-background to-transparent">
          {/* Search Bar with Filter Button */}
          <div ref={filterDropdownRef} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events..."
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                showFilters || dateFilter !== 'all' || sortOrder !== 'asc'
                  ? 'border-primary bg-primary text-white'
                  : 'border-white/10 bg-card-background text-foreground hover:border-white/20'
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl bg-card-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
                {/* When Section */}
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">When</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleDateFilterChange('all')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>All Time</span>
                      {dateFilter === 'all' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange('today')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Today</span>
                      {dateFilter === 'today' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange('month')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>This Month</span>
                      {dateFilter === 'month' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange('custom')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Custom Range</span>
                      {dateFilter === 'custom' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Sort Section */}
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSortOrder('asc')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Oldest First</span>
                      {sortOrder === 'asc' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => setSortOrder('desc')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Newest First</span>
                      {sortOrder === 'desc' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading events..."
            ) : total > 0 ? (
              <>
                Showing {startIndex}-{endIndex} of {total} event
                {total !== 1 ? "s" : ""}
              </>
            ) : (
              "No events found"
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

        {/* Events Grouped by Date */}
        {!loading && !error && events.length > 0 && (
          <div>
            {groupedEvents.map(([dateKey, dateEvents]) => {
              const firstEventDate = new Date(dateEvents[0].startDateTime);
              const monthAbbrev = firstEventDate.toLocaleDateString("en-US", {
                month: "short",
              });
              const dayNum = firstEventDate.getDate();
              const dayName = firstEventDate.toLocaleDateString("en-US", {
                weekday: "long",
              });

              return (
                <div key={dateKey} className="relative flex">
                  {/* Timeline column - continuous line */}
                  <div className="hidden sm:block sm:w-8 relative">
                    {/* Continuous line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/20" />
                    {/* Dot positioned at header level */}
                    <div className="sticky top-36 z-40 flex h-8 items-center justify-center">
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
                    <div className="sticky top-36 z-30 pb-3">
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
                          onClick={handleEventClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Event Preview Modal */}
      <EventPreviewModal
        eventId={selectedEventId}
        isOpen={!!selectedEventId}
        onClose={handleCloseModal}
      />

      {/* Custom Date Range Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-card-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Select Date Range
              </h3>
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  if (!customStartDate && !customEndDate) {
                    setDateFilter('all');
                  }
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close date picker"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate || undefined}
                  className="w-full rounded-lg border border-white/10 bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setDateFilter('all');
                  setShowDatePicker(false);
                }}
                className="flex-1 rounded-full border border-white/10 bg-card-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-white/20"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setShowDatePicker(false);
                }}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
