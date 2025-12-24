"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import {
  InvitationPreviewDto,
  CollaboratorRole,
} from "@/types/event-collaborator";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserPlus,
  Shield,
  Scan,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function JoinEventPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationPreviewDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await eventCollaboratorService.previewInvitation(token);

        if (!data.success) {
          setError(data.message || "Invalid or expired invitation");
          return;
        }

        setInvitation(data);
      } catch (err: any) {
        console.error("Failed to fetch invitation:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load invitation. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to auth with return URL
      const returnUrl = encodeURIComponent(`/events/join/${token}`);
      router.push(`/auth?redirect=${returnUrl}&inviteToken=${token}&inviteType=collaborator`);
      return;
    }

    try {
      setAccepting(true);
      const result = await eventCollaboratorService.acceptInvite(token);

      if (result.success) {
        setAccepted(true);
        toast.success("Invitation accepted successfully!");

        // Redirect to event management page after a short delay
        setTimeout(() => {
          router.push(`/event-management/${result.event.id}`);
        }, 2000);
      } else {
        if (result.requiresLogin) {
          const returnUrl = encodeURIComponent(`/events/join/${token}`);
          router.push(`/auth?redirect=${returnUrl}&inviteToken=${token}&inviteType=collaborator`);
        } else {
          toast.error(result.message || "Failed to accept invitation");
        }
      }
    } catch (err: any) {
      console.error("Failed to accept invitation:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to accept invitation. Please try again."
      );
    } finally {
      setAccepting(false);
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

  const getRoleInfo = (role: CollaboratorRole) => {
    switch (role) {
      case CollaboratorRole.COLLABORATOR_ADMIN:
        return {
          label: "Admin Collaborator",
          description: "Full admin access - can manage other collaborators",
          icon: Shield,
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/30",
        };
      case CollaboratorRole.COLLABORATOR:
        return {
          label: "Scanner",
          description: "Can scan and check-in guests at the event",
          icon: Scan,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500/30",
        };
      default:
        return {
          label: "Collaborator",
          description: "Standard collaborator access",
          icon: UserPlus,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
        };
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation || !invitation.event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <Link
            href="/events"
            className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Browse Events
          </Link>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-12 text-center">
            <p className="mb-4 text-lg text-red-400">
              {error || "Invalid or expired invitation"}
            </p>
            <Link
              href="/events"
              className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const event = invitation.event;
  const roleInfo = getRoleInfo(invitation.role!);
  const RoleIcon = roleInfo.icon;

  // Already accepted state
  if (invitation.alreadyAccepted || accepted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {accepted ? "Invitation Accepted!" : "Already a Collaborator"}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {accepted
                ? "You are now a collaborator for this event. Redirecting..."
                : "You have already accepted this invitation."}
            </p>
            <Link
              href={`/event-management/${event.id}`}
              className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
            >
              Go to Event Management
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back Button */}
        <Link
          href="/events"
          className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Browse Events
        </Link>

        {/* Invitation Header */}
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
          <UserPlus className="mx-auto mb-2 h-8 w-8 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            You&apos;ve been invited to collaborate
          </h2>
          <p className="text-sm text-muted-foreground">
            Review the details below and accept to join the team
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col gap-6 lg:flex-row-reverse">
          {/* Left Column - Image, Date, Role, Accept Button */}
          <section className="flex flex-col gap-6 lg:w-96 lg:shrink-0">
            {/* Event Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-700 bg-card-secondary-background">
              {event.eventImage ? (
                <Image
                  src={event.eventImage}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/20">
                  <Calendar className="h-24 w-24 text-primary/30" />
                </div>
              )}
            </div>

            {/* Date & Time Card */}
            <div className="rounded-xl border border-neutral-700 bg-card-background p-6">
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
                        <p className="font-medium text-foreground">
                          {formatDate(event.startDateTime)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.startDateTime)}
                        </p>
                      </div>
                      <div>
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

            {/* Role Info Card */}
            <div
              className={`rounded-xl border ${roleInfo.borderColor} ${roleInfo.bgColor} p-4`}
            >
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                Your Role
              </h3>
              <div className="flex items-center gap-3">
                <RoleIcon className={`h-6 w-6 ${roleInfo.color}`} />
                <div>
                  <p className={`font-semibold ${roleInfo.color}`}>
                    {roleInfo.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Accept Button */}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accepting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Accepting...
                </span>
              ) : isAuthenticated ? (
                "Accept Invitation"
              ) : (
                "Sign in to Accept"
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-center text-sm text-muted-foreground">
                You&apos;ll need to sign in or create an account to accept this
                invitation
              </p>
            )}
          </section>

          {/* Right Column - Event Name and Description */}
          <section className="flex flex-1 flex-col gap-6">
            {/* Event Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {event.name}
              </h1>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
                  About this event
                </h2>
                <div
                  className="tiptap-editor tiptap-view-mode"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
