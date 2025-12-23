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
  Check,
  X,
  QrCode,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import PaymentModal, { PaymentSuccessModal } from "@/components/payments/PaymentModal";

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
                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="text-sm text-neutral-300">
                    You have manage access for this event.
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/event-management/${eventId}/scanner`}
                      className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                    >
                      <QrCode className="h-4 w-4" />
                      Check-In
                    </Link>
                    <Link
                      href={`/event-management/${eventId}`}
                      className="flex items-center gap-1 rounded-full bg-pink-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-pink-600"
                    >
                      Manage
                      <span className="text-xs">↗</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Event Image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-700 bg-card-secondary-background mb-6">
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
                  const canRegister =
                    event.status === EventStatus.PUBLISHED &&
                    !isEventEnded &&
                    hasAvailableTickets;
                  const showClosedMessage = isEventEnded || !hasAvailableTickets;

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
                          const isDisabled = isSoldOut || !canRegister;

                          return (
                            <div
                              key={ticket.id}
                              onClick={() =>
                                !isDisabled && setSelectedTicketId(ticket.id)
                              }
                              className={`flex items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                                isDisabled
                                  ? "border-white/10 bg-card-secondary-background opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "border-primary bg-primary/10 cursor-pointer"
                                  : "border-white/10 bg-card-secondary-background cursor-pointer hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {canRegister && !isSoldOut && (
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
                                    {isSoldOut ? "Sold out" : `${remaining} left`}
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
      {showQuestionForm && selectedTicket?.questionForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-card-background to-card-secondary-background rounded-3xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Almost there!
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please answer a few questions to complete your registration
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionForm(false);
                    setQuestionAnswers({});
                  }}
                  className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 pb-6 space-y-5 max-h-[50vh] overflow-y-auto">
              {selectedTicket.questionForm.map((q, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {q.question}
                    {q.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>

                  {q.type === "shortText" && (
                    <input
                      type="text"
                      value={questionAnswers[q.question] || ""}
                      onChange={(e) =>
                        handleQuestionChange(q.question, e.target.value)
                      }
                      placeholder="Your answer..."
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  )}

                  {q.type === "longText" && (
                    <textarea
                      value={questionAnswers[q.question] || ""}
                      onChange={(e) =>
                        handleQuestionChange(q.question, e.target.value)
                      }
                      rows={4}
                      placeholder="Your answer..."
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                    />
                  )}

                  {q.type === "singleSelect" && q.options && (
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          onClick={() => handleQuestionChange(q.question, option)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            questionAnswers[q.question] === option
                              ? "border-primary bg-primary/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              questionAnswers[q.question] === option
                                ? "border-primary"
                                : "border-white/30"
                            }`}
                          >
                            {questionAnswers[q.question] === option && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="text-foreground">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "multiSelect" && q.options && (
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => {
                        const isChecked = (
                          questionAnswers[q.question] || []
                        ).includes(option);
                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? "border-primary bg-primary/10"
                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                isChecked
                                  ? "border-primary bg-primary"
                                  : "border-white/30"
                              }`}
                            >
                              {isChecked && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-foreground">{option}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = questionAnswers[q.question] || [];
                                const updated = e.target.checked
                                  ? [...current, option]
                                  : current.filter((o: string) => o !== option);
                                handleQuestionChange(q.question, updated);
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-white/10 bg-card-secondary-background/50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuestionForm(false);
                    setQuestionAnswers({});
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-sm sm:text-md text-foreground font-medium hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedTicketId && handleRegister(selectedTicketId)
                  }
                  disabled={isRegistering}
                  className="flex-1 px-6 py-3 rounded-xl bg-primary text-white text-sm sm:text-md font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
