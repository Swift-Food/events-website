import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  ArrowUpCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { GuestActionMenu } from "./GuestActionMenu";

/**
 * Extract guest display name with proper fallbacks
 */
function getGuestDisplayName(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "Guest";

  // Try EventUser firstName/lastName first
  const eventUserName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  if (eventUserName) return eventUserName;

  // Fallback to User username
  if (guest.user?.username) return guest.user.username;

  // Last resort: email (before @)
  if (guest.user?.email) {
    return guest.user.email.split("@")[0];
  }

  return "Guest";
}

/**
 * Get initials for avatar
 */
function getGuestInitials(guest: GuestTicketResponseDto['guest'] | undefined): string {
  if (!guest) return "?";

  // Try lastName initial first
  if (guest.lastName) return guest.lastName.charAt(0).toUpperCase();
  if (guest.firstName) return guest.firstName.charAt(0).toUpperCase();

  // Try nested user
  if (guest.user) {
    if (guest.user.lastName) return guest.user.lastName.charAt(0).toUpperCase();
    if (guest.user.firstName) return guest.user.firstName.charAt(0).toUpperCase();
    if (guest.user.username) return guest.user.username.charAt(0).toUpperCase();
    if (guest.user.email) return guest.user.email.charAt(0).toUpperCase();
  }

  return "?";
}

interface GuestTableRowProps {
  guest: GuestTicketResponseDto;
  isSelected: boolean;
  onToggleSelect: (ticketId: string) => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  onCheckIn: (qrCode: string) => void;
  onPromote: (ticketId: string) => void;
  onBlacklist: (guest: GuestTicketResponseDto) => void;
  onReview?: (guest: GuestTicketResponseDto) => void;
  onRowClick?: (guest: GuestTicketResponseDto) => void;
}

// Statuses that can be selected for bulk actions (approve/reject)
// Note: PENDING_PAYMENT is excluded because those tickets are already approved and waiting for payment
const BULK_ACTIONABLE_STATUSES = [
  GuestTicketStatus.PENDING_APPROVAL,
  GuestTicketStatus.WAITLISTED,
];

export const GuestTableRow = ({
  guest,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onCheckIn,
  onPromote,
  onBlacklist,
  onReview,
  onRowClick,
}: GuestTableRowProps) => {
  const [showMenu, setShowMenu] = useState(false);

  // Only allow selection for bulk-actionable statuses
  const canSelect = BULK_ACTIONABLE_STATUSES.includes(guest.status as GuestTicketStatus);

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
        label: "Pending",
        icon: Clock,
        className: "bg-amber-100 text-amber-700",
      },
      pending_payment: {
        label: "Awaiting Payment",
        icon: Clock,
        className: "bg-blue-100 text-blue-700",
      },
      waitlisted: {
        label: "Waitlisted",
        icon: Clock,
        className: "bg-orange-100 text-orange-700",
      },
      refunded: {
        label: "Refunded",
        icon: XCircle,
        className: "bg-purple-100 text-purple-700",
      },
      expired: {
        label: "Expired",
        icon: XCircle,
        className: "bg-neutral-100 text-neutral-700",
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
        className={`inline-flex items-center gap-1 md:gap-1.5 rounded-full px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-medium ${config.className}`}
      >
        <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
        {config.label}
      </span>
    );
  };

 
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('[role="menu"]')
    ) {
      return;
    }
    onRowClick?.(guest);
  };

  return (
    <tr
      className="border-b border-neutral-700 last:border-b-0 transition-colors hover:bg-white/5 cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="p-3 md:p-4">
        <input
          type="checkbox"
          checked={isSelected && canSelect}
          onChange={() => canSelect && onToggleSelect(guest.id)}
          disabled={!canSelect}
          className={`h-4 w-4 rounded border-neutral-700 bg-input-background text-primary focus:ring-2 focus:ring-primary ${
            !canSelect ? "opacity-30 cursor-not-allowed" : ""
          }`}
        />
      </td>
      <td className="p-3 md:p-4">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getGuestInitials(guest.guest)}
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-medium text-foreground break-words">{getGuestDisplayName(guest.guest)}</p>
            <p className="text-xs md:text-sm text-muted-foreground break-all">{guest.guest?.user?.email || "No email"}</p>
          </div>
        </div>
      </td>
      <td className="p-3 md:p-4">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <ChevronRight className="h-4 w-4 text-muted-foreground md:hidden ml-2" />
        </div>
      </td>
      <td className="hidden md:table-cell p-4">
        <p className="text-sm text-foreground">
          {format(new Date(guest.createdAt), "MMM d, yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(guest.createdAt), "h:mm a")}
        </p>
      </td>
      <td className="hidden md:table-cell p-4">
        <p className="text-sm text-foreground">
          {guest.ticketName || "—"}
        </p>
      </td>
      <td className="hidden md:table-cell p-4">
        <div className="flex items-center justify-end gap-2">
          {guest.status === GuestTicketStatus.PENDING_APPROVAL && onReview && (
            <button
              onClick={() => onReview(guest)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </button>
          )}
          {guest.status === "waitlisted" && (
            <button
              onClick={() => onPromote(guest.id)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Promote
            </button>
          )}
          {guest.status === GuestTicketStatus.ACTIVE && (
            <button
              onClick={() => onCheckIn(guest.qrCode || "")}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
            >
              Check In
            </button>
          )}
          <button
            onClick={() => onRowClick?.(guest)}
            className="rounded-lg bg-card-secondary-background p-2 transition-colors hover:bg-white/15"
            title="View details"
          >
            <Eye className="h-4 w-4 text-foreground" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg bg-card-secondary-background p-2 transition-colors hover:bg-white/15"
            >
              <MoreHorizontal className="h-4 w-4 text-foreground" />
            </button>
            {showMenu && (
              <GuestActionMenu
                guest={guest}
                onClose={() => setShowMenu(false)}
                onApprove={onApprove}
                onReject={onReject}
                onCheckIn={onCheckIn}
                onPromote={onPromote}
                onBlacklist={onBlacklist}
                onViewDetails={onRowClick}
              />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};