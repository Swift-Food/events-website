import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { EventResponseDto } from "@/types/event";

interface HorizontalEventCardProps {
  event: EventResponseDto;
  isHostedEvent?: boolean;
}

export default function HorizontalEventCard({
  event,
  isHostedEvent = false,
}: HorizontalEventCardProps) {
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get public tickets
  const publicTickets = event.eventTickets?.filter(
    (ticket) => !ticket.isPrivate
  );

  // Check if sold out (all public tickets have no quantity left)
  const isSoldOut =
    publicTickets &&
    publicTickets.length > 0 &&
    publicTickets.every((ticket) => ticket.quantityLeft === 0);

  // Get minimum price from available public tickets
  const getMinPrice = () => {
    const availableTickets = publicTickets?.filter(
      (ticket) => ticket.isAvailable && ticket.quantityLeft > 0
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

  const primaryCategory = event.categories?.[0];

  return (
    <Link
      href={isHostedEvent ? `/event-management/${event.id}` : `/events/${event.id}`}
      className="group flex gap-4 rounded-2xl border border-white/10 bg-card-background p-4 transition-all hover:border-white/20 hover:shadow-2xl"
    >
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
        {/* Top row: Category and Time */}
        <div className="mb-1 flex items-center gap-3">
          {primaryCategory && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {primaryCategory.name}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {formatTime(event.startDateTime)}
          </span>
        </div>

        {/* Event Name */}
        <h3 className="mb-1 truncate text-base font-semibold text-foreground group-hover:text-primary">
          {event.name}
        </h3>

        {/* Location */}
        {event.address &&
          event.address.city &&
          event.address.city !== "TBD" && (
            <div className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {event.address.city}, {event.address.zipcode}
              </span>
            </div>
          )}

        {/* Price */}
        {formatPrice() && (
          <div className={`flex items-center gap-1.5 text-sm ${isSoldOut ? "text-red-400" : "text-muted-foreground"}`}>
            <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={isSoldOut ? "font-medium" : ""}>{formatPrice()}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
