"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { guestTicketService } from "@/services/guest-ticket.service";
import { AdminTicketResponseDto, GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/authContext";
import { GuestManagementHeader } from "@/components/guest-tickets/GuestManagementHeader";
import { GuestStatsCards } from "@/components/guest-tickets/GuestTicketStatsCard";
import { GuestFilters } from "@/components/guest-tickets";
import { GuestTable } from "@/components/guest-tickets";
import { BulkActionBar } from "@/components/guest-tickets";
import { Loader } from "lucide-react";

type FilterStatus = "all" | "approved" | "pending" | "waitlisted" | "rejected" | "checked_in";

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

  const filteredGuests = guests.filter((guest) => {
    const matchesStatus =
      filterStatus === "all" ||
      guest.status === filterStatus ||
      (filterStatus === "checked_in" && guest.status === "checked_in"); // ← Fixed
  
    const matchesSearch =
      searchQuery === "" ||
      `${guest.guest.firstName} ${guest.guest.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        <GuestManagementHeader
          eventId={eventId}
          totalGuests={guests.length}
          pendingCount={pendingGuests.length}
        />

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
          checkedInCount={guests.filter((g) => g.status === GuestTicketStatus.CHECKED_IN).length} // ← Fixed
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
    </div>
  );
}