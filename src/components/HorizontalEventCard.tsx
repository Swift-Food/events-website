import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Calendar, Clock, MapPin, Ticket, Video, Lock } from "lucide-react";
import { EventResponseDto } from "@/types/event";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  isVirtualEvent,
  isHybridEvent,
  hasOnlineComponent,
} from "@/types/event/status";
import { resolveTheme } from "@/lib/theme-presets";
import type { EventThemeConfig } from "@/types/event/theme";

interface HorizontalEventCardProps {
  event: EventResponseDto;
  linkToManagement?: boolean;
  showDate?: boolean;
  showCategories?: boolean;
  onClick?: (e: React.MouseEvent, event: EventResponseDto) => void;
  variant?: "default" | "dark";
}

export default function HorizontalEventCard({
  event,
  linkToManagement = false,
  showDate = false,
  showCategories = true,
  onClick,
  variant = "default",
}: HorizontalEventCardProps) {
  // Text color classes based on variant (dark variant forces white text for use in dark modals)
  const textPrimary = variant === "dark" ? "text-white" : "text-foreground";
  const textMuted = variant === "dark" ? "text-white/60" : "text-muted-foreground";
  const hoverPrimary = variant === "dark" ? "group-hover:text-accent" : "group-hover:text-primary";
  const themePalette = useMemo(() => {
    if (!event.eventTheme) return null;
    try {
      const config: EventThemeConfig = JSON.parse(event.eventTheme);
      return resolveTheme(config).palette;
    } catch {
      return null;
    }
  }, [event.eventTheme]);

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Check if sold out (all tickets are sold out)
  const isSoldOut =
    event.eventTickets &&
    event.eventTickets.length > 0 &&
    event.eventTickets.every((ticket) => ticket.isSoldOut);

  // Get minimum price from available public tickets
  const getMinPrice = () => {
    const availableTickets = event.eventTickets?.filter(
      (ticket) =>
        !ticket.isPrivate && ticket.isAvailable && !ticket.isSoldOut
    );
    if (!availableTickets || availableTickets.length === 0) return null;

    const prices = availableTickets.map((ticket) => parseFloat(ticket.price));
    return Math.min(...prices);
  };

  const minPrice = getMinPrice();

  const formatPrice = () => {
    if (isSoldOut) return "Sold Out";
    if (minPrice === null) return null;
    if (minPrice === 0) return "Free";
    return `From £${minPrice.toFixed(2)}`;
  };

  // Check if event is currently ongoing
  const now = new Date();
  const isOngoing =
    new Date(event.startDateTime) <= now && new Date(event.endDateTime) > now;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(e, event);
    }
  };

  // Auto-overflow categories and subcategories
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const categoryWidthsRef = useRef<number[]>([]);

  // Combine categories and subcategories for display
  const allTags = [
    ...(event.categories?.map(c => ({ ...c, type: 'category' as const })) ?? []),
    ...(event.subcategories?.map(s => ({ ...s, type: 'subcategory' as const })) ?? []),
  ];

  const [visibleCount, setVisibleCount] = useState(allTags.length);

  const calculateVisibleCategories = useCallback(() => {
    const container = categoriesContainerRef.current;
    if (!container || !allTags.length) return;

    const children = Array.from(container.children) as HTMLElement[];
    const containerWidth = container.offsetWidth;
    const gap = 6; // gap-1.5 = 0.375rem = 6px
    const overflowBadgeWidth = 40; // approximate width for "+N" badge

    // Measure and store widths on first run (when all items are visible)
    if (categoryWidthsRef.current.length !== allTags.length) {
      categoryWidthsRef.current = children
        .filter((child) => !child.dataset.overflow)
        .map((child) => child.offsetWidth);
    }

    const widths = categoryWidthsRef.current;
    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < widths.length; i++) {
      const childWidth = widths[i];
      const widthWithGap = totalWidth + childWidth + (count > 0 ? gap : 0);

      // Check if we need space for overflow badge
      const remainingItems = allTags.length - (count + 1);
      const needsOverflowBadge = remainingItems > 0;
      const requiredWidth = needsOverflowBadge
        ? widthWithGap + gap + overflowBadgeWidth
        : widthWithGap;

      if (requiredWidth <= containerWidth) {
        totalWidth = widthWithGap;
        count++;
      } else {
        break;
      }
    }

    setVisibleCount(Math.max(1, count)); // show at least 1
  }, [allTags.length]);

  useEffect(() => {
    // Reset stored widths when categories/subcategories change
    categoryWidthsRef.current = [];
    setVisibleCount(allTags.length);
  }, [event.categories, event.subcategories, allTags.length]);

  useEffect(() => {
    // Small delay to ensure DOM is ready for measurement
    const timer = setTimeout(calculateVisibleCategories, 0);

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleCategories();
    });

    if (categoriesContainerRef.current) {
      resizeObserver.observe(categoriesContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [calculateVisibleCategories]);

  return (
    <Link
      href={
        linkToManagement
          ? `/event-management/${event.id}`
          : `/events/${event.id}`
      }
      onClick={handleClick}
      className="group relative flex gap-4 rounded-2xl transition-all py-4 pl-2"
    >
      {/* Status Badges */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        {/* Private/Invite-Only Event Badge */}
        {/* {event.isPrivate && (
          <div className="group/private flex items-center gap-1 rounded-full bg-purple-500/90 px-1.5 py-0.5 backdrop-blur-sm transition-all duration-200">
            <Lock className="h-2.5 w-2.5 text-white" />
            <span className="max-w-0 overflow-hidden text-[10px] font-semibold text-white transition-all duration-200 group-hover/private:max-w-[50px] group-hover/private:ml-0.5">PRIVATE</span>
          </div>
        )} */}
        {/* Virtual/Hybrid Event Badge */}
        {/* {isHybridEvent(event.format) ? (
          <div className="group/hybrid flex items-center gap-1 rounded-full bg-violet-500/90 px-1.5 py-0.5 backdrop-blur-sm transition-all duration-200">
            <Video className="h-2.5 w-2.5 text-white" />
            <span className="max-w-0 overflow-hidden text-[10px] font-semibold text-white transition-all duration-200 group-hover/hybrid:max-w-[80px] group-hover/hybrid:ml-0.5">Live + Online</span>
          </div>
        ) : isVirtualEvent(event.format) && (
          <div className="group/virtual flex items-center gap-1 rounded-full bg-blue-500/90 px-1.5 py-0.5 backdrop-blur-sm transition-all duration-200">
            <Video className="h-2.5 w-2.5 text-white" />
            <span className="max-w-0 overflow-hidden text-[10px] font-semibold text-white transition-all duration-200 group-hover/virtual:max-w-[50px] group-hover/virtual:ml-0.5">Online</span>
          </div>
        )} */}
        {/* Verified Badge */}
        {event.isVerified && (
          <VerifiedBadge size="sm" />
        )}
        {/* Ongoing Badge */}
        {isOngoing && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-1.5 py-0.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
            </span>
            <span className="text-[10px] font-semibold text-white">LIVE</span>
          </div>
        )}
      </div>
      {/* Event Image */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl bg-card-secondary-background">
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
            style={{ backgroundColor: themePalette?.pageBackground ?? event.eventColor }}
          >
            <Calendar className="h-8 w-8" style={{ color: themePalette?.subTextColor ?? "rgba(255,255,255,0.5)" }} />
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Date/Time */}
        <span className={`mb-1 flex items-center gap-1.5 text-sm ${textMuted}`}>
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          {showDate && <>{formatDate(event.startDateTime)} &middot; </>}
          {formatTime(event.startDateTime)}
        </span>

        {/* Event Name */}
        <h3 className={`mb-1 truncate text-base font-semibold ${textPrimary} ${hoverPrimary}`}>
          {event.name}
        </h3>

        {/* Row 1: Address */}
        {isVirtualEvent(event.format) ? (
          <div className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
            <Video className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
            <span className="truncate text-blue-400">Online Event</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {event.address &&
              event.address.city &&
              event.address.city !== "TBD" && (
                <div className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {event.address.city}
                    {event.address.zipcode && (", " + event.address.zipcode)}
                  </span>
                </div>
              )}
            {isHybridEvent(event.format) && (
              <span className={`flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-xs ${textMuted} flex-shrink-0`}>
                <span>+</span>
                <Video className="h-3 w-3 flex-shrink-0" />
                <span>Online</span>
              </span>
            )}
          </div>
        )}

        {/* Row 2: Price */}
        {formatPrice() && (
          <div
            className={`mt-1 flex items-center gap-1.5 text-sm ${
              isSoldOut
                ? "text-red-400"
                : minPrice === 0
                ? "text-green-400"
                : "text-warning"
            }`}
          >
            <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={isSoldOut ? "font-medium" : ""}>
              {formatPrice()}
            </span>
          </div>
        )}

        {/* Row 3: Categories & Subcategories */}
        {showCategories && allTags.length > 0 && (
          <div
            ref={categoriesContainerRef}
            className="mt-1.5 flex items-center gap-1.5"
          >
            {allTags.map((tag, index) => (
              <span
                key={tag.id}
                className={`rounded-md border px-2 py-0.5 text-xs ${
                  tag.type === 'subcategory'
                    ? "border-purple-400/30 bg-purple-500/10 text-purple-400"
                    : `border-white/20 bg-transparent ${textMuted}`
                } ${index >= visibleCount ? "hidden" : ""}`}
              >
                {tag.name}
              </span>
            ))}
            {allTags.length > visibleCount && (
              <span
                data-overflow="true"
                className={`group/tooltip relative rounded-md border border-white/20 bg-transparent px-2 py-0.5 text-xs ${textMuted} cursor-default`}
              >
                +{allTags.length - visibleCount}
                <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {allTags
                    .slice(visibleCount)
                    .map((t) => t.name)
                    .join(", ")}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
