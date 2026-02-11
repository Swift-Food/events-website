"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { calendarService } from "@/services/calendar.service";
import { highlightService } from "@/services/highlight.service";
import { useAuth } from "@/lib/auth/authContext";
import { Calendar, CalendarRole, CalendarEventsFilter } from "@/types/calendar";
import { EventResponseDto } from "@/types/event";
import { HighlightResponseDto } from "@/types/highlight";
import {
 Calendar as CalendarIcon,
 MapPin,
 User,
 BellOff,
 Trash2,
 Crown,
 Shield,
 Edit3,
 Plus,
 ChevronDown,
 CalendarPlus,
 ListPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import EventsTimeline from "@/components/EventsTimeline";
import AddEventsToCalendarModal from "@/components/AddEventsToCalendarModal";
import { HighlightsBar, AddHighlightModal } from "@/components/highlights";
import EventCalendarWidget from "@/components/EventCalendarWidget";

interface CalendarClientProps {
 initialCalendar: Calendar;
 calendarUrl: string;
}

function AddEventDropdown({ calendarId, onAddExisting }: { calendarId: string; onAddExisting: () => void }) {
 const [isOpen, setIsOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (ref.current && !ref.current.contains(e.target as Node)) {
    setIsOpen(false);
   }
  };
  if (isOpen) document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [isOpen]);

 return (
  <div className="relative" ref={ref}>
   <button
    onClick={() => setIsOpen(!isOpen)}
    className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium text-white transition-all hover:bg-primary/80"
   >
    <Plus className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Add Event</span>
    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
   </button>
   {isOpen && (
    <div className="absolute right-0 top-full z-50 mt-1.5 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-card-background backdrop-blur-xl shadow-lg">
     <Link
      href={`/event-creation?calendarId=${calendarId}`}
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-white/5 transition-all"
      onClick={() => setIsOpen(false)}
     >
      <CalendarPlus className="h-4 w-4 text-muted-foreground" />
      Create New Event
     </Link>
     <button
      onClick={() => { onAddExisting(); setIsOpen(false); }}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-white/5 transition-all cursor-pointer"
     >
      <ListPlus className="h-4 w-4 text-muted-foreground" />
      Add Existing Event
     </button>
    </div>
   )}
  </div>
 );
}

export default function CalendarClient({
 initialCalendar,
 calendarUrl,
}: CalendarClientProps) {
 const router = useRouter();
 const { isAuthenticated, user, isLoading: authLoading } = useAuth();

 const [calendar, setCalendar] = useState<Calendar>(initialCalendar);
 const [events, setEvents] = useState<EventResponseDto[]>([]);
 const [activeTab, setActiveTab] = useState<CalendarEventsFilter>("upcoming");
 const [upcomingCount, setUpcomingCount] = useState(0);
 const [pastCount, setPastCount] = useState(0);
 const [isSubscribed, setIsSubscribed] = useState(false);
 const [loadingEvents, setLoadingEvents] = useState(true);
 const [loadingSubscription, setLoadingSubscription] = useState(false);

 // Check if user can manage this calendar and their role
 type UserRole = "owner" | "admin" | "contributor" | null;
 const [userRole, setUserRole] = useState<UserRole>(null);

 // Add events modal state
 const [showAddEventsModal, setShowAddEventsModal] = useState(false);

 // Highlights state
 const [highlights, setHighlights] = useState<HighlightResponseDto[]>([]);
 const [loadingHighlights, setLoadingHighlights] = useState(true);
 const [showAddHighlightModal, setShowAddHighlightModal] = useState(false);

 // Calendar widget state
 const [allEvents, setAllEvents] = useState<EventResponseDto[]>([]);
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);

 // Re-fetch calendar data when user is authenticated
 useEffect(() => {
  const fetchAuthenticatedCalendarData = async () => {
   if (!isAuthenticated || authLoading) return;

   try {
    const data = await calendarService.getCalendarByUrl(calendarUrl);
    setCalendar(data);
    console.log("calender data", JSON.stringify(calendar))
   } catch (err) {
    console.error("Failed to fetch authenticated calendar data:", err);
   }
  };

  fetchAuthenticatedCalendarData();
 }, [isAuthenticated, authLoading, calendarUrl]);

 // Fetch calendar events
 useEffect(() => {
  const fetchEvents = async () => {
   try {
    setLoadingEvents(true);
    const response = await calendarService.getCalendarEvents(calendar.id, { filter: activeTab });
    setEvents(response.events);
    setUpcomingCount(response.upcomingCount);
    setPastCount(response.pastCount);
   } catch (err) {
    console.error("Failed to fetch calendar events:", err);
    toast.error("Failed to load calendar events");
   } finally {
    setLoadingEvents(false);
   }
  };

  fetchEvents();
 }, [calendar.id, activeTab]);

 // Fetch all events for calendar widget date highlighting
 useEffect(() => {
  const fetchAllEvents = async () => {
   try {
    const response = await calendarService.getCalendarEvents(calendar.id, { filter: "all" });
    setAllEvents(response.events);
   } catch (err) {
    console.error("Failed to fetch all events for calendar widget:", err);
   }
  };

  fetchAllEvents();
 }, [calendar.id]);

 // Check if user is subscribed
 useEffect(() => {
  const checkSubscription = async () => {
   if (!isAuthenticated || authLoading) {
    setIsSubscribed(false);
    return;
   }

   try {
    const subscribed = await calendarService.isSubscribed(calendar.id);
    setIsSubscribed(subscribed);
   } catch (err) {
    console.error("Failed to check subscription status:", err);
   }
  };

  checkSubscription();
 }, [isAuthenticated, authLoading, calendar.id]);

 // Fetch highlights for the calendar
 useEffect(() => {
  const fetchHighlights = async () => {
   if (!calendar.ownerEventUserId) return;

   try {
    setLoadingHighlights(true);
    const response = await highlightService.getUserHighlights(
     calendar.ownerEventUserId,
     { calendarId: calendar.id }
    );
        console.log("hights", JSON.stringify(response))
    setHighlights(response.highlights);
   } catch (err) {
    console.error("Failed to fetch highlights:", err);
    // Silent fail - highlights are not critical
   } finally {
    setLoadingHighlights(false);
   }
  };

  fetchHighlights();
 }, [calendar.id, calendar.ownerEventUserId]);

 // Refresh highlights
 const refreshHighlights = async () => {
  if (!calendar.ownerEventUserId) return;

  try {
   const response = await highlightService.getUserHighlights(
    calendar.ownerEventUserId,
    { calendarId: calendar.id }
   );
   setHighlights(response.highlights);
  } catch (err) {
   console.error("Failed to refresh highlights:", err);
  }
 };

 // Check if user is owner or collaborator and determine role
 useEffect(() => {
  const checkUserRole = async () => {
   if (!calendar) return;

   if (!user && !authLoading) {
    setUserRole(null);
    return;
   }

   if (!user) return;

   // Check if user is the calendar owner
   const isOwner = calendar.owner?.user?.id === user.id;
   if (isOwner) {
    setUserRole("owner");
    return;
   }

   // Check if user is a collaborator
   try {
    const collaborators = await calendarService.getCollaborators(calendar.id);
    const collaborator = collaborators.find(
     (collab) =>
      collab.inviteAccepted && collab.eventUser?.id === user.eventUser?.id
    );
    if (collaborator) {
     if (collaborator.role === CalendarRole.ADMIN) {
      setUserRole("admin");
     } else {
      setUserRole("contributor");
     }
    } else {
     setUserRole(null);
    }
   } catch (err) {
    // User might not have permission to view collaborators
    setUserRole(null);
   }
  };

  checkUserRole();
 }, [calendar, user, authLoading]);

 const handleSubscribe = async () => {
  if (!isAuthenticated) {
   toast.error("Please log in to subscribe to this calendar");
   router.push(`/auth?redirect=/calendars/${calendar.calendarUrl}`);
   return;
  }

  try {
   setLoadingSubscription(true);
   if (isSubscribed) {
    await calendarService.unsubscribe(calendar.id);
    toast.success("Unsubscribed from calendar");
    setIsSubscribed(false);
    // Update subscriber count
    setCalendar((prev) => ({
     ...prev,
     subscriberCount: Math.max(0, prev.subscriberCount - 1),
    }));
   } else {
    await calendarService.subscribe(calendar.id);
    toast.success("Subscribed to calendar!");
    setIsSubscribed(true);
    // Update subscriber count
    setCalendar((prev) => ({
     ...prev,
     subscriberCount: prev.subscriberCount + 1,
    }));
   }
  } catch (error: any) {
   console.error("Failed to update subscription:", error);
   toast.error(
    error.response?.data?.message || "Failed to update subscription"
   );
  } finally {
   setLoadingSubscription(false);
  }
 };

 const handleDelete = async () => {
  if (
   !confirm(
    "Are you sure you want to delete this calendar? This action cannot be undone."
   )
  ) {
   return;
  }

  try {
   await calendarService.deleteCalendar(calendar.id);
   toast.success("Calendar deleted successfully");
   router.push("/calendars");
  } catch (error: any) {
   console.error("Failed to delete calendar:", error);
   toast.error(error.response?.data?.message || "Failed to delete calendar");
  }
 };

 const refreshEvents = async () => {
  try {
   const [tabResponse, allResponse] = await Promise.all([
    calendarService.getCalendarEvents(calendar.id, { filter: activeTab }),
    calendarService.getCalendarEvents(calendar.id, { filter: "all" }),
   ]);
   setEvents(tabResponse.events);
   setUpcomingCount(tabResponse.upcomingCount);
   setPastCount(tabResponse.pastCount);
   setAllEvents(allResponse.events);
  } catch (err) {
   console.error("Failed to refresh calendar events:", err);
  }
 };

 const canManage = userRole === "owner" || userRole === "admin";
 const isOwner = userRole === "owner";

 // Compute event dates for the calendar widget
 const eventDates = useMemo(() => {
  return allEvents.map((e) => new Date(e.startDateTime));
 }, [allEvents]);

 // Filter displayed events when a date is selected
 const displayedEvents = useMemo(() => {
  if (!selectedDate) return events;
  return allEvents.filter((e) => {
   const eventDate = new Date(e.startDateTime);
   return (
    eventDate.getFullYear() === selectedDate.getFullYear() &&
    eventDate.getMonth() === selectedDate.getMonth() &&
    eventDate.getDate() === selectedDate.getDate()
   );
  });
 }, [events, allEvents, selectedDate]);

 const handleDateSelect = (date: Date | null) => {
  setSelectedDate(date);
 };

 return (
  <div className="min-h-screen ">
   {/* Management Banner - Mobile */}
   {/* {canManage && (
    <div
     className={`sm:hidden border-y ${
      userRole === "owner"
       ? "border-amber-500/30 bg-amber-500/10"
       : "border-purple-500/30 bg-purple-500/10"
     }`}
    >
     <div className="px-6 py-3 flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-300">
       {userRole === "owner"
        ? "You own this calendar."
        : "You have manage access for this calendar."}
      </span>
      <Link
       href={`/calendars/${calendar.calendarUrl}/edit`}
       className={`shrink-0 flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
        userRole === "owner"
         ? "bg-amber-500 hover:bg-amber-600"
         : "bg-purple-500 hover:bg-purple-600"
       }`}
      >
       Manage
       <span className="text-xs">↗</span>
      </Link>
     </div>
    </div>
   )} */}

   <div className="mx-auto max-w-6xl px-6 pt-0 pb-8 sm:py-8">
    {/* Management Banner - Desktop */}
    {/* {canManage && (
     <div
      className={`hidden sm:flex mb-6 items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
       userRole === "owner"
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-purple-500/30 bg-purple-500/10"
      }`}
     >
      <div className="flex items-center gap-3">
       <span
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
         userRole === "owner"
          ? "bg-amber-500/30 text-amber-400"
          : "bg-purple-500/30 text-purple-400"
        }`}
       >
        {userRole === "owner" && <Crown className="h-3 w-3" />}
        {userRole === "admin" && <Shield className="h-3 w-3" />}
        {userRole === "owner" ? "Owner" : "Admin"}
       </span>
       <span className="text-sm text-neutral-300">
        {userRole === "owner"
         ? "You own this calendar."
         : "You have manage access for this calendar."}
       </span>
      </div>
      <Link
       href={`/calendars/${calendar.calendarUrl}/edit`}
       className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
        userRole === "owner"
         ? "bg-amber-500 hover:bg-amber-600"
         : "bg-purple-500 hover:bg-purple-600"
       }`}
      >
       Manage
       <span className="text-xs">↗</span>
      </Link>
     </div>
    )} */}

    {/* Banner Section - full bleed on mobile */}
    <div className="relative -mx-6 sm:mx-0 calendar-stagger-1">
     {/* Banner Image / Color */}
     <div
      className="relative aspect-[4/1] w-full overflow-hidden sm:rounded-2xl"
      style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
     >
      {(calendar.calendarBannerImageUrl || calendar.calendarImage) && (
       <Image
        src={calendar.calendarBannerImageUrl || calendar.calendarImage!}
        alt={`${calendar.name} banner`}
        fill
        className="object-cover"
        priority
       />
      )}
     </div>
    </div>

    {/* Profile image row with subscribe/manage buttons */}
    <div className="flex items-end justify-between mb-6 pl-4 pr-0 sm:px-6 -mt-12 sm:-mt-14 calendar-stagger-2">
     {/* Calendar Profile Image - overlapping banner */}
     <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-xl border-4 border-[var(--background)] bg-card-secondary-background shadow-lg shrink-0">
      {calendar.calendarImage ? (
       <Image
        src={calendar.calendarImage}
        alt={calendar.name}
        fill
        className="object-cover"
       />
      ) : (
       <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: calendar.calendarColor || "#6366f1" }}
       >
        <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white/30" />
       </div>
      )}
     </div>

     {/* Subscribe Button */}
     {!canManage && (
      <button
       onClick={handleSubscribe}
       disabled={loadingSubscription}
       className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 text-sm font-medium transition-all ${
        isSubscribed
         ? "border border-white/10 bg-card-background text-foreground hover:bg-white/5"
         : "bg-primary text-white hover:bg-primary/80"
       } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
       {isSubscribed ? (
        <>
         <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
         Unsubscribe
        </>
       ) : (
        <>
         Subscribe
        </>
       )}
      </button>
     )}

     {/* Management Buttons */}
     {canManage && (
      <div className="flex gap-1.5">
       <AddEventDropdown
        calendarId={calendar.id}
        onAddExisting={() => setShowAddEventsModal(true)}
       />
       <Link
        href={`/calendars/${calendar.calendarUrl}/edit`}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-card-background px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium text-foreground transition-all hover:bg-white/5"
       >
        <Edit3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Edit</span>
       </Link>
       {isOwner && (
        <button
         onClick={handleDelete}
         className="flex items-center rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
        >
         <Trash2 className="h-3.5 w-3.5" />
        </button>
       )}
      </div>
     )}
    </div>

    {/* Calendar Name and Description */}
    <div className="mb-6 mt-4 calendar-stagger-3">
     <h1 className="mb-2 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
      {calendar.name}
     </h1>

     {calendar.description && (
      <div
       className="tiptap-editor tiptap-view-mode text-muted-foreground mt-3"
       dangerouslySetInnerHTML={{ __html: calendar.description }}
      />
     )}
    </div>

    {/* Highlights Bar */}
    {(highlights.length > 0 || canManage) && !loadingHighlights && (
     <div className="mb-6">
      <HighlightsBar
       highlights={highlights}
       showAddButton={canManage}
       onAddClick={() => setShowAddHighlightModal(true)}
      />
     </div>
    )}

    {/* Content Below Banner */}
    <div className="flex flex-col gap-6 lg:flex-row calendar-stagger-4">
     {/* Main Content */}
     <section className="flex-1 min-w-0 space-y-6">
      {/* Events Section */}
      <div className="pt-6">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
         Events
        </h2>
        <div className="flex gap-2">
         <button
          onClick={() => { setActiveTab("upcoming"); setSelectedDate(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
           activeTab === "upcoming" && !selectedDate
            ? "bg-primary text-white"
            : "bg-card-background border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
         >
          Upcoming ({upcomingCount})
         </button>
         <button
          onClick={() => { setActiveTab("past"); setSelectedDate(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
           activeTab === "past" && !selectedDate
            ? "bg-primary text-white"
            : "bg-card-background border border-white/10 text-muted-foreground hover:text-foreground"
          }`}
         >
          Past ({pastCount})
         </button>
        </div>
       </div>

       {loadingEvents ? (
        <div className="flex min-h-[200px] items-center justify-center">
         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
       ) : displayedEvents.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
         <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
         <h3 className="mb-2 text-xl font-semibold text-foreground">
          {selectedDate
           ? "No events on this date"
           : activeTab === "upcoming" ? "No upcoming events" : "No past events"}
         </h3>
         <p className="text-muted-foreground">
          {selectedDate
           ? "Try selecting a different date or clear the filter"
           : activeTab === "upcoming"
            ? canManage
             ? "Add events to this calendar to get started"
             : "Check back later for new events"
            : "Past events will appear here after they end"}
         </p>
        </div>
       ) : (
        <EventsTimeline events={displayedEvents} />
       )}
      </div>
     </section>

     {/* Sidebar */}
     <aside className="flex flex-col gap-6 lg:w-80 lg:shrink-0">
      {/* Calendar Date Picker */}
      <EventCalendarWidget
       eventDates={eventDates}
       selectedDate={selectedDate}
       onDateSelect={handleDateSelect}
      />

      {/* Location Card */}
      {calendar.address && (
       <div className="rounded-xl border border-neutral-700 bg-card-background overflow-hidden">
        {calendar.address.location?.latitude &&
        calendar.address.location?.longitude ? (
         <GoogleMap
          latitude={calendar.address.location.latitude}
          longitude={calendar.address.location.longitude}
          title={calendar.address.name}
          className="h-40 w-full !rounded-none"
          placeId={calendar.address.placeId}
         />
        ) : (
         <div className="h-40 w-full bg-card-secondary-background flex flex-col items-center justify-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Map</span>
         </div>
        )}
        <div className="p-4">
         {calendar.address.name && (
          <h3 className="font-semibold text-foreground mb-1">
           {calendar.address.name}
          </h3>
         )}
         <p className="text-sm text-muted-foreground">
          {[
           calendar.address.addressLine1,
           calendar.address.addressLine2,
           calendar.address.city,
           calendar.address.zipcode,
          ]
           .filter(Boolean)
           .join(", ")}
         </p>
        </div>
       </div>
      )}

      {/* Owner Card */}
      <div className="rounded-xl bg-card-background p-4 sm:p-6">
       <h3 className="mb-4 text-lg font-semibold text-foreground">
        Organized by
       </h3>
       {calendar.owner?.user ? (
        <Link
         href={`/user/${calendar.ownerEventUserId}`}
         className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
         {calendar.owner.user.profilePicture ? (
          <Image
           src={calendar.owner.user.profilePicture}
           alt={
            calendar.owner.firstName || calendar.owner.lastName
             ? [calendar.owner.firstName, calendar.owner.lastName]
               .filter(Boolean)
               .join(" ")
             : calendar.owner.user.username || "Organizer"
           }
           width={48}
           height={48}
           className="rounded-full"
           unoptimized
          />
         ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
           <User className="h-6 w-6 text-primary" />
          </div>
         )}
         <div>
          <p className="font-medium text-foreground">
           {calendar.owner.firstName || calendar.owner.lastName
            ? [calendar.owner.firstName, calendar.owner.lastName]
              .filter(Boolean)
              .join(" ")
            : calendar.owner.user.username || "Anonymous"}
          </p>
          <p className="text-sm text-muted-foreground">Owner</p>
         </div>
        </Link>
       ) : (
        <div className="flex items-center gap-3">
         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
         </div>
         <div>
          <p className="font-medium text-foreground">Calendar Owner</p>
          <p className="text-sm text-muted-foreground">Owner</p>
         </div>
        </div>
       )}
      </div>
     </aside>
    </div>
   </div>

   {/* Add Events Modal */}
   {showAddEventsModal && (
    <AddEventsToCalendarModal
     calendarId={calendar.id}
     calendarName={calendar.name}
     existingEventIds={events.map((e) => e.id)}
     onClose={() => setShowAddEventsModal(false)}
     onEventsAdded={refreshEvents}
    />
   )}

   {/* Add Highlight Modal */}
   <AddHighlightModal
    isOpen={showAddHighlightModal}
    onClose={() => setShowAddHighlightModal(false)}
    onSuccess={refreshHighlights}
    calendarId={calendar.id}
   />
  </div>
 );
}
