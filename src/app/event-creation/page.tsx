"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import EventForm from "@/components/EventForm";

function EventCreationContent() {
 const { isAuthenticated, isLoading } = useAuth();
 const router = useRouter();
 const searchParams = useSearchParams();
 const calendarId = searchParams.get("calendarId");

 useEffect(() => {
  document.querySelector("main")?.scrollTo(0, 0);
 }, []);

 useEffect(() => {
  if (!isLoading && !isAuthenticated) {
   router.push("/auth?redirect=/event-creation");
  }
 }, [isAuthenticated, isLoading, router]);

 if (isLoading) {
  return (
   <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
   </div>
  );
 }

 if (!isAuthenticated) {
  return null;
 }

 return <div className="min-h-screen py-6"><EventForm mode="create" initialCalendarId={calendarId ?? undefined} /></div>;
}

export default function EventCreationPage() {
 return (
  <Suspense fallback={
   <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
   </div>
  }>
   <EventCreationContent />
  </Suspense>
 );
}
