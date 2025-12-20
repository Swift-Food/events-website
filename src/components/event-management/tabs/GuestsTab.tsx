"use client";

import { useEffect, useState } from "react";
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
import { Loader, Link as LinkIcon, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "all" | "approved" | "pending" | "waitlisted" | "rejected" | "checked_in";

interface GuestsTabProps {
  eventId: string;
}

export function GuestsTab({ eventId }: GuestsTabProps) {
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

  useEffect(() => {
    fetchGuestData();
  }, [eventId]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div>
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
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          rejectedCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
        />

        <GuestFilters
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingCount={pendingGuests.length}
          approvedCount={guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length}
          waitlistedCount={guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length}
          rejectedCount={guests.filter((g) => g.status === GuestTicketStatus.CANCELLED).length}
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
        />
      </div>

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
    </>
  );
}
