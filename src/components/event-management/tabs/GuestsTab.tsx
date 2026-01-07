"use client";

import { useEffect, useState } from "react";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventTicketService } from "@/services/event-ticket.service";
import { blacklistService } from "@/services/blacklist.service";
import {
  AdminTicketResponseDto,
  GuestTicketResponseDto,
  GuestTicketStatus,
} from "@/types/guest-ticket";
import { EventTicketResponseDto } from "@/types/event-ticket/response/ticket.dto";
import { GuestManagementHeader } from "@/components/guest-tickets/GuestManagementHeader";
// import { GuestStatsCards } from "@/components/guest-tickets/GuestTicketStatsCard";
import { GuestOverviewCard } from "@/components/event-management/GuestOverviewCard";
import { GuestFilters, GuestTable, BulkActionBar, ReviewGuestModal, GuestDetailsModal } from "@/components/guest-tickets";
import { Loader } from "lucide-react";
import { CsvUploadModal } from "@/components/event-management/CsvUploadModal";
import { InviteGuestsModal } from "@/components/event-management/InviteGuestsModal";
import { InviteLinkModal } from "@/components/event-management/InviteLinkModal";
import { InvitationsSection } from "@/components/event-management/InvitationsSection";
import { BlacklistModal, BlacklistSection } from "@/components/blacklist";
import { toast } from "sonner";

type FilterStatus = "all" | "active" | "pending_approval" | "pending_payment" | "waitlisted" | "cancelled" | "checked_in" | "blacklisted";

/**
 * Extract guest display name with proper fallbacks (for search filtering)
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

interface GuestsTabProps {
  eventId: string;
  initialFilter?: FilterStatus;
}

export function GuestsTab({ eventId, initialFilter = "all" }: GuestsTabProps) {
  const [guests, setGuests] = useState<GuestTicketResponseDto[]>([]);
  const [pendingGuests, setPendingGuests] = useState<AdminTicketResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter);
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

  // CSV upload modal state
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

  // Invite guests modal state
  const [showInviteGuestsModal, setShowInviteGuestsModal] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewGuest, setReviewGuest] = useState<GuestTicketResponseDto | AdminTicketResponseDto | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  // Guest details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsGuest, setDetailsGuest] = useState<GuestTicketResponseDto | null>(null);

  // Blacklist modal state
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistGuest, setBlacklistGuest] = useState<GuestTicketResponseDto | null>(null);
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);

  // Blacklist count for filter badge
  const [blacklistedCount, setBlacklistedCount] = useState(0);

  useEffect(() => {
    fetchGuestData();
  }, [eventId]);

  // Sync filter status with initialFilter prop
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

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

  const handleOpenReview = (guest: GuestTicketResponseDto | AdminTicketResponseDto) => {
    setReviewGuest(guest);
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
    setReviewGuest(null);
  };

  const handleOpenDetails = (guest: GuestTicketResponseDto) => {
    setDetailsGuest(guest);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setDetailsGuest(null);
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
      setAvailableTickets(tickets);
      setShowInviteModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load ticket types");
    }
  };

  const handleOpenCsvUploadModal = async () => {
    try {
      const tickets = await eventTicketService.getEventTickets(eventId);
      setAvailableTickets(tickets);
      setShowCsvUploadModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load ticket types");
    }
  };

  const handleBackFromCsv = () => {
    setShowCsvUploadModal(false);
    setShowInviteGuestsModal(true);
  };

  const handleBackFromLink = () => {
    setShowInviteModal(false);
    setShowInviteGuestsModal(true);
  };

  // Statuses that can be selected for bulk actions (approve/reject)
  // Note: PENDING_PAYMENT is excluded because those tickets are already approved and waiting for payment
  const BULK_ACTIONABLE_STATUSES = [
    GuestTicketStatus.PENDING_APPROVAL,
    GuestTicketStatus.WAITLISTED,
  ];

  const filteredGuests = guests.filter((guest) => {
    // "all" filter excludes cancelled tickets
    const matchesStatus =
      filterStatus === "all"
        ? guest.status !== GuestTicketStatus.CANCELLED
        : guest.status === filterStatus;

    const matchesSearch =
      searchQuery === "" ||
      getGuestDisplayName(guest.guest)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
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
    // Only select guests with bulk-actionable statuses
    const actionableGuests = filteredGuests.filter((g) =>
      BULK_ACTIONABLE_STATUSES.includes(g.status as GuestTicketStatus)
    );

    if (selectedGuests.size === actionableGuests.length && actionableGuests.length > 0) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(actionableGuests.map((g) => g.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="mb-6">
          <GuestManagementHeader
            eventId={eventId}
            totalGuests={guests.length}
            pendingCount={pendingGuests.length}
          />
        </div>

        {/* <GuestStatsCards
          stats={checkInStats}
          totalGuests={guests.length}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          rejectedCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
        /> */}
        <GuestOverviewCard
          isLoading={false}
          checkInStats={checkInStats}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          pendingApprovalCount={guests.filter((g) => g.status === GuestTicketStatus.PENDING_APPROVAL).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          onCheckedInClick={() => setFilterStatus("checked_in")}
          onApprovedClick={() => setFilterStatus("active")}
          onPendingClick={() => setFilterStatus("pending_approval")}
          onWaitlistedClick={() => setFilterStatus("waitlisted")}
        />

        <InvitationsSection onInviteClick={() => setShowInviteGuestsModal(true)} />

        <GuestFilters
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingCount={guests.filter((g) => g.status === GuestTicketStatus.PENDING_APPROVAL).length}
          pendingPaymentCount={guests.filter((g) => g.status === GuestTicketStatus.PENDING_PAYMENT).length}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          cancelledCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
          checkedInCount={guests.filter((g) => g.status === GuestTicketStatus.CHECKED_IN).length}
          blacklistedCount={blacklistedCount}
        />

        {filterStatus === "blacklisted" ? (
          <BlacklistSection
            eventId={eventId}
            onBlacklistCountChange={setBlacklistedCount}
          />
        ) : (
          <>
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
              onRowClick={handleOpenDetails}
            />
          </>
        )}
      </div>

      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onBack={handleBackFromLink}
        eventId={eventId}
        tickets={availableTickets}
      />

      <InviteGuestsModal
        isOpen={showInviteGuestsModal}
        onClose={() => setShowInviteGuestsModal(false)}
        onSelectCsv={handleOpenCsvUploadModal}
        onSelectLink={handleOpenInviteModal}
      />
      <CsvUploadModal
        isOpen={showCsvUploadModal}
        onClose={() => setShowCsvUploadModal(false)}
        onBack={handleBackFromCsv}
        tickets={availableTickets}
      />
      <ReviewGuestModal
        isOpen={showReviewModal}
        guest={reviewGuest}
        onClose={handleCloseReview}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isReviewLoading}
      />
      <GuestDetailsModal
        isOpen={showDetailsModal}
        guest={detailsGuest}
        onClose={handleCloseDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        onCheckIn={handleCheckIn}
        onPromote={handlePromoteFromWaitlist}
        onReview={handleOpenReview}
      />
      <BlacklistModal
        isOpen={showBlacklistModal}
        guest={blacklistGuest}
        onClose={handleCloseBlacklist}
        onConfirm={handleConfirmBlacklist}
        isLoading={isBlacklistLoading}
      />
    </>
  );
}
