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
import { getEffectiveTicketStatus } from "@/lib/ticket-utils";
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
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type TabType = "upcoming" | "all";
type SubFilterType = "all" | "past" | "cancelled";

function MyTicketsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightTicketId = searchParams.get("ticketId");

  const clearTicketIdParam = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ticketId");
    const newUrl = params.toString() ? `/my-tickets?${params.toString()}` : "/my-tickets";
    router.replace(newUrl, { scroll: false });
  };

  const [tickets, setTickets] = useState<GuestTicketWithEventResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [subFilter, setSubFilter] = useState<SubFilterType>("all");
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

  const isPendingStatus = (status: GuestTicketStatus) =>
    status === GuestTicketStatus.PENDING_APPROVAL ||
    status === GuestTicketStatus.PENDING_PAYMENT ||
    status === GuestTicketStatus.WAITLISTED;

  const isUpcomingStatus = (status: GuestTicketStatus) =>
    status === GuestTicketStatus.ACTIVE ||
    status === GuestTicketStatus.CHECKED_IN;

  const isRestStatus = (status: GuestTicketStatus) =>
    status === GuestTicketStatus.EXPIRED ||
    status === GuestTicketStatus.CANCELLED ||
    status === GuestTicketStatus.REFUNDED;

  // Calculate counts for each tab
  const tabCounts = useMemo(() => {
    const counts = {
      upcoming: 0,
      all: 0,
      past: 0,
      cancelled: 0,
    };

    tickets.forEach((ticket) => {
      const effective = getEffectiveTicketStatus(
        ticket.status,
        ticket.eventStartDateTime,
        ticket.eventEndDateTime,
      );

      if (isUpcomingStatus(effective) || isPendingStatus(effective)) {
        counts.upcoming++;
      }

      if (isRestStatus(effective)) {
        counts.all++;
        if (
          effective === GuestTicketStatus.CANCELLED ||
          effective === GuestTicketStatus.REFUNDED
        ) {
          counts.cancelled++;
        } else if (effective === GuestTicketStatus.EXPIRED) {
          counts.past++;
        }
      }
    });

    return counts;
  }, [tickets]);

  // For the upcoming tab, split into pending and active sections
  const { pendingTickets, activeTickets } = useMemo(() => {
    const pending: GuestTicketWithEventResponseDto[] = [];
    const active: GuestTicketWithEventResponseDto[] = [];

    tickets.forEach((ticket) => {
      const effective = getEffectiveTicketStatus(
        ticket.status,
        ticket.eventStartDateTime,
        ticket.eventEndDateTime,
      );
      if (isPendingStatus(effective)) pending.push(ticket);
      else if (isUpcomingStatus(effective)) active.push(ticket);
    });

    const sortAsc = (a: GuestTicketWithEventResponseDto, b: GuestTicketWithEventResponseDto) =>
      new Date(a.eventStartDateTime).getTime() - new Date(b.eventStartDateTime).getTime();

    return {
      pendingTickets: pending.sort(sortAsc),
      activeTickets: active.sort(sortAsc),
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (activeTab === "upcoming") {
      return [...pendingTickets, ...activeTickets];
    }

    return tickets
      .filter((ticket) => {
        const effective = getEffectiveTicketStatus(
          ticket.status,
          ticket.eventStartDateTime,
          ticket.eventEndDateTime,
        );

        if (!isRestStatus(effective)) return false;
        if (subFilter === "past") return effective === GuestTicketStatus.EXPIRED;
        if (subFilter === "cancelled")
          return (
            effective === GuestTicketStatus.CANCELLED ||
            effective === GuestTicketStatus.REFUNDED
          );
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventStartDateTime).getTime();
        const dateB = new Date(b.eventStartDateTime).getTime();
        return dateB - dateA;
      });
  }, [tickets, activeTab, subFilter, pendingTickets, activeTickets]);

  const formatCount = (count: number) => (count > 99 ? "99+" : count);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "upcoming",
      label: "Upcoming",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    { id: "all", label: "All", icon: <Ticket className="h-4 w-4" /> },
  ];

  const subFilters: { id: SubFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
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
                  {[...Array(2)].map((_, i) => (
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
                {/* Tabs */}
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 tickets-stagger-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                        if (t.id !== "all") setSubFilter("all");
                      }}
                      className={`flex-shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                        activeTab === t.id
                          ? "bg-primary text-white shadow-lg shadow-primary/25 border border-primary/50"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/5 hover:border-white/10"
                      }`}
                    >
                      {t.icon}
                      {t.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                          activeTab === t.id
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {formatCount(tabCounts[t.id])}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sub-filters for "All" tab */}
                {activeTab === "all" && (
                  <div className="mb-6 flex gap-1.5 tickets-stagger-2">
                    {subFilters.map((sf) => (
                      <button
                        key={sf.id}
                        onClick={() => setSubFilter(sf.id)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                          subFilter === sf.id
                            ? "bg-white/15 text-foreground border border-white/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {sf.id !== "all" && <Filter className="h-3 w-3" />}
                        {sf.label}
                        {sf.id !== "all" && (
                          <span className="text-[10px] opacity-70">
                            {formatCount(tabCounts[sf.id])}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {filteredTickets.length === 0 ? (
                  <div key={`${activeTab}-${subFilter}`} className="tickets-content-animate">
                    <div className="rounded-xl border border-white/10 bg-card-background/50 p-10 text-center">
                      <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No {activeTab === "upcoming" ? "upcoming" : subFilter === "all" ? "past" : subFilter} tickets
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {activeTab === "upcoming"
                          ? "You don't have any upcoming tickets right now"
                          : subFilter === "past"
                          ? "No past event tickets"
                          : subFilter === "cancelled"
                          ? "No cancelled or refunded tickets"
                          : "No past or cancelled tickets"}
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
                ) : activeTab === "upcoming" ? (
                  /* Upcoming tab: sectioned layout */
                  <div key="upcoming" className="space-y-6 tickets-content-animate">
                    {/* Pending section */}
                    {pendingTickets.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Pending
                          </h3>
                          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                            {pendingTickets.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {pendingTickets.map((ticket, index) => (
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
                                onQRClose={ticket.id === highlightTicketId ? clearTicketIdParam : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active section */}
                    {activeTickets.length > 0 && (
                      <div>
                        {pendingTickets.length > 0 && (
                          <div className="mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Confirmed
                            </h3>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {activeTickets.map((ticket, index) => (
                            <div
                              key={ticket.id}
                              className="ticket-card-animate"
                              style={{ animationDelay: `${(pendingTickets.length + index) * 50}ms` }}
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
                                onQRClose={ticket.id === highlightTicketId ? clearTicketIdParam : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* All tab: flat grid */
                  <div key={`all-${subFilter}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 tickets-content-animate">
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
                          onQRClose={ticket.id === highlightTicketId ? clearTicketIdParam : undefined}
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
