"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import EventForm from "@/components/EventForm";
import { eventService } from "@/services/event.service";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import { EventResponseDto, EventStatus } from "@/types";
import { CollaboratorRole } from "@/types/event-collaborator";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import {
 Eye,
 X,
 Crown,
 Shield,
 Scan,
 AlertTriangle,
 EyeOff,
} from "lucide-react";

// Tab components
import {
 OverviewTab,
 GuestsTab,
 RegistrationTab,
 TeamTab,
 CateringTab,
} from "@/components/event-management/tabs";

type TabType = "overview" | "guests" | "registration" | "team" | "catering";

// User role for this event - determines what they can see/do
type UserRole = "owner" | "admin" | "scanner" | null;

export default function EventManagementPage() {
 const params = useParams();
 const router = useRouter();
 const searchParams = useSearchParams();
 const eventId = params.id as string;
 const { user, isAuthenticated, isLoading: authLoading } = useAuth();

 // Get current tab from URL, default to "overview"
 const currentTab = (searchParams.get("tab") as TabType) || "overview";

 // Get guest filter from URL
 const guestFilter = searchParams.get("filter") || "all";

 const [eventData, setEventData] = useState<EventResponseDto | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
 const [userRole, setUserRole] = useState<UserRole>(null);
 const [showEditModal, setShowEditModal] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);
 const [isPublishLoading, setIsPublishLoading] = useState(false);
 const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
 const [refreshKey, setRefreshKey] = useState(0);

 // Modal always uses the default purple-black gradient regardless of event theme
 const editModalBackground = "linear-gradient(to bottom, #41296e 0%, #000000 15%)";

 // Lock body scroll when edit modal is open
 useEffect(() => {
  if (showEditModal) {
   document.body.style.overflow = "hidden";
   return () => { document.body.style.overflow = ""; };
  }
 }, [showEditModal]);

 const setTab = (tab: TabType, filter?: string) => {
  const url = filter
   ? `/event-management/${eventId}?tab=${tab}&filter=${filter}`
   : `/event-management/${eventId}?tab=${tab}`;
  router.push(url);
 };

 // Fetch event data
 const fetchEvent = async (showLoading = true) => {
  if (!eventId) {
   setError("Event ID is missing");
   setIsLoading(false);
   return;
  }

  try {
   if (showLoading) setIsLoading(true);
   const data = await eventService.getEventById(eventId);
   setEventData(data);
   setError(null);
  } catch (err: any) {
   console.error("Error fetching event:", err);
   const errorMessage =
    err.response?.data?.message || "Failed to load event";
   setError(errorMessage);
   toast.error(errorMessage);
  } finally {
   if (showLoading) setIsLoading(false);
  }
 };

 // Delete event handler
 const handleDeleteEvent = async () => {
  try {
   setIsDeleting(true);
   await eventService.deleteEvent(eventId);
   toast.success("Event deleted successfully");
   router.push("/event-management");
  } catch (err: any) {
   console.error("Error deleting event:", err);
   const errorMessage =
    err.response?.data?.message || "Failed to delete event";
   toast.error(errorMessage);
  } finally {
   setIsDeleting(false);
  }
 };

 // Handle publish toggle
 const handlePublishToggle = () => {
  if (eventData?.status === EventStatus.PUBLISHED) {
   setShowUnpublishConfirm(true);
  } else {
   handlePublish();
  }
 };

 // Publish event
 const handlePublish = async () => {
  try {
   setIsPublishLoading(true);
   const response = await eventService.publishEvent(eventId);
   if (response.success) {
    setEventData(response.event);
    toast.success("Event published!");
   }
  } catch (err: any) {
   console.error("Error publishing event:", err);
   toast.error(err.response?.data?.message || "Failed to publish event");
  } finally {
   setIsPublishLoading(false);
  }
 };

 // Unpublish event
 const handleUnpublish = async () => {
  try {
   setIsPublishLoading(true);
   const response = await eventService.unpublishEvent(eventId);
   if (response.success) {
    setEventData(response.event);
    toast.success("Event unpublished");
   }
  } catch (err: any) {
   console.error("Error unpublishing event:", err);
   toast.error(err.response?.data?.message || "Failed to unpublish event");
  } finally {
   setIsPublishLoading(false);
   setShowUnpublishConfirm(false);
  }
 };

 // Fetch event data on mount and when eventId changes
 useEffect(() => {
  fetchEvent();
 }, [eventId]);

 // Check authorization - owner or collaborator
 useEffect(() => {
  const checkAuthorization = async () => {
   if (!eventData) return;

   if (!user && !authLoading) {
    setIsAuthorized(false);
    setUserRole(null);
    setError("You must be logged in to manage events");
    return;
   }

   if (!user) return;

   // Check if user is the event owner
   const isOwner = eventData.owner?.user?.id === user.id;
   if (isOwner) {
    setIsAuthorized(true);
    setUserRole("owner");
    return;
   }

   // Check if user is a collaborator
   try {
    const collaboratorsData =
     await eventCollaboratorService.getCollaborators(eventId);
    const collaborator = collaboratorsData.collaborators.find(
     (collab) =>
      collab.inviteAccepted && collab.eventUser?.id === user.eventUser?.id
    );

    if (collaborator) {
     setIsAuthorized(true);
     // Set role based on collaborator role
     if (collaborator.role === CollaboratorRole.COLLABORATOR_ADMIN) {
      setUserRole("admin");
     } else {
      setUserRole("scanner");
     }
    } else {
     setIsAuthorized(false);
     setUserRole(null);
     setError("You are not authorized to manage this event");
    }
   } catch (err) {
    // User doesn't have permission to view collaborators - not authorized
    setIsAuthorized(false);
    setUserRole(null);
    setError("You are not authorized to manage this event");
   }
  };

  checkAuthorization();
 }, [user, eventData, authLoading, eventId]);

 // Loading state
 if (isLoading || authLoading) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
    <div className="text-center">
     <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
     <p className="text-lg text-muted-foreground">Loading event...</p>
    </div>
   </div>
  );
 }

 // Auth required
 if (!isAuthenticated) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
    <div className="text-center max-w-md">
     <div className="mb-4 text-6xl">🔒</div>
     <h1 className="mb-2 text-2xl font-bold text-foreground">
      Authentication Required
     </h1>
     <p className="mb-6 text-muted-foreground">
      You must be logged in to manage events.
     </p>
     <button
      onClick={() => router.push("/auth")}
      className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
     >
      Go to Login
     </button>
    </div>
   </div>
  );
 }

 // Unauthorized
 if (isAuthorized === false) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
    <div className="text-center max-w-md">
     <div className="mb-4 text-6xl">🚫</div>
     <h1 className="mb-2 text-2xl font-bold text-foreground">
      Unauthorized Access
     </h1>
     <p className="mb-6 text-muted-foreground">
      You do not have permission to manage this event.
     </p>
     <div className="flex gap-3 justify-center">
      <button
       onClick={() => router.push("/events")}
       className="rounded-full bg-card-secondary-background px-6 py-3 font-semibold text-foreground transition-all hover:bg-white/15"
      >
       Browse Events
      </button>
     </div>
    </div>
   </div>
  );
 }

 // Error state
 if (error || !eventData) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
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

 const allTabs: { id: TabType; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "registration", label: "Registration" },
  { id: "team", label: "Team" },
  { id: "catering", label: "Catering" },
 ];

 // Scanner role can only see overview tab
 const tabs =
  userRole === "scanner"
   ? allTabs.filter((tab) => tab.id === "overview")
   : allTabs;

 return (
  <div className="relative min-h-screen">
   {/* Preview Banner - Mobile only */}
   <div className="sm:hidden border-y border-purple-500/30 bg-purple-500/10">
    <div className="px-6 py-3 flex items-center justify-between">
     <span className="text-sm text-neutral-300">
      You are currently editing this event.
     </span>
     <button
      onClick={() => router.push(`/events/${eventId}`)}
      className="flex items-center gap-1 rounded-full bg-purple-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-600"
     >
      Preview
      <span className="text-xs">↗</span>
     </button>
    </div>
   </div>

   {/* Header */}
   <div className="">
    <div className="mx-auto max-w-6xl px-6 py-6">
     {/* Event Title & Role Badge */}
     <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
       <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        {eventData.name}
       </h1>
       {/* Role Badge */}
       {userRole && (
        <span
         className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          userRole === "owner"
           ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
           : userRole === "admin"
           ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
           : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
         }`}
        >
         {userRole === "owner" && <Crown className="h-3 w-3" />}
         {userRole === "admin" && <Shield className="h-3 w-3" />}
         {userRole === "scanner" && <Scan className="h-3 w-3" />}
         {userRole === "owner"
          ? "Owner"
          : userRole === "admin"
          ? "Admin"
          : "Scanner"}
        </span>
       )}
      </div>
      {/* Preview Button - Desktop only */}
      <button
       onClick={() => router.push(`/events/${eventId}`)}
       className="hidden sm:flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-500/20"
      >
       <Eye className="h-4 w-4" />
       Preview
      </button>
     </div>

     {/* Tabs */}
     <div className="flex gap-6 border-b border-neutral-700 -mb-px overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
       const isActive = currentTab === tab.id;
       return (
        <button
         key={tab.id}
         onClick={() => setTab(tab.id)}
         className={`relative shrink-0 whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
          isActive
           ? "text-primary"
           : "text-muted-foreground hover:text-foreground"
         }`}
        >
         {tab.label}
         {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
         )}
        </button>
       );
      })}
     </div>
    </div>
   </div>

   {/* Tab Content */}
   <div className="mx-auto max-w-6xl px-6 pb-8">
    {currentTab === "overview" && (
     <OverviewTab
      eventData={eventData}
      onEditClick={() => setShowEditModal(true)}
      onScanClick={() =>
       router.push(`/event-management/${eventId}/scanner`)
      }
      onTeamClick={() => setTab("team")}
      onGuestsClick={(filter) => setTab("guests", filter)}
      onDeleteClick={handleDeleteEvent}
      isDeleting={isDeleting}
      userRole={userRole}
      onPublishToggle={handlePublishToggle}
      isPublishLoading={isPublishLoading}
      refreshKey={refreshKey}
     />
    )}

    {currentTab === "guests" && (
     <GuestsTab eventId={eventId} eventName={eventData.name} initialFilter={guestFilter as any} onRefresh={() => { fetchEvent(false); setRefreshKey(k => k + 1); }} />
    )}

    {currentTab === "registration" && (
     <RegistrationTab
      eventData={eventData}
      onRefresh={() => fetchEvent(false)}
      onScanClick={() =>
       router.push(`/event-management/${eventId}/scanner`)
      }
     />
    )}

    {currentTab === "team" && (
     <TeamTab eventId={eventId} ownerId={eventData.owner?.user?.id} />
    )}
    {currentTab === "catering" && <CateringTab eventData={eventData} />}
   </div>

   {/* Edit Event Slide-out Modal */}
   {showEditModal && (
    <>
     {/* Backdrop */}
     <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowEditModal(false)}
     />

     {/* Slide-out Panel */}
     <div className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl overflow-y-auto overscroll-contain shadow-2xl animate-in slide-in-from-right duration-300" style={{ background: editModalBackground }}>
      {/* Modal Header */}
      <div className="sticky top-0 z-10 flex items-center justify-end px-6 py-4">
       {/* <h2 className="text-lg font-semibold text-foreground">Edit Event</h2> */}
       <button
        onClick={() => setShowEditModal(false)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
       >
        <X className="h-5 w-5" />
       </button>
      </div>

      {/* Event Form */}
      <EventForm
       mode="edit"
       eventId={eventId}
       initialData={eventData}
       eventStatus={eventData.status}
       onPublishToggle={handlePublishToggle}
       isPublishLoading={isPublishLoading}
       onSaveSuccess={() => {
        setShowEditModal(false);
        fetchEvent();
       }}
      />
     </div>
    </>
   )}

   {/* Unpublish Confirmation Modal */}
   {showUnpublishConfirm && (
    <>
     <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
      onClick={() => setShowUnpublishConfirm(false)}
     />
     <div className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
       </div>
       <h3 className="text-lg font-semibold text-foreground">
        Unpublish Event
       </h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
       This will hide the event from public view. Are you sure you want
       to unpublish{" "}
       <span className="font-medium text-foreground">
        {eventData.name}
       </span>
       ?
      </p>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
       <div className="flex items-start gap-3">
        <EyeOff className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
         <p className="text-amber-400/80">
          The event will only be visible to you and your team. Public
          users will not be able to find or register for it.
         </p>
        </div>
       </div>
      </div>

      <div className="flex gap-3">
       <button
        onClick={() => setShowUnpublishConfirm(false)}
        disabled={isPublishLoading}
        className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
       >
        Cancel
       </button>
       <button
        onClick={handleUnpublish}
        disabled={isPublishLoading}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
       >
        {isPublishLoading ? (
         <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Unpublishing...
         </>
        ) : (
         "Unpublish"
        )}
       </button>
      </div>
     </div>
    </>
   )}
  </div>
 );
}
