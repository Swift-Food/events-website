"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventService } from "@/services/event.service";
import { EventResponseDto } from "@/types";
import EventForm from "@/components/EventForm";
import { toast } from "sonner";

export default function EventEditPage() {
 const params = useParams();
 const router = useRouter();
 const eventId = params.id as string;
 const { isAuthenticated, isLoading: authLoading } = useAuth();

 const [eventData, setEventData] = useState<EventResponseDto | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
  if (!authLoading && !isAuthenticated) {
   router.push(`/auth?redirect=/event-management/${eventId}/edit`);
  }
 }, [isAuthenticated, authLoading, router, eventId]);

 useEffect(() => {
  if (!eventId || !isAuthenticated) return;
  const fetchEvent = async () => {
   try {
    setIsLoading(true);
    const data = await eventService.getEventById(eventId);
    setEventData(data);
   } catch (err: any) {
    console.error("Error fetching event:", err);
    toast.error(err.response?.data?.message || "Failed to load event");
    router.push(`/event-management/${eventId}`);
   } finally {
    setIsLoading(false);
   }
  };
  fetchEvent();
 }, [eventId, isAuthenticated, router]);

 if (authLoading || isLoading) {
  return (
   <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
   </div>
  );
 }

 if (!isAuthenticated || !eventData) {
  return null;
 }

 return (
  <div className="py-6">
   <EventForm
    mode="edit"
    fullPage
    eventId={eventId}
    initialData={eventData}
    eventStatus={eventData.status}
    onSaveSuccess={() => router.push(`/event-management/${eventId}`)}
   />
  </div>
 );
}
