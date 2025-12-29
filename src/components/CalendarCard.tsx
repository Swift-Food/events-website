import Link from "next/link";
import Image from "next/image";
import { Calendar as CalendarIcon, MapPin, Users, Briefcase, User } from "lucide-react";
import { Calendar, CalendarType } from "@/types/calendar";

interface CalendarCardProps {
  calendar: Calendar;
  isOwnedCalendar?: boolean;
}

export default function CalendarCard({ calendar, isOwnedCalendar = false }: CalendarCardProps) {
  const getTypeIcon = () => {
    return calendar.calendarType === CalendarType.TEAM ? (
      <Briefcase className="h-3 w-3" />
    ) : (
      <User className="h-3 w-3" />
    );
  };

  const getTypeBadgeColors = () => {
    return calendar.calendarType === CalendarType.TEAM
      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
      : "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  return (
    <Link
      href={isOwnedCalendar ? `/calendars/${calendar.calendarUrl}/edit` : `/calendars/${calendar.calendarUrl}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card-background transition-all hover:border-white/20 hover:shadow-2xl"
    >
      {/* Type Badge */}
      <div className="absolute right-3 top-3 z-10">
        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${getTypeBadgeColors()}`}
        >
          {getTypeIcon()}
          {calendar.calendarType === CalendarType.TEAM ? "Team" : "Personal"}
        </span>
      </div>

      {/* Calendar Image */}
      <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden bg-card-secondary-background">
        {calendar.calendarImage ? (
          <Image
            src={calendar.calendarImage}
            alt={calendar.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
          >
            <CalendarIcon className="h-16 w-16 text-white/50" />
          </div>
        )}
      </div>

      {/* Calendar Details */}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary">
            {calendar.name}
          </h3>

          {/* Description */}
          {calendar.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {calendar.description.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
            </p>
          )}

          {/* Location */}
          {calendar.address && calendar.address.city && (
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{calendar.address.city}</span>
            </div>
          )}

          {/* Subscriber Count */}
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {calendar.subscriberCount || 0} subscriber
              {calendar.subscriberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {calendar.isPublic ? (
              <span className="text-green-400">Public</span>
            ) : (
              <span className="text-amber-400">Private</span>
            )}
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
