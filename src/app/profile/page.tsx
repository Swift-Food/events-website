// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventService } from "@/services/event.service";
import { guestTicketService } from "@/services/guest-ticket.service";
import { GuestTicketWithEventResponseDto } from "@/types/guest-ticket";
import {
 eventUserService,
 EventUserStats,
} from "@/services/event-user.service";
import { EventResponseDto, EventFormat } from "@/types/event";
import EventCard from "@/components/EventCard";
import HorizontalEventCard from "@/components/HorizontalEventCard";
import {
 User,
 Calendar,
 Ticket,
 LogOut,
 // Settings,
 ChevronRight,
 Plus,
 CalendarCheck,
 History,
 Users,
 Loader2,
 ExternalLink,
} from "lucide-react";
import StripeConnectCard from "@/components/payments/StripeConnectCard";
import { toast } from "sonner";
import Link from "next/link";

type TabType = "upcoming" | "hosting" | "attended" | "past";

interface ProfileStats {
 eventsCreated: number;
 eventsAttended: number;
 upcomingEvents: number;
}

export default function ProfilePage() {
 const {
  user,
  eventUser,
  isAuthenticated,
  isLoading: authLoading,
  logout,
 } = useAuth();
 const router = useRouter();
 // console.log(user, eventUser)

 // Data states
 const [stats, setStats] = useState<ProfileStats | null>(null);
 const [hostedEvents, setHostedEvents] = useState<EventResponseDto[]>([]);
 const [attendingTickets, setAttendingTickets] = useState<
  GuestTicketWithEventResponseDto[]
 >([]);

 // UI states
 const [activeTab, setActiveTab] = useState<TabType>("upcoming");
 const [isLoadingStats, setIsLoadingStats] = useState(true);
 const [isLoadingEvents, setIsLoadingEvents] = useState(true);
 const [isLoadingTickets, setIsLoadingTickets] = useState(true);
 const [isLoggingOut, setIsLoggingOut] = useState(false);

 // Redirect if not authenticated
 useEffect(() => {
  if (!authLoading && !isAuthenticated) {
   router.push("/auth");
  }
 }, [authLoading, isAuthenticated, router]);

 // Fetch user stats
 useEffect(() => {
  const fetchStats = async () => {
   if (!isAuthenticated) return;

   try {
    setIsLoadingStats(true);
    const userStats = await eventUserService.getMyStats();
    setStats(userStats);
   } catch (error) {
    console.error("Failed to fetch stats:", error);
    toast.error("Failed to load profile stats");
   } finally {
    setIsLoadingStats(false);
   }
  };

  fetchStats();
 }, [isAuthenticated]);

 // Fetch hosted events
 useEffect(() => {
  const fetchHostedEvents = async () => {
   if (!isAuthenticated) return;

   try {
    setIsLoadingEvents(true);
    const response = await eventService.getMyEvents();
    setHostedEvents(response.events as EventResponseDto[]);
   } catch (error) {
    console.error("Failed to fetch hosted events:", error);
    toast.error("Failed to load your events");
   } finally {
    setIsLoadingEvents(false);
   }
  };

  fetchHostedEvents();
 }, [isAuthenticated]);

 // Fetch attending tickets
 useEffect(() => {
  const fetchAttendingTickets = async () => {
   if (!isAuthenticated) return;

   try {
    setIsLoadingTickets(true);
    const response = await guestTicketService.getMyTickets();
    setAttendingTickets(response.tickets);
   } catch (error) {
    console.error("Failed to fetch tickets:", error);
    toast.error("Failed to load your tickets");
   } finally {
    setIsLoadingTickets(false);
   }
  };

  fetchAttendingTickets();
 }, [isAuthenticated]);

 // Filter events based on active tab
 const now = new Date();

 const upcomingHostedEvents = hostedEvents.filter(
  (event) => new Date(event.startDateTime) > now
 );

 const pastHostedEvents = hostedEvents.filter(
  (event) => new Date(event.startDateTime) <= now
 );

 const upcomingAttendingEvents = attendingTickets
  .filter((ticket) => new Date(ticket.eventStartDateTime) > now)
  .map(
   (ticket) =>
    ({
     id: ticket.eventId,
     name: ticket.eventName,
     startDateTime: ticket.eventStartDateTime,
     endDateTime: ticket.eventEndDateTime,
     eventImage: ticket.eventImage,
     status: ticket.eventStatus,
     description: "",
     eventColor: "#000000",
     isPrivate: false,
     requiresApproval: false,
     format: EventFormat.IN_PERSON,
     virtualMeetingUrl: null,
     isTrustedMeetingUrl: true,
     virtualCapacity: null,
     eventUrl: null,
     viewCount: 0,
     acceptingNewTickets: true,
     stopAcceptingOnStart: false,
     hideFullAddress: false,
     createdAt: new Date(),
     updatedAt: new Date(),
     owner: {
      id: "",
      userId: "",
      organizationName: "",
      user: {
       id: "",
       username: "",
       email: "",
       createdAt: "",
       eventUser: null,
      },
     },
     address: {
      id: "",
      name: "",
      addressLine1: "",
      addressLine2: null,
      flat: null,
      city: "TBD",
      zipcode: "",
      location: null,
      placeId: null,
     },
     categories: [],
     attendeesCount: 0,
    } as EventResponseDto)
  );

 const pastAttendingEvents = attendingTickets
  .filter((ticket) => new Date(ticket.eventStartDateTime) <= now)
  .map(
   (ticket) =>
    ({
     id: ticket.eventId,
     name: ticket.eventName,
     startDateTime: ticket.eventStartDateTime,
     endDateTime: ticket.eventEndDateTime,
     eventImage: ticket.eventImage,
     status: ticket.eventStatus,
     description: "",
     eventColor: "#000000",
     isPrivate: false,
     requiresApproval: false,
     format: EventFormat.IN_PERSON,
     virtualMeetingUrl: null,
     isTrustedMeetingUrl: true,
     virtualCapacity: null,
     eventUrl: null,
     viewCount: 0,
     acceptingNewTickets: true,
     stopAcceptingOnStart: false,
     hideFullAddress: false,
     createdAt: new Date(),
     updatedAt: new Date(),
     owner: {
      id: "",
      userId: "",
      organizationName: "",
      user: {
       id: "",
       username: "",
       email: "",
       createdAt: "",
       eventUser: null,
      },
     },
     address: {
      id: "",
      name: "",
      addressLine1: "",
      addressLine2: null,
      flat: null,
      city: "TBD",
      zipcode: "",
      location: null,
      placeId: null,
     },
     categories: [],
     attendeesCount: 0,
    } as EventResponseDto)
  );

 // Get events for current tab
 const getEventsForTab = (): EventResponseDto[] => {
  switch (activeTab) {
   case "upcoming":
    return upcomingAttendingEvents;
   case "hosting":
    return upcomingHostedEvents;
   case "attended":
    return pastAttendingEvents;
   case "past":
    return pastHostedEvents;
   default:
    return [];
  }
 };

 const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
   logout();
   toast.success("Logged out successfully");
   router.push("/");
  } catch (error) {
   console.error("Logout failed:", error);
   toast.error("Failed to logout");
  } finally {
   setIsLoggingOut(false);
  }
 };

 // Loading state
 if (authLoading) {
  return (
   <div className="flex min-h-[calc(100vh-64px)] items-center justify-center ">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
   </div>
  );
 }

 // Not authenticated
 if (!isAuthenticated || !user) {
  return null;
 }

 const tabs: {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  count: number;
 }[] = [
  {
   id: "upcoming",
   label: "Upcoming",
   icon: <Calendar className="h-4 w-4" />,
   count: upcomingAttendingEvents.length,
  },
  {
   id: "hosting",
   label: "Hosting",
   icon: <Users className="h-4 w-4" />,
   count: upcomingHostedEvents.length,
  },
  {
   id: "attended",
   label: "Attended",
   icon: <CalendarCheck className="h-4 w-4" />,
   count: pastAttendingEvents.length,
  },
  {
   id: "past",
   label: "Past Hosted",
   icon: <History className="h-4 w-4" />,
   count: pastHostedEvents.length,
  },
 ];

 const currentEvents = getEventsForTab();
 const isLoadingCurrentTab =
  activeTab === "hosting" || activeTab === "past"
   ? isLoadingEvents
   : isLoadingTickets;

 return (
  <div className="min-h-[calc(100vh-64px)] ">
   <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    {/* Profile Header */}
    <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6 lg:p-8 mb-6">
     {/* Avatar + User Info Row - Always visible */}
     <div className="flex items-center gap-4 lg:gap-6">
      {/* Avatar */}
      <div className="relative shrink-0">
       <div className="h-16 w-16 lg:h-24 lg:w-24 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20">
        <User className="h-8 w-8 lg:h-12 lg:w-12 text-primary" />
       </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
       <h1 className="text-xl lg:text-3xl font-bold text-foreground truncate">
        {eventUser?.firstName || eventUser?.lastName
         ? `${eventUser.firstName || ''} ${eventUser.lastName || ''}`.trim()
         : user.username || user.email.split('@')[0]}
       </h1>
       {user.username && (
        <p className="text-muted-foreground text-sm lg:text-base mt-0.5 lg:mt-1 truncate">@{user.username}</p>
       )}
       <p className="text-muted-foreground text-xs lg:text-sm mt-0.5 lg:mt-1 truncate">{user.email}</p>
       {eventUser?.organizationName && (
        <p className="text-primary text-xs lg:text-sm font-medium mt-1 lg:mt-2 truncate">
         {eventUser.organizationName}
        </p>
       )}
      </div>

      {/* Desktop Actions - Inline */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
       {eventUser?.id && (
        <Link
         href={`/user/${eventUser.id}`}
         className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-card-secondary-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
        >
         <ExternalLink className="h-4 w-4" />
         Public Profile
        </Link>
       )}
       <Link
        href="/profile/edit"
        className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-card-secondary-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
       >
        Edit Profile
       </Link>
       <Link
        href="/event-creation"
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
       >
        <Plus className="h-4 w-4" />
        Create Event
       </Link>
      </div>
     </div>

     {/* Mobile/Tablet Actions - Stacked below */}
     <div className="lg:hidden mt-5 flex flex-col gap-2.5">
      <Link
       href="/event-creation"
       className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
       <Plus className="h-4 w-4" />
       Create Event
      </Link>
      <div className="flex gap-2.5">
       <Link
        href="/profile/edit"
        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
       >
        Edit Profile
       </Link>
       {eventUser?.id && (
        <Link
         href={`/user/${eventUser.id}`}
         className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-card-secondary-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
        >
         <ExternalLink className="h-4 w-4" />
         Public Profile
        </Link>
       )}
      </div>
     </div>
    </div>

    {/* Stats Cards - Mobile: unified card, Desktop: 3 separate cards */}
    {/* Mobile unified stats card */}
    <div className="sm:hidden rounded-2xl bg-card-background backdrop-blur-xl p-4 mb-6">
     <div className="flex justify-around items-stretch">
      <MobileStatItem
       label="Created"
       value={stats?.eventsCreated ?? 0}
       icon={<Calendar className="h-5 w-5" />}
       isLoading={isLoadingStats}
      />
      <div className="w-px bg-foreground/10 mx-2" />
      <MobileStatItem
       label="Attended"
       value={stats?.eventsAttended ?? 0}
       icon={<CalendarCheck className="h-5 w-5" />}
       isLoading={isLoadingStats}
      />
      <div className="w-px bg-foreground/10 mx-2" />
      <MobileStatItem
       label="Upcoming"
       value={upcomingAttendingEvents.length + upcomingHostedEvents.length}
       icon={<Ticket className="h-5 w-5" />}
       isLoading={isLoadingEvents || isLoadingTickets}
      />
     </div>
    </div>

    {/* Desktop: 3 separate cards */}
    <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-6">
     <StatsCard
      label="Events Created"
      value={stats?.eventsCreated ?? 0}
      icon={<Calendar className="h-5 w-5" />}
      isLoading={isLoadingStats}
     />
     <StatsCard
      label="Events Attended"
      value={stats?.eventsAttended ?? 0}
      icon={<CalendarCheck className="h-5 w-5" />}
      isLoading={isLoadingStats}
     />
     <StatsCard
      label="Upcoming Events"
      value={upcomingAttendingEvents.length + upcomingHostedEvents.length}
      icon={<Ticket className="h-5 w-5" />}
      isLoading={isLoadingEvents || isLoadingTickets}
     />
    </div>

    {/* Stripe Connect Payment Setup */}
    <div className="mb-6">
     <StripeConnectCard />
    </div>

    {/* Tabs */}
    <div className="rounded-3xl bg-card-background backdrop-blur-xl overflow-hidden">
     {/* <div className="border-b border-foreground/10">
      <div className="flex overflow-x-auto scrollbar-hide">
       {tabs.map((tab) => (
        <button
         key={tab.id}
         onClick={() => setActiveTab(tab.id)}
         className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
          activeTab === tab.id
           ? "border-primary text-primary"
           : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/20"
         }`}
        >
         {tab.icon}
         {tab.label}
         <span
          className={`rounded-full px-2 py-0.5 text-xs ${
           activeTab === tab.id
            ? "bg-primary/20 text-primary"
            : "bg-card-secondary-background text-muted-foreground"
          }`}
         >
          {tab.count}
         </span>
        </button>
       ))}
      </div>
     </div> */}

     {/* Tab Content */}
     {/* <div className="p-3 sm:p-6">
      {isLoadingCurrentTab ? (
       <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
      ) : currentEvents.length === 0 ? (
       <EmptyState activeTab={activeTab} />
      ) : (
       <>
        <div className="flex flex-col gap-3 md:hidden">
         {currentEvents.map((event) => (
          <HorizontalEventCard
           key={event.id}
           event={event}
           isHostedEvent={
            activeTab === "hosting" || activeTab === "past"
           }
          />
         ))}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {currentEvents.map((event) => (
          <EventCard
           key={event.id}
           event={event}
           isHostedEvent={
            activeTab === "hosting" || activeTab === "past"
           }
          />
         ))}
        </div>
       </>
      )}
     </div> */}

    </div>
   </div>
  </div>
 );
}

// Stats Card Component
interface StatsCardProps {
 label: string;
 value: number | string;
 icon: React.ReactNode;
 isLoading?: boolean;
 isText?: boolean;
}

function StatsCard({ label, value, icon, isLoading, isText }: StatsCardProps) {
 return (
  <div className="rounded-2xl bg-card-background backdrop-blur-xl p-5 flex justify-start items-center">
   <div className="flex items-center gap-3">
    <div className="rounded-full bg-primary/20 p-2.5 text-primary">
     {icon}
    </div>
    <div>
     {isLoading ? (
      <div className="h-7 w-12 bg-card-secondary-background rounded animate-pulse" />
     ) : (
      <p className={`font-bold text-foreground ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
     )}
     <p className="text-xs text-muted-foreground">{label}</p>
    </div>
   </div>
  </div>
 );
}

// Mobile Stats Item Component - vertically stacked, centered
interface MobileStatItemProps {
 label: string;
 value: number | string;
 icon: React.ReactNode;
 isLoading?: boolean;
}

function MobileStatItem({ label, value, icon, isLoading }: MobileStatItemProps) {
 return (
  <div className="flex flex-col items-center justify-center flex-1 py-1">
   <div className="rounded-full bg-primary/20 p-2 text-primary mb-2">
    {icon}
   </div>
   {isLoading ? (
    <div className="h-6 w-8 bg-card-secondary-background rounded animate-pulse mb-1" />
   ) : (
    <p className="text-xl font-bold text-foreground">{value}</p>
   )}
   <p className="text-xs text-muted-foreground">{label}</p>
  </div>
 );
}

// Empty State Component
interface EmptyStateProps {
 activeTab: TabType;
}

function EmptyState({ activeTab }: EmptyStateProps) {
 const content = {
  upcoming: {
   icon: <Calendar className="h-12 w-12" />,
   title: "No upcoming events",
   description: "You haven't registered for any upcoming events yet.",
   action: { label: "Browse Events", href: "/events" },
  },
  hosting: {
   icon: <Users className="h-12 w-12" />,
   title: "No events hosted",
   description: "You haven't created any upcoming events yet.",
   action: { label: "Create Event", href: "/events/create" },
  },
  attended: {
   icon: <CalendarCheck className="h-12 w-12" />,
   title: "No past events",
   description: "You haven't attended any events yet.",
   action: { label: "Browse Events", href: "/events" },
  },
  past: {
   icon: <History className="h-12 w-12" />,
   title: "No past hosted events",
   description: "You haven't hosted any events that have ended.",
   action: { label: "Create Event", href: "/events/create" },
  },
 };

 const { icon, title, description, action } = content[activeTab];

 return (
  <div className="flex flex-col items-center justify-center py-12 text-center">
   <div className="rounded-full bg-card-secondary-background p-4 text-muted-foreground mb-4">
    {icon}
   </div>
   <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
   <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
   <Link
    href={action.href}
    className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
   >
    {action.label}
    <ChevronRight className="h-4 w-4" />
   </Link>
  </div>
 );
}
