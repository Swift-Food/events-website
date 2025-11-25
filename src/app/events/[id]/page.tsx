"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { eventsApi } from "@/services/events";
import { EventResponseDto, EventStatus } from "@/types/event";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  User,
  Ticket,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import GoogleMap from "@/components/GoogleMap";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await eventsApi.findById(eventId);
        console.log("Event data: ", data);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <button
            onClick={() => router.push("/events")}
            className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Events
          </button>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-12 text-center">
            <p className="mb-4 text-lg text-red-400">
              {error || "Event not found"}
            </p>
            <button
              onClick={() => router.push("/events")}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    [EventStatus.PUBLISHED]:
      "bg-green-500/20 text-green-400 border-green-500/30",
    [EventStatus.DRAFT]: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    [EventStatus.ONGOING]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    [EventStatus.CANCELLED]: "bg-red-500/20 text-red-400 border-red-500/30",
    [EventStatus.COMPLETED]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/events")}
          className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Events
        </button>

        {/* Hero Image */}
        <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-card-secondary-background">
          {event.eventImage ? (
            <Image
              src={event.eventImage}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{ backgroundColor: event.eventColor }}
            >
              <Calendar className="h-24 w-24 text-white/30" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute right-6 top-6">
            <span
              className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md ${
                statusColors[event.status]
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2">
            {/* Event Title */}
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
              {event.name}
            </h1>

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {event.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-foreground"
                    style={
                      category.color
                        ? {
                            borderColor: category.color + "40",
                            color: category.color,
                          }
                        : undefined
                    }
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                About this event
              </h2>
              <div
                className="tiptap-editor tiptap-view-mode"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>

            {/* Event URL */}
            {/* {event.eventUrl && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                  More Information
                </h2>
                <a
                  href={event.eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
                >
                  <ExternalLink className="h-5 w-5" />
                  Visit Event Website
                </a>
              </div>
            )} */}

            {/* Tickets */}
            {event.eventTickets && event.eventTickets.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                  Tickets
                </h2>
                <div className="space-y-3">
                  {event.eventTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-card-background p-4"
                    >
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {ticket.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.quantity - ticket.quantitySold} left
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          {Number(ticket.price) === 0
                            ? "Free"
                            : `$${Number(ticket.price).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Event Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Date & Time Card */}
              <div className="rounded-xl border border-white/10 bg-card-background p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Date & Time
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center py-1">
                    <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                    <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                    <div className="h-3 w-3 rounded-full bg-primary/30 shadow-md"></div>
                  </div>
                  <div className="flex-1">
                    {isSameDay(event.startDateTime, event.endDateTime) ? (
                      <>
                        <p className="font-medium text-foreground">
                          {formatDate(event.startDateTime)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.startDateTime)} -{" "}
                          {formatTime(event.endDateTime)}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Start
                          </p>
                          <p className="font-medium text-foreground">
                            {formatDate(event.startDateTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(event.startDateTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            End
                          </p>
                          <p className="font-medium text-foreground">
                            {formatDate(event.endDateTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(event.endDateTime)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="rounded-xl border border-white/10 bg-card-background p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Location
                </h3>
                <div className="mb-4 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    {/* <p className="font-medium text-foreground">
                      {event.address.name}
                    </p> */}
                    <p className="text-sm text-muted-foreground">
                      {event.address.addressLine1}
                    </p>
                    {event.address.addressLine2 && (
                      <p className="text-sm text-muted-foreground">
                        {event.address.addressLine2}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {event.address.city}, {event.address.zipcode}
                    </p>
                  </div>
                </div>

                {/* Google Map */}
                <GoogleMap
                  latitude={event.address.location?.latitude}
                  longitude={event.address.location?.longitude}
                  title={event.address.name}
                  className="h-64 w-full"
                />
              </div>

              {/* Organizer Card */}
              <div className="rounded-xl border border-white/10 bg-card-background p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Organized by
                </h3>
                <div className="flex items-center gap-3">
                  {event.owner.profilePicture ? (
                    <Image
                      src={event.owner.profilePicture}
                      alt={event.owner.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {event.owner.username}
                    </p>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="rounded-xl border border-white/10 bg-card-background p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Event Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span>Attendees</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {event.attendeesCount || 0}
                    </span>
                  </div>
                  {event.ticketsSoldCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-5 w-5" />
                        <span>Tickets Sold</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {event.ticketsSoldCount}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {event.viewCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Register Button */}
              {event.status === EventStatus.PUBLISHED && (
                <button className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/80">
                  Register for Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tiptap Styling */}
      <style jsx global>{`
        .tiptap-editor {
          color: white;
        }

        .tiptap-editor .ProseMirror {
          outline: none;
        }

        .tiptap-editor h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 2.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: white;
        }

        .tiptap-editor h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 2.25rem;
          margin-top: 0.875rem;
          margin-bottom: 0.875rem;
          color: white;
        }

        .tiptap-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 2rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          color: white;
        }

        .tiptap-editor p {
          font-size: 1rem;
          line-height: 1.75rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .tiptap-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tiptap-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .tiptap-editor li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .tiptap-editor hr {
          border: none;
          border-top: 2px solid rgba(255, 255, 255, 0.2);
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .tiptap-editor blockquote {
          border-left: 4px solid rgba(255, 255, 255, 0.3);
          padding-left: 1rem;
          margin-left: 0;
          margin-top: 1rem;
          margin-bottom: 1rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
        }

        .tiptap-editor strong {
          font-weight: 700;
        }

        .tiptap-editor em {
          font-style: italic;
        }

        .tiptap-editor code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .tiptap-editor a {
          color: #60a5fa;
          text-decoration: underline;
          transition: color 150ms;
        }

        .tiptap-editor a:hover {
          color: #93c5fd;
        }

        .tiptap-view-mode a {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}
