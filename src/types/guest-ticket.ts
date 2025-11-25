// types/guest-ticket.ts
/**
 * Guest Ticket Status Flow (matches backend exactly):
 *
 * Free Tickets:
 *   PENDING_APPROVAL → ACTIVE → CHECKED_IN
 *                   ↓
 *                CANCELLED
 *
 * Paid Tickets:
 *   PENDING_APPROVAL → PENDING_PAYMENT → ACTIVE → CHECKED_IN
 *                   ↓                   ↓
 *                CANCELLED           REFUNDED
 *
 * Waitlist Flow:
 *   WAITLISTED → (promoted) → PENDING_APPROVAL → ...
 */
export enum GuestTicketStatus {
  /** Ticket created, awaiting organizer approval (for approval-required tickets) */
  PENDING_APPROVAL = 'pending_approval',

  /** Ticket approved by organizer, awaiting payment (for paid tickets only) */
  PENDING_PAYMENT = 'pending_payment',

  /** Ticket is active and ready to use (approved + paid if required) */
  ACTIVE = 'active',

  /** Ticket has been used/scanned at the event */
  CHECKED_IN = 'checked_in',

  /** Ticket cancelled by user or organizer (ticket becomes available again) */
  CANCELLED = 'cancelled',

  /** Payment refunded, ticket no longer valid (ticket becomes available again) */
  REFUNDED = 'refunded',

  /** Ticket on waitlist, waiting for availability */
  WAITLISTED = 'waitlisted',

  /** Event has ended and ticket expired unused */
  EXPIRED = 'expired',
}

// Backend Response DTOs - Must match backend exactly

/**
 * Guest ticket response from backend (lightweight)
 * Matches: src/features/event-management/guest-tickets/dto/response.dto.ts
 */
export interface GuestTicketResponseDto {
  id: string;
  eventId: string;
  eventName: string;
  guestEventUserId: string;
  eventTicketId: string;
  ticketName: string;
  status: GuestTicketStatus;
  questionAnswers: Record<string, any> | null;
  qrCode: string | null;
  qrCodeImageUrl: string | null;
  purchaseDateTime: Date | null;
  checkInDateTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended DTO with event details for profile/dashboard
 * Matches: GuestTicketWithEventResponseDto from backend
 */
export interface GuestTicketWithEventResponseDto extends GuestTicketResponseDto {
  eventStartDateTime: Date;
  eventEndDateTime: Date;
  eventImage: string | null;
  eventStatus: string;
}

/**
 * Response when registering for a ticket
 * Matches: RegisterTicketResponseDto from backend
 */
export interface RegisterTicketResponseDto {
  success: boolean;
  message: string;
  guestTicket: GuestTicketResponseDto;
  requiresPayment: boolean;
  paymentUrl?: string;
}

/**
 * Response for "My Tickets" endpoint
 * Matches: MyTicketsResponseDto from backend
 */
export interface MyTicketsResponseDto {
  tickets: GuestTicketWithEventResponseDto[];
  total: number;
}

/**
 * Admin view of ticket (for organizers)
 * Matches: AdminTicketResponseDto from backend
 */
export interface AdminTicketResponseDto {
  id: string;
  eventId: string;
  eventName: string;
  guestEmail: string;
  guestName: string;
  ticketName: string;
  status: GuestTicketStatus;
  questionAnswers: Record<string, any> | null;
  registeredAt: Date;
  approvedRejectedAt?: Date;
  approvedRejectedBy?: string;
}

/**
 * Response for pending tickets endpoint
 * Matches: PendingTicketsResponseDto from backend
 */
export interface PendingTicketsResponseDto {
  pending: AdminTicketResponseDto[];
  waitlist: AdminTicketResponseDto[];
  total: number;
}

// Request DTOs

export interface RegisterForTicketDto {
  eventTicketId: string;
  questionAnswers?: Record<string, any>;
}

export interface UpdateTicketStatusDto {
  status: GuestTicketStatus;
  reason?: string;
}

// Other response types

export interface TicketActionResponseDto {
  success: boolean;
  message: string;
  ticket?: GuestTicketResponseDto;
}

export interface BulkActionResponseDto {
  success: boolean;
  message?: string;
  approved?: number;
  rejected?: number;
  checkedIn?: number;
  failed?: number;
  errors?: string[];
}
