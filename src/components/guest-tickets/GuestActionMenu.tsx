import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import {
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowUpCircle,
  UserCheck,
  Download,
  Ban,
  Eye,
} from "lucide-react";
import { useEffect, useRef } from "react";

interface GuestActionMenuProps {
  guest: GuestTicketResponseDto;
  onClose: () => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  onCheckIn: (qrCode: string) => void;
  onPromote: (ticketId: string) => void;
  onBlacklist: (guest: GuestTicketResponseDto) => void;
  onViewDetails?: (guest: GuestTicketResponseDto) => void;
}

export const GuestActionMenu = ({
  guest,
  onClose,
  onApprove,
  onReject,
  onCheckIn,
  onPromote,
  onBlacklist,
  onViewDetails,
}: GuestActionMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const menuItems = [];

  // Add status-specific actions
  if (guest.status === GuestTicketStatus.PENDING_APPROVAL) {
    menuItems.push(
      {
        label: "Approve",
        icon: CheckCircle2,
        onClick: () => {
          onApprove(guest.id);
          onClose();
        },
        color: "text-green-600",
      },
      {
        label: "Reject",
        icon: XCircle,
        onClick: () => {
          onReject(guest.id);
          onClose();
        },
        color: "text-red-600",
      }
    );
  }

  if (guest.status === "waitlisted") {
    menuItems.push({
      label: "Promote from Waitlist",
      icon: ArrowUpCircle,
      onClick: () => {
        onPromote(guest.id);
        onClose();
      },
      color: "text-primary",
    });
  }

  if (guest.status === GuestTicketStatus.ACTIVE) {
    menuItems.push({
      label: "Check In",
      icon: UserCheck,
      onClick: () => {
        onCheckIn(guest.qrCode || "");
        onClose();
      },
      color: "text-purple-600",
    });
  }

  // Common actions
  if (onViewDetails) {
    menuItems.push({
      label: "View Details",
      icon: Eye,
      onClick: () => {
        onViewDetails(guest);
        onClose();
      },
      color: "text-foreground",
    });
  }

  // menuItems.push(
  //   {
  //     label: "View QR Code",
  //     icon: QrCode,
  //     onClick: () => {
  //       // TODO: Implement QR code modal
  //       console.log("View QR code:", guest.qrCode);
  //       onClose();
  //     },
  //     color: "text-foreground",
  //   },
  //   {
  //     label: "Download Ticket",
  //     icon: Download,
  //     onClick: () => {
  //       // TODO: Implement ticket download
  //       console.log("Download ticket:", guest.id);
  //       onClose();
  //     },
  //     color: "text-foreground",
  //   }
  // );

  // Dangerous actions (blacklist)
  // Only show if ticket is not already cancelled/refunded
  if (
    guest.status !== GuestTicketStatus.CANCELLED &&
    guest.status !== GuestTicketStatus.REFUNDED
  ) {
    menuItems.push({
      label: "Blacklist User",
      icon: Ban,
      onClick: () => {
        onBlacklist(guest);
        onClose();
      },
      color: "text-red-500",
      isDanger: true,
    });
  }

  // Separate normal and dangerous items
  const normalItems = menuItems.filter((item) => !(item as any).isDanger);
  const dangerItems = menuItems.filter((item) => (item as any).isDanger);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl bg-card-secondary-background shadow-xl ring-1 ring-border"
    >
      <div className="py-1">
        {normalItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${item.color}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        {dangerItems.length > 0 && (
          <>
            <div className="my-1 border-t border-border" />
            {dangerItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={`danger-${index}`}
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-500/10 ${item.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};