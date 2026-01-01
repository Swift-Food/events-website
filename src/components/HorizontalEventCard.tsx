import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket, Video, Lock } from "lucide-react";
import { EventResponseDto } from "@/types/event";
import { isVirtualEvent } from "@/types/event/status";

interface HorizontalEventCardProps {
  event: EventResponseDto;
  isHostedEvent?: boolean;
  onClick?: (e: React.MouseEvent, event: EventResponseDto) => void;
}

export default function HorizontalEventCard({
  event,
  isHostedEvent = false,
  onClick,
}: HorizontalEventCardProps) {
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if sold out (all tickets have no quantity left)
  const isSoldOut =
    event.eventTickets &&
    event.eventTickets.length > 0 &&
    event.eventTickets.every((ticket) => ticket.quantityLeft === 0);

  // Get minimum price from available public tickets
  const getMinPrice = () => {
    const availableTickets = event.eventTickets?.filter(
      (ticket) => !ticket.isPrivate && ticket.isAvailable && ticket.quantityLeft > 0
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
    new Date(event.startDateTime) <= now &&
    new Date(event.endDateTime) > now;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(e, event);
    }
  };

  return (
    <Link
      href={isHostedEvent ? `/event-management/${event.id}` : `/events/${event.id}`}
      onClick={handleClick}
      className="group relative flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-card-background p-4 transition-all hover:border-white/20 hover:shadow-2xl"
    >
      {/* Status Badges */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        {/* Private/Invite-Only Event Badge */}
        {event.isPrivate && (
          <div className="group/private flex items-center gap-1 rounded-full bg-purple-500/90 px-1.5 py-0.5 backdrop-blur-sm transition-all duration-200">
            <Lock className="h-2.5 w-2.5 text-white" />
            <span className="max-w-0 overflow-hidden text-[10px] font-semibold text-white transition-all duration-200 group-hover/private:max-w-[50px] group-hover/private:ml-0.5">PRIVATE</span>
          </div>
        )}
        {/* Virtual Event Badge */}
        {isVirtualEvent(event.format) && (
          <div className="flex items-center gap-1 rounded-full bg-blue-500/90 px-1.5 py-0.5 backdrop-blur-sm">
            <Video className="h-2.5 w-2.5 text-white" />
            <span className="text-[10px] font-semibold text-white">ONLINE</span>
          </div>
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
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-card-secondary-background">
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
            <Calendar className="h-8 w-8 text-white/50" />
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Time */}
        <span className="mb-1 text-sm text-muted-foreground">
          {formatTime(event.startDateTime)}
        </span>

        {/* Event Name */}
        <h3 className="mb-1 truncate text-base font-semibold text-foreground group-hover:text-primary">
          {event.name}
        </h3>

        {/* Location & Price Row */}
        <div className="flex items-center gap-3">
          {/* Location */}
          {isVirtualEvent(event.format) ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Video className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
              <span className="truncate text-blue-400">Online Event</span>
            </div>
          ) : event.address &&
            event.address.city &&
            event.address.city !== "TBD" && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {event.address.city}, {event.address.zipcode}
                </span>
              </div>
            )}

          {/* Price */}
          {formatPrice() && (
            <div className={`flex items-center gap-1.5 text-sm flex-shrink-0 ${
              isSoldOut ? "text-red-400" : minPrice === 0 ? "text-green-400" : "text-orange-400"
            }`}>
              <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
              <span className={isSoldOut ? "font-medium" : ""}>{formatPrice()}</span>
            </div>
          )}
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {event.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-md border border-white/20 bg-transparent px-2 py-0.5 text-xs text-muted-foreground"
              >
                {category.name.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
