"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import { CollaboratorRole } from "@/types/event-collaborator";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto, EventStatus } from "@/types/event";
import { GuestTicketStatus, TicketInvitationPreviewDto } from "@/types/guest-ticket";
import type { PaymentFlowState } from "@/types/payment";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  User,
  Ticket,
  Loader2,
  X,
  CheckCircle2,
  ScanLine,
  Crown,
  Shield,
  Gift,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import PaymentModal, { PaymentSuccessModal } from "@/components/payments/PaymentModal";
import RegistrationQuestionsModal from "@/components/RegistrationQuestionsModal";
import { getTicketStatusText, getTicketStatusBadgeClasses, isTicketUsable } from "@/utils/ticket-status";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const eventId = params.id as string;
  const inviteToken = searchParams.get("inviteToken");

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTicketSelector, setShowTicketSelector] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>(
    {}
  );

  // Invitation preview state
  const [invitationPreview, setInvitationPreview] = useState<TicketInvitationPreviewDto | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFlowState | null>(null);
  const [successTicketDetails, setSuccessTicketDetails] = useState<Pick<PaymentFlowState['ticketDetails'], 'ticketName' | 'eventName'> | null>(null);

  // Check if user can manage this event and their role
  type UserRole = "owner" | "admin" | "scanner" | null;
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await eventsApi.findById(eventId);
        console.log("Event data: ", data);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Fetch invitation preview when inviteToken is present
  useEffect(() => {
    const fetchInvitationPreview = async () => {
      if (!inviteToken) return;

      try {
        setInvitationLoading(true);
        setInvitationError(null);
        const preview = await guestTicketService.previewTicketInvitation(inviteToken);

        if (preview.success) {
          setInvitationPreview(preview);
          // Auto-select the invited ticket
          if (preview.ticket?.id) {
            setSelectedTicketId(preview.ticket.id);
          }
        } else {
          setInvitationError(preview.message || "Invalid or expired invitation");
        }
      } catch (err: any) {
        console.error("Failed to fetch invitation preview:", err);
        setInvitationError(err.response?.data?.message || "Invalid or expired invitation");
      } finally {
        setInvitationLoading(false);
      }
    };

    fetchInvitationPreview();
  }, [inviteToken]);

  // Check if user is owner or collaborator and determine role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!event) return;

      if (!user && !authLoading) {
        setUserRole(null);
        return;
      }

      if (!user) return;

      // Check if user is the event owner
      const isOwner = event.owner?.user?.id === user.id;
      if (isOwner) {
        setUserRole("owner");
        return;
      }

      // Check if user is a collaborator
      try {
        const collaboratorsData = await eventCollaboratorService.getCollaborators(eventId);
        const collaborator = collaboratorsData.collaborators.find(
          (collab) =>
            collab.inviteAccepted &&
            collab.eventUser?.id === user.eventUser?.id
        );
        if (collaborator) {
          if (collaborator.role === CollaboratorRole.COLLABORATOR_ADMIN) {
            setUserRole("admin");
          } else {
            setUserRole("scanner");
          }
        } else {
          setUserRole(null);
        }
      } catch (err) {
        // User might not have permission to view collaborators
        setUserRole(null);
      }
    };

    checkUserRole();
  }, [event, user, authLoading, eventId]);

  const selectedTicket = event?.eventTickets?.find(
    (t) => t.id === selectedTicketId
  );

  const handleRegister = async (ticketId: string) => {
    // Build the redirect URL with inviteToken if present
    const currentUrl = `/events/${eventId}${inviteToken ? `?inviteToken=${inviteToken}` : ''}`;

    if (!isAuthenticated) {
      toast.error("Please log in to register for this event");
      router.push(`/auth?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const ticket = event?.eventTickets?.find((t) => t.id === ticketId);
    if (!ticket) {
      toast.error("Ticket not found");
      return;
    }

    // Set the selected ticket for the question form
    setSelectedTicketId(ticketId);

    // For invitation flow, skip question form (invitation already has ticket selected)
    // Check if ticket has questions that need answering (only for non-invite flow)
    if (
      !inviteToken &&
      ticket.questionForm &&
      ticket.questionForm.length > 0 &&
      !showQuestionForm
    ) {
      setShowQuestionForm(true);
      return;
    }

    try {
      setIsRegistering(true);

      // If we have an invite token, use the accept invitation API
      if (inviteToken && invitationPreview?.success) {
        const result = await guestTicketService.acceptTicketInvite(inviteToken);

        if (result.success) {
          // Check if payment is required
          if (result.requiresPayment && result.guestTicket) {
            try {
              const paymentResponse = await paymentService.createTicketPaymentIntent(result.guestTicket.id);

              if (paymentResponse.success && paymentResponse.clientSecret) {
                setPaymentData({
                  clientSecret: paymentResponse.clientSecret,
                  amount: paymentResponse.amount || 0,
                  currency: paymentResponse.currency || 'gbp',
                  ticketDetails: paymentResponse.ticketDetails || {
                    ticketName: invitationPreview.ticket?.name || 'Ticket',
                    eventName: event?.name || 'Event',
                    price: Number(ticket?.price) || 0,
                  },
                  guestTicketId: result.guestTicket.id,
                });
                setShowPaymentModal(true);
              } else {
                throw new Error(paymentResponse.error || 'Failed to create payment');
              }
            } catch (paymentError: any) {
              console.error("Payment setup failed:", paymentError);
              toast.error(
                paymentError.response?.data?.message || "Failed to setup payment. Please try again from My Tickets."
              );
              router.push("/my-tickets");
            }
          } else {
            toast.success(result.message || "Invitation accepted successfully!");
            router.push("/my-tickets");
          }
        } else {
          toast.error(result.message || "Failed to accept invitation");
        }
      } else {
        // Normal registration flow
        const result = await guestTicketService.registerForTicket({
          eventTicketId: ticketId,
          questionAnswers:
            Object.keys(questionAnswers).length > 0 ? questionAnswers : undefined,
        });

        if (result.success) {
          setShowQuestionForm(false);
          setQuestionAnswers({});

          // Check if user was added to waitlist
          if (result.isWaitlisted) {
            toast.success(
              result.message || `Added to waitlist at position #${result.waitlistPosition}!`,
              { duration: 5000 }
            );
            setShowTicketSelector(false);
            setSelectedTicketId(null);
            router.push("/my-tickets");
            return;
          }

          // Check if payment is required
          if (result.requiresPayment && result.guestTicket.status === GuestTicketStatus.PENDING_PAYMENT) {
            // Get payment intent for this guest ticket
            try {
              const paymentResponse = await paymentService.createTicketPaymentIntent(result.guestTicket.id);

              if (paymentResponse.success && paymentResponse.clientSecret) {
                setPaymentData({
                  clientSecret: paymentResponse.clientSecret,
                  amount: paymentResponse.amount || 0,
                  currency: paymentResponse.currency || 'gbp',
                  ticketDetails: paymentResponse.ticketDetails || {
                    ticketName: ticket?.name || 'Ticket',
                    eventName: event?.name || 'Event',
                    price: Number(ticket?.price) || 0,
                  },
                  guestTicketId: result.guestTicket.id,
                });
                setShowPaymentModal(true);
                setShowTicketSelector(false);
                setSelectedTicketId(null);
              } else {
                throw new Error(paymentResponse.error || 'Failed to create payment');
              }
            } catch (paymentError: any) {
              console.error("Payment setup failed:", paymentError);
              toast.error(
                paymentError.response?.data?.message || "Failed to setup payment. Please try again from My Tickets."
              );
              router.push("/my-tickets");
            }
          } else {
            toast.success(result.message || "Successfully registered for event!");
            setShowTicketSelector(false);
            setSelectedTicketId(null);
            router.push("/my-tickets");
          }
        }
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for event"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
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
    toast.info("Payment cancelled. You can complete payment from My Tickets.");
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessTicketDetails(null);
    router.push("/my-tickets");
  };

  const handleQuestionChange = (question: string, value: any) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

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

  const isSameDay = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <button
            onClick={() => router.push("/events")}
            className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Events
          </button>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-12 text-center">
            <p className="mb-4 text-lg text-red-400">
              {error || "Event not found"}
            </p>
            <button
              onClick={() => router.push("/events")}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    [EventStatus.PUBLISHED]:
      "bg-green-500/20 text-green-400 border-green-500/30",
    [EventStatus.DRAFT]: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    [EventStatus.ONGOING]:
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
    [EventStatus.CANCELLED]: "bg-red-500/20 text-red-400 border-red-500/30",
    [EventStatus.COMPLETED]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Management/Scanner Banner - Mobile (full width) */}
      {userRole && (
        <div className={`sm:hidden border-y ${userRole === "scanner" ? "border-blue-500/30 bg-blue-500/10" : userRole === "admin" ? "border-purple-500/30 bg-purple-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-300">
              {userRole === "scanner"
                ? "You can scan tickets for this event."
                : userRole === "owner"
                ? "You have full access to this event."
                : "You have manage access for this event."}
            </span>
            {userRole === "scanner" ? (
              <Link
                href={`/event-management/${eventId}/scanner`}
                className="shrink-0 flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <ScanLine className="h-4 w-4" />
                Scan
              </Link>
            ) : (
              <Link
                href={`/event-management/${eventId}`}
                className={`shrink-0 flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
                  userRole === "owner"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                Manage
                <span className="text-xs">↗</span>
              </Link>
            )}
          </div>
        </div>
      )}


      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Management/Scanner Banner - Desktop */}
        {userRole && (
          <div className={`hidden sm:flex mb-6 items-center justify-between gap-4 rounded-lg border px-4 py-3 ${userRole === "scanner" ? "border-blue-500/30 bg-blue-500/10" : userRole === "admin" ? "border-purple-500/30 bg-purple-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  userRole === "owner"
                    ? "bg-amber-500/30 text-amber-400"
                    : userRole === "admin"
                    ? "bg-purple-500/30 text-purple-400"
                    : "bg-blue-500/30 text-blue-400"
                }`}
              >
                {userRole === "owner" && <Crown className="h-3 w-3" />}
                {userRole === "admin" && <Shield className="h-3 w-3" />}
                {userRole === "scanner" && <ScanLine className="h-3 w-3" />}
                {userRole === "owner" ? "Owner" : userRole === "admin" ? "Admin" : "Scanner"}
              </span>
              <span className="text-sm text-neutral-300">
                {userRole === "scanner"
                  ? "You can scan tickets for this event."
                  : userRole === "owner"
                  ? "You have full access to this event."
                  : "You have manage access for this event."}
              </span>
            </div>
            {userRole === "scanner" ? (
              <Link
                href={`/event-management/${eventId}/scanner`}
                className="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <ScanLine className="h-4 w-4" />
                Scan Tickets
              </Link>
            ) : (
              <Link
                href={`/event-management/${eventId}`}
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
                  userRole === "owner"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                Manage
                <span className="text-xs">↗</span>
              </Link>
            )}
          </div>
        )}


        {/* Back Button */}
        <button
          onClick={() => router.push("/events")}
          className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Events
        </button>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col gap-6 lg:flex-row-reverse">
          {/* Left Column - Image and Sidebar */}
          <section className="flex flex-col gap-6 lg:w-96 lg:shrink-0">
            {/* 2×2 Grid on sm-md, Flex column on lg+ */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:flex-col">
              {/* Top Left: Image with Status Badge */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-700 bg-card-secondary-background sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
                {event.eventImage ? (
                  <Image
                    src={event.eventImage}
                    alt={event.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center"
                    style={{ backgroundColor: event.eventColor || "#3b82f6" }}
                  >
                    <Calendar className="h-24 w-24 text-white/30" />
                  </div>
                )}

                {/* Status Badge - Only on lg+ */}
                <div className="absolute right-4 top-4 hidden lg:block">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md ${
                      statusColors[event.status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {event.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Event Title & Categories - Show on mobile & tablet, hide on desktop */}
              <div className="block lg:hidden sm:col-span-1 sm:row-span-1 sm:flex sm:flex-col sm:items-center sm:justify-center">
                <h1 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground sm:text-center">
                  {event.name}
                </h1>

                {/* Categories */}
                {event.categories && event.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:justify-center">
                    {event.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-foreground"
                        style={
                          category.color
                            ? {
                                borderColor: category.color + "40",
                                color: category.color,
                              }
                            : undefined
                        }
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Date & Time Card - Bottom left on tablet, normal on mobile/desktop */}
              <div className="rounded-xl border border-neutral-700 bg-card-background p-6 sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Date & Time
                </h3>
                <div className="flex gap-4">
                  {isSameDay(event.startDateTime, event.endDateTime) ? (
                    <>
                      <div className="flex flex-col items-center py-1">
                        <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {formatDate(event.startDateTime)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.startDateTime)} -{" "}
                          {formatTime(event.endDateTime)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center py-1">
                        <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                        <div className="my-2 w-0.5 flex-1 rounded-full bg-primary/30"></div>
                        <div className="h-3 w-3 rounded-full bg-primary/30 shadow-md"></div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Start
                          </p>
                          <p className="font-medium text-foreground">
                            {formatDate(event.startDateTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(event.startDateTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            End
                          </p>
                          <p className="font-medium text-foreground">
                            {formatDate(event.endDateTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(event.endDateTime)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Location Card - Bottom right */}
              <div className="rounded-xl border border-neutral-700 bg-card-background overflow-hidden sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
                {event.address ? (
                  <>
                    {/* Map Area */}
                    {event.address.location?.latitude && event.address.location?.longitude ? (
                      <GoogleMap
                        latitude={event.address.location.latitude}
                        longitude={event.address.location.longitude}
                        title={event.address.name}
                        className="h-40 w-full !rounded-none"
                      />
                    ) : (
                      <div className="h-40 w-full bg-card-secondary-background flex flex-col items-center justify-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Map</span>
                      </div>
                    )}

                    {/* Address Details */}
                    <div className="p-4">
                      {event.address.name && event.address.name !== event.name && (
                        <h3 className="font-semibold text-foreground mb-1">
                          {event.address.name}
                        </h3>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {[
                          event.address.addressLine1,
                          event.address.addressLine2,
                          event.address.city,
                          event.address.zipcode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    <div className="h-32 w-full bg-card-secondary-background rounded-lg flex flex-col items-center justify-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Map</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Location TBD</p>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer & Stats - Side by side on sm-md, separate on lg+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {/* Organizer Card */}
              <div className="rounded-xl border border-white/10 bg-card-background p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Organized by
                  </h3>
                  {/* Status Badge - Show on mobile/tablet, hide on desktop */}
                  <div className="block lg:hidden">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusColors[event.status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
                {event.owner?.user ? (
                  <div className="flex items-center gap-3">
                    {event.owner.user.profilePicture ? (
                      <Image
                        src={event.owner.user.profilePicture}
                        alt={event.owner.user.username || "Organizer"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {event.owner.user.username || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">Organizer</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Event Organizer</p>
                      <p className="text-sm text-muted-foreground">Organizer</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Stats Card */}
              <div className="rounded-xl border border-neutral-700 bg-card-background p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Event Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span>Attendees</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {event.attendeesCount || 0}
                    </span>
                  </div>
                  {event.ticketsSoldCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-5 w-5" />
                        <span>Tickets Sold</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {event.ticketsSoldCount}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {event.viewCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column - Main Content */}
          <section className="flex-1 space-y-6">
            {/* Event Title and Categories - Only show on desktop */}
            <div className="hidden lg:block">
              <h1 className="mb-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                {event.name}
              </h1>

              {/* Categories */}
              {event.categories && event.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-foreground"
                      style={
                        category.color
                          ? {
                              borderColor: category.color + "40",
                              color: category.color,
                            }
                          : undefined
                      }
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Invitation Banner */}
            {inviteToken && invitationPreview?.success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <Gift className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-400">
                      You&apos;ve been invited!
                    </h3>
                    <p className="text-sm text-emerald-300/80">
                      You have an invitation for the <span className="font-medium">{invitationPreview.ticket?.name}</span> ticket
                      {invitationPreview.ticket?.bypassPayment && invitationPreview.ticket?.isPaid && (
                        <span className="ml-1">(payment waived)</span>
                      )}
                      {invitationPreview.bypassApproval && (
                        <span className="ml-1">(no approval required)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invitation Error Banner */}
            {inviteToken && invitationError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-400">
                      Invalid Invitation
                    </h3>
                    <p className="text-sm text-red-300/80">
                      {invitationError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets */}
            {event.eventTickets && event.eventTickets.length > 0 && (() => {
              const isEventEnded = new Date(event.endDateTime) < new Date();
              const hasAvailableTickets = event.eventTickets.some(t => (t.quantityLeft ?? 0) > 0 && t.isAvailable);
              const hasUserTicket = !!event.userTicket;
              // Allow registration even when sold out (for waitlist), but not if user already has ticket
              const canRegister = event.status === EventStatus.PUBLISHED && !isEventEnded && !hasUserTicket;
              const showClosedMessage = isEventEnded && !hasUserTicket;
              // Check if we have a valid invitation
              const hasValidInvitation = inviteToken && invitationPreview?.success;
              const invitedTicketId = invitationPreview?.ticket?.id;

              return (
                <div className="rounded-xl bg-card-background backdrop-blur-xl p-6 border border-neutral-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-foreground">
                      Tickets
                    </h2>
                    {showClosedMessage && (
                      <span className="text-sm text-muted-foreground">
                        Registration closed
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {event.eventTickets.map((ticket) => {
                      const remaining = ticket.quantityLeft ?? 0;
                      const isSelected = selectedTicketId === ticket.id;
                      const isSoldOut = remaining <= 0;
                      const isManuallyUnavailable = !ticket.isAvailable; // Organizer disabled this ticket
                      const isOwnedTicket = event.userTicket?.ticketName === ticket.name;
                      const isActiveTicket = isOwnedTicket && isTicketUsable(event.userTicket!.status as GuestTicketStatus);
                      // Check if this is the invited ticket
                      const isInvitedTicket = hasValidInvitation && ticket.id === invitedTicketId;
                      // In invitation mode, only the invited ticket is selectable
                      const isDisabledByInvitation = hasValidInvitation && !isInvitedTicket;
                      // Can select sold out tickets for waitlist, but not if organizer disabled or user has ticket
                      const isDisabled = !canRegister || isManuallyUnavailable || hasUserTicket || isDisabledByInvitation;

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => !isDisabled && !isDisabledByInvitation && setSelectedTicketId(ticket.id)}
                          className={`flex items-center justify-between gap-2 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all ${
                            isOwnedTicket
                              ? isActiveTicket
                                ? "border-green-500/30 bg-green-500/10 cursor-default"
                                : "border-yellow-500/30 bg-yellow-500/10 cursor-default"
                              : isInvitedTicket
                                ? "border-emerald-500/50 bg-emerald-500/10 cursor-pointer ring-2 ring-emerald-500/30"
                                : isDisabledByInvitation
                                  ? "border-white/5 bg-card-secondary-background opacity-40 cursor-not-allowed"
                                  : isDisabled
                                    ? "border-white/10 bg-card-secondary-background opacity-50 cursor-not-allowed"
                                    : isSelected
                                      ? "border-primary bg-primary/10 cursor-pointer"
                                      : "border-white/10 bg-card-secondary-background cursor-pointer hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {isOwnedTicket ? (
                              <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${isActiveTicket ? "text-green-400" : "text-yellow-400"}`} />
                            ) : isInvitedTicket ? (
                              <Gift className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-400" />
                            ) : canRegister && !isManuallyUnavailable && !isDisabledByInvitation && (
                              <div
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected ? "border-primary" : "border-white/30"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className={`text-sm sm:text-base font-semibold break-words ${isInvitedTicket ? "text-emerald-400" : "text-foreground"}`}>
                                {ticket.name}
                                {isInvitedTicket && (
                                  <span className="ml-2 text-xs font-normal text-emerald-300/80">(Invited)</span>
                                )}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {isOwnedTicket ? (
                                  isTicketUsable(event.userTicket!.status as GuestTicketStatus) ? (
                                    <span className="text-green-400">You own this ticket</span>
                                  ) : (
                                    <span className="text-yellow-400">{getTicketStatusText(event.userTicket!.status as GuestTicketStatus)}</span>
                                  )
                                ) : isInvitedTicket ? (
                                  <span className="text-emerald-300/80">
                                    {invitationPreview?.ticket?.bypassPayment && invitationPreview?.ticket?.isPaid ? "Free with invitation" : `${remaining} left`}
                                  </span>
                                ) : isManuallyUnavailable ? (
                                  <span className="text-gray-400">Unavailable</span>
                                ) : isSoldOut ? (
                                  <span className="text-amber-400">Sold out - Join waitlist</span>
                                ) : (
                                  `${remaining} left`
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-base sm:text-xl font-bold ${isInvitedTicket && invitationPreview?.ticket?.bypassPayment && invitationPreview?.ticket?.isPaid ? "text-emerald-400 line-through decoration-emerald-400/50" : "text-foreground"}`}>
                              {Number(ticket.price) === 0
                                ? "Free"
                                : `£${Number(ticket.price).toFixed(2)}`}
                            </p>
                            {isInvitedTicket && invitationPreview?.ticket?.bypassPayment && invitationPreview?.ticket?.isPaid && (
                              <p className="text-sm font-semibold text-emerald-400">Free</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* User ticket info */}
                  {hasUserTicket && event.userTicket && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={getTicketStatusBadgeClasses(event.userTicket.status as GuestTicketStatus)}>
                            {getTicketStatusText(event.userTicket.status as GuestTicketStatus)}
                          </span>
                          {event.userTicket.checkInCode && isTicketUsable(event.userTicket.status as GuestTicketStatus) && (
                            <span className="text-xs text-muted-foreground">
                              Code: <span className="font-mono font-semibold text-foreground">{event.userTicket.checkInCode}</span>
                            </span>
                          )}
                        </div>
                        <Link
                          href="/my-tickets"
                          className="text-sm text-green-400 hover:text-green-300 transition-colors"
                        >
                          View in My Tickets →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Accept Invitation Button (for invitation mode) */}
                  {hasValidInvitation && canRegister && (
                    <button
                      onClick={() => invitedTicketId && handleRegister(invitedTicketId)}
                      disabled={isRegistering}
                      className="w-full mt-4 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Accepting invitation...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4" />
                          Accept Invitation
                        </>
                      )}
                    </button>
                  )}

                  {/* Register/Join Waitlist Button (for normal mode) */}
                  {!hasValidInvitation && canRegister && event.eventTickets.some(t => t.isAvailable) && (
                    <button
                      onClick={() => selectedTicketId && handleRegister(selectedTicketId)}
                      disabled={!selectedTicketId || isRegistering}
                      className="w-full mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {(() => {
                            const ticket = event.eventTickets.find(t => t.id === selectedTicketId);
                            const isSoldOut = (ticket?.quantityLeft ?? 0) <= 0;
                            return isSoldOut ? "Joining waitlist..." : "Registering...";
                          })()}
                        </>
                      ) : selectedTicketId ? (
                        (() => {
                          const ticket = event.eventTickets.find(t => t.id === selectedTicketId);
                          const isSoldOut = (ticket?.quantityLeft ?? 0) <= 0;
                          return isSoldOut ? "Join Waitlist" : "Register";
                        })()
                      ) : (
                        "Select a ticket"
                      )}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Description */}
            <div className="py-6">
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground ">
                About this event
              </h2>
              {event.description ? (
                <div
                  className="tiptap-editor tiptap-view-mode"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </div>
          </section>
        </div>
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

      {/* Question Form Modal */}
      {selectedTicket?.questionForm && (
        <RegistrationQuestionsModal
          isOpen={showQuestionForm}
          questionForm={selectedTicket.questionForm}
          questionAnswers={questionAnswers}
          onQuestionChange={handleQuestionChange}
          onCancel={() => {
            setShowQuestionForm(false);
            setQuestionAnswers({});
          }}
          onSubmit={() => selectedTicketId && handleRegister(selectedTicketId)}
          isSubmitting={isRegistering}
        />
      )}

    </div>
  );
}
