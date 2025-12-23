import { GuestTicketResponseDto } from "@/types/guest-ticket";
import { GuestTableRow } from "./GuestTableRow";
import { Inbox } from "lucide-react";

interface GuestTableProps {
  guests: GuestTicketResponseDto[];
  selectedGuests: Set<string>;
  onToggleSelect: (ticketId: string) => void;
  onToggleSelectAll: () => void;
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string, reason?: string) => void;
  onCheckIn: (qrCode: string) => void;
  onPromote: (ticketId: string) => void;
  onReview?: (guest: GuestTicketResponseDto) => void;
  onRowClick?: (guest: GuestTicketResponseDto) => void;
}

export const GuestTable = ({
  guests,
  selectedGuests,
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
  onCheckIn,
  onPromote,
  onReview,
  onRowClick,
}: GuestTableProps) => {
  if (guests.length === 0) {
    return (
      <div className="rounded-2xl bg-card-background p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Inbox className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No guests found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card-background">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="p-3 md:p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedGuests.size === guests.length && guests.length > 0}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-neutral-700 bg-input-background text-primary focus:ring-2 focus:ring-primary"
                />
              </th>
              <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-muted-foreground">
                Guest
              </th>
              <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden md:table-cell p-4 text-left text-sm font-semibold text-muted-foreground">
                Registered
              </th>
              <th className="hidden md:table-cell p-4 text-left text-sm font-semibold text-muted-foreground">
                Ticket Type
              </th>
              <th className="hidden md:table-cell p-4 text-right text-sm font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <GuestTableRow
                key={guest.id}
                guest={guest}
                isSelected={selectedGuests.has(guest.id)}
                onToggleSelect={onToggleSelect}
                onApprove={onApprove}
                onReject={onReject}
                onCheckIn={onCheckIn}
                onPromote={onPromote}
                onReview={onReview}
                onRowClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};