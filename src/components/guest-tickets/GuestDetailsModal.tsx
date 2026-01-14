import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { format } from "date-fns";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  Eye,
  Mail,
  Calendar,
  Ticket,
  ClipboardList,
  Ban,
} from "lucide-react";

/**
 * Extract guest display name with proper fallbacks
 */
function getGuestDisplayName(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "Guest";

  const eventUserName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  if (eventUserName) return eventUserName;

  if (guest.user) {
    const userName = `${guest.user.firstName || ""} ${guest.user.lastName || ""}`.trim();
    if (userName) return userName;

    if (guest.user.username) return guest.user.username;

    if (guest.user.email) {
      const emailPrefix = guest.user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
  }

  return "Guest";
}

/**
 * Get initials for avatar
 */
function getGuestInitials(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "?";

  if (guest.lastName) return guest.lastName.charAt(0).toUpperCase();
  if (guest.firstName) return guest.firstName.charAt(0).toUpperCase();

  if (guest.user) {
    if (guest.user.lastName) return guest.user.lastName.charAt(0).toUpperCase();
    if (guest.user.firstName) return guest.user.firstName.charAt(0).toUpperCase();
    if (guest.user.username) return guest.user.username.charAt(0).toUpperCase();
    if (guest.user.email) return guest.user.email.charAt(0).toUpperCase();
  }

  return "?";
}

interface GuestDetailsModalProps {
  isOpen: boolean;
  guest: GuestTicketResponseDto | null;
  onClose: () => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  onCheckIn: (qrCode: string) => void;
  onPromote: (ticketId: string) => void;
  onReview?: (guest: GuestTicketResponseDto) => void;
}

export const GuestDetailsModal = ({
  isOpen,
  guest,
  onClose,
  onApprove,
  onReject,
  onCheckIn,
  onPromote,
  onReview,
}: GuestDetailsModalProps) => {
  if (!isOpen || !guest) return null;

  const getStatusBadge = () => {
    const statusConfig = {
      checked_in: {
        label: "Checked In",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700",
      },
      active: {
        label: "Approved",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700",
      },
      pending_approval: {
        label: "Pending Approval",
        icon: Clock,
        className: "bg-amber-100 text-amber-700",
      },
      waitlisted: {
        label: "Waitlisted",
        icon: Clock,
        className: "bg-orange-100 text-orange-700",
      },
      cancelled: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-neutral-100 text-neutral-700",
      },
    };

    const config = statusConfig[guest.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${config.className}`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] rounded-2xl bg-card-background border border-white/10 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 shrink-0">
          <h3 className="text-lg font-semibold text-foreground">Guest Details</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Guest Info */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {getGuestInitials(guest.guest)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-foreground break-words">
                {getGuestDisplayName(guest.guest)}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="break-all">{guest.guest?.user?.email || "No email"}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge()}
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-card-secondary-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Type</p>
                <p className="text-sm font-medium text-foreground">
                  {guest.ticketName || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-card-secondary-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(guest.createdAt), "MMM d, yyyy")} at{" "}
                  {format(new Date(guest.createdAt), "h:mm a")}
                </p>
              </div>
            </div>

            {/* Show rejection reason if populated */}
            {guest.cancelledReason && (
              <div className="flex items-center gap-3 rounded-xl bg-card-secondary-background p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Ban className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm font-medium text-foreground">
                    {guest.cancelledReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Registration Questions */}
          {guest.questionAnswers && Object.keys(guest.questionAnswers).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Registration Answers</h4>
              </div>
              <div className="space-y-2">
                {Object.entries(guest.questionAnswers).map(([question, answer]) => (
                  <div
                    key={question}
                    className="rounded-xl bg-card-secondary-background p-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {question}
                    </p>
                    <p className="text-sm text-foreground">
                      {Array.isArray(answer) ? answer.join(", ") : String(answer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-white/10 p-4 shrink-0">
          <div className="flex flex-wrap gap-2">
            {guest.status === GuestTicketStatus.PENDING_APPROVAL && onReview && (
              <button
                onClick={() => {
                  onClose();
                  onReview(guest);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Eye className="h-4 w-4" />
                Review
              </button>
            )}
            {guest.status === "waitlisted" && (
              <button
                onClick={() => {
                  onPromote(guest.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Promote
              </button>
            )}
            {guest.status === GuestTicketStatus.ACTIVE && (
              <button
                onClick={() => {
                  onCheckIn(guest.qrCode || "");
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Check In
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-card-secondary-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
