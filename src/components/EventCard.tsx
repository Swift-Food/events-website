import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users } from "lucide-react";
import { EventResponseDto, EventStatus } from "@/types/event";

interface EventCardProps {
  event: EventResponseDto;
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Link
      href={`/events/${event.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-card-background transition-all hover:border-white/20 hover:shadow-2xl"
    >
      {/* Event Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-card-secondary-background">
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
            style={{ backgroundColor: event.eventColor }}
          >
            <Calendar className="h-16 w-16 text-white/50" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
              event.status === EventStatus.PUBLISHED
                ? "bg-green-500/80 text-white"
                : event.status === EventStatus.CANCELLED
                ? "bg-red-500/80 text-white"
                : "bg-gray-500/80 text-white"
            }`}
          >
            {event.status}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary">
          {event.name}
        </h3>

        {/* Date */}
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.startDateTime)}</span>
        </div>

        {/* Location */}
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">
            {event.address.city}, {event.address.zipcode}
          </span>
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {event.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground"
              >
                {category.name}
              </span>
            ))}
            {event.categories.length > 2 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                +{event.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {event.attendeesCount || 0} attendee
              {event.attendeesCount !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
