"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto, EventStatus } from "@/types/event";
import { GuestTicketStatus } from "@/types/guest-ticket";
import type { PaymentFlowState } from "@/types/payment";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  Ticket,
  Loader2,
  X,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import PaymentModal, { PaymentSuccessModal } from "@/components/payments/PaymentModal";
import RegistrationQuestionsModal from "@/components/RegistrationQuestionsModal";
import { getTicketStatusText, getTicketStatusBadgeClasses, isTicketUsable } from "@/utils/ticket-status";

interface EventPreviewModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventPreviewModal({
  eventId,
  isOpen,
  onClose,
}: EventPreviewModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFlowState | null>(null);
  const [successTicketDetails, setSuccessTicketDetails] = useState<Pick<
    PaymentFlowState["ticketDetails"],
    "ticketName" | "eventName"
  > | null>(null);

  // Check if user can manage this event
  const [canManageEvent, setCanManageEvent] = useState(false);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await eventsApi.findById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event details:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId && isOpen) {
      fetchEventDetails();
    }
  }, [eventId, isOpen]);

  // Check if user is owner or collaborator
  useEffect(() => {
    const checkCanManageEvent = async () => {
      if (!event || !isAuthenticated || !user || !eventId) {
        setCanManageEvent(false);
        return;
      }

      const isOwner = event.owner?.user?.id === user.id;
      if (isOwner) {
        setCanManageEvent(true);
        return;
      }

      try {
        const collaboratorsData =
          await eventCollaboratorService.getCollaborators(eventId);
        const isCollaborator = collaboratorsData.collaborators.some(
          (collab) =>
            collab.inviteAccepted && collab.eventUser?.id === user.eventUser?.id
        );
        setCanManageEvent(isCollaborator);
      } catch (err) {
        setCanManageEvent(false);
      }
    };

    checkCanManageEvent();
  }, [event, isAuthenticated, user, eventId]);

  const selectedTicket = event?.eventTickets?.find(
    (t) => t.id === selectedTicketId
  );

  const handleRegister = async (ticketId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to register for this event");
      router.push("/auth");
      return;
    }

    const ticket = event?.eventTickets?.find((t) => t.id === ticketId);
    if (!ticket) {
      toast.error("Ticket not found");
      return;
    }

    setSelectedTicketId(ticketId);

    if (
      ticket.questionForm &&
      ticket.questionForm.length > 0 &&
      !showQuestionForm
    ) {
      setShowQuestionForm(true);
      return;
    }

    try {
      setIsRegistering(true);
      const result = await guestTicketService.registerForTicket({
        eventTicketId: ticketId,
        questionAnswers:
          Object.keys(questionAnswers).length > 0 ? questionAnswers : undefined,
      });

      if (result.success) {
        setShowQuestionForm(false);
        setQuestionAnswers({});

        if (
          result.requiresPayment &&
          result.guestTicket.status === GuestTicketStatus.PENDING_PAYMENT
        ) {
          try {
            const paymentResponse = await paymentService.createTicketPaymentIntent(
              result.guestTicket.id
            );

            if (paymentResponse.success && paymentResponse.clientSecret) {
              setPaymentData({
                clientSecret: paymentResponse.clientSecret,
                amount: paymentResponse.amount || 0,
                currency: paymentResponse.currency || "gbp",
                ticketDetails: paymentResponse.ticketDetails || {
                  ticketName: ticket?.name || "Ticket",
                  eventName: event?.name || "Event",
                  price: Number(ticket?.price) || 0,
                },
                guestTicketId: result.guestTicket.id,
              });
              setShowPaymentModal(true);
              setSelectedTicketId(null);
            } else {
              throw new Error(paymentResponse.error || "Failed to create payment");
            }
          } catch (paymentError: any) {
            console.error("Payment setup failed:", paymentError);
            toast.error(
              paymentError.response?.data?.message ||
                "Failed to setup payment. Please try again from My Tickets."
            );
            router.push("/my-tickets");
          }
        } else {
          toast.success(result.message || "Successfully registered for event!");
          setSelectedTicketId(null);
          router.push("/my-tickets");
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

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setEvent(null);
      setSelectedTicketId(null);
      setShowQuestionForm(false);
      setQuestionAnswers({});
    }, 300);
  };

  const handleViewFullPage = () => {
    if (eventId) {
      router.push(`/events/${eventId}`);
    }
  };

  if (!isOpen) return null;

  const statusColors = {
    [EventStatus.PUBLISHED]: "bg-green-500/20 text-green-400 border-green-500/30",
    [EventStatus.DRAFT]: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    [EventStatus.ONGOING]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    [EventStatus.CANCELLED]: "bg-red-500/20 text-red-400 border-red-500/30",
    [EventStatus.COMPLETED]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal - Desktop: slide from right, Mobile: slide from bottom */}
      <div
        className={`fixed z-50 bg-background shadow-2xl overflow-hidden transition-transform duration-300 ease-out
          /* Mobile: bottom sheet */
          inset-x-0 bottom-0 top-16 rounded-t-3xl
          /* Desktop: right slide-out */
          sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:w-full sm:max-w-2xl sm:rounded-none sm:rounded-l-3xl
          ${isAnimating
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={handleViewFullPage}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">View Full Page</span>
            <span className="sm:hidden">Full Page</span>
          </button>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          )}

          {error && !loading && (
            <div className="p-6">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && event && (
            <div className="p-4 sm:p-6">
              {/* Management Banner */}
              {canManageEvent && (
                <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-3">
                  <span className="text-sm text-neutral-300">
                    You have manage access for this event.
                  </span>
                  <Link
                    href={`/event-management/${eventId}`}
                    className="flex items-center gap-1 rounded-full bg-pink-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-pink-600"
                  >
                    Manage
                    <span className="text-xs">↗</span>
                  </Link>
                </div>
              )}

              {/* Event Image */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-700 bg-card-secondary-background mb-6">
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
                    <Calendar className="h-16 w-16 text-white/30" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute right-4 top-4">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
                      statusColors[event.status] ||
                      "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {event.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Event Title */}
              <h1 className="mb-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {event.name}
              </h1>

              {/* Categories */}
              {event.categories && event.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-foreground"
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

              {/* Date & Time */}
              <div className="rounded-xl border border-neutral-700 bg-card-background p-4 mb-4">
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
                          {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
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

              {/* Location */}
              {event.address && (
                <div className="rounded-xl border border-neutral-700 bg-card-background overflow-hidden mb-4">
                  {event.address.location?.latitude &&
                  event.address.location?.longitude ? (
                    <GoogleMap
                      latitude={event.address.location.latitude}
                      longitude={event.address.location.longitude}
                      title={event.address.name}
                      className="h-32 w-full !rounded-none"
                    />
                  ) : (
                    <div className="h-32 w-full bg-card-secondary-background flex flex-col items-center justify-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Map</span>
                    </div>
                  )}
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
                        event.address.zipcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Organizer & Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Organizer */}
                <div className="rounded-xl border border-white/10 bg-card-background p-4">
                  <p className="text-xs text-muted-foreground mb-2">Organized by</p>
                  {event.owner?.user ? (
                    <div className="flex items-center gap-2">
                      {event.owner.user.profilePicture ? (
                        <Image
                          src={event.owner.user.profilePicture}
                          alt={event.owner.user.username || "Organizer"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.owner.user.username || "Anonymous"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Event Organizer
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-neutral-700 bg-card-background p-4">
                  <p className="text-xs text-muted-foreground mb-2">Stats</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Attendees
                      </span>
                      <span className="font-medium text-foreground">
                        {event.attendeesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Views
                      </span>
                      <span className="font-medium text-foreground">
                        {event.viewCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets */}
              {event.eventTickets &&
                event.eventTickets.length > 0 &&
                (() => {
                  const isEventEnded = new Date(event.endDateTime) < new Date();
                  const hasAvailableTickets = event.eventTickets.some(
                    (t) => (t.quantityLeft ?? 0) > 0 && t.isAvailable
                  );
                  const hasUserTicket = !!event.userTicket;
                  const canRegister =
                    event.status === EventStatus.PUBLISHED &&
                    !isEventEnded &&
                    hasAvailableTickets &&
                    !hasUserTicket;
                  const showClosedMessage = (isEventEnded || !hasAvailableTickets) && !hasUserTicket;

                  return (
                    <div className="rounded-xl bg-card-background backdrop-blur-xl p-4 border border-neutral-700 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-foreground">
                          Tickets
                        </h2>
                        {showClosedMessage && (
                          <span className="text-xs text-muted-foreground">
                            Registration closed
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {event.eventTickets.map((ticket) => {
                          const remaining = ticket.quantityLeft ?? 0;
                          const isSelected = selectedTicketId === ticket.id;
                          const isSoldOut = remaining <= 0 || !ticket.isAvailable;
                          const isOwnedTicket = event.userTicket?.ticketName === ticket.name;
                          const isDisabled = isSoldOut || !canRegister || hasUserTicket;

                          return (
                            <div
                              key={ticket.id}
                              onClick={() =>
                                !isDisabled && setSelectedTicketId(ticket.id)
                              }
                              className={`flex items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                                isOwnedTicket
                                  ? "border-green-500/30 bg-green-500/10 cursor-default"
                                  : isDisabled
                                    ? "border-white/10 bg-card-secondary-background opacity-50 cursor-not-allowed"
                                    : isSelected
                                      ? "border-primary bg-primary/10 cursor-pointer"
                                      : "border-white/10 bg-card-secondary-background cursor-pointer hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isOwnedTicket ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                ) : canRegister && !isSoldOut && (
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                      isSelected
                                        ? "border-primary"
                                        : "border-white/30"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h3 className="text-sm font-semibold text-foreground truncate">
                                    {ticket.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {isOwnedTicket ? (
                                      <span className="text-green-400">You own this ticket</span>
                                    ) : isSoldOut ? (
                                      "Sold out"
                                    ) : (
                                      `${remaining} left`
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-bold text-foreground">
                                  {Number(ticket.price) === 0
                                    ? "Free"
                                    : `£${Number(ticket.price).toFixed(2)}`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* User ticket info */}
                      {hasUserTicket && event.userTicket && (
                        <div className="mt-3 pt-3 border-t border-white/10">
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
                              My Tickets →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Register Button - only show if user doesn't have a ticket */}
                      {canRegister &&
                        event.eventTickets.some(
                          (t) => (t.quantityLeft ?? 0) > 0 && t.isAvailable
                        ) && (
                          <button
                            onClick={() =>
                              selectedTicketId && handleRegister(selectedTicketId)
                            }
                            disabled={!selectedTicketId || isRegistering}
                            className="w-full mt-3 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isRegistering ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Registering...
                              </>
                            ) : selectedTicketId ? (
                              "Register"
                            ) : (
                              "Select a ticket to register"
                            )}
                          </button>
                        )}
                    </div>
                  );
                })()}

              {/* Description */}
              <div className="mb-4">
                <h2 className="mb-3 text-lg font-semibold text-muted-foreground">
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
            </div>
          )}
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
          zIndex={60}
        />
      )}
    </>
  );
}
