"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { eventsApi } from "@/services/events";
import { EventListResponseDto, EventResponseDto } from "@/types/event";
import { EventCategoryType } from "@/types/category";
import { Search, Calendar, X, SlidersHorizontal, Check } from "lucide-react";
import EventsTimeline from "@/components/EventsTimeline";
import { useCategoriesContext } from "@/lib/categories-context";

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageSkeleton />}>
      <EventsPageContent />
    </Suspense>
  );
}

function EventsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-card-background rounded animate-pulse" />
          <div className="mt-2 h-5 w-72 bg-card-background rounded animate-pulse" />
        </div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}

function EventsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Get categories from context
  const { categories: allCategories } = useCategoriesContext();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState<EventCategoryType | "all">(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && Object.values(EventCategoryType).includes(categoryParam as EventCategoryType)) {
      return categoryParam as EventCategoryType;
    }
    return "all";
  });
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(() => {
    return searchParams.get("subcategoryId");
  });
  const [showFilters, setShowFilters] = useState(false);

  // Refs
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);

  const eventsPerPage = 12;

  // Get subcategories for the selected category
  const filteredSubcategories = useMemo(() => {
    if (categoryFilter === "all") {
      return [];
    }

    const category = allCategories.find(
      (cat) => cat.name.toLowerCase() === categoryFilter.toLowerCase()
    );

    if (!category) {
      return [];
    }

    return category.subcategories || [];
  }, [allCategories, categoryFilter]);

  // Sync category and subcategory filter when URL params change (e.g., browser back/forward)
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const subcategoryIdParam = searchParams.get("subcategoryId");

    const newCategory =
      categoryParam && Object.values(EventCategoryType).includes(categoryParam as EventCategoryType)
        ? (categoryParam as EventCategoryType)
        : "all";

    if (newCategory !== categoryFilter) {
      setCategoryFilter(newCategory);
    }

    if (subcategoryIdParam !== selectedSubcategoryId) {
      setSelectedSubcategoryId(subcategoryIdParam);
    }
  }, [searchParams, categoryFilter, selectedSubcategoryId]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
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

  // Build query params helper
  const buildQueryParams = useCallback(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;
    let today: boolean | undefined;
    let currentMonth: boolean | undefined;

    switch (dateFilter) {
      case "today":
        today = true;
        break;
      case "month":
        currentMonth = true;
        break;
      case "custom":
        startDate = customStartDate ? new Date(customStartDate).toISOString() : undefined;
        endDate = customEndDate ? new Date(customEndDate).toISOString() : undefined;
        break;
      case "all":
      default:
        startDate = undefined;
        endDate = undefined;
    }

    return {
      search: searchTerm || undefined,
      startDate,
      endDate,
      today,
      currentMonth,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      subcategoryId: selectedSubcategoryId || undefined,
      sortBy: "startDateTime" as const,
      sortOrder,
    };
  }, [searchTerm, dateFilter, customStartDate, customEndDate, categoryFilter, selectedSubcategoryId, sortOrder]);

  // Initial fetch
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    skipRef.current = 0;

    try {
      const result: EventListResponseDto = await eventsApi.findAll({
        ...buildQueryParams(),
        skip: 0,
        take: eventsPerPage,
      });

      const newEvents = result.events ?? [];
      setEvents(newEvents);
      setTotal(result.total ?? 0);
      setHasMore(newEvents.length === eventsPerPage && newEvents.length < (result.total ?? 0));
      skipRef.current = newEvents.length;
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  // Load more events
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result: EventListResponseDto = await eventsApi.findAll({
        ...buildQueryParams(),
        skip: skipRef.current,
        take: eventsPerPage,
      });

      const newEvents = result.events ?? [];
      setEvents((prev) => [...prev, ...newEvents]);
      setHasMore(newEvents.length === eventsPerPage && skipRef.current + newEvents.length < (result.total ?? 0));
      skipRef.current += newEvents.length;
    } catch (err) {
      console.error("Failed to load more events:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [buildQueryParams, loadingMore, hasMore]);

  // Reset and fetch when filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Intersection observer for infinite scroll
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

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleDateFilterChange = (filter: "all" | "today" | "month" | "custom") => {
    setDateFilter(filter);
    if (filter !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const handleCategoryFilterChange = (category: EventCategoryType | "all") => {
    setCategoryFilter(category);
    // Clear subcategory when category changes
    setSelectedSubcategoryId(null);
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    // Always clear subcategoryId when category changes
    params.delete("subcategoryId");
    router.push(`/events${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const handleSubcategoryChange = (subcategoryId: string | null) => {
    setSelectedSubcategoryId(subcategoryId);
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    if (subcategoryId) {
      params.set("subcategoryId", subcategoryId);
    } else {
      params.delete("subcategoryId");
    }
    router.push(`/events${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const getCategoryLabel = (categoryName: EventCategoryType | string) => {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  };

  const hasActiveSearch = !!searchTerm;
  const hasActiveFilters = dateFilter !== "all" || sortOrder !== "asc" || categoryFilter !== "all" || selectedSubcategoryId !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">All Events</h1>
          <p className="mt-2 text-sm sm:text-md text-muted-foreground">
            Browse and search through all upcoming events
          </p>
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-20 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4 bg-gradient-to-b from-background via-background to-transparent">
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
                  ? "border-primary bg-primary text-white"
                  : "border-white/10 bg-card-background text-foreground hover:border-white/20"
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
                      onClick={() => handleDateFilterChange("all")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>All Time</span>
                      {dateFilter === "all" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange("today")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Today</span>
                      {dateFilter === "today" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange("month")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>This Month</span>
                      {dateFilter === "month" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleDateFilterChange("custom")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Custom Range</span>
                      {dateFilter === "custom" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    {dateFilter === "custom" && (
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
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Category
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryFilterChange("all")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>All Categories</span>
                      {categoryFilter === "all" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    {allCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilterChange(category.name as EventCategoryType)}
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
                      onClick={() => setSortOrder("asc")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Oldest First</span>
                      {sortOrder === "asc" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => setSortOrder("desc")}
                      className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-white/5 transition-colors"
                    >
                      <span>Newest First</span>
                      {sortOrder === "desc" && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subcategory Filter Chips - only show when a category is selected and has subcategories */}
        {filteredSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSubcategoryId && (
              <button
                onClick={() => handleSubcategoryChange(null)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border border-red-400/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            {filteredSubcategories.map((subcategory) => {
              const isSelected = selectedSubcategoryId === subcategory.id;
              return (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryChange(isSelected ? null : subcategory.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-white border border-primary"
                      : "border border-white/10 bg-card-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {getCategoryLabel(subcategory.name)}
                </button>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading events..." : total > 0 ? <>{total} event{total !== 1 ? "s" : ""} found</> : "No events found"}
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
            <h3 className="mb-2 text-xl font-semibold text-foreground">No events found</h3>
            <p className="text-muted-foreground">
              {hasActiveSearch ? "Try adjusting your search terms" : "Check back later for new events"}
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
        {!loading && !error && events.length > 0 && <EventsTimeline events={events} />}

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
          <p className="text-center text-sm text-muted-foreground py-8">You&apos;ve reached the end</p>
        )}
      </div>
    </div>
  );
}
