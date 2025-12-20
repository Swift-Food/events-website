import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  UserCheck,
  ArrowUpCircle,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { GuestActionMenu } from "./GuestActionMenu";

interface GuestTableRowProps {
  guest: GuestTicketResponseDto;
  isSelected: boolean;
  onToggleSelect: (ticketId: string) => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  onCheckIn: (qrCode: string) => void;
  onPromote: (ticketId: string) => void;
}

export const GuestTableRow = ({
  guest,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onCheckIn,
  onPromote,
}: GuestTableRowProps) => {
  const [showMenu, setShowMenu] = useState(false);
  console.log("guest is", JSON.stringify(guest))
  const getStatusBadge = () => {
    const statusConfig = {
      checked_in: {  // ← Add this
        label: "Active",  // Show as "Active" since they're checked in
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700",
      },
      active: {
        label: "Approved",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700",
      },
      pending: {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-100 text-amber-700",
      },
      waitlisted: {
        label: "Waitlisted",
        icon: Clock,
        className: "bg-orange-100 text-orange-700",
      },
      rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-100 text-red-700",
      },
    };
    console.log("guest status", guest.status)
    const config = statusConfig[guest.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

 
  return (
    <tr className="border-b border-neutral-700 last:border-b-0 transition-colors hover:bg-white/5">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(guest.id)}
          className="h-4 w-4 rounded border-neutral-700 bg-input-background text-primary focus:ring-2 focus:ring-primary"
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {(guest.guest?.lastName || "").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{guest.guest.firstName} {guest.guest.lastName}</p>
            <p className="font-medium text-foreground">{guest.guest.user.email}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center">
          {getStatusBadge()}
    
        </div>
      </td>
      <td className="p-4">
        <p className="text-sm text-foreground">
          {format(new Date(guest.createdAt), "MMM d, yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(guest.createdAt), "h:mm a")}
        </p>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          {guest.status === GuestTicketStatus.PENDING_APPROVAL && (
            <>
              <button
                onClick={() => onApprove(guest.id)}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(guest.id)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                Reject
              </button>
            </>
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
              />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};