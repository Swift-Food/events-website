"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import { CollaboratorRole } from "@/types/event-collaborator";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto, EventStatus } from "@/types/event";
import { GuestTicketStatus } from "@/types/guest-ticket";
import type { PaymentFlowState } from "@/types/payment";
import {
  Calendar,
  CalendarPlus,
  MapPin,
  Users,
  Clock,
  User,
  Ticket,
  Loader2,
  X,
  ExternalLink,
  CheckCircle2,
  ScanLine,
  Crown,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import PaymentModal, { PaymentSuccessModal } from "@/components/payments/PaymentModal";
import RegistrationQuestionsModal from "@/components/RegistrationQuestionsModal";
import { getTicketStatusText, getTicketStatusBadgeClasses, isTicketUsable } from "@/utils/ticket-status";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
  buildLocationString,
} from "@/utils/calendar";

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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});

  // Calendar dropdown state
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(event.target as Node)) {
        setShowCalendarDropdown(false);
      }
    };

    if (showCalendarDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendarDropdown]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFlowState | null>(null);
  const [successTicketDetails, setSuccessTicketDetails] = useState<Pick<
    PaymentFlowState["ticketDetails"],
    "ticketName" | "eventName"
  > | null>(null);

  // Check if user can manage this event and their role
  type UserRole = "owner" | "admin" | "scanner" | null;
  const [userRole, setUserRole] = useState<UserRole>(null);

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

  // Check if user is owner or collaborator and determine role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!event || !eventId) return;

      if (!user && !authLoading) {
        setUserRole(null);
        return;
      }

      if (!user) return;

      const isOwner = event.owner?.user?.id === user.id;
      if (isOwner) {
        setUserRole("owner");
        return;
      }

      try {
        const collaboratorsData =
          await eventCollaboratorService.getCollaborators(eventId);
        const collaborator = collaboratorsData.collaborators.find(
          (collab) =>
            collab.inviteAccepted && collab.eventUser?.id === user.eventUser?.id
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
        setUserRole(null);
      }
    };

    checkUserRole();
  }, [event, user, authLoading, eventId]);

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
              {/* Management/Scanner Banner */}
              {userRole && (
                <div className={`mb-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${userRole === "scanner" ? "border-blue-500/30 bg-blue-500/10" : userRole === "admin" ? "border-purple-500/30 bg-purple-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                  <span className="text-sm text-neutral-300">
                    {userRole === "scanner"
                      ? "You can scan tickets for this event."
                      : userRole === "owner"
                      ? "You own this event."
                      : "You have manage access for this event."}
                  </span>
                  {userRole === "scanner" ? (
                    <Link
                      href={`/event-management/${eventId}/scanner`}
                      className="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan
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

                {/* Add to Calendar Button */}
                <div className="relative mt-4" ref={calendarDropdownRef}>
                  <button
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Add to Calendar
                  </button>

                  {showCalendarDropdown && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-white/10 bg-card-background shadow-xl">
                      <button
                        onClick={() => {
                          window.open(
                            generateGoogleCalendarUrl({
                              title: event.name,
                              startDate: new Date(event.startDateTime),
                              endDate: new Date(event.endDateTime),
                              location: buildLocationString(event.address),
                            }),
                            '_blank'
                          );
                          setShowCalendarDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.48 10.92v3.28h4.92c-.2 1.08-.72 1.96-1.52 2.56v2.12h2.44c1.44-1.32 2.28-3.28 2.28-5.6 0-.54-.04-1.08-.14-1.58h-7.98v-.78z" fill="#4285F4"/>
                          <path d="M12 21c2.4 0 4.4-.8 5.86-2.12l-2.44-2.12c-.84.56-1.9.9-3.42.9-2.62 0-4.84-1.78-5.64-4.16H3.82v2.18C5.24 18.82 8.4 21 12 21z" fill="#34A853"/>
                          <path d="M6.36 13.5c-.2-.6-.32-1.24-.32-1.9s.12-1.3.32-1.9V7.52H3.82C3.12 8.9 2.72 10.4 2.72 12s.4 3.1 1.1 4.48l2.54-2.98z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.2 1.64l2.58-2.58C17.36 2.74 14.96 1.8 12 1.8 8.4 1.8 5.24 3.98 3.82 7.12l2.54 2.98c.8-2.38 3.02-4.72 5.64-4.72z" fill="#EA4335"/>
                        </svg>
                        Google Calendar
                      </button>
                      <button
                        onClick={() => {
                          window.open(
                            generateOutlookCalendarUrl({
                              title: event.name,
                              startDate: new Date(event.startDateTime),
                              endDate: new Date(event.endDateTime),
                              location: buildLocationString(event.address),
                            }),
                            '_blank'
                          );
                          setShowCalendarDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zM7.88 8.88h5.5q-.54-.11-1-.54-.47-.43-.75-.98l-2.7 1.1q-.04.12-.21.18-.19.06-.36.06H7.88v.18zm6.25 3.67q.13-.1.24-.21.12-.1.22-.22l.22-.22.17-.28.1-.32.04-.32q0-.45-.11-.87-.1-.42-.33-.76-.22-.34-.59-.54-.36-.2-.88-.2-.51 0-.88.2-.37.2-.59.54-.22.34-.33.76-.1.42-.1.87t.1.87q.1.43.33.76.22.33.59.54.37.2.88.2.51 0 .88-.2.37-.21.59-.54.22-.33.33-.76.1-.42.1-.87z" fill="#0078D4"/>
                        </svg>
                        Outlook Calendar
                      </button>
                      <button
                        onClick={() => {
                          downloadICSFile({
                            title: event.name,
                            startDate: new Date(event.startDateTime),
                            endDate: new Date(event.endDateTime),
                            location: buildLocationString(event.address),
                          });
                          setShowCalendarDropdown(false);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                      >
                        <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="text-left">
                          <p>Download .ics file</p>
                          <p className="text-xs text-muted-foreground">Open to add to your calendar app</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                      placeId={event.address.placeId}
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
                  const hasUserTicket = !!event.userTicket;
                  // Allow registration even when sold out (for waitlist), but not if user already has ticket
                  const canRegister =
                    event.status === EventStatus.PUBLISHED &&
                    !isEventEnded &&
                    !hasUserTicket;
                  const showClosedMessage = isEventEnded && !hasUserTicket;

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
                          const isSoldOut = remaining <= 0;
                          const isManuallyUnavailable = !ticket.isAvailable; // Organizer disabled this ticket
                          const isOwnedTicket = event.userTicket?.ticketName === ticket.name;
                          const isActiveTicket = isOwnedTicket && isTicketUsable(event.userTicket!.status as GuestTicketStatus);
                          // Can select sold out tickets for waitlist, but not if organizer disabled or user has ticket
                          const isDisabled = !canRegister || isManuallyUnavailable || hasUserTicket;

                          return (
                            <div
                              key={ticket.id}
                              onClick={() =>
                                !isDisabled && setSelectedTicketId(ticket.id)
                              }
                              className={`flex items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                                isOwnedTicket
                                  ? isActiveTicket
                                    ? "border-green-500/30 bg-green-500/10 cursor-default"
                                    : "border-yellow-500/30 bg-yellow-500/10 cursor-default"
                                  : isDisabled
                                    ? "border-white/10 bg-card-secondary-background opacity-50 cursor-not-allowed"
                                    : isSelected
                                      ? "border-primary bg-primary/10 cursor-pointer"
                                      : "border-white/10 bg-card-secondary-background cursor-pointer hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isOwnedTicket ? (
                                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActiveTicket ? "text-green-400" : "text-yellow-400"}`} />
                                ) : canRegister && !isManuallyUnavailable && (
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
                                      isTicketUsable(event.userTicket!.status as GuestTicketStatus) ? (
                                        <span className="text-green-400">You own this ticket</span>
                                      ) : (
                                        <span className="text-yellow-400">{getTicketStatusText(event.userTicket!.status as GuestTicketStatus)}</span>
                                      )
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

                      {/* Register/Join Waitlist Button */}
                      {canRegister && event.eventTickets.some(t => t.isAvailable) && (
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
