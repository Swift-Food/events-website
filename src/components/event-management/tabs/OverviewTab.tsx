"use client";

import { EventResponseDto } from "@/types";
import { MapPin, Edit, Users, ImageIcon } from "lucide-react";
import Image from "next/image";

interface OverviewTabProps {
  eventData: EventResponseDto;
  onEditClick: () => void;
}

export function OverviewTab({ eventData, onEditClick }: OverviewTabProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isSameDay = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getTicketStats = () => {
    if (!eventData.eventTickets || eventData.eventTickets.length === 0) {
      return { totalSold: 0, totalLeft: 0 };
    }
    return eventData.eventTickets.reduce(
      (acc, ticket) => ({
        totalSold: acc.totalSold + ticket.quantitySold,
        totalLeft: acc.totalLeft + ticket.quantityLeft,
      }),
      { totalSold: 0, totalLeft: 0 }
    );
  };

  const ticketStats = getTicketStats();

  return (
    <div className="space-y-6 bg-card-background p-4 sm:p-6 rounded-xl">
      {/* Header row: Image, Title, Badge, Edit button (desktop) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Event Image */}
          <div className="relative h-16 w-16 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-card-secondary-background">
            {eventData.eventImage ? (
              <Image
                src={eventData.eventImage}
                alt={eventData.name}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: eventData.eventColor || "#3b82f6" }}
              >
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
              </div>
            )}
          </div>

          {/* Title and badge */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                {eventData.name}
              </h2>
              <span className="self-start sm:self-center rounded-md bg-green-500/20 px-2 py-0.5 text-xs font-medium capitalize text-green-400 shrink-0">
                {eventData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Edit button - desktop only */}
        <button
          onClick={onEditClick}
          className="hidden sm:flex items-center gap-2 rounded-md border border-neutral-700 bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
        >
          <Edit className="h-4 w-4" />
          Edit Event Details
        </button>
      </div>

      {/* Categories */}
      {eventData.categories && eventData.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {eventData.categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full border border-neutral-700 bg-card-secondary-background px-3 py-1 text-sm text-foreground"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}

      {/* Info Row */}
      <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
        {/* When */}
        <div className="flex gap-4">
          {isSameDay(eventData.startDateTime, eventData.endDateTime) ? (
            <>
              <div className="flex flex-col items-center py-1">
                <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {formatDate(eventData.startDateTime)}
                </p>
                <p className="text-sm text-neutral-400">
                  {formatTime(eventData.startDateTime)} - {formatTime(eventData.endDateTime)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center py-1">
                <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                <div className="h-3 w-3 rounded-full bg-primary/30 shadow-md"></div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Start
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(eventData.startDateTime)}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {formatTime(eventData.startDateTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    End
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(eventData.endDateTime)}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {formatTime(eventData.endDateTime)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Where */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-neutral-400">Where</p>
            {eventData.address ? (
              <>
                <p className="font-medium text-foreground">
                  {eventData.address.addressLine1}
                </p>
                <p className="text-sm text-neutral-400">
                  {eventData.address.city}, {eventData.address.zipcode}
                </p>
              </>
            ) : (
              <p className="text-neutral-400">Location TBD</p>
            )}
          </div>
        </div>

        {/* Attendees */}
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-neutral-400">Attendees</p>
            <p className="font-medium text-foreground">
              {ticketStats.totalSold} registered
            </p>
            <p className="text-sm text-neutral-400">
              {eventData.viewCount || 0} views
            </p>
          </div>
        </div>
      </div>

      {/* Edit Button - mobile only */}
      <div className="flex justify-end sm:hidden">
        <button
          onClick={onEditClick}
          className="flex items-center gap-2 rounded-md border border-neutral-700 bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
        >
          <Edit className="h-4 w-4" />
          Edit Event Details
        </button>
      </div>
    </div>
  );
}
