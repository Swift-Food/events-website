import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users } from "lucide-react";
import { EventResponseDto, EventStatus } from "@/types/event";

interface EventCardProps {
  event: EventResponseDto;
  isHostedEvent?: boolean;
}

export default function EventCard({ event, isHostedEvent = false }: EventCardProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const totalTicketsSold = event.eventTickets?.reduce(
    (sum, ticket) => sum + ticket.quantitySold,
    0
  ) || 0;

  // Check if event is currently ongoing
  const now = new Date();
  const isOngoing =
    new Date(event.startDateTime) <= now &&
    new Date(event.endDateTime) > now;

  return (
    <Link
      href={isHostedEvent ? `/event-management/${event.id}` : `/events/${event.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card-background transition-all hover:border-white/20 hover:shadow-2xl"
    >
      {/* Ongoing Badge */}
      {isOngoing && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-green-500/90 px-2 py-1 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
          </span>
          <span className="text-xs font-semibold text-white">LIVE</span>
        </div>
      )}
      {/* Event Image */}
      <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden bg-card-secondary-background">
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
      </div>

      {/* Event Details */}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary">
            {event.name}
          </h3>

          {/* Date */}
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.startDateTime)}</span>
          </div>

          {/* Location */}
          {event.address &&
            event.address.city &&
            event.address.city !== "TBD" && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">
                  {event.address.city}, {event.address.zipcode}
                </span>
              </div>
            )}

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
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {totalTicketsSold} attendee
              {totalTicketsSold !== 1 ? "s" : ""}
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
