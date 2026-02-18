# Browse by Location Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add location-based event browsing to the discover page and a dedicated location events page at `/locations/[id]`.

**Architecture:** New locations API service, a `BrowseByLocation` component on the discover page showing text pill/chip cards, and a `/locations/[id]` page reusing `EventsTimeline` with client-side search and infinite scroll pagination.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Axios, Lucide React icons

---

### Task 1: Create Location Types

**Files:**
- Create: `src/types/location/index.ts`

**Step 1: Create the type file**

```typescript
import { EventResponseDto } from "@/types/event";

export interface EventLocationResponseDto {
  id: string;
  name: string;
  image: string | null;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  eventCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LocationEventsResponseDto {
  events: EventResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Step 2: Commit**

```bash
git add src/types/location/index.ts
git commit -m "feat: add location type definitions"
```

---

### Task 2: Create Locations API Service

**Files:**
- Create: `src/services/locations.ts`
- Reference: `src/services/categories.ts` (follow same pattern)

**Step 1: Create the service**

```typescript
import apiClient from "@/lib/auth/apiClient";
import {
  EventLocationResponseDto,
  LocationEventsResponseDto,
} from "@/types/location";

export const locationsApi = {
  /**
   * Fetch all event locations with event counts
   */
  findAll: async (): Promise<EventLocationResponseDto[]> => {
    const response = await apiClient.get<EventLocationResponseDto[]>(
      "/events/locations"
    );
    return response.data;
  },

  /**
   * Fetch a specific location by ID
   */
  findById: async (id: string): Promise<EventLocationResponseDto> => {
    const response = await apiClient.get<EventLocationResponseDto>(
      `/events/locations/${id}`
    );
    return response.data;
  },

  /**
   * Fetch paginated published upcoming events for a location
   */
  findEvents: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<LocationEventsResponseDto> => {
    const response = await apiClient.get<LocationEventsResponseDto>(
      `/events/locations/${id}/events`,
      { params }
    );
    return response.data;
  },
};
```

**Step 2: Commit**

```bash
git add src/services/locations.ts
git commit -m "feat: add locations API service"
```

---

### Task 3: Create BrowseByLocation Component

**Files:**
- Create: `src/components/BrowseByLocation.tsx`
- Reference: `src/app/(main)/discover/page.tsx` (category section styling at lines 99-152)

**Step 1: Create the component**

This component fetches locations on mount and renders them as horizontally scrollable text pill/chip cards. Each pill shows location name + event count. Links to `/locations/[id]`.

Key design decisions:
- Horizontal scroll on mobile with hidden scrollbar (matching category section pattern)
- Pill style: `rounded-full border border-white/10 bg-white/5 hover:bg-white/10`
- Event count shown in muted color after location name
- Loading skeleton: row of pill-shaped shimmer elements
- Only renders content if locations exist (returns null otherwise)
- Section header: "Browse by Location" matching "Browse by Category" style

```typescript
"use client";

import { useState, useEffect } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function BrowseByLocation() {
  const [locations, setLocations] = useState<EventLocationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const data = await locationsApi.findAll();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (!loading && locations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 discover-section-header">
        Browse by Location
      </h2>

      {loading ? (
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 flex-shrink-0 rounded-full skeleton-shimmer"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-2 flex-wrap sm:flex-wrap">
            {locations.map((location) => (
              <Link
                key={location.id}
                href={`/locations/${location.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/10 hover:border-white/20 flex-shrink-0"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{location.name}</span>
                <span className="text-muted-foreground text-xs">
                  {location.eventCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/BrowseByLocation.tsx
git commit -m "feat: add BrowseByLocation component"
```

---

### Task 4: Add BrowseByLocation to Discover Page

**Files:**
- Modify: `src/app/(main)/discover/page.tsx`

**Step 1: Add import at top of file (after existing imports)**

Add after the `import Link from "next/link";` line (line 11):

```typescript
import BrowseByLocation from "@/components/BrowseByLocation";
```

**Step 2: Add the component below the "Browse Calendars" section**

Insert after the calendars loading skeleton section (after line 203, before the closing `</div>` tags). Place it as a new stagger section:

```tsx
        {/* Browse by Location Section - stagger 5 */}
        <div className="discover-stagger-5">
          <BrowseByLocation />
        </div>
```

This goes right before the final two closing `</div>` tags at lines 204-206.

**Step 3: Commit**

```bash
git add src/app/(main)/discover/page.tsx
git commit -m "feat: add browse by location section to discover page"
```

---

### Task 5: Create Location Events Page

**Files:**
- Create: `src/app/(main)/locations/[id]/page.tsx`
- Reference: `src/app/(main)/events/page.tsx` (layout, search bar, timeline, infinite scroll patterns)

**Step 1: Create the page**

This is a client component page that:
1. Fetches location details + first page of events on mount
2. Shows location name as header with a back link
3. Has a sticky search bar that filters loaded events client-side by name
4. Uses `EventsTimeline` for display
5. Uses Intersection Observer for infinite scroll (page-based pagination, not skip/take)
6. Shows appropriate loading/error/empty states

Key differences from `/events` page:
- No filter dropdown (no category/date/sort filters) — just search
- Search is client-side only (filters `allEvents` state by name)
- Pagination uses `page`/`limit` params instead of `skip`/`take`
- Shows location name in header

```typescript
"use client";

import { useState, useEffect, useRef, useCallback, useMemo, use } from "react";
import { locationsApi } from "@/services/locations";
import { EventLocationResponseDto } from "@/types/location";
import { EventResponseDto } from "@/types/event";
import { Search, X, Calendar, MapPin, ArrowLeft } from "lucide-react";
import EventsTimeline from "@/components/EventsTimeline";
import Link from "next/link";

export default function LocationEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [location, setLocation] = useState<EventLocationResponseDto | null>(null);
  const [allEvents, setAllEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const eventsPerPage = 20;

  // Fetch location details + first page of events
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    pageRef.current = 1;

    try {
      const [locationData, eventsData] = await Promise.all([
        locationsApi.findById(id),
        locationsApi.findEvents(id, { page: 1, limit: eventsPerPage }),
      ]);

      setLocation(locationData);
      const newEvents = eventsData.events ?? [];
      setAllEvents(newEvents);
      setHasMore(eventsData.pagination.page < eventsData.pagination.totalPages);
      pageRef.current = 2;
    } catch (err) {
      console.error("Failed to fetch location events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load more events
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const eventsData = await locationsApi.findEvents(id, {
        page: pageRef.current,
        limit: eventsPerPage,
      });

      const newEvents = eventsData.events ?? [];
      setAllEvents((prev) => [...prev, ...newEvents]);
      setHasMore(eventsData.pagination.page < eventsData.pagination.totalPages);
      pageRef.current += 1;
    } catch (err) {
      console.error("Failed to load more events:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, loadingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

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

  // Client-side search filtering
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return allEvents;
    const term = searchTerm.toLowerCase();
    return allEvents.filter((event) =>
      event.name.toLowerCase().includes(term)
    );
  }, [allEvents, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>
          {location ? (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                  {location.name}
                </h1>
              </div>
              <p className="mt-2 text-sm sm:text-md text-muted-foreground">
                {location.eventCount} upcoming event{location.eventCount !== 1 ? "s" : ""}
              </p>
            </>
          ) : loading ? (
            <>
              <div className="h-8 w-48 bg-card-background rounded animate-pulse" />
              <div className="mt-2 h-5 w-32 bg-card-background rounded animate-pulse" />
            </>
          ) : null}
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-40 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
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
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length > 0
                ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}${searchTerm ? " found" : ""}`
                : "No events found"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchInitial}
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
            <h3 className="mb-2 text-xl font-semibold text-foreground">No events found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No upcoming events at this location"}
            </p>
            {searchTerm && (
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
        {!loading && !error && filteredEvents.length > 0 && (
          <EventsTimeline events={filteredEvents} stickyTopOffset={60} />
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {/* End of results */}
        {!loading && !hasMore && allEvents.length > 0 && !searchTerm && (
          <p className="text-center text-sm text-muted-foreground py-8">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(main)/locations/[id]/page.tsx
git commit -m "feat: add location events page with timeline and search"
```

---

### Task 6: Verify Everything Works

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Verify manually**

1. Navigate to `/discover` — confirm "Browse by Location" section appears below calendars
2. Click a location pill — confirm it navigates to `/locations/[id]`
3. On location page — confirm events load in timeline, search filters client-side, infinite scroll works
4. Check mobile responsiveness — confirm horizontal scroll on discover pills, proper layout on location page

**Step 3: Fix any TypeScript/build errors**

```bash
npm run build
```

**Step 4: Commit any fixes**
