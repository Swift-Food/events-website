"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventTicketService } from "@/services/event-ticket.service";
import { blacklistService } from "@/services/blacklist.service";
import { AdminTicketResponseDto, GuestTicketResponseDto, GuestTicketStatus, ReservationMode } from "@/types/guest-ticket";
import { EventTicketResponseDto } from "@/types/event-ticket/response/ticket.dto";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import { GuestManagementHeader } from "@/components/guest-tickets/GuestManagementHeader";
import { GuestStatsCards } from "@/components/guest-tickets/GuestTicketStatsCard";
import { GuestFilters, GuestTable, BulkActionBar, ReviewGuestModal } from "@/components/guest-tickets";
import { BlacklistModal } from "@/components/blacklist";
import { Loader, Link as LinkIcon, Copy, Check } from "lucide-react";

type FilterStatus = "all" | "active" | "pending_approval" | "waitlisted" | "cancelled" | "checked_in" | "blacklisted";

/**
 * Extract guest display name with proper fallbacks
 */
function getGuestDisplayName(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "";

  // Try EventUser firstName/lastName first
  const eventUserName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  if (eventUserName) return eventUserName;

  // Fallback to User username
  if (guest.user?.username) return guest.user.username;

  // Last resort: email (before @)
  if (guest.user?.email) {
    return guest.user.email.split("@")[0];
  }

  return "";
}

export default function GuestManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [guests, setGuests] = useState<GuestTicketResponseDto[]>([]);
  const [pendingGuests, setPendingGuests] = useState<AdminTicketResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewGuest, setReviewGuest] = useState<GuestTicketResponseDto | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  // Blacklist modal state
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistGuest, setBlacklistGuest] = useState<GuestTicketResponseDto | null>(null);
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push("/auth");
      return;
    }

    if (isAuthenticated) {
      fetchGuestData();
    }
  }, [eventId, isAuthenticated, authLoading]);

  const fetchGuestData = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleApprove = async (ticketId: string, reason?: string) => {
    try {
      setIsReviewLoading(true);
      await guestTicketService.approveTicket(ticketId, reason);
      toast.success("Guest approved successfully");
      setShowReviewModal(false);
      setReviewGuest(null);
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve guest");
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleReject = async (ticketId: string, reason?: string) => {
    try {
      setIsReviewLoading(true);
      await guestTicketService.rejectTicket(ticketId, reason);
      toast.success("Guest rejected");
      setShowReviewModal(false);
      setReviewGuest(null);
      await fetchGuestData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject guest");
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleOpenReview = (guest: GuestTicketResponseDto) => {
    setReviewGuest(guest);
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
    setReviewGuest(null);
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

  const handleOpenBlacklist = (guest: GuestTicketResponseDto) => {
    setBlacklistGuest(guest);
    setShowBlacklistModal(true);
  };

  const handleCloseBlacklist = () => {
    setShowBlacklistModal(false);
    setBlacklistGuest(null);
  };

  const handleConfirmBlacklist = async (reason: string) => {
    if (!blacklistGuest) return;

    try {
      setIsBlacklistLoading(true);
      const result = await blacklistService.blacklistUser(eventId, {
        blockedUserId: blacklistGuest.guest?.userId,
        blockedEmail: blacklistGuest.guest?.user?.email,
        reason,
      });

      if (result.success) {
        toast.success(result.message || "User blacklisted successfully");
        if (result.ticketRefunded) {
          toast.info(`Ticket refunded: £${result.refundAmount?.toFixed(2)}`);
        }
        handleCloseBlacklist();
        await fetchGuestData();
      } else {
        throw new Error(result.message || "Failed to blacklist user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to blacklist user");
      throw error;
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  const handleOpenInviteModal = async () => {
    try {
      const tickets = await eventTicketService.getEventTickets(eventId);
      console.log("tickets are", tickets)
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
        reservationMode: ReservationMode.ON_ACCEPTANCE,
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
      guest.status === filterStatus;

    const matchesSearch =
      searchQuery === "" ||
      getGuestDisplayName(guest.guest).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guest.guest?.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase());

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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="mb-4 inline-block h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <GuestManagementHeader
            eventId={eventId}
            totalGuests={guests.length}
            pendingCount={pendingGuests.length}
          />
          <button
            onClick={handleOpenInviteModal}
            className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600"
          >
            <LinkIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
            Invite Guests
          </button>
        </div>

        <GuestStatsCards
          stats={checkInStats}
          totalGuests={guests.length}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          rejectedCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
        />

        <GuestFilters
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingCount={guests.filter((g) => g.status === GuestTicketStatus.PENDING_APPROVAL).length}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          cancelledCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
          checkedInCount={guests.filter((g) => g.status === GuestTicketStatus.CHECKED_IN).length}
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
          onBlacklist={handleOpenBlacklist}
          onReview={handleOpenReview}
        />

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Generate Invite Link
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!generatedLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select a ticket type to generate an invite link
                  </p>
                  <div className="space-y-2">
                    {availableTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleGenerateLink(ticket.id)}
                        disabled={isGenerating}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {ticket.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {parseFloat(ticket.price) > 0 ? `$${ticket.price}` : "Free"} • {ticket.quantityLeft} of {ticket.quantityTotal} available
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
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Share this link with guests
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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

        <ReviewGuestModal
          isOpen={showReviewModal}
          guest={reviewGuest}
          onClose={handleCloseReview}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={isReviewLoading}
        />
        <BlacklistModal
          isOpen={showBlacklistModal}
          guest={blacklistGuest}
          onClose={handleCloseBlacklist}
          onConfirm={handleConfirmBlacklist}
          isLoading={isBlacklistLoading}
        />
      </div>
    </div>
  );
}