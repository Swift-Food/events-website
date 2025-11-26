"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";
import { eventService } from "@/services/event.service";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";

export default function EventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [eventData, setEventData] = useState<EventResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Event ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await eventService.getEventById(eventId);
        console.log("Event management fetched data: ", data);
        setEventData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching event:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to load event";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Failed to Load Event
          </h1>
          <p className="mb-6 text-muted-foreground">
            {error || "The event could not be found or loaded."}
          </p>
          <button
            onClick={() => router.push("/events")}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return <EventForm mode="edit" eventId={eventId} initialData={eventData} />;
}
