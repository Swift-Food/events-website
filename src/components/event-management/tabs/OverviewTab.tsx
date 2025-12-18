"use client";

import { EventResponseDto } from "@/types";
import { Calendar, MapPin, Clock, Edit, Users, ImageIcon } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
          {/* <h2 className="text-xl font-bold text-foreground">Event Details</h2> */}
      <div className="">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Event Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card-secondary-background lg:aspect-square lg:w-48 lg:shrink-0">
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

          {/* Event Info Grid */}
          <div className="grid flex-1 gap-6 sm:grid-cols-2">
            {/* When */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">When</p>
                <p className="text-foreground">{formatDate(eventData.startDateTime)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(eventData.startDateTime)} - {formatTime(eventData.endDateTime)}
                </p>
              </div>
            </div>

            {/* Where */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Where</p>
                {eventData.address ? (
                  <>
                    <p className="text-foreground">{eventData.address.addressLine1}</p>
                    <p className="text-sm text-muted-foreground">
                      {eventData.address.city}, {eventData.address.zipcode}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Location TBD</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendees</p>
                <p className="text-foreground">{eventData.attendeesCount || 0} registered</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-foreground capitalize">{eventData.status}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 rounded-md bg-card-secondary-background px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Edit className="h-4 w-4" />
            Edit Event Details
          </button>
        </div>
      </div>
    </div>
  );
}
