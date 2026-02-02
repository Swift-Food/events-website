"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import EventForm from "@/components/EventForm";

export default function EventCreationPage() {
 const { isAuthenticated, isLoading } = useAuth();
 const router = useRouter();

 useEffect(() => {
  if (!isLoading && !isAuthenticated) {
   router.push("/auth?redirect=/event-creation");
  }
 }, [isAuthenticated, isLoading, router]);

 if (isLoading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
   </div>
  );
 }

 if (!isAuthenticated) {
  return null;
 }
 
 return <div className="min-h-screen bg-background py-6"><EventForm mode="create" /></div>;
}
