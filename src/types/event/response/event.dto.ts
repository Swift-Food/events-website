/**
 * Event response DTOs
 * Backend source: src/features/event-management/events/dto/response.dto.ts
 */

import { EventStatus, EventFormat } from '../status';
import { EventOwnerResponseDto } from './owner.dto';
import { EventAddressResponseDto } from '../../address/response.dto';
import { EventCategoryResponseDto } from '../../category/response.dto';
import { EventTicketResponseDto } from '../../event-ticket/response/ticket.dto';

export interface UserTicketDto {
  id: string;
  status: 'pending_approval' | 'pending_payment' | 'active' | 'checked_in' | 'cancelled' | 'refunded' | 'waitlisted' | 'expired';
  ticketName: string;
  ticketId: string;
  checkInCode: string | null;
  qrCodeImageUrl: string | null;
  purchaseDateTime: string | null;
  checkInDateTime: string | null;
}

export interface EventResponseDto {
  id: string;
  name: string;
  description: string;
  eventImage: string | null;
  eventColor: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  status: EventStatus;
  isPrivate: boolean;
  requiresApproval: boolean;
  format: EventFormat;
  virtualMeetingUrl: string | null;
  virtualCapacity: number | null;
  eventUrl: string | null;
  viewCount: number;
  acceptingNewTickets: boolean;
  stopAcceptingOnStart: boolean;
  hideFullAddress: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner: EventOwnerResponseDto;
  address: EventAddressResponseDto;
  categories: EventCategoryResponseDto[];
  eventTickets?: EventTicketResponseDto[];
  ticketsSoldCount?: number;
  attendeesCount?: number;
  userTicket?: UserTicketDto | null;
}

export interface EventListResponseDto {
  events: EventResponseDto[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateEventResponse {
  success: boolean;
  message: string;
  event: EventResponseDto;
}

export interface UpdateEventResponse {
  success: boolean;
  message: string;
  event: EventResponseDto;
}

export interface EventStats {
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  revenue: number;
  attendees: number;
}
