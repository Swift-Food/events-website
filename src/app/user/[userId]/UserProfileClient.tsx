"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { eventsApi } from "@/services/events";
import { followService } from "@/services/follow.service";
import { useAuth } from "@/lib/auth/authContext";
import {
 EventResponseDto,
 EventListResponseDto,
 EventStatus,
} from "@/types/event";
import { OrganizerProfile } from "@/types/organizer";
import { FollowStatusType } from "@/types/follower";
import EventsTimeline from "@/components/EventsTimeline";
import {
 User,
 Calendar,
 Globe,
 Twitter,
 Linkedin,
 Instagram,
 Loader2,
} from "lucide-react";

type EventTab = "upcoming" | "past";

interface UserProfileClientProps {
 initialProfile: OrganizerProfile;
 userId: string;
}

export default function UserProfileClient({
 initialProfile,
 userId,
}: UserProfileClientProps) {
 const { user: currentUser, isAuthenticated } = useAuth();
 const isPublic = initialProfile.isProfilePublic ? true : false;
 const isOwnProfile = currentUser?.id === initialProfile.user?.id;

 const [events, setEvents] = useState<EventResponseDto[]>([]);
 const [loading, setLoading] = useState(isPublic); // Only show loading if public profile
 const [loadingMore, setLoadingMore] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [hasMore, setHasMore] = useState(true);
 const [activeTab, setActiveTab] = useState<EventTab>("upcoming");

 // Follow state
 const [followStatus, setFollowStatus] =
  useState<FollowStatusType>("not_following");
 const [followsMe, setFollowsMe] = useState(false);
 const [followLoading, setFollowLoading] = useState(false);

 const sentinelRef = useRef<HTMLDivElement>(null);
 const skipRef = useRef(0);
 const eventsPerPage = 12;

 // Priority: personal name > username > organization name > fallback
 const personalName = [initialProfile.firstName, initialProfile.lastName]
  .filter(Boolean)
  .join(" ");
 const displayName =
  personalName ||
  initialProfile.user?.username ||
  initialProfile.organizationName ||
  "User";

 const profileImage =
  initialProfile.profilePicture || initialProfile.user?.profilePicture;

 const formatJoinedDateParts = (dateString: string) => {
  const date = new Date(dateString);
  return {
   day: date.getDate().toString(),
   month: date.toLocaleDateString("en-GB", { month: "short" }),
   year: date.getFullYear().toString(),
  };
 };

 const joinedParts = formatJoinedDateParts(initialProfile.createdAt);

 // Filter events based on active tab
 // Upcoming: endDateTime >= now (includes ongoing events), sorted ascending
 // Past: endDateTime < now, sorted descending (most recent first)
 const filteredEvents = useMemo(() => {
  const now = new Date();
  const filtered = events.filter((event) => {
   const endDate = new Date(event.endDateTime);
   if (activeTab === "upcoming") {
    return endDate >= now;
   } else {
    return endDate < now;
   }
  });

  // Sort: upcoming ascending (soonest first), past descending (most recent first)
  return filtered.sort((a, b) => {
   const dateA = new Date(a.startDateTime).getTime();
   const dateB = new Date(b.startDateTime).getTime();
   return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
  });
 }, [events, activeTab]);

 const upcomingCount = useMemo(() => {
  const now = new Date();
  return events.filter((event) => new Date(event.endDateTime) >= now).length;
 }, [events]);

 const pastCount = useMemo(() => {
  const now = new Date();
  return events.filter((event) => new Date(event.endDateTime) < now).length;
 }, [events]);

 const fetchEvents = useCallback(async () => {
  // Skip fetching if profile is private
  if (!isPublic) {
   setLoading(false);
   return;
  }

  setLoading(true);
  setError(null);
  skipRef.current = 0;

  try {
   const result: EventListResponseDto = await eventsApi.findByOwnerId(
    userId,
    {
     status: EventStatus.PUBLISHED,
     sortBy: "startDateTime",
     sortOrder: "asc",
     skip: 0,
     take: eventsPerPage,
     includePast: true,
    }
   );

   const newEvents = result.events ?? [];
   setEvents(newEvents);
   setHasMore(
    newEvents.length === eventsPerPage &&
     newEvents.length < (result.total ?? 0)
   );
   skipRef.current = newEvents.length;
  } catch (err) {
   console.error("Failed to fetch events:", err);
   setError("Failed to load events. Please try again later.");
  } finally {
   setLoading(false);
  }
 }, [userId, isPublic]);

 const loadMoreEvents = useCallback(async () => {
  // Skip loading more if profile is private
  if (!isPublic || loadingMore || !hasMore) return;

  setLoadingMore(true);
  try {
   const result: EventListResponseDto = await eventsApi.findByOwnerId(
    userId,
    {
     status: EventStatus.PUBLISHED,
     sortBy: "startDateTime",
     sortOrder: "asc",
     skip: skipRef.current,
     take: eventsPerPage,
     includePast: true,
    }
   );

   const newEvents = result.events ?? [];
   setEvents((prev) => [...prev, ...newEvents]);
   setHasMore(
    newEvents.length === eventsPerPage &&
     skipRef.current + newEvents.length < (result.total ?? 0)
   );
   skipRef.current += newEvents.length;
  } catch (err) {
   console.error("Failed to load more events:", err);
  } finally {
   setLoadingMore(false);
  }
 }, [userId, isPublic, loadingMore, hasMore]);

 useEffect(() => {
  fetchEvents();
 }, [fetchEvents]);

 // Fetch follow relationship
 useEffect(() => {
  const checkFollowRelationship = async () => {
   if (!isAuthenticated || isOwnProfile) return;
   try {
    const result = await followService.getFollowRelationship(initialProfile.id);
    setFollowStatus(result.isFollowingStatus);
    setFollowsMe(result.followsMe);
   } catch (err) {
    console.error("Failed to check follow relationship:", err);
   }
  };
  checkFollowRelationship();
 }, [isAuthenticated, isOwnProfile, initialProfile.id]);

 const handleFollow = async () => {
  if (!isAuthenticated || followLoading) return;
  setFollowLoading(true);
  try {
   const result = await followService.followUser(initialProfile.id);
   setFollowStatus(result.status);
  } catch (err) {
   console.error("Failed to follow user:", err);
  } finally {
   setFollowLoading(false);
  }
 };

 const handleUnfollow = async () => {
  if (!isAuthenticated || followLoading) return;
  setFollowLoading(true);
  try {
   await followService.unfollowUser(initialProfile.id);
   setFollowStatus("not_following");
  } catch (err) {
   console.error("Failed to unfollow user:", err);
  } finally {
   setFollowLoading(false);
  }
 };

 useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel) return;

  const observer = new IntersectionObserver(
   (entries) => {
    if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
     loadMoreEvents();
    }
   },
   { rootMargin: "200px" }
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
 }, [hasMore, loading, loadingMore, loadMoreEvents]);

 return (
  <div className="min-h-screen ">
   <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
    {/* Profile Header */}
    <div className="mb-8">
     <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden bg-primary/10">
       {profileImage ? (
        <img
         src={profileImage}
         alt={displayName}
         className="h-full w-full object-cover"
         onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextElementSibling?.classList.remove(
           "hidden"
          );
         }}
        />
       ) : null}
       <div
        className={`h-full w-full flex items-center justify-center ${
         profileImage ? "hidden" : ""
        }`}
       >
        <User className="h-14 w-14 sm:h-16 sm:w-16 text-primary" />
       </div>
      </div>

      {/* Name */}
      <h1 className="text-[32px] sm:text-[36px] !font-light text-white mt-6">
       {displayName}
      </h1>

      {/* Follows you indicator */}
      {isAuthenticated && !isOwnProfile && followsMe && (
       <p className="text-[10px] text-zinc-500 tracking-widest mt-2">
        FOLLOWS YOU
       </p>
      )}

      {/* Social Links - Public only */}
      {isPublic && (
       <div className="flex items-center justify-center gap-5 mt-4">
        {initialProfile.website && (
         <a
          href={initialProfile.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="Website"
         >
          <Globe size={18} />
         </a>
        )}
        {initialProfile.twitterHandle && (
         <a
          href={`https://twitter.com/${initialProfile.twitterHandle.replace(
           "@",
           ""
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="Twitter"
         >
          <Twitter size={18} />
         </a>
        )}
        {initialProfile.linkedinUrl && (
         <a
          href={initialProfile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="LinkedIn"
         >
          <Linkedin size={18} />
         </a>
        )}
        {initialProfile.instagramUrl && (
         <a
          href={initialProfile.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="Instagram"
         >
          <Instagram size={18} />
         </a>
        )}
       </div>
      )}

      {/* Follow Button - Only show for other users when authenticated */}
      {isAuthenticated && !isOwnProfile && (
       <button
        onClick={followStatus === "not_following" ? handleFollow : handleUnfollow}
        disabled={followLoading}
        className="mt-4 flex items-center gap-2 px-12 py-2 rounded-full border border-zinc-500 text-foreground text-sm font-light tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
       >
        {followLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {followStatus === "following"
         ? "UNFOLLOW"
         : followStatus === "pending"
         ? "REQUESTED"
         : "FOLLOW"}
       </button>
      )}

      {/* Bio - Always shown */}
      {initialProfile.bio && (
       <p className="text-[15px] text-zinc-400 leading-relaxed mt-8 px-2 sm:px-0 sm:max-w-xl">
        {initialProfile.bio}
       </p>
      )}

      {/* Stats - Public only */}
      {isPublic && (
       <div className="flex items-center gap-3 text-xs text-zinc-600 uppercase tracking-widest mt-6">
        <span>{initialProfile.totalEventsCreated} Events Created</span>
        <span>·</span>
        <span>
         Joined {joinedParts.month} {joinedParts.year}
        </span>
       </div>
      )}
     </div>
    </div>

    {/* Events Section - Only show for public profiles */}
    {isPublic && (
     <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
       Events by {displayName}
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
       <button
        onClick={() => setActiveTab("upcoming")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
         activeTab === "upcoming"
          ? "bg-primary text-white"
          : "bg-white/5 text-muted-foreground hover:bg-white/10"
        }`}
       >
        Upcoming{!loading && ` (${upcomingCount})`}
       </button>
       <button
        onClick={() => setActiveTab("past")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
         activeTab === "past"
          ? "bg-primary text-white"
          : "bg-white/5 text-muted-foreground hover:bg-white/10"
        }`}
       >
        Past{!loading && ` (${pastCount})`}
       </button>
      </div>

      {/* Loading State */}
      {loading && (
       <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
       </div>
      )}

      {/* Error State */}
      {error && !loading && (
       <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
         onClick={fetchEvents}
         className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
        >
         Try Again
        </button>
       </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
       <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-xl font-semibold text-foreground">
         {events.length === 0
          ? "No events yet"
          : activeTab === "upcoming"
          ? "No upcoming events"
          : "No past events"}
        </h3>
        <p className="text-muted-foreground">
         {events.length === 0
          ? "This user hasn't published any events yet."
          : activeTab === "upcoming"
          ? "Check back later for new events."
          : "This user hasn't had any past events."}
        </p>
       </div>
      )}

      {/* Events Timeline */}
      {!loading && !error && filteredEvents.length > 0 && (
       <EventsTimeline events={filteredEvents} stickyTopClass="top-2" />
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {loadingMore && (
       <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
       </div>
      )}

      {/* End of results */}
      {!loading && !hasMore && filteredEvents.length > 0 && (
       <p className="text-center text-sm text-muted-foreground py-8">
        You&apos;ve reached the end
       </p>
      )}
     </div>
    )}

    {/* Private Profile Notice */}
    {!isPublic && (
     <div className="rounded-xl border border-white/10 bg-card-background p-12 text-center">
      <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
      <h3 className="mb-2 text-xl font-semibold text-foreground">
       This profile is private
      </h3>
      <p className="text-muted-foreground">
       Follow this user to see more of their content.
      </p>
     </div>
    )}
   </div>
  </div>
 );
}
