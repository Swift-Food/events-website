// utils/ticket-status.ts
import { GuestTicketStatus } from '@/types/guest-ticket';

/**
 * Get user-friendly display text for ticket status
 */
export function getTicketStatusText(status: GuestTicketStatus): string {
  const statusTexts: Record<GuestTicketStatus, string> = {
    [GuestTicketStatus.PENDING_APPROVAL]: 'Pending Approval',
    [GuestTicketStatus.PENDING_PAYMENT]: 'Payment Required',
    [GuestTicketStatus.ACTIVE]: 'Active',
    [GuestTicketStatus.CHECKED_IN]: 'Checked In',
    [GuestTicketStatus.CANCELLED]: 'Cancelled',
    [GuestTicketStatus.REFUNDED]: 'Refunded',
    [GuestTicketStatus.WAITLISTED]: 'Waitlisted',
    [GuestTicketStatus.EXPIRED]: 'Expired',
  };

  return statusTexts[status] || status;
}

/**
 * Get description/message for each status
 */
export function getTicketStatusMessage(status: GuestTicketStatus): string {
  const messages: Record<GuestTicketStatus, string> = {
    [GuestTicketStatus.PENDING_APPROVAL]: 'Your registration is awaiting organizer approval',
    [GuestTicketStatus.PENDING_PAYMENT]: 'Complete payment to confirm your ticket',
    [GuestTicketStatus.ACTIVE]: 'Your ticket is confirmed and ready to use',
    [GuestTicketStatus.CHECKED_IN]: 'You have checked in to this event',
    [GuestTicketStatus.CANCELLED]: 'This ticket has been cancelled',
    [GuestTicketStatus.REFUNDED]: 'Your payment has been refunded',
    [GuestTicketStatus.WAITLISTED]: 'You are on the waitlist for this event',
    [GuestTicketStatus.EXPIRED]: 'This ticket has expired',
  };

  return messages[status] || '';
}

/**
 * Get Tailwind CSS classes for status badge
 */
export function getTicketStatusBadgeClasses(status: GuestTicketStatus): string {
  const baseClasses = 'rounded-full border px-3 py-1 text-xs font-semibold';

  const statusClasses: Record<GuestTicketStatus, string> = {
    [GuestTicketStatus.PENDING_APPROVAL]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    [GuestTicketStatus.PENDING_PAYMENT]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    [GuestTicketStatus.ACTIVE]: 'bg-green-500/20 text-green-400 border-green-500/30',
    [GuestTicketStatus.CHECKED_IN]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [GuestTicketStatus.CANCELLED]: 'bg-red-500/20 text-red-400 border-red-500/30',
    [GuestTicketStatus.REFUNDED]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    [GuestTicketStatus.WAITLISTED]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    [GuestTicketStatus.EXPIRED]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const classes = statusClasses[status] || '';
  return `${baseClasses} ${classes}`;
}

/**
 * Check if ticket is actionable (can be cancelled, paid, etc.)
 */
export function canCancelTicket(status: GuestTicketStatus): boolean {
  return [
    GuestTicketStatus.PENDING_APPROVAL,
    GuestTicketStatus.PENDING_PAYMENT,
    GuestTicketStatus.ACTIVE,
    GuestTicketStatus.WAITLISTED,
  ].includes(status);
}

/**
 * Check if ticket requires payment
 */
export function requiresPayment(status: GuestTicketStatus): boolean {
  return status === GuestTicketStatus.PENDING_PAYMENT;
}

/**
 * Check if ticket is usable (active or checked in)
 */
export function isTicketUsable(status: GuestTicketStatus): boolean {
  return [
    GuestTicketStatus.ACTIVE,
    GuestTicketStatus.CHECKED_IN,
  ].includes(status);
}

/**
 * Check if organizer can approve/reject ticket
 */
export function canModerateTicket(status: GuestTicketStatus): boolean {
  return [
    GuestTicketStatus.PENDING_APPROVAL,
    GuestTicketStatus.PENDING_PAYMENT,
    GuestTicketStatus.WAITLISTED,
  ].includes(status);
}
