import Link from "next/link";
import Image from "next/image";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Calendar } from "@/types/calendar";

interface HorizontalCalendarCardProps {
  calendar: Calendar;
}

export default function HorizontalCalendarCard({ calendar }: HorizontalCalendarCardProps) {
  return (
    <Link
      href={`/calendars/${calendar.calendarUrl}`}
      className="group flex gap-3 h-[110px] rounded-xl border border-white/10 bg-card-background p-3 transition-all hover:border-white/20 hover:shadow-lg"
    >
      {/* Square Image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-card-secondary-background">
        {calendar.calendarImage ? (
          <Image
            src={calendar.calendarImage}
            alt={calendar.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
          >
            <CalendarIcon className="h-6 w-6 text-white/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary">
          {calendar.name}
        </h3>

        {/* Subscriber Count */}
        {(calendar.showSubscriberCount ?? true) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Users className="h-3 w-3" />
            <span>
              {calendar.subscriberCount || 0} subscriber{calendar.subscriberCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Description */}
        {calendar.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {calendar.description.replace(/<[^>]*>/g, '')}
          </p>
        )}
      </div>
    </Link>
  );
}
