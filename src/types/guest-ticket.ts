// types/guest-ticket.ts

import { EventUser } from "./user";

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
  guest: EventUser;
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
  ticketPrice: number; // Price of the ticket (0 for free tickets)
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
  /** For Stripe.js payment flow - client secret for PaymentIntent */
  clientSecret?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  ticketDetails?: {
    ticketName: string;
    eventName: string;
    price: number;
  };
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

export interface BulkApproveTicketsDto {
  ticketIds: string[];
}

export interface BulkRejectTicketsDto {
  ticketIds: string[];
  reason?: string;
}

export interface BulkCheckInDto {
  qrCodes: string[];
}

export interface RefundTicketRequestDto {
  reason: string;
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

export interface RefundResult {
  success: boolean;
  message: string;
  refundId?: string;
  amountRefunded?: number;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  reason?: string;
  refundAmount?: number;
}

// Ticket Invite Link Types

/**
 * Reservation mode for invite links
 */
export enum ReservationMode {

  IMMEDIATE = 'immediate',
  ON_ACCEPTANCE = 'on_acceptance',
}

/**
 * Generate a ticket invite link
 */
export interface GenerateTicketInviteLinkDto {
  eventTicketId: string;
  bypassPayment?: boolean;
  bypassApproval?: boolean;
  reservationMode: ReservationMode;
  maxUses?: number; // Default: 100
}

/**
 * Response when generating a ticket invite link
 */
export interface GenerateTicketInviteLinkResponseDto {
  success: boolean;
  message: string;
  inviteLink: string;
  token: string;
  inviteLinkId: string;
}

/**
 * Accept a ticket invitation
 */
export interface AcceptTicketInviteDto {
  token?: string; // Token from URL params, optional in body
}

/**
 * Response when accepting a ticket invitation
 */
export interface AcceptTicketInviteResponseDto {
  success: boolean;
  message: string;
  guestTicket?: GuestTicketResponseDto;
  requiresPayment?: boolean;
  paymentUrl?: string;
  requiresLogin?: boolean;
}

/**
 * Preview ticket invitation details
 */
export interface TicketInvitationPreviewDto {
  success: boolean;
  message?: string;
  event?: {
    id: string;
    name: string;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
    eventImage: string | null;
  };
  ticket?: {
    id: string;
    name: string;
    isPaid: boolean;
    bypassPayment: boolean;
  };
  bypassApproval?: boolean;
  reservationMode?: ReservationMode;
  maxUses?: number;
  usedCount?: number;
}

/**
 * Ticket invite link details
 */
export interface TicketInviteLinkDto {
  id: string;
  eventId: string;
  eventTicketId: string;
  ticketName: string;
  token: string;
  bypassPayment: boolean;
  bypassApproval: boolean;
  reservationMode: ReservationMode;
  maxUses: number;
  usedCount: number;
  createdAt: Date;
  createdBy: string;
}

/**
 * Response for getting all invite links for an event
 */
export interface InviteLinksListResponseDto {
  success: boolean;
  inviteLinks: TicketInviteLinkDto[];
  total: number;
}
