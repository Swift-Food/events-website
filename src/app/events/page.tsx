"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { eventsApi } from "@/services/events";
import { categoriesApi } from "@/services/categories";
import { EventListResponseDto, EventResponseDto } from "@/types/event";
import { EventCategoryType, EventCategoryResponseDto } from "@/types/category";
import { Search, Calendar, ChevronLeft, ChevronRight, X, SlidersHorizontal, Check } from "lucide-react";
import EventsTimeline from "@/components/EventsTimeline";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories
  const [allCategories, setAllCategories] = useState<EventCategoryResponseDto[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<EventCategoryType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter dropdown ref
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize category filter from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && Object.values(EventCategoryType).includes(categoryParam as EventCategoryType)) {
      setCategoryFilter(categoryParam as EventCategoryType);
    }
  }, [searchParams]);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoriesApi.findAll();
        setAllCategories(categories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

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
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
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
  }, [searchTerm, dateFilter, customStartDate, customEndDate, sortOrder, categoryFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [searchTerm, currentPage, dateFilter, customStartDate, customEndDate, sortOrder, categoryFilter]);

  const totalPages = Math.ceil(total / eventsPerPage);

  // Calculate range for display
  const startIndex = (currentPage - 1) * eventsPerPage + 1;
  const endIndex = Math.min(currentPage * eventsPerPage, total);

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleDateFilterChange = (filter: 'all' | 'today' | 'month' | 'custom') => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handleCategoryFilterChange = (category: EventCategoryType | 'all') => {
    setCategoryFilter(category);
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.push(`/events${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const getCategoryLabel = (categoryName: EventCategoryType) => {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  };

  const hasActiveSearch = !!searchTerm;
  const hasActiveFilters = dateFilter !== 'all' || sortOrder !== 'asc' || categoryFilter !== 'all';

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
                showFilters || hasActiveFilters
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
                    {dateFilter === 'custom' && (
                      <div className="mt-2 space-y-2 px-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">From</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">To</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={customStartDate || undefined}
                            className="w-full rounded-lg border border-white/10 bg-card-secondary-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Category Section */}
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryFilterChange('all')}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>All Categories</span>
                      {categoryFilter === 'all' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    {allCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilterChange(category.name)}
                        className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                      >
                        <span>{getCategoryLabel(category.name)}</span>
                        {categoryFilter === category.name && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
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

        {/* Events Timeline */}
        {!loading && !error && events.length > 0 && (
          <EventsTimeline events={events} />
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
