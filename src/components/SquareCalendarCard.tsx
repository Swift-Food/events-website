import Link from "next/link";
import Image from "next/image";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/types/calendar";
import VerifiedBadge from "@/components/VerifiedBadge";

interface SquareCalendarCardProps {
  calendar: Calendar;
  size?: number;
}

export default function SquareCalendarCard({ calendar, size }: SquareCalendarCardProps) {
  const eventCount = calendar.upcomingEventCount ?? 0;

  return (
    <Link
      href={`/calendars/${calendar.calendarUrl}`}
      className={`group relative block overflow-hidden rounded-2xl ${!size ? "w-full aspect-square" : ""}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Background Image or Color */}
      {calendar.calendarImage ? (
        <Image
          src={calendar.calendarImage}
          alt={calendar.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
        >
          <CalendarIcon className="h-12 w-12 text-white/30" />
        </div>
      )}

      {/* Verified Badge */}
      {calendar.isVerified && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 shadow-sm backdrop-blur-sm">
          <VerifiedBadge size="sm" showLabel />
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60%]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white text-base font-semibold line-clamp-2">
          {calendar.name}
        </h3>
        <p className="text-white/70 text-sm mt-0.5">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
