import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventResponseDto } from "@/types/event";
import { EventThemeProvider } from "@/context/EventThemeContext";
import EmbedClient from "./EmbedClient";

interface PageProps {
 params: Promise<{ id: string }>;
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getEvent(eventId: string): Promise<EventResponseDto | null> {
 try {
  const res = await fetch(
   `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
   {
    cache: "no-store",
   }
  );

  if (!res.ok) {
   if (res.status === 404) {
    return null;
   }
   throw new Error("Failed to fetch event");
  }

  return res.json();
 } catch (error) {
  console.error("Error fetching event for embed:", error);
  return null;
 }
}

export async function generateMetadata({
 params,
}: PageProps): Promise<Metadata> {
 const { id } = await params;
 const event = await getEvent(id);

 if (!event) {
  return { title: "Event Not Found" };
 }

 return {
  title: `${event.name} - Prismo Embed`,
  robots: { index: false, follow: false },
 };
}

export default async function EmbedEventPage({
 params,
 searchParams,
}: PageProps) {
 const { id } = await params;
 const search = await searchParams;
 const event = await getEvent(id);

 if (!event) {
  notFound();
 }

  const layout = (search.layout as string) || "card";
  const show = (search.show as string) || "image,time,organizer,location,description,categories,tickets,cta";
  const theme = (search.theme as string) || "event";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventPageUrl = `${baseUrl}/events/${event.eventUrl || event.id}`;

  return (
   <EventThemeProvider themeJson={event.eventTheme}>
    <EmbedClient
     event={event}
     layout={layout}
     show={show}
     theme={theme}
     eventPageUrl={eventPageUrl}
    />
   </EventThemeProvider>
 );
}
