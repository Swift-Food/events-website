"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";
import { eventService } from "@/services/event.service";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";

export default function EventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<EventResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

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

        // Authorization check
        if (user && data.owner?.user?.id) {
          const authorized = user.id === data.owner.user.id;
          setIsAuthorized(authorized);

          if (!authorized) {
            setError("You are not authorized to manage this event");
            toast.error("You do not have permission to edit this event");
          }
        } else if (!user) {
          setIsAuthorized(false);
          setError("You must be logged in to manage events");
        }
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
  }, [eventId, user]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Authentication Required
          </h1>
          <p className="mb-6 text-muted-foreground">
            You must be logged in to manage events.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Unauthorized Access
          </h1>
          <p className="mb-6 text-muted-foreground">
            You do not have permission to manage this event. Only the event
            owner can edit event details.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/events")}
              className="rounded-full bg-card-secondary-background px-6 py-3 font-semibold text-foreground transition-all hover:bg-white/15"
            >
              Browse Events
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              My Profile
            </button>
          </div>
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
