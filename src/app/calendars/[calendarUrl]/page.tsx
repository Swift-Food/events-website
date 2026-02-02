import { notFound } from "next/navigation";
import { Calendar } from "@/types/calendar";
import CalendarClient from "./CalendarClient";
import type { Metadata } from "next";

interface PageProps {
 params: Promise<{ calendarUrl: string }>;
}

// Fetch calendar data server-side
async function getCalendar(calendarUrl: string): Promise<Calendar | null> {
 try {
  const res = await fetch(
   `${process.env.NEXT_PUBLIC_API_URL}/calendars/url/${calendarUrl}`,
   { cache: "no-store" }
  );

  if (!res.ok) {
   if (res.status === 404) return null;
   throw new Error("Failed to fetch calendar");
  }

  return res.json();
 } catch (error) {
  console.error("Error fetching calendar:", error);
  return null;
 }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 const { calendarUrl } = await params;
 const calendar = await getCalendar(calendarUrl);

 if (!calendar) {
  return {
   title: "Calendar Not Found",
  };
 }

 // Strip HTML tags from description
 const cleanDescription = calendar.description
  ? calendar.description.replace(/<[^>]*>/g, '').substring(0, 160)
  : undefined;

 return {
  title: calendar.name,
  description: cleanDescription,
  openGraph: {
   title: calendar.name,
   description: cleanDescription,
   images: calendar.calendarImage ? [calendar.calendarImage] : [],
  },
 };
}

export default async function CalendarPage({ params }: PageProps) {
 const { calendarUrl } = await params;
 const calendar = await getCalendar(calendarUrl);

 if (!calendar) {
  notFound();
 }

 return <CalendarClient initialCalendar={calendar} calendarUrl={calendarUrl} />;
}
