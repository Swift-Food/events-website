import { pdf } from "@react-pdf/renderer";
import { GuestTicketResponseDto, GuestTicketStatus } from "@/types/guest-ticket";
import { GuestListPdf } from "@/components/pdf/GuestListPdf";

/**
 * Guest List Export Utility
 *
 * Provides PDF export functionality for event guest lists.
 * Generates a professionally styled PDF document.
 */

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<GuestTicketStatus, string> = {
  [GuestTicketStatus.PENDING_APPROVAL]: "Pending Approval",
  [GuestTicketStatus.PENDING_PAYMENT]: "Awaiting Payment",
  [GuestTicketStatus.ACTIVE]: "Approved",
  [GuestTicketStatus.CHECKED_IN]: "Checked In",
  [GuestTicketStatus.CANCELLED]: "Cancelled",
  [GuestTicketStatus.REFUNDED]: "Refunded",
  [GuestTicketStatus.WAITLISTED]: "Waitlisted",
  [GuestTicketStatus.EXPIRED]: "Expired",
};

/**
 * Generate filename for the export
 */
function generateFilename(eventName: string, filterStatus?: string): string {
  const sanitizedEventName = eventName
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .substring(0, 50);

  const date = new Date().toISOString().split("T")[0];
  const filterSuffix = filterStatus && filterStatus !== "all" ? `_${filterStatus}` : "";

  return `${sanitizedEventName}_guests${filterSuffix}_${date}.pdf`;
}

/**
 * Download guest list as PDF file
 *
 * @param guests - Array of guest tickets to export
 * @param eventName - Name of the event
 * @param filterStatus - Optional filter status
 */
export async function downloadGuestListPDF(
  guests: GuestTicketResponseDto[],
  eventName: string,
  filterStatus?: string
): Promise<void> {
  if (guests.length === 0) {
    throw new Error("No guests to export");
  }

  // Generate PDF blob
  const blob = await pdf(
    GuestListPdf({ guests, eventName, filterStatus })
  ).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = generateFilename(eventName, filterStatus);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get export summary for toast notification
 */
export function getExportSummary(guests: GuestTicketResponseDto[]): string {
  const total = guests.length;
  if (total === 0) return "No guests to export";
  if (total === 1) return "1 guest exported";
  return `${total} guests exported`;
}
