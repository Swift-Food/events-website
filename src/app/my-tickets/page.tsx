// app/my-tickets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { guestTicketService } from "@/services/guest-ticket.service";
import { GuestTicketWithEventResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { TicketCard } from "@/components/tickets";
import { Ticket, Calendar, CheckCircle2, Clock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type FilterType = "all" | "upcoming" | "past" | "active" | "pending";

export default function MyTicketsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<GuestTicketWithEventResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [refundingTicketId, setRefundingTicketId] = useState<string | null>(null);

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
      // First check eligibility
      const eligibility = await guestTicketService.checkRefundEligibility(ticketId);

      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "This ticket is not eligible for refund");
        return;
      }

      // Confirm with user
      const confirmed = window.confirm(
        `Are you sure you want to refund this ticket? You will receive £${eligibility.refundAmount?.toFixed(2) || "0.00"} back.`
      );

      if (!confirmed) return;

      setRefundingTicketId(ticketId);
      const result = await guestTicketService.refundTicket(ticketId, {
        reason: "User requested refund",
      });

      if (result.success) {
        toast.success(result.message || "Refund processed successfully");
        // Update ticket status locally
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

  const now = new Date();

  const filteredTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.eventStartDateTime);
    const isUpcoming = eventDate > now;

    switch (filter) {
      case "upcoming":
        return isUpcoming && ticket.status !== GuestTicketStatus.CANCELLED && ticket.status !== GuestTicketStatus.REFUNDED;
      case "past":
        return !isUpcoming;
      case "active":
        return ticket.status === GuestTicketStatus.ACTIVE;
      case "pending":
        return ticket.status === GuestTicketStatus.PENDING_APPROVAL || ticket.status === GuestTicketStatus.PENDING_PAYMENT;
      default:
        return true;
    }
  });

  const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: "upcoming", label: "Upcoming", icon: <Calendar className="h-4 w-4" /> },
    { id: "active", label: "Active", icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: "pending", label: "Pending", icon: <Clock className="h-4 w-4" /> },
    { id: "past", label: "Past", icon: <Ticket className="h-4 w-4" /> },
    { id: "all", label: "All", icon: <Ticket className="h-4 w-4" /> },
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your event tickets
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card-background text-muted-foreground hover:text-foreground hover:bg-card-secondary-background"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-card-secondary-background p-4 text-muted-foreground mb-4">
              <Ticket className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No tickets found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {filter === "upcoming"
                ? "You don't have any upcoming tickets. Browse events to find something exciting!"
                : "No tickets match this filter."}
            </p>
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onRefund={handleRefund}
                isRefunding={refundingTicketId === ticket.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
