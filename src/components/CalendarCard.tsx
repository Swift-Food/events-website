import Link from "next/link";
import Image from "next/image";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Calendar } from "@/types/calendar";

interface CalendarCardProps {
  calendar: Calendar;
}

export default function CalendarCard({ calendar }: CalendarCardProps) {
  return (
    <Link
      href={`/calendars/${calendar.calendarUrl}`}
      className="group w-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card-background transition-all hover:border-white/20 hover:shadow-lg"
    >
      {/* Calendar Image */}
      <div className="relative aspect-[16/9] w-full flex-shrink-0 overflow-hidden bg-card-secondary-background">
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
            <CalendarIcon className="h-12 w-12 text-white/50" />
          </div>
        )}

      </div>

      {/* Calendar Details */}
      <div className="flex flex-col flex-1 p-3">
        <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary">
          {calendar.name}
        </h3>

        {/* Description */}
        {calendar.description && (
          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
            {calendar.description.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {/* Subscriber Count - pushed to bottom */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
          <Users className="h-3 w-3" />
          <span>
            {calendar.subscriberCount || 0} subscriber{calendar.subscriberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
