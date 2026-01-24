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

// Dynamic icon component for Lucide icons
const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = icons[name as keyof typeof icons];

  if (!IconComponent) {
    // Fallback to a default icon if not found
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

  const getCategoryLabel = (categoryName: string) => {
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

        {/* Event Categories Section */}
        {!loadingCategories && allCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Browse by Category
            </h2>

            <div className="overflow-x-auto pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-2 sm:gap-3">
                {allCategories.slice(0, 12).map((category) => (
                  <Link
                    key={category.id}
                    href={`/events?category=${category.name}`}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer group w-14 sm:w-18 flex-shrink-0"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {category.iconName ? (
                        <DynamicIcon
                          name={category.iconName}
                          className="w-4 h-4 sm:w-6 sm:h-6 text-primary"
                        />
                      ) : (
                        <DynamicIcon
                          name="circle"
                          className="w-4 h-4 sm:w-6 sm:h-6 text-primary"
                        />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-foreground text-center line-clamp-2">
                      {getCategoryLabel(category.name)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {calendars.slice(0, 6).map((calendar) => (
                <div key={calendar.id} className="flex-shrink-0">
                  <SquareCalendarCard calendar={calendar} size={200} />
                </div>
              ))}
            </div>
            {/* Desktop: responsive grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {calendars.slice(0, 6).map((calendar) => (
                <SquareCalendarCard key={calendar.id} calendar={calendar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
