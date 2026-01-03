"use client";

import { useState, useEffect } from "react";
import { calendarsApi } from "@/services/calendars";
import { categoriesApi } from "@/services/categories";
import { Calendar as CalendarType } from "@/types/calendar";
import { EventCategoryType, EventCategoryResponseDto } from "@/types/category";
import { ChevronRight as ArrowRight } from "lucide-react";
import CalendarCard from "@/components/CalendarCard";
import UpcomingEventsSection from "@/components/UpcomingEventsSection";
import HorizontalCalendarCard from "@/components/HorizontalCalendarCard";
import Link from "next/link";

export default function DiscoveryPage() {
  // Calendars state
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);

  // Categories
  const [allCategories, setAllCategories] = useState<EventCategoryResponseDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch all categories
  const fetchAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const categories = await categoriesApi.findAll();
      setAllCategories(categories);
      console.log("Categories: ", categories)
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch calendars
  const fetchCalendars = async () => {
    try {
      setLoadingCalendars(true);
      const result = await calendarsApi.findAll({
        isPublic: true,
        take: 10,
      });
      setCalendars(result.calendars ?? []);
    } catch (err) {
      console.error("Failed to fetch calendars:", err);
    } finally {
      setLoadingCalendars(false);
    }
  };

  // Helper function to get display label
  const getCategoryLabel = (categoryName: EventCategoryType) => {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  };

  // Fetch calendars and categories on mount
  useEffect(() => {
    fetchCalendars();
    fetchAllCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Discover Events
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Find and join exciting events happening around you
          </p>
        </div>

        {/* Upcoming Events Section */}
        <UpcomingEventsSection />

        {/* Calendars Section */}
        {!loadingCalendars && calendars.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Browse Calendars
              </h2>
              <Link
                href="/calendars"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
          </div>
        )}

        {/* Event Categories Section */}
        {!loadingCategories && allCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Browse by Category
            </h2>

            {/* Mobile: Horizontal scroll with 2 rows */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex flex-col gap-2">
                {[0, 1].map((rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {allCategories
                      .slice(0, 12)
                      .filter((_, i) => i % 2 === rowIndex)
                      .map((category) => (
                        <Link
                          key={category.id}
                          href={`/events?category=${category.name}`}
                          className="rounded-xl px-4 py-2.5 text-sm font-medium border border-white/10 bg-card-background text-foreground hover:bg-card-background/80 cursor-pointer transition-colors text-center whitespace-nowrap"
                        >
                          {getCategoryLabel(category.name)}
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: 4-column grid */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-2">
              {allCategories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/events?category=${category.name}`}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium border border-white/10 bg-card-background text-foreground hover:bg-card-background/80 cursor-pointer transition-colors text-center truncate"
                >
                  {getCategoryLabel(category.name)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
