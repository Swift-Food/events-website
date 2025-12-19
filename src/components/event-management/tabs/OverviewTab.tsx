"use client";

import { EventResponseDto } from "@/types";
import { Calendar, MapPin, Edit, Users, ImageIcon, Eye } from "lucide-react";
import Image from "next/image";

interface OverviewTabProps {
  eventData: EventResponseDto;
  onEditClick: () => void;
}

export function OverviewTab({ eventData, onEditClick }: OverviewTabProps) {
  const formatDate = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sameDay = start.toDateString() === end.toDateString();

    const startFormatted = start.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (sameDay) {
      return startFormatted;
    }

    const endFormatted = end.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  const formatTime = (startDate: string | Date, endDate: string | Date) => {
    const formatSingleTime = (date: string | Date) => {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };
    return `${formatSingleTime(startDate)} - ${formatSingleTime(endDate)}`;
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
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-700 bg-card-background p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Event Image */}
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-card-secondary-background">
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
                <ImageIcon className="h-12 w-12 text-white/30" />
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1">
            {/* Header with title, badges, and edit button */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{eventData.name}</h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-md bg-green-500/20 px-2 py-0.5 text-xs font-medium capitalize text-green-400">
                    {eventData.status}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-neutral-400">
                    <Eye className="h-4 w-4" />
                    {eventData.viewCount || 0}
                  </span>
                </div>
              </div>
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 rounded-md border border-neutral-700 bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
              >
                <Edit className="h-4 w-4" />
                Edit Event Details
              </button>
            </div>

            {/* Info Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* When */}
              <div className="rounded-lg border border-neutral-700 bg-card-secondary-background p-4">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">When</span>
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {formatDate(eventData.startDateTime, eventData.endDateTime)}
                </p>
                <p className="text-sm text-neutral-400">
                  {formatTime(eventData.startDateTime, eventData.endDateTime)}
                </p>
              </div>

              {/* Where */}
              <div className="rounded-lg border border-neutral-700 bg-card-secondary-background p-4">
                <div className="flex items-center gap-2 text-neutral-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Where</span>
                </div>
                {eventData.address ? (
                  <>
                    <p className="mt-2 font-medium text-foreground">
                      {eventData.address.addressLine1}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {eventData.address.city}, {eventData.address.zipcode}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-neutral-400">Location TBD</p>
                )}
              </div>

              {/* Attendees */}
              <div className="rounded-lg border border-neutral-700 bg-card-secondary-background p-4">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Attendees</span>
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {ticketStats.totalSold} registered
                </p>
                <p className="text-sm text-neutral-400">
                  {ticketStats.totalLeft} tickets left
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {eventData.categories && eventData.categories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
