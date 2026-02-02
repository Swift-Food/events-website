"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { eventsApi } from "@/services/events";
import { guestTicketService } from "@/services/guest-ticket.service";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import { blacklistService } from "@/services/blacklist.service";
import { CollaboratorRole } from "@/types/event-collaborator";
import { paymentService } from "@/services/payment.service";
import { mailService } from "@/services/mail.service";
import { useAuth } from "@/lib/auth/authContext";
import { EventResponseDto, EventStatus } from "@/types/event";
import { isVirtualEvent, isHybridEvent } from "@/types/event/status";
import {
  GuestTicketStatus,
  TicketInvitationPreviewDto,
} from "@/types/guest-ticket";
import { BlacklistStatusDto, BlacklistAppealStatus } from "@/types/blacklist";
import type { PaymentFlowState } from "@/types/payment";
import {
  Calendar,
  CalendarPlus,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  User,
  Ticket,
  Loader2,
  X,
  CheckCircle2,
  ScanLine,
  Crown,
  Shield,
  Gift,
  Flag,
  Lock,
  Video,
  Ban,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GoogleMap from "@/components/GoogleMap";
import { toast } from "sonner";
import PaymentModal, {
  PaymentSuccessModal,
} from "@/components/payments/PaymentModal";
import { AppealModal } from "@/components/blacklist";
import {
  getTicketStatusText,
  getTicketStatusBadgeClasses,
  isTicketUsable,
} from "@/utils/ticket-status";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
  buildLocationString,
} from "@/utils/calendar";
import SmartAppBanner from "@/components/SmartAppBanner";
import ExternalLinkConfirmModal from "@/components/ExternalLinkConfirmModal";
import RegistrationConfirmModal from "@/components/RegistrationConfirmModal";
import GroupPurchaseModal from "@/components/GroupPurchaseModal";
import SaveToCalendarModal from "@/components/SaveToCalendarModal";
import { usePathname } from "next/navigation";
import { useEventTheme } from "@/context/EventThemeContext";
import { getThemeCSSVariables } from "@/lib/theme-presets";
import EventThemeBackground from "@/components/theme/EventThemeBackground";
import EventThemeStyles from "@/components/theme/EventThemeStyles";

interface EventClientProps {
  initialEvent: EventResponseDto;
  eventId: string;
}

export default function EventClient({
  initialEvent,
  eventId,
}: EventClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { config: themeConfig, palette: themePalette, shader: themeShader, landscape: themeLandscape } = useEventTheme();
  const themeCSSVars = useMemo(() => getThemeCSSVariables(themePalette), [themePalette]);
  const inviteToken = searchParams.get("inviteToken");

  // Apply theme CSS variables to document root so navbar inherits them
  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(themeCSSVars);
    entries.forEach(([key, value]) => root.style.setProperty(key, value));
    return () => {
      entries.forEach(([key]) => root.style.removeProperty(key));
    };
  }, [themeCSSVars]);

  // Build current path for SmartAppBanner
  const currentPath = `${pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const [event, setEvent] = useState<EventResponseDto>(initialEvent);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTicketSelector, setShowTicketSelector] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>(
    {}
  );

  // Registration confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);

  // Group purchase modal state
  const [showGroupPurchaseModal, setShowGroupPurchaseModal] = useState(false);

  // Calendar dropdown state
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Save to calendar modal state
  const [showSaveToCalendarModal, setShowSaveToCalendarModal] = useState(false);

  // External link confirmation modal state
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCalendarDropdown(false);
      }
    };

    if (showCalendarDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendarDropdown]);

  // Invitation preview state
  const [invitationPreview, setInvitationPreview] =
    useState<TicketInvitationPreviewDto | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFlowState | null>(null);
  const [successTicketDetails, setSuccessTicketDetails] = useState<Pick<
    PaymentFlowState["ticketDetails"],
    "ticketName" | "eventName"
  > | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Blacklist status state
  const [blacklistStatus, setBlacklistStatus] =
    useState<BlacklistStatusDto | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);

  // Check if user can manage this event and their role
  type UserRole = "owner" | "admin" | "scanner" | null;
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Re-fetch event data when user is authenticated to get userTicket info
  // This is needed because the initial server-side fetch doesn't have auth context
  useEffect(() => {
    const fetchAuthenticatedEventData = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        const data = await eventsApi.findById(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch authenticated event data:", err);
      }
    };

    fetchAuthenticatedEventData();
  }, [isAuthenticated, authLoading, eventId]);

  // Check if user is blacklisted from this event
  useEffect(() => {
    const checkBlacklistStatus = async () => {
      if (!isAuthenticated || authLoading) {
        setBlacklistStatus(null);
        return;
      }

      try {
        const status = await blacklistService.getMyBlacklistStatus(eventId);
        setBlacklistStatus(status);
      } catch (err) {
        // User is not blacklisted or error fetching - either way, don't block
        setBlacklistStatus(null);
      }
    };

    checkBlacklistStatus();
  }, [isAuthenticated, authLoading, eventId]);

  // Fetch invitation preview when inviteToken is present
  useEffect(() => {
    const fetchInvitationPreview = async () => {
      if (!inviteToken) return;

      try {
        setInvitationLoading(true);
        setInvitationError(null);
        const preview = await guestTicketService.previewTicketInvitation(
          inviteToken
        );

        if (preview.success) {
          setInvitationPreview(preview);
          // Auto-select the invited ticket
          if (preview.ticket?.id) {
            setSelectedTicketId(preview.ticket.id);
          }
        } else {
          setInvitationError(
            preview.message || "Invalid or expired invitation"
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch invitation preview:", err);
        setInvitationError(
          err.response?.data?.message || "Invalid or expired invitation"
        );
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
        // User might not have permission to view collaborators
        setUserRole(null);
      }
    };

    checkUserRole();
  }, [event, user, authLoading, eventId]);

  // Show confirmation modal before registration
  const handleRegisterClick = (ticketId: string) => {
    // Build the redirect URL with inviteToken if present
    const currentUrl = `/events/${eventId}${
      inviteToken ? `?inviteToken=${inviteToken}` : ""
    }`;

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

    setPendingTicketId(ticketId);
    setSelectedTicketId(ticketId);
    // Always show regular confirmation modal first - group option is secondary
    setShowConfirmModal(true);
  };

  // Switch from single ticket to group purchase flow
  const handleSwitchToGroupPurchase = () => {
    setShowConfirmModal(false);
    setShowGroupPurchaseModal(true);
  };

  // Handler for when a group session is created
  const handleGroupSessionCreated = (sessionId: string) => {
    setShowGroupPurchaseModal(false);
    setPendingTicketId(null);
    toast.success("Group created! Your friends have been invited.");
    // Redirect to a group session management page or my-tickets with a group filter
    router.push(`/my-tickets?groupSession=${sessionId}`);
  };

  // Called when user confirms registration from the confirmation modal
  const handleConfirmRegistration = async (
    questionAnswersFromModal: Record<string, any>
  ) => {
    if (!pendingTicketId) return;
    setQuestionAnswers(questionAnswersFromModal);
    await handleRegister(pendingTicketId, questionAnswersFromModal);
  };

  const handleRegister = async (
    ticketId: string,
    answers?: Record<string, any>
  ) => {
    const ticket = event?.eventTickets?.find((t) => t.id === ticketId);
    if (!ticket) {
      toast.error("Ticket not found");
      return;
    }

    const answersToUse = answers || questionAnswers;

    try {
      setIsRegistering(true);

      // If we have an invite token, use the accept invitation API
      if (inviteToken && invitationPreview?.success) {
        const result = await guestTicketService.acceptTicketInvite(
          inviteToken,
          Object.keys(answersToUse).length > 0 ? answersToUse : undefined
        );

        if (result.success) {
          // Check if payment is required
          if (result.requiresPayment && result.paymentUrl) {
            // Extract guestTicketId from paymentUrl (format: /payments/ticket/:guestTicketId)
            const guestTicketId = result.paymentUrl.split("/").pop();

            if (!guestTicketId) {
              setShowConfirmModal(false);
              toast.error(
                "Failed to process payment. Please try again from My Tickets."
              );
              router.push("/my-tickets");
              return;
            }

            try {
              const paymentResponse =
                await paymentService.createTicketPaymentIntent(guestTicketId);

              if (paymentResponse.success && paymentResponse.clientSecret) {
                setPaymentData({
                  clientSecret: paymentResponse.clientSecret,
                  amount: paymentResponse.amount || 0,
                  currency: paymentResponse.currency || "gbp",
                  ticketDetails: paymentResponse.ticketDetails || {
                    ticketName:
                      result.ticket?.name ||
                      invitationPreview.ticket?.name ||
                      "Ticket",
                    eventName: result.event?.name || event?.name || "Event",
                    price: Number(ticket?.price) || 0,
                  },
                  guestTicketId: guestTicketId,
                });
                // Close confirm modal and open payment modal together
                setShowConfirmModal(false);
                setShowPaymentModal(true);
              } else {
                throw new Error(
                  paymentResponse.error || "Failed to create payment"
                );
              }
            } catch (paymentError: any) {
              console.error("Payment setup failed:", paymentError);
              setShowConfirmModal(false);
              toast.error(
                paymentError.response?.data?.message ||
                  "Failed to setup payment. Please try again from My Tickets."
              );
              router.push("/my-tickets");
            }
          } else {
            setShowConfirmModal(false);
            toast.success(
              result.message || "Invitation accepted successfully!"
            );
            router.push("/my-tickets");
          }
        } else {
          toast.error(result.message || "Failed to accept invitation");
          setShowConfirmModal(false);
          // Redirect to my-tickets if user already has a ticket, otherwise stay on event page
          if (result.message?.includes("already")) {
            router.push("/my-tickets");
          } else {
            // Remove inviteToken from URL to prevent retry loop
            router.replace(`/events/${eventId}`);
          }
        }
      } else {
        // Normal registration flow
        const result = await guestTicketService.registerForTicket({
          eventTicketId: ticketId,
          questionAnswers:
            Object.keys(answersToUse).length > 0 ? answersToUse : undefined,
        });

        if (result.success) {
          setQuestionAnswers({});

          // Check if user was added to waitlist
          if (result.isWaitlisted) {
            setShowConfirmModal(false);
            toast.success(
              result.message ||
                `Added to waitlist at position #${result.waitlistPosition}!`,
              { duration: 5000 }
            );
            setShowTicketSelector(false);
            setSelectedTicketId(null);
            router.push("/my-tickets");
            return;
          }

          // Check if payment is required
          if (
            result.requiresPayment &&
            result.guestTicket.status === GuestTicketStatus.PENDING_PAYMENT
          ) {
            // Get payment intent for this guest ticket
            try {
              const paymentResponse =
                await paymentService.createTicketPaymentIntent(
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
                // Close confirm modal and open payment modal together
                setShowConfirmModal(false);
                setShowPaymentModal(true);
                setShowTicketSelector(false);
                setSelectedTicketId(null);
              } else {
                throw new Error(
                  paymentResponse.error || "Failed to create payment"
                );
              }
            } catch (paymentError: any) {
              console.error("Payment setup failed:", paymentError);
              setShowConfirmModal(false);
              toast.error(
                paymentError.response?.data?.message ||
                  "Failed to setup payment. Please try again from My Tickets."
              );
              router.push("/my-tickets");
            }
          } else {
            setShowConfirmModal(false);
            toast.success(
              result.message || "Successfully registered for event!"
            );
            setShowTicketSelector(false);
            setSelectedTicketId(null);
            router.push("/my-tickets");
          }
        }
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to register for event";
      toast.error(errorMessage);
      setShowConfirmModal(false);
      // If user already has a ticket, redirect to my-tickets
      if (errorMessage.toLowerCase().includes("already")) {
        router.push("/my-tickets");
      } else if (inviteToken) {
        // Remove inviteToken from URL on other errors
        router.replace(`/events/${eventId}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    if (paymentData) {
      setSuccessTicketDetails({
        ticketName: paymentData.ticketDetails.ticketName,
        eventName: paymentData.ticketDetails.eventName,
      });
    }
    setShowSuccessModal(true);
    setPaymentData(null);

    // Re-fetch event data to get updated info (virtualMeetingUrl, userTicket, etc.)
    try {
      const data = await eventsApi.findById(eventId);
      setEvent(data);
    } catch (err) {
      console.error("Failed to refresh event data after payment:", err);
    }
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

  const handleReportEvent = async () => {
    if (!reportDescription.trim()) {
      toast.error("Please provide a reason for reporting this event");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to report an event");
      return;
    }

    try {
      setIsReporting(true);
      await mailService.reportEvent(reportDescription, eventId, user.id);
      toast.success(
        "Event reported successfully. Thank you for your feedback."
      );
      setShowReportModal(false);
      setReportDescription("");
    } catch (error: any) {
      console.error("Failed to report event:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to report event. Please try again."
      );
    } finally {
      setIsReporting(false);
    }
  };

  const handleSubmitAppeal = async (appealMessage: string) => {
    if (!blacklistStatus?.blacklistId) {
      toast.error("Unable to submit appeal");
      return;
    }

    try {
      const result = await blacklistService.submitAppeal(
        blacklistStatus.blacklistId,
        {
          appealMessage,
        }
      );
      if (result.success) {
        toast.success(
          "Appeal submitted successfully. The organizer will review your request."
        );
        // Refresh blacklist status
        const newStatus = await blacklistService.getMyBlacklistStatus(eventId);
        setBlacklistStatus(newStatus);
      } else {
        throw new Error(result.message || "Failed to submit appeal");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit appeal"
      );
      throw error;
    }
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

  // Ensure URL has a protocol for external links
  const formatExternalUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  // Check if virtual meeting can be joined (10 minutes before event start)
  const canJoinVirtualMeeting = () => {
    if (!event) return false;
    const now = new Date();
    const eventStart = new Date(event.startDateTime);
    const tenMinutesBefore = new Date(eventStart.getTime() - 10 * 60 * 1000);
    return now >= tenMinutesBefore;
  };

  const statusColors = {
    [EventStatus.PUBLISHED]: "bg-green-500/20 text-green-400",
    [EventStatus.DRAFT]: "bg-gray-500/20 text-gray-400",
    [EventStatus.ONGOING]: "bg-purple-500/20 text-purple-400",
    [EventStatus.CANCELLED]: "bg-red-500/20 text-red-400",
    [EventStatus.COMPLETED]: "bg-blue-500/20 text-blue-400",
  };

  return (
    <>
      {/* Smart App Banner - shown on mobile when viewing invite */}
      <SmartAppBanner currentPath={currentPath} />

      <div
        className={`relative min-h-screen ${themeConfig.type === "solid" ? "bg-background" : ""}`}
        style={themeCSSVars as React.CSSProperties}
      >
        <EventThemeBackground
          config={themeConfig}
          palette={themePalette}
          shader={themeShader}
          landscape={themeLandscape}
        />
        <EventThemeStyles />
        <div className="relative z-10">
        {/* Management/Scanner Banner - Mobile */}
        {userRole && (
          <div className="sm:hidden sticky top-4 z-[100] w-full px-4 animate-in slide-in-from-top-4 duration-700 ease-out">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-[24px] border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-between px-4 py-3">
                {/* Subtle Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md ${
                  userRole === "scanner"
                    ? "border-blue-400/30 bg-blue-500/20 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : userRole === "admin"
                    ? "border-purple-400/30 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                    : "border-amber-400/30 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                }`}>
                  {userRole === "owner" && <Crown className="w-3.5 h-3.5" />}
                  {userRole === "admin" && <Shield className="w-3.5 h-3.5" />}
                  {userRole === "scanner" && <ScanLine className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {userRole === "owner" ? "Owner" : userRole === "admin" ? "Admin" : "Scanner"}
                  </span>
                </div>

                {userRole === "scanner" ? (
                  <Link
                    href={`/event-management/${eventId}/scanner`}
                    className="relative flex items-center gap-2 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-zinc-100 transition-all active:scale-[0.96] shadow-xl shadow-white/5"
                  >
                    Scan
                    <ScanLine className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/event-management/${eventId}`}
                    className="relative flex items-center gap-2 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-zinc-100 transition-all active:scale-[0.96] group/btn shadow-xl shadow-white/5"
                  >
                    Manage
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                )}
              </div>
              {/* Subtle role-colored background glow */}
              <div className={`absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl -z-10 ${
                userRole === "owner" ? "bg-amber-500" : userRole === "admin" ? "bg-purple-500" : "bg-blue-500"
              }`} />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Management/Scanner Banner - Desktop */}
          {userRole && (
            <div className="hidden sm:block mb-6 relative group">
              <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-[24px] border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-between px-4 py-3 lg:px-8">
                {/* Subtle Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                <div className="flex items-center gap-4 lg:gap-8">
                  <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md ${
                    userRole === "scanner"
                      ? "border-blue-400/30 bg-blue-500/20 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                      : userRole === "admin"
                      ? "border-purple-400/30 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "border-amber-400/30 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  }`}>
                    {userRole === "owner" && <Crown className="w-3.5 h-3.5" />}
                    {userRole === "admin" && <Shield className="w-3.5 h-3.5" />}
                    {userRole === "scanner" && <ScanLine className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {userRole === "owner" ? "Owner" : userRole === "admin" ? "Admin" : "Scanner"}
                    </span>
                  </div>
                  <p className="text-sm font-medium theme-text-sub opacity-80">
                    {userRole === "scanner"
                      ? "You can scan tickets for this event."
                      : userRole === "owner"
                      ? "You own this event."
                      : "You have manage access for this event."}
                  </p>
                </div>

                {userRole === "scanner" ? (
                  <Link
                    href={`/event-management/${eventId}/scanner`}
                    className="relative flex items-center gap-2 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-zinc-100 transition-all active:scale-[0.96] group/btn shadow-xl shadow-white/5"
                  >
                    Scan Tickets
                    <ScanLine className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/event-management/${eventId}`}
                    className="relative flex items-center gap-2 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-zinc-100 transition-all active:scale-[0.96] group/btn shadow-xl shadow-white/5"
                  >
                    Manage
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                )}
              </div>
              {/* Subtle role-colored background glow */}
              <div className={`absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl -z-10 ${
                userRole === "owner" ? "bg-amber-500" : userRole === "admin" ? "bg-purple-500" : "bg-blue-500"
              }`} />
            </div>
          )}

          {/* Back Button and Report Button */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              onClick={() => router.push("/events")}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Events
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Flag className="h-4 w-4" />
              Report Event
            </button>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="flex flex-col gap-6 lg:flex-row-reverse">
            {/* Left Column - Image and Sidebar */}
            <section className="flex flex-col gap-6 lg:w-96 lg:shrink-0">
              {/* 2×2 Grid on sm-md, Flex column on lg+ */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:flex-col">
                {/* Top Left: Image with Status Badge */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card-background sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
                  {event.eventImage ? (
                    <Image
                      src={event.eventImage}
                      alt={event.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-card-background">
                      <Calendar className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Status Badge - Only on lg+ and only for collaborators */}
                  {userRole && (
                    <div className="absolute right-4 top-4 hidden lg:flex lg:items-center lg:gap-2">
                      {event.isPrivate && (
                        <span className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-2 text-sm font-semibold text-purple-400 backdrop-blur-md">
                          <Lock className="h-3.5 w-3.5" />
                          Private
                        </span>
                      )}
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-md ${
                          statusColors[event.status] ||
                          "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {event.status || "Unknown"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Event Title & Categories - Show on mobile & tablet, hide on desktop */}
                <div className="block lg:hidden sm:col-span-1 sm:row-span-1 sm:flex sm:flex-col sm:items-center sm:justify-center">
                  <h1 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground sm:text-center">
                    {event.name}
                  </h1>

                  {/* Categories & Subcategories */}
                  {((event.categories && event.categories.length > 0) ||
                    (event.subcategories &&
                      event.subcategories.length > 0)) && (
                    <div className="flex flex-wrap gap-2 sm:justify-center">
                      {event.categories?.map((category) => (
                        <Link
                          key={category.id}
                          href={`/events?category=${category.name}`}
                          className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
                        >
                          {category.name}
                        </Link>
                      ))}
                      {event.subcategories?.map((subcategory) => {
                        // Find parent category for the subcategory to include in URL
                        const parentCategory = event.categories?.find(
                          (cat) =>
                            cat.id === subcategory.categoryId ||
                            cat.id === (subcategory as any).category?.id
                        );
                        const href = parentCategory
                          ? `/events?category=${parentCategory.name}&subcategoryId=${subcategory.id}`
                          : `/events?subcategoryId=${subcategory.id}`;
                        return (
                          <Link
                            key={subcategory.id}
                            href={href}
                            className="rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20"
                          >
                            {subcategory.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Organizer - Mobile/Tablet */}
                  <div className="mt-6 h-px bg-white/10" />
                  <div className="py-4 flex items-center gap-3 sm:justify-center">
                    {event.owner?.user ? (
                      <Link
                        href={`/user/${event.owner.id}`}
                        className="flex items-center gap-3 group"
                      >
                        {event.owner.user.profilePicture ? (
                          <Image
                            src={event.owner.user.profilePicture}
                            alt={
                              event.owner.firstName || event.owner.lastName
                                ? [event.owner.firstName, event.owner.lastName]
                                    .filter(Boolean)
                                    .join(" ")
                                : event.owner.user.username || "Organizer"
                            }
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {event.owner.firstName || event.owner.lastName
                              ? [event.owner.firstName, event.owner.lastName]
                                  .filter(Boolean)
                                  .join(" ")
                              : event.owner.user.username || "Anonymous"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Organizer
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            Event Organizer
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Organizer
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/10" />
                </div>

                {/* Date & Time Card - Bottom left on tablet, normal on mobile/desktop */}
                <div className="rounded-xl bg-card-background backdrop-blur-sm p-4 sm:p-6 sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
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
                            {formatTime(event.startDateTime)} -{""}
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

                  {/* Add to Calendar Button */}
                  <div className="relative mt-4" ref={calendarDropdownRef}>
                    <button
                      onClick={() =>
                        setShowCalendarDropdown(!showCalendarDropdown)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-secondary-background/80"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Add to Calendar
                    </button>

                    {showCalendarDropdown && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg bg-card-background shadow-xl">
                        <button
                          onClick={() => {
                            window.open(
                              generateGoogleCalendarUrl({
                                title: event.name,
                                startDate: new Date(event.startDateTime),
                                endDate: new Date(event.endDateTime),
                                location: buildLocationString(event.address),
                              }),
                              "_blank"
                            );
                            setShowCalendarDropdown(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M12.48 10.92v3.28h4.92c-.2 1.08-.72 1.96-1.52 2.56v2.12h2.44c1.44-1.32 2.28-3.28 2.28-5.6 0-.54-.04-1.08-.14-1.58h-7.98v-.78z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 21c2.4 0 4.4-.8 5.86-2.12l-2.44-2.12c-.84.56-1.9.9-3.42.9-2.62 0-4.84-1.78-5.64-4.16H3.82v2.18C5.24 18.82 8.4 21 12 21z"
                              fill="#34A853"
                            />
                            <path
                              d="M6.36 13.5c-.2-.6-.32-1.24-.32-1.9s.12-1.3.32-1.9V7.52H3.82C3.12 8.9 2.72 10.4 2.72 12s.4 3.1 1.1 4.48l2.54-2.98z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.2 1.64l2.58-2.58C17.36 2.74 14.96 1.8 12 1.8 8.4 1.8 5.24 3.98 3.82 7.12l2.54 2.98c.8-2.38 3.02-4.72 5.64-4.72z"
                              fill="#EA4335"
                            />
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
                              "_blank"
                            );
                            setShowCalendarDropdown(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zM7.88 8.88h5.5q-.54-.11-1-.54-.47-.43-.75-.98l-2.7 1.1q-.04.12-.21.18-.19.06-.36.06H7.88v.18zm6.25 3.67q.13-.1.24-.21.12-.1.22-.22l.22-.22.17-.28.1-.32.04-.32q0-.45-.11-.87-.1-.42-.33-.76-.22-.34-.59-.54-.36-.2-.88-.2-.51 0-.88.2-.37.2-.59.54-.22.34-.33.76-.1.42-.1.87t.1.87q.1.43.33.76.22.33.59.54.37.2.88.2.51 0 .88-.2.37-.21.59-.54.22-.33.33-.76.1-.42.1-.87z"
                              fill="#0078D4"
                            />
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
                            <p className="text-xs text-muted-foreground">
                              Open to add to your calendar app
                            </p>
                          </div>
                        </button>
                        {isAuthenticated && (
                          <>
                            <div className="h-px bg-white/10" />
                            <button
                              onClick={() => {
                                setShowCalendarDropdown(false);
                                setShowSaveToCalendarModal(true);
                              }}
                              className="flex w-full items-start gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-white/5"
                            >
                              <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                              <div className="text-left">
                                <p>Save to My Calendars</p>
                                <p className="text-xs text-muted-foreground">
                                  Add to your platform calendars
                                </p>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Card - Bottom right */}
                <div className="rounded-xl bg-card-background backdrop-blur-sm overflow-hidden sm:col-span-1 sm:row-span-1 lg:col-span-1 lg:row-span-1">
                  {isVirtualEvent(event.format) ? (
                    <div className="p-4 sm:p-6">
                      <div className="h-32 w-full bg-primary/10 rounded-lg flex flex-col items-center justify-center gap-2 mb-4">
                        <Video className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Online Event
                        </span>
                      </div>
                      {event.virtualMeetingUrl ? (
                        canJoinVirtualMeeting() ? (
                          event.isTrustedMeetingUrl ? (
                            <a
                              href={formatExternalUrl(event.virtualMeetingUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Join Virtual Meeting
                            </a>
                          ) : (
                            <button
                              onClick={() => setShowExternalLinkModal(true)}
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Join Virtual Meeting
                            </button>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Meeting link available 10 minutes before event
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Meeting link will be shared before the event
                        </p>
                      )}
                    </div>
                  ) : event.address ? (
                    <>
                      {/* Map Area - only show if address is not obscured */}
                      {event.address.isObscured ? (
                        <div className="h-40 w-full bg-card-secondary-background flex flex-col items-center justify-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Location hidden
                          </span>
                        </div>
                      ) : event.address.location?.latitude &&
                        event.address.location?.longitude ? (
                        <GoogleMap
                          latitude={event.address.location.latitude}
                          longitude={event.address.location.longitude}
                          title={event.address.name}
                          className="h-40 w-full !rounded-none"
                          placeId={event.address.placeId}
                        />
                      ) : (
                        <div className="h-40 w-full bg-card-secondary-background flex flex-col items-center justify-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Map
                          </span>
                        </div>
                      )}

                      {/* Address Details */}
                      <div className="p-4">
                        {event.address.isObscured ? (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {event.address.city}, {event.address.zipcode}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              Full address revealed after registration
                            </p>
                          </>
                        ) : (
                          <>
                            {event.address.name &&
                              event.address.name !== event.name && (
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
                                .join(",")}
                            </p>
                          </>
                        )}
                        {isHybridEvent(event.format) && (
                          <div className="mt-3 pt-3">
                            {event.virtualMeetingUrl ? (
                              canJoinVirtualMeeting() ? (
                                <a
                                  href={formatExternalUrl(
                                    event.virtualMeetingUrl
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Video className="h-4 w-4" />
                                  Join Virtual Meeting
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Video className="h-4 w-4" />
                                  Meeting link available 10 minutes before event
                                </p>
                              )
                            ) : (
                              <p className="text-sm text-primary flex items-center gap-1">
                                <Video className="h-4 w-4" />
                                Also available online
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : isHybridEvent(event.format) ? (
                    <div className="p-4 sm:p-6">
                      <div className="h-32 w-full bg-primary/10 rounded-lg flex flex-col items-center justify-center gap-2 mb-4">
                        <Video className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Hybrid Event
                        </span>
                      </div>
                      {event.virtualMeetingUrl ? (
                        canJoinVirtualMeeting() ? (
                          <a
                            href={formatExternalUrl(event.virtualMeetingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Join Virtual Meeting
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-2">
                            Meeting link available 10 minutes before event
                          </p>
                        )
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Physical location TBD
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <div className="h-32 w-full bg-card-secondary-background rounded-lg flex flex-col items-center justify-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Map
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Location TBD
                      </p>
                    </div>
                  )}
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

                {/* Categories & Subcategories */}
                {((event.categories && event.categories.length > 0) ||
                  (event.subcategories && event.subcategories.length > 0)) && (
                  <div className="flex flex-wrap gap-2">
                    {event.categories?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/events?category=${category.name}`}
                        className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
                      >
                        {category.name}
                      </Link>
                    ))}
                    {event.subcategories?.map((subcategory) => {
                      // Find parent category for the subcategory to include in URL
                      const parentCategory = event.categories?.find(
                        (cat) =>
                          cat.id === subcategory.categoryId ||
                          cat.id === (subcategory as any).category?.id
                      );
                      const href = parentCategory
                        ? `/events?category=${parentCategory.name}&subcategoryId=${subcategory.id}`
                        : `/events?subcategoryId=${subcategory.id}`;
                      return (
                        <Link
                          key={subcategory.id}
                          href={href}
                          className="rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20"
                        >
                          {subcategory.name}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Organizer - Desktop */}
                <div className="mt-8 h-px bg-white/10" />
                <div className="py-6 flex items-center gap-3">
                  {event.owner?.user ? (
                    <Link
                      href={`/user/${event.owner.id}`}
                      className="flex items-center gap-3 group"
                    >
                      {event.owner.user.profilePicture ? (
                        <Image
                          src={event.owner.user.profilePicture}
                          alt={
                            event.owner.firstName || event.owner.lastName
                              ? [event.owner.firstName, event.owner.lastName]
                                  .filter(Boolean)
                                  .join(" ")
                              : event.owner.user.username || "Organizer"
                          }
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {event.owner.firstName || event.owner.lastName
                            ? [event.owner.firstName, event.owner.lastName]
                                .filter(Boolean)
                                .join(" ")
                            : event.owner.user.username || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Organizer
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Event Organizer
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Organizer
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-px bg-white/10" />
              </div>

              {/* Invitation Banner */}
              {inviteToken &&
                invitationPreview?.success &&
                (event.userTicket ? (
                  // User already has a ticket - show info banner instead
                  <div className="rounded-xl bg-blue-500/10 p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                        <Ticket className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-400">
                          You already have a ticket
                        </h3>
                        <p className="text-sm text-blue-300/80">
                          You already have a ticket for this event. View it in
                          your tickets.
                        </p>
                      </div>
                      <Link
                        href="/my-tickets"
                        className="shrink-0 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/30"
                      >
                        View My Tickets
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Show invitation banner
                  <div className="rounded-xl bg-emerald-500/10 p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                        <Gift className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-400">
                          You&apos;ve been invited!
                        </h3>
                        <p className="text-sm text-emerald-300/80">
                          You have an invitation for the{" "}
                          <span className="font-medium">
                            {invitationPreview.ticket?.name}
                          </span>{" "}
                          ticket
                          {invitationPreview.ticket?.bypassPayment &&
                            invitationPreview.ticket?.isPaid && (
                              <span className="ml-1">(payment waived)</span>
                            )}
                          {invitationPreview.bypassApproval && (
                            <span className="ml-1">(no approval required)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Invitation Error Banner */}
              {inviteToken && invitationError && (
                <div className="rounded-xl bg-red-500/10 p-4 mb-6">
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
              {event.eventTickets &&
                event.eventTickets.length > 0 &&
                (() => {
                  const isEventEnded = new Date(event.endDateTime) < new Date();
                  const hasAvailableTickets = event.eventTickets.some(
                    (t) => !t.isSoldOut && t.isAvailable
                  );
                  const hasUserTicket = !!event.userTicket;
                  // Allow registration even when sold out (for waitlist), but not if user already has ticket
                  const canRegister =
                    event.status === EventStatus.PUBLISHED &&
                    !isEventEnded &&
                    !hasUserTicket;
                  const showClosedMessage = isEventEnded && !hasUserTicket;
                  // Check if we have a valid invitation
                  const hasValidInvitation =
                    inviteToken && invitationPreview?.success;
                  const invitedTicketId = invitationPreview?.ticket?.id;

                  return (
                    <div className="rounded-xl bg-card-background backdrop-blur-sm p-4 sm:p-6">
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

                      {/* Blacklist Warning Notice */}
                      {blacklistStatus?.isBlacklisted && (
                        <div className="mb-4 rounded-xl bg-red-500/10 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                              <Ban className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-red-400">
                                You cannot register for this event
                              </h3>
                              <p className="mt-1 text-sm text-red-300/80">
                                {blacklistStatus.reason}
                              </p>
                              {blacklistStatus.appealStatus ===
                                BlacklistAppealStatus.NONE &&
                                blacklistStatus.canAppeal && (
                                  <button
                                    onClick={() => setShowAppealModal(true)}
                                    className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30"
                                  >
                                    Submit Appeal
                                  </button>
                                )}
                              {blacklistStatus.appealStatus ===
                                BlacklistAppealStatus.PENDING && (
                                <p className="mt-2 text-sm text-amber-400">
                                  Your appeal is under review by the organizer.
                                </p>
                              )}
                              {blacklistStatus.appealStatus ===
                                BlacklistAppealStatus.DENIED && (
                                <p className="mt-2 text-sm text-red-400">
                                  Your appeal was denied. This decision is
                                  final.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Private Event Notice (when no invite token) */}
                      {event.isPrivate &&
                        !hasValidInvitation &&
                        !hasUserTicket &&
                        canRegister && (
                          <div className="mb-4 rounded-xl bg-purple-500/10 p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                                <Lock className="h-5 w-5 text-purple-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-purple-400">
                                  Private Event
                                </h3>
                                <p className="mt-1 text-sm text-purple-300/80">
                                  This is a private event. You&apos;ll need an
                                  invite link from the organizer to register for
                                  tickets.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="space-y-2 sm:space-y-3">
                        {event.eventTickets.map((ticket) => {
                          const isSelected = selectedTicketId === ticket.id;
                          // Use backend-computed status fields (no quantity data needed)
                          const isSoldOut = ticket.isSoldOut;
                          const isNearlySoldOut = ticket.isNearlySoldOut;
                          const isManuallyUnavailable = !ticket.isAvailable; // Organizer disabled this ticket
                          const isOwnedTicket =
                            event.userTicket?.ticketName === ticket.name;
                          const isActiveTicket =
                            isOwnedTicket &&
                            isTicketUsable(
                              event.userTicket!.status as GuestTicketStatus
                            );
                          // Check if this is the invited ticket
                          const isInvitedTicket =
                            hasValidInvitation && ticket.id === invitedTicketId;
                          // In invitation mode, only the invited ticket is selectable
                          const isDisabledByInvitation =
                            hasValidInvitation && !isInvitedTicket;
                          // Private events require an invite link (unless user already has a ticket)
                          const isDisabledByPrivate =
                            event.isPrivate &&
                            !hasValidInvitation &&
                            !hasUserTicket;
                          // Can select sold out tickets for waitlist, but not if organizer disabled or user has ticket
                          const isDisabled =
                            !canRegister ||
                            isManuallyUnavailable ||
                            hasUserTicket ||
                            isDisabledByInvitation ||
                            isDisabledByPrivate;

                          return (
                            <div
                              key={ticket.id}
                              onClick={() =>
                                !isDisabled && setSelectedTicketId(ticket.id)
                              }
                              className={`flex items-center justify-between gap-2 sm:gap-4 rounded-xl p-3 sm:p-4 transition-all border-2 ${
                                isOwnedTicket
                                  ? isActiveTicket
                                    ? "bg-card-secondary-background border-green-500/50 cursor-default"
                                    : "bg-card-secondary-background border-yellow-500/50 cursor-default"
                                  : isInvitedTicket
                                  ? "bg-emerald-500/10 border-transparent cursor-pointer ring-2 ring-emerald-500/30"
                                  : isDisabledByInvitation
                                  ? "bg-card-secondary-background border-transparent opacity-40 cursor-not-allowed"
                                  : isDisabled
                                  ? "bg-card-secondary-background border-transparent opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-card-secondary-background border-white/50 cursor-pointer"
                                  : "bg-card-secondary-background border-transparent cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {isOwnedTicket ? (
                                  <CheckCircle2
                                    className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${
                                      isActiveTicket
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                    }`}
                                  />
                                ) : isInvitedTicket ? (
                                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-400" />
                                ) : (
                                  canRegister &&
                                  !isManuallyUnavailable &&
                                  !isDisabledByInvitation &&
                                  !isDisabledByPrivate && (
                                    <div
                                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                        isSelected ? "" : ""
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary" />
                                      )}
                                    </div>
                                  )
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <h3
                                      className={`text-sm sm:text-base font-semibold break-words ${
                                        isInvitedTicket
                                          ? "text-emerald-400"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {ticket.name}
                                      {isInvitedTicket && (
                                        <span className="ml-2 text-xs font-normal text-emerald-300/80">
                                          (Invited)
                                        </span>
                                      )}
                                    </h3>
                                    {isNearlySoldOut &&
                                      !isOwnedTicket &&
                                      !isManuallyUnavailable &&
                                      !isInvitedTicket && (
                                        <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold text-orange-500 uppercase tracking-wide">
                                          <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                                          </span>
                                          Selling fast
                                        </span>
                                      )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {isOwnedTicket ? (
                                      isTicketUsable(
                                        event.userTicket!
                                          .status as GuestTicketStatus
                                      ) ? (
                                        <span className="text-green-400">
                                          You own this ticket
                                        </span>
                                      ) : (
                                        <span className="text-yellow-400">
                                          {getTicketStatusText(
                                            event.userTicket!
                                              .status as GuestTicketStatus
                                          )}
                                        </span>
                                      )
                                    ) : isInvitedTicket ? (
                                      <span className="text-emerald-300/80">
                                        {invitationPreview?.ticket
                                          ?.bypassPayment &&
                                        invitationPreview?.ticket?.isPaid
                                          ? "Free with invitation"
                                          : ticket.description || null}
                                      </span>
                                    ) : isManuallyUnavailable ? (
                                      <span className="text-gray-400">
                                        Unavailable
                                      </span>
                                    ) : isSoldOut ? (
                                      <span className="text-amber-400">
                                        Sold out - Join waitlist
                                      </span>
                                    ) : ticket.description ? (
                                      <span className="line-clamp-2">
                                        {ticket.description}
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <p
                                    className={`text-base sm:text-xl font-bold ${
                                      isInvitedTicket &&
                                      invitationPreview?.ticket
                                        ?.bypassPayment &&
                                      invitationPreview?.ticket?.isPaid
                                        ? "text-emerald-400 line-through decoration-emerald-400/50"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {Number(ticket.price) === 0
                                      ? "Free"
                                      : `£${Number(ticket.price).toFixed(2)}`}
                                  </p>
                                  {isInvitedTicket &&
                                    invitationPreview?.ticket?.bypassPayment &&
                                    invitationPreview?.ticket?.isPaid && (
                                      <p className="text-sm font-semibold text-emerald-400">
                                        Free
                                      </p>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* User ticket info */}
                      {hasUserTicket && event.userTicket && (
                        <div className="mt-4 pt-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={getTicketStatusBadgeClasses(
                                  event.userTicket.status as GuestTicketStatus
                                )}
                              >
                                {getTicketStatusText(
                                  event.userTicket.status as GuestTicketStatus
                                )}
                              </span>
                              {event.userTicket.checkInCode &&
                                isTicketUsable(
                                  event.userTicket.status as GuestTicketStatus
                                ) && (
                                  <span className="text-xs text-muted-foreground">
                                    Code:{" "}
                                    <span className="font-mono font-semibold text-foreground">
                                      {event.userTicket.checkInCode}
                                    </span>
                                  </span>
                                )}
                            </div>
                            <Link
                              href={`/my-tickets?ticketId=${event.userTicket.id}`}
                              className="text-sm text-green-400 hover:text-green-300 transition-colors shrink-0"
                            >
                              View Ticket →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Accept Invitation Button (for invitation mode) */}
                      {hasValidInvitation && canRegister && (
                        <button
                          onClick={() =>
                            invitedTicketId &&
                            handleRegisterClick(invitedTicketId)
                          }
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

                      {/* Register/Join Waitlist Button (for normal mode - hidden for private events without invite) */}
                      {!hasValidInvitation &&
                        !event.isPrivate &&
                        canRegister &&
                        event.eventTickets.some((t) => t.isAvailable) && (
                          <button
                            onClick={() =>
                              selectedTicketId &&
                              handleRegisterClick(selectedTicketId)
                            }
                            disabled={!selectedTicketId || isRegistering}
                            className="w-full mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isRegistering ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {(() => {
                                  const ticket = event.eventTickets.find(
                                    (t) => t.id === selectedTicketId
                                  );
                                  return ticket?.isSoldOut
                                    ? "Joining waitlist..."
                                    : "Registering...";
                                })()}
                              </>
                            ) : selectedTicketId ? (
                              (() => {
                                const ticket = event.eventTickets.find(
                                  (t) => t.id === selectedTicketId
                                );
                                return ticket?.isSoldOut
                                  ? "Join Waitlist"
                                  : "Register";
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
                <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
                  About this event
                </h2>
                {event.description ? (
                  <div
                    className="tiptap-editor tiptap-view-mode themed-event"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    No description provided.
                  </p>
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

        {/* Registration Confirmation Modal */}
        {showConfirmModal &&
          event &&
          pendingTicketId &&
          (() => {
            const pendingTicket = event.eventTickets?.find(
              (t) => t.id === pendingTicketId
            );
            if (!pendingTicket) return null;

            return (
              <RegistrationConfirmModal
                isOpen={showConfirmModal}
                event={event}
                ticket={pendingTicket}
                isRegistering={isRegistering}
                onClose={() => {
                  setShowConfirmModal(false);
                  setPendingTicketId(null);
                }}
                onConfirm={handleConfirmRegistration}
                onSwitchToGroup={handleSwitchToGroupPurchase}
              />
            );
          })()}

        {/* Group Purchase Modal */}
        {showGroupPurchaseModal &&
          event &&
          pendingTicketId &&
          (() => {
            const pendingTicket = event.eventTickets?.find(
              (t) => t.id === pendingTicketId
            );
            if (!pendingTicket) return null;

            return (
              <GroupPurchaseModal
                isOpen={showGroupPurchaseModal}
                event={event}
                ticket={pendingTicket}
                onClose={() => {
                  setShowGroupPurchaseModal(false);
                  setPendingTicketId(null);
                }}
                onSessionCreated={handleGroupSessionCreated}
              />
            );
          })()}

        {/* Report Event Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl bg-card-background p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Report Event
                </h2>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription("");
                  }}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">
                Please describe why you're reporting this event. Our team will
                review your report.
              </p>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe the issue with this event..."
                className="mb-4 w-full rounded-lg bg-card-secondary-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] resize-y"
                disabled={isReporting}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription("");
                  }}
                  disabled={isReporting}
                  className="flex-1 rounded-lg bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportEvent}
                  disabled={isReporting || !reportDescription.trim()}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isReporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reporting...
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blacklist Appeal Modal */}
        <AppealModal
          isOpen={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          onSubmit={handleSubmitAppeal}
          reason={blacklistStatus?.reason || ""}
        />

        {/* External Link Confirmation Modal */}
        {showExternalLinkModal && event.virtualMeetingUrl && (
          <ExternalLinkConfirmModal
            url={formatExternalUrl(event.virtualMeetingUrl)}
            onClose={() => setShowExternalLinkModal(false)}
          />
        )}

        {/* Save to Calendar Modal */}
        {showSaveToCalendarModal && (
          <SaveToCalendarModal
            eventId={event.id}
            eventName={event.name}
            onClose={() => setShowSaveToCalendarModal(false)}
          />
        )}
        </div>
      </div>
    </>
  );
}
