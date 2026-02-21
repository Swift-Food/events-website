import { GuestTicketStatus } from "@/types/guest-ticket";

/**
 * Computes the effective display status for a ticket based on event timing.
 * Handles the gap between when an event starts/ends and when the backend
 * cleanup job updates the DB status.
 *
 * - Event ended + ACTIVE/CHECKED_IN -> EXPIRED
 * - Event started + PENDING or WAITLISTED -> EXPIRED
 */
export function getEffectiveTicketStatus(
  status: GuestTicketStatus,
  eventStartDateTime: string | Date,
  eventEndDateTime: string | Date,
): GuestTicketStatus {
  const now = new Date();
  const hasStarted = new Date(eventStartDateTime) <= now;
  const hasEnded = new Date(eventEndDateTime) < now;

  if (
    hasEnded &&
    (status === GuestTicketStatus.ACTIVE || status === GuestTicketStatus.CHECKED_IN)
  ) {
    return GuestTicketStatus.EXPIRED;
  }

  if (
    hasStarted &&
    (status === GuestTicketStatus.PENDING_PAYMENT ||
      status === GuestTicketStatus.PENDING_APPROVAL ||
      status === GuestTicketStatus.WAITLISTED)
  ) {
    return GuestTicketStatus.EXPIRED;
  }

  return status;
}
