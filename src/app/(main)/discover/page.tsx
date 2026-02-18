"use client";

import { useState, useEffect } from "react";
import { calendarsApi } from "@/services/calendars";
import { categoriesApi } from "@/services/categories";
import { Calendar as CalendarType } from "@/types/calendar";
import { EventCategoryResponseDto } from "@/types/category";
import { ChevronRight as ArrowRight, icons, LucideProps } from "lucide-react";
import SquareCalendarCard from "@/components/SquareCalendarCard";
import UpcomingEventsSection from "@/components/UpcomingEventsSection";
import Link from "next/link";
import BrowseByLocation from "@/components/BrowseByLocation";

// Dynamic icon component for Lucide icons
const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = icons[name as keyof typeof icons];

  if (!IconComponent) {
    const FallbackIcon = icons.Circle;
    return <FallbackIcon {...props} />;
  }

  return <IconComponent {...props} />;
};

export default function DiscoverPage() {
  // Calendars state
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);

  // Categories
  const [allCategories, setAllCategories] = useState<
    EventCategoryResponseDto[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch all categories
  const fetchAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const categories = await categoriesApi.findAll();
      setAllCategories(categories);
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

  const getCategoryLabel = (categoryName: string) => {
    return (
      categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
    );
  };

  // Fetch calendars and categories on mount
  useEffect(() => {
    fetchCalendars();
    fetchAllCategories();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Original gradient background - unchanged */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(to bottom, #41296e 0%, #000000 15%)",
        }}
      />

      {/* Subtle ambient glow */}
      <div className="discover-ambient" />

      {/* Noise texture for depth */}
      <div className="discover-noise" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Header - stagger 1 */}
        <div className="mb-8 discover-stagger-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Discover Events
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            Find and join exciting events happening around you
          </p>
        </div>

        {/* Event Categories Section - stagger 2 */}
        {!loadingCategories && allCategories.length > 0 && (
          <div className="mb-8 discover-stagger-2">
            <h2 className="text-lg font-semibold text-foreground mb-4 discover-section-header">
              Browse by Category
            </h2>

            <div className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-2 sm:gap-3">
                {allCategories.slice(0, 12).map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/events?category=${category.name}`}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer group w-14 sm:w-18 flex-shrink-0"
                    style={{
                      animationDelay: `${200 + index * 30}ms`,
                    }}
                  >
                    <div className="category-icon-wrapper w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-transparent group-hover:border-primary/20">
                      {category.iconName ? (
                        <DynamicIcon
                          name={category.iconName}
                          className="w-4 h-4 sm:w-6 sm:h-6 text-primary transition-transform"
                        />
                      ) : (
                        <DynamicIcon
                          name="circle"
                          className="w-4 h-4 sm:w-6 sm:h-6 text-primary"
                        />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-foreground text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {getCategoryLabel(category.name)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton for categories */}
        {loadingCategories && (
          <div className="mb-8 discover-stagger-2">
            <div className="h-6 w-40 skeleton-shimmer mb-4" />
            <div className="flex gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 w-14 sm:w-18"
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full skeleton-shimmer" />
                  <div className="w-10 h-3 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events Section - stagger 3 */}
        <div className="discover-stagger-3">
          <UpcomingEventsSection />
        </div>

        {/* Calendars Section - stagger 4 */}
        {!loadingCalendars && calendars.length > 0 && (
          <div className="mb-8 discover-stagger-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground discover-section-header">
                Featured Calendars
              </h2>
              <Link
                href="/calendars"
                className="view-all-link text-sm text-primary hover:text-primary/80"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {calendars.slice(0, 6).map((calendar) => (
                <div key={calendar.id} className="flex-shrink-0 discover-card">
                  <SquareCalendarCard calendar={calendar} size={200} />
                </div>
              ))}
            </div>
            {/* Desktop: responsive grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {calendars.slice(0, 6).map((calendar) => (
                <div key={calendar.id} className="discover-card">
                  <SquareCalendarCard calendar={calendar} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton for calendars */}
        {loadingCalendars && (
          <div className="mb-8 discover-stagger-4">
            <div className="h-6 w-40 skeleton-shimmer mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square skeleton-shimmer rounded-xl"
                />
              ))}
            </div>
          </div>
        )}

        {/* Browse by Location Section - stagger 5 */}
        <div className="discover-stagger-5">
          <BrowseByLocation />
        </div>
      </div>
    </div>
  );
}
