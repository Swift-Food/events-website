"use client";

import { useState, useEffect } from "react";
import { EventResponseDto } from "@/types";
import { MapPin, Edit, Users, ImageIcon, ScanLine, Trash2, Calendar, Eye, AlertTriangle, Loader2, CreditCard } from "lucide-react";
import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { CsvUploadModal } from "@/components/event-management/CsvUploadModal";
import { InviteGuestsModal } from "@/components/event-management/InviteGuestsModal";
import { InviteLinkModal } from "@/components/event-management/InviteLinkModal";
import { InvitationsSection } from "@/components/event-management/InvitationsSection";
import { GuestOverviewCard } from "@/components/event-management/GuestOverviewCard";
import Image from "next/image";
import { guestTicketService } from "@/services/guest-ticket.service";
import { toast } from "sonner";

interface OverviewTabProps {
  eventData: EventResponseDto;
  onEditClick: () => void;
  onScanClick: () => void;
  onDeleteClick: () => Promise<void>;
  isDeleting?: boolean;
}

export function OverviewTab({ eventData, onEditClick, onScanClick, onDeleteClick, isDeleting }: OverviewTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refundableInfo, setRefundableInfo] = useState<{ count: number; totalAmount: number } | null>(null);
  const [isLoadingRefundInfo, setIsLoadingRefundInfo] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundComplete, setRefundComplete] = useState(false);

  // CSV upload modal state
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

  // Invite guests modal state
  const [showInviteGuestsModal, setShowInviteGuestsModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);

  // Guest stats state
  const [guests, setGuests] = useState<GuestTicketResponseDto[]>([]);
  const [checkInStats, setCheckInStats] = useState({
    totalTickets: 0,
    checkedIn: 0,
    pending: 0,
    percentageCheckedIn: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch guest stats
  useEffect(() => {
    const fetchGuestStats = async () => {
      try {
        setIsLoadingStats(true);
        const [attendees, stats] = await Promise.all([
          guestTicketService.getEventAttendees(eventData.id),
          guestTicketService.getCheckInStats(eventData.id),
        ]);
        setGuests(attendees);
        setCheckInStats(stats);
      } catch (error) {
        console.error("Error fetching guest stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchGuestStats();
  }, [eventData.id]);

  // Computed stats
  const pendingApprovalCount = guests.filter((g) => g.status === GuestTicketStatus.PENDING_APPROVAL).length;
  const approvedCount = guests.filter((g) => g.status === GuestTicketStatus.ACTIVE).length;
  const waitlistedCount = guests.filter((g) => g.status === GuestTicketStatus.WAITLISTED).length;

  // Fetch refundable ticket info when modal opens
  useEffect(() => {
    if (showDeleteConfirm && !refundableInfo && !isLoadingRefundInfo) {
      setIsLoadingRefundInfo(true);
      guestTicketService.getRefundableTicketCount(eventData.id)
        .then(setRefundableInfo)
        .catch((err) => {
          console.error("Failed to fetch refundable info:", err);
        })
        .finally(() => setIsLoadingRefundInfo(false));
    }
  }, [showDeleteConfirm, eventData.id, refundableInfo, isLoadingRefundInfo]);

  // Reset state when modal closes
  useEffect(() => {
    if (!showDeleteConfirm) {
      setRefundableInfo(null);
      setRefundComplete(false);
    }
  }, [showDeleteConfirm]);

  const handleRefundAll = async () => {
    setIsRefunding(true);
    try {
      const result = await guestTicketService.refundAllEventTickets(eventData.id);
      if (result.success) {
        toast.success(`Refunded ${result.totalRefunded} tickets (£${result.totalAmount.toFixed(2)})`);
        setRefundComplete(true);
        setRefundableInfo({ count: 0, totalAmount: 0 });
      } else {
        toast.error(`Refunded ${result.totalRefunded}, but ${result.failed} failed`);
      }
    } catch (err: any) {
      console.error("Failed to refund tickets:", err);
      toast.error(err.response?.data?.message || "Failed to refund tickets");
    } finally {
      setIsRefunding(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
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

  const isSameDay = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getTicketStats = () => {
    if (!eventData.eventTickets || eventData.eventTickets.length === 0) {
      return { totalSold: 0, totalLeft: 0 };
    }
    return eventData.eventTickets.reduce(
      (acc, ticket) => ({
        totalSold: acc.totalSold + ticket.quantitySold,
        totalLeft: acc.totalLeft + ticket.quantityLeft,
      }),
      { totalSold: 0, totalLeft: 0 }
    );
  };

  const ticketStats = getTicketStats();

  const handleBackFromCsv = () => {
    setShowCsvUploadModal(false);
    setShowInviteGuestsModal(true);
  };

  const handleBackFromLink = () => {
    setShowInviteLinkModal(false);
    setShowInviteGuestsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-card-background rounded-2xl border border-white/5 overflow-hidden">
        {/* Header with image and title */}
        <div className="p-5 sm:p-6">
          <div className="flex gap-4 sm:gap-5">
            {/* Event Image */}
            <div className="relative h-20 w-20 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-card-secondary-background">
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
                  <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
                </div>
              )}
            </div>

            {/* Title, badge, and actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium capitalize text-green-400">
                      {eventData.status}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                    {eventData.name}
                  </h2>

                  {/* Categories inline */}
                  {eventData.categories && eventData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {eventData.categories.map((category) => (
                        <span
                          key={category.id}
                          className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="border-t border-white/5 px-5 sm:px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* When */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(eventData.startDateTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(eventData.startDateTime)}
                  {!isSameDay(eventData.startDateTime, eventData.endDateTime) &&
                    ` - ${formatDate(eventData.endDateTime)}`
                  }
                </p>
              </div>
            </div>

            {/* Where */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                {eventData.address ? (
                  <>
                    <p className="text-sm font-medium text-foreground truncate">
                      {eventData.address.addressLine1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {eventData.address.city}, {eventData.address.zipcode}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Location TBD</p>
                )}
              </div>
            </div>

            {/* Attendees */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ticketStats.totalSold} registered
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {eventData.viewCount || 0} views
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="border-t border-white/5 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onScanClick}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ScanLine className="h-4 w-4" />
            Scan Tickets
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onEditClick}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center rounded-xl bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
              title="Delete event"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <GuestOverviewCard
        isLoading={isLoadingStats}
        checkInStats={checkInStats}
        approvedCount={approvedCount}
        pendingApprovalCount={pendingApprovalCount}
        waitlistedCount={waitlistedCount}
      />

      <InvitationsSection onInviteClick={() => setShowInviteGuestsModal(true)} />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card-background border border-white/5 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Delete Event</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <span className="font-medium text-foreground">{eventData.name}</span>?
            </p>

            {/* Consequences warning */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400 mb-2">This will permanently:</p>
                  <ul className="text-amber-400/80 space-y-1 list-disc list-inside">
                    <li>Remove the event from public view</li>
                    <li>Cancel all registered tickets</li>
                    <li>Delete all event data and check-in history</li>
                  </ul>
                </div>
              </div>
            </div>

            {ticketStats.totalSold > 0 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 mb-4">
                <p className="text-sm text-red-400">
                  <span className="font-semibold">{ticketStats.totalSold} people</span> have registered for this event. They will lose access to their tickets.
                </p>
              </div>
            )}

            {/* Paid tickets refund section */}
            {isLoadingRefundInfo ? (
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking for paid tickets...</span>
              </div>
            ) : refundableInfo && refundableInfo.count > 0 && !refundComplete ? (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      {refundableInfo.count} paid ticket{refundableInfo.count !== 1 ? 's' : ''} (£{refundableInfo.totalAmount.toFixed(2)})
                    </p>
                    <p className="text-xs text-blue-400/70 mb-3">
                      You must refund paid tickets before deleting this event.
                    </p>
                    <button
                      onClick={handleRefundAll}
                      disabled={isRefunding}
                      className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isRefunding ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Refunding...
                        </>
                      ) : (
                        "Refund All Tickets"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : refundComplete ? (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 mb-4">
                <p className="text-sm text-green-400">All paid tickets have been refunded. You can now delete the event.</p>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground mb-4">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting || isRefunding}
                className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteClick();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting || isRefunding || (refundableInfo !== null && refundableInfo.count > 0 && !refundComplete)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete Event"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <InviteGuestsModal
        isOpen={showInviteGuestsModal}
        onClose={() => setShowInviteGuestsModal(false)}
        onSelectCsv={() => setShowCsvUploadModal(true)}
        onSelectLink={() => setShowInviteLinkModal(true)}
      />

      <CsvUploadModal
        isOpen={showCsvUploadModal}
        onClose={() => setShowCsvUploadModal(false)}
        onBack={handleBackFromCsv}
        tickets={eventData.eventTickets || []}
      />

      <InviteLinkModal
        isOpen={showInviteLinkModal}
        onClose={() => setShowInviteLinkModal(false)}
        onBack={handleBackFromLink}
        eventId={eventData.id}
        tickets={eventData.eventTickets || []}
      />
    </div>
  );
}
