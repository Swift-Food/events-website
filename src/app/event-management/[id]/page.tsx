"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import EventForm from "@/components/EventForm";
import { eventService } from "@/services/event.service";
import { EventResponseDto } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import { CollaboratorManagement } from "@/components/event-collaborators/CollaboratorManagement";
import {
  Calendar,
  MapPin,
  Clock,
  Edit,
  X,
  Users,
  Eye,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";

// Import guest management components
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventTicketService } from "@/services/event-ticket.service";
import {
  AdminTicketResponseDto,
  GuestTicketResponseDto,
  GuestTicketStatus,
  ReservationMode,
} from "@/types/guest-ticket";
import { EventTicketResponseDto } from "@/types/event-ticket/response/ticket.dto";
import { GuestManagementHeader } from "@/components/guest-tickets/GuestManagementHeader";
import { GuestStatsCards } from "@/components/guest-tickets/GuestTicketStatsCard";
import { GuestFilters, GuestTable, BulkActionBar } from "@/components/guest-tickets";
import { Loader, Link as LinkIcon, Copy, Check } from "lucide-react";

type TabType = "overview" | "guests" | "registration" | "team";
type FilterStatus = "all" | "approved" | "pending" | "waitlisted" | "rejected" | "checked_in";

export default function EventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Get current tab from URL, default to "overview"
  const currentTab = (searchParams.get("tab") as TabType) || "overview";

  const [eventData, setEventData] = useState<EventResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Guest management state
  const [guests, setGuests] = useState<GuestTicketResponseDto[]>([]);
  const [pendingGuests, setPendingGuests] = useState<AdminTicketResponseDto[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [checkInStats, setCheckInStats] = useState({
    totalTickets: 0,
    checkedIn: 0,
    pending: 0,
    percentageCheckedIn: 0,
  });

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<EventTicketResponseDto[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setTab = (tab: TabType) => {
    router.push(`/event-management/${eventId}?tab=${tab}`);
  };

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
        setEventData(data);
        setError(null);

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
        const errorMessage = err.response?.data?.message || "Failed to load event";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user]);

  // Fetch guest data when on guests tab
  useEffect(() => {
    if (currentTab === "guests" && isAuthenticated && eventId) {
      fetchGuestData();
    }
  }, [currentTab, isAuthenticated, eventId]);

  const fetchGuestData = async () => {
    try {
      setGuestsLoading(true);
      const [attendees, pending, stats] = await Promise.all([
        guestTicketService.getEventAttendees(eventId),
        guestTicketService.getPendingTickets(eventId),
        guestTicketService.getCheckInStats(eventId),
      ]);

      setGuests(attendees);
      setPendingGuests(pending.pending || []);
      setCheckInStats(stats);
    } catch (error: any) {
      console.error("Error fetching guest data:", error);
      toast.error(error.response?.data?.message || "Failed to load guest data");
    } finally {
      setGuestsLoading(false);
    }
  };

  // Guest management handlers
  const handleApprove = async (ticketId: string) => {
    try {
      await guestTicketService.approveTicket(ticketId);
      toast.success("Guest approved successfully");
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve guest");
    }
  };

  const handleReject = async (ticketId: string, reason?: string) => {
    try {
      await guestTicketService.rejectTicket(ticketId, reason);
      toast.success("Guest rejected");
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject guest");
    }
  };

  const handleCheckIn = async (qrCode: string) => {
    try {
      await guestTicketService.checkInTicket(qrCode);
      toast.success("Guest checked in successfully");
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to check in guest");
    }
  };

  const handleBulkApprove = async () => {
    try {
      const ticketIds = Array.from(selectedGuests);
      const result = await guestTicketService.bulkApproveTickets(ticketIds);
      toast.success(`Approved ${result.approved || ""} guests`);
      setSelectedGuests(new Set());
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve guests");
    }
  };

  const handleBulkReject = async (reason?: string) => {
    try {
      const ticketIds = Array.from(selectedGuests);
      const result = await guestTicketService.bulkRejectTickets(ticketIds, reason);
      toast.success(`Rejected ${result.rejected || ""} guests`);
      setSelectedGuests(new Set());
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject guests");
    }
  };

  const handlePromoteFromWaitlist = async (ticketId: string) => {
    try {
      await guestTicketService.promoteFromWaitlist(ticketId);
      toast.success("Guest promoted from waitlist");
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to promote guest");
    }
  };

  const handleOpenInviteModal = async () => {
    try {
      const tickets = await eventTicketService.getEventTickets(eventId);
      setAvailableTickets(tickets);
      setShowInviteModal(true);
      setGeneratedLink("");
      setIsCopied(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load ticket types");
    }
  };

  const handleGenerateLink = async (ticketId: string) => {
    try {
      setIsGenerating(true);
      const response = await guestTicketService.generateTicketInviteLink(eventId, {
        eventTicketId: ticketId,
        bypassPayment: false,
        bypassApproval: true,
        reservationMode: ReservationMode.FCFS,
        maxUses: 100,
      });
      setGeneratedLink(response.inviteLink);
      toast.success("Invite link generated!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesStatus =
      filterStatus === "all" ||
      guest.status === filterStatus ||
      (filterStatus === "checked_in" && guest.status === "checked_in");

    const matchesSearch =
      searchQuery === "" ||
      `${guest.guest.firstName} ${guest.guest.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      guest.guest.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const toggleSelectGuest = (ticketId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedGuests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filteredGuests.map((g) => g.id)));
    }
  };

  // Format helpers
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Loading state
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

  // Auth required
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Authentication Required</h1>
          <p className="mb-6 text-muted-foreground">You must be logged in to manage events.</p>
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Unauthorized Access</h1>
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Failed to Load Event</h1>
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

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "guests", label: "Guests" },
    { id: "registration", label: "Registration" },
    { id: "team", label: "Team" },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <div className="">
        <div className="mx-auto max-w-6xl px-6 py-6">
          {/* Event Title & Preview Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{eventData.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">Event Management</p>
            </div>
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-500/20"
            >
              <Eye className="h-4 w-4" />
              Preview Event
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/10 -mb-px">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
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
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Overview Tab */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            {/* Event Details Card */}
            <div className="rounded-2xl border border-white/10 bg-card-background p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Event Details</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4" />
                  Edit Event
                </button>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Event Image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card-secondary-background lg:aspect-square lg:w-48 lg:shrink-0">
                  {eventData.eventImage ? (
                    <Image
                      src={eventData.eventImage}
                      alt={eventData.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ backgroundColor: eventData.eventColor || "#3b82f6" }}
                    >
                      <ImageIcon className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Event Info Grid */}
                <div className="grid flex-1 gap-6 sm:grid-cols-2">
                {/* When */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">When</p>
                    <p className="text-foreground">{formatDate(eventData.startDateTime)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(eventData.startDateTime)} - {formatTime(eventData.endDateTime)}
                    </p>
                  </div>
                </div>

                {/* Where */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Where</p>
                    {eventData.address ? (
                      <>
                        <p className="text-foreground">{eventData.address.addressLine1}</p>
                        <p className="text-sm text-muted-foreground">
                          {eventData.address.city}, {eventData.address.zipcode}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Location TBD</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendees</p>
                    <p className="text-foreground">{eventData.attendeesCount || 0} registered</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-foreground capitalize">{eventData.status}</p>
                  </div>
                </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Guests Tab */}
        {currentTab === "guests" && (
          <div>
            {guestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <GuestManagementHeader
                    eventId={eventId}
                    totalGuests={guests.length}
                    pendingCount={pendingGuests.length}
                  />
                  <button
                    onClick={handleOpenInviteModal}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-card-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-white/20"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Invite Guests
                  </button>
                </div>

                <GuestStatsCards
                  stats={checkInStats}
                  totalGuests={guests.length}
                  approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
                  waitlistedCount={
                    guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length
                  }
                  rejectedCount={
                    guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length
                  }
                />

                <GuestFilters
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  pendingCount={pendingGuests.length}
                  approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
                  waitlistedCount={
                    guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length
                  }
                  rejectedCount={
                    guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length
                  }
                  checkedInCount={
                    guests.filter((g) => g.status === GuestTicketStatus.CHECKED_IN).length
                  }
                />

                {selectedGuests.size > 0 && (
                  <BulkActionBar
                    selectedCount={selectedGuests.size}
                    onApprove={handleBulkApprove}
                    onReject={handleBulkReject}
                    onCancel={() => setSelectedGuests(new Set())}
                  />
                )}

                <GuestTable
                  guests={filteredGuests}
                  selectedGuests={selectedGuests}
                  onToggleSelect={toggleSelectGuest}
                  onToggleSelectAll={toggleSelectAll}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onCheckIn={handleCheckIn}
                  onPromote={handlePromoteFromWaitlist}
                />
              </>
            )}
          </div>
        )}

        {/* Registration Tab */}
        {currentTab === "registration" && (
          <div className="rounded-2xl border border-white/10 bg-card-background p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Registration Settings</h2>
            <p className="text-muted-foreground">
              Registration form management coming soon. You can edit ticket types and registration
              questions by clicking "Edit Event" in the Overview tab.
            </p>
          </div>
        )}

        {/* Team Tab */}
        {currentTab === "team" && (
          <CollaboratorManagement
            eventId={eventId}
            ownerId={eventData.owner?.user?.id}
            isCompact={false}
          />
        )}
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
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl overflow-y-auto bg-background shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Edit Event</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Event Form */}
            <EventForm mode="edit" eventId={eventId} initialData={eventData} />
          </div>
        </>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card-background border border-white/10 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Generate Invite Link</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!generatedLink ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a ticket type to generate an invite link
                </p>
                <div className="space-y-2">
                  {availableTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleGenerateLink(ticket.id)}
                      disabled={isGenerating}
                      className="w-full rounded-xl border border-white/10 bg-card-secondary-background p-4 text-left transition-all hover:border-white/20 disabled:opacity-50"
                    >
                      <div className="font-medium text-foreground">{ticket.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {parseFloat(ticket.price) > 0 ? `£${ticket.price}` : "Free"} •{" "}
                        {ticket.quantityLeft} of {ticket.quantityTotal} available
                      </div>
                    </button>
                  ))}
                </div>
                {isGenerating && (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-card-secondary-background p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Share this link with guests
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGeneratedLink("");
                    setIsCopied(false);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Generate another link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
