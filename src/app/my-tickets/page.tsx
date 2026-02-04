// app/my-tickets/page.tsx
"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { guestTicketService } from "@/services/guest-ticket.service";
import { paymentService } from "@/services/payment.service";
import {
  GuestTicketWithEventResponseDto,
  GuestTicketStatus,
} from "@/types/guest-ticket";
import type { PaymentFlowState } from "@/types/payment";
import { TicketCard } from "@/components/tickets";
import PaymentModal, {
  PaymentSuccessModal,
} from "@/components/payments/PaymentModal";
import {
  Ticket,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type FilterType = "all" | "active" | "pending" | "cancelled" | "checked_in";

function MyTicketsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightTicketId = searchParams.get("ticketId");

  const [tickets, setTickets] = useState<GuestTicketWithEventResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("active");
  const [refundingTicketId, setRefundingTicketId] = useState<string | null>(null);
  const [cancellingTicketId, setCancellingTicketId] = useState<string | null>(null);
  const [leavingWaitlistTicketId, setLeavingWaitlistTicketId] = useState<string | null>(null);

  // Payment state
  const [processingPaymentTicketId, setProcessingPaymentTicketId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFlowState | null>(null);
  const [successTicketDetails, setSuccessTicketDetails] = useState<{
    ticketName: string;
    eventName: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const response = await guestTicketService.getMyTickets();
        setTickets(response.tickets);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast.error("Failed to load your tickets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [isAuthenticated]);

  const handleRefund = async (ticketId: string) => {
    try {
      setRefundingTicketId(ticketId);
      const eligibility = await guestTicketService.checkRefundEligibility(ticketId);

      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "This ticket is not eligible for refund");
        return;
      }

      const result = await guestTicketService.refundTicket(ticketId, {
        reason: "User requested refund",
      });

      if (result.success) {
        toast.success(
          result.message ||
            `Refund of £${eligibility.refundAmount?.toFixed(2) || "0.00"} processed successfully`
        );
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: GuestTicketStatus.REFUNDED } : t
          )
        );
      } else {
        toast.error(result.message || "Failed to process refund");
      }
    } catch (error: any) {
      console.error("Refund failed:", error);
      toast.error(error.response?.data?.message || "Failed to process refund");
    } finally {
      setRefundingTicketId(null);
    }
  };

  const handleCancel = async (ticketId: string) => {
    try {
      setCancellingTicketId(ticketId);
      const result = await guestTicketService.cancelTicket(ticketId);

      if (result.success) {
        toast.success(result.message || "Ticket cancelled successfully");
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: GuestTicketStatus.CANCELLED } : t
          )
        );
      } else {
        toast.error(result.message || "Failed to cancel ticket");
      }
    } catch (error: any) {
      console.error("Cancel failed:", error);
      toast.error(error.response?.data?.message || "Failed to cancel ticket");
    } finally {
      setCancellingTicketId(null);
    }
  };

  const handleLeaveWaitlist = async (ticketId: string) => {
    try {
      setLeavingWaitlistTicketId(ticketId);
      const result = await guestTicketService.leaveWaitlist(ticketId);

      if (result.success) {
        toast.success(result.message || "You have left the waitlist");
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      } else {
        toast.error(result.message || "Failed to leave waitlist");
      }
    } catch (error: any) {
      console.error("Leave waitlist failed:", error);
      toast.error(error.response?.data?.message || "Failed to leave waitlist");
    } finally {
      setLeavingWaitlistTicketId(null);
    }
  };

  const handleCompletePayment = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      toast.error("Ticket not found");
      return;
    }

    try {
      setProcessingPaymentTicketId(ticketId);
      const paymentResponse = await paymentService.createTicketPaymentIntent(ticketId);

      if (paymentResponse.success && paymentResponse.clientSecret) {
        setPaymentData({
          clientSecret: paymentResponse.clientSecret,
          amount: paymentResponse.amount || 0,
          currency: paymentResponse.currency || "gbp",
          ticketDetails: paymentResponse.ticketDetails || {
            ticketName: ticket.ticketName,
            eventName: ticket.eventName,
            price: 0,
          },
          guestTicketId: ticketId,
        });
        setShowPaymentModal(true);
      } else {
        throw new Error(paymentResponse.error || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("Payment setup failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to setup payment. Please try again."
      );
    } finally {
      setProcessingPaymentTicketId(null);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);

    if (paymentData?.guestTicketId) {
      try {
        await paymentService.confirmTicketPayment(paymentData.guestTicketId);
      } catch (error) {
        console.error("Failed to confirm payment with backend:", error);
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === paymentData.guestTicketId
            ? { ...t, status: GuestTicketStatus.ACTIVE }
            : t
        )
      );
    }

    if (paymentData) {
      setSuccessTicketDetails({
        ticketName: paymentData.ticketDetails.ticketName,
        eventName: paymentData.ticketDetails.eventName,
      });
    }
    setShowSuccessModal(true);
    setPaymentData(null);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    toast.info("Payment cancelled. You can try again later.");
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessTicketDetails(null);
  };

  const now = new Date();

  // Calculate counts for each filter
  const filterCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      active: 0,
      pending: 0,
      cancelled: 0,
      checked_in: 0,
    };

    tickets.forEach((ticket) => {
      const eventEndDate = new Date(ticket.eventEndDateTime);
      const hasEnded = eventEndDate < now;

      if (ticket.status === GuestTicketStatus.ACTIVE && !hasEnded) {
        counts.active++;
      } else if (
        ticket.status === GuestTicketStatus.PENDING_APPROVAL ||
        ticket.status === GuestTicketStatus.PENDING_PAYMENT ||
        ticket.status === GuestTicketStatus.WAITLISTED
      ) {
        counts.pending++;
      } else if (
        ticket.status === GuestTicketStatus.CANCELLED ||
        ticket.status === GuestTicketStatus.REFUNDED
      ) {
        counts.cancelled++;
      } else if (ticket.status === GuestTicketStatus.CHECKED_IN) {
        counts.checked_in++;
      }
    });

    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const eventEndDate = new Date(ticket.eventEndDateTime);
        const hasEnded = eventEndDate < now;

        switch (filter) {
          case "active":
            return ticket.status === GuestTicketStatus.ACTIVE && !hasEnded;
          case "pending":
            return (
              ticket.status === GuestTicketStatus.PENDING_APPROVAL ||
              ticket.status === GuestTicketStatus.PENDING_PAYMENT ||
              ticket.status === GuestTicketStatus.WAITLISTED
            );
          case "cancelled":
            return (
              ticket.status === GuestTicketStatus.CANCELLED ||
              ticket.status === GuestTicketStatus.REFUNDED
            );
          case "checked_in":
            return ticket.status === GuestTicketStatus.CHECKED_IN;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventStartDateTime).getTime();
        const dateB = new Date(b.eventStartDateTime).getTime();
        if (filter === "active" || filter === "pending") {
          return dateA - dateB;
        }
        return dateB - dateA;
      });
  }, [tickets, filter]);

  const formatCount = (count: number) => (count > 99 ? "99+" : count);

  const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    {
      id: "active",
      label: "Active",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    { id: "pending", label: "Pending", icon: <Clock className="h-4 w-4" /> },
    { id: "cancelled", label: "Cancelled", icon: <Ticket className="h-4 w-4" /> },
    { id: "checked_in", label: "Checked In", icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: "all", label: "All", icon: <Ticket className="h-4 w-4" /> },
  ];

  // Check if user has no tickets at all
  const hasNoTickets = !isLoading && tickets.length === 0;

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 tickets-stagger-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            My Tickets
          </h1>
          <p className="mt-2 text-md text-muted-foreground">
            View and manage your event tickets
          </p>
        </div>

        {/* Unified Empty State - No tickets at all */}
        {hasNoTickets ? (
          <div className="tickets-stagger-2">
            <div className="rounded-2xl border border-white/10 bg-card-background/50 backdrop-blur-sm p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                No tickets yet
              </h2>
              <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
                Browse events and get your first ticket to see it here.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                Discover Events
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Loading State */}
            {isLoading ? (
              <div className="tickets-stagger-2">
                {/* Skeleton for filters */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-24 rounded-full skeleton-shimmer"
                    />
                  ))}
                </div>
                {/* Skeleton for cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-72 rounded-2xl skeleton-shimmer"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Filters with counts - horizontal scroll on mobile */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 tickets-stagger-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`flex-shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                        filter === f.id
                          ? "bg-primary text-white shadow-lg shadow-primary/25 border border-primary/50"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/5 hover:border-white/10"
                      }`}
                    >
                      {f.icon}
                      {f.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                          filter === f.id
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {formatCount(filterCounts[f.id])}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Empty Filter State */}
                {filteredTickets.length === 0 ? (
                  <div key={filter} className="tickets-content-animate">
                    <div className="rounded-xl border border-white/10 bg-card-background/50 p-10 text-center">
                      <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No {filter === "all" ? "" : filter.replace("_", " ")} tickets
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {filter === "active"
                          ? "You don't have any active tickets right now"
                          : filter === "pending"
                          ? "No tickets awaiting action"
                          : filter === "cancelled"
                          ? "No cancelled or refunded tickets"
                          : filter === "checked_in"
                          ? "You haven't checked into any events yet"
                          : "No tickets match this filter"}
                      </p>
                      <Link
                        href="/discover"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Search className="h-4 w-4" />
                        Find Events
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Tickets Grid */
                  <div key={filter} className="grid grid-cols-1 sm:grid-cols-2 gap-4 tickets-content-animate">
                    {filteredTickets.map((ticket, index) => (
                      <div
                        key={ticket.id}
                        className="ticket-card-animate"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TicketCard
                          ticket={ticket}
                          onRefund={handleRefund}
                          isRefunding={refundingTicketId === ticket.id}
                          onCompletePayment={handleCompletePayment}
                          isProcessingPayment={processingPaymentTicketId === ticket.id}
                          onCancel={handleCancel}
                          isCancelling={cancellingTicketId === ticket.id}
                          onLeaveWaitlist={handleLeaveWaitlist}
                          isLeavingWaitlist={leavingWaitlistTicketId === ticket.id}
                          autoShowQR={ticket.id === highlightTicketId}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          clientSecret={paymentData.clientSecret}
          ticketDetails={paymentData.ticketDetails}
          amount={paymentData.amount}
          currency={paymentData.currency}
        />
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && successTicketDetails && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
          ticketDetails={successTicketDetails}
        />
      )}
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MyTicketsContent />
    </Suspense>
  );
}
