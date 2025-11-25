/**
 * Event Service DTOs
 *
 * These types match the backend DTOs for creating, updating, and querying events.
 * Backend sources:
 * - src/features/event-management/events/dto/create-event.dto.ts
 * - src/features/user-management/driver-user/dto/location.dto.ts
 * - src/features/event-management/tickets/dto/create-ticket.dto.ts
 */

import { EventStatus, EventResponseDto } from './event';

/**
 * Location coordinates (matches backend LocationDto)
 * Backend: src/features/user-management/driver-user/dto/location.dto.ts
 */
export interface LocationDto {
  latitude: number;
  longitude: number;
}

/**
 * Address data for creating events (matches backend CreateEventAddressDto)
 * Backend: src/features/event-management/events/dto/create-event.dto.ts
 */
export interface CreateEventAddressDto {
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location?: LocationDto;
}

/**
 * Create event request DTO
 * Backend: src/features/event-management/events/dto/create-event.dto.ts
 */
export interface CreateEventDto {
  name: string;
  description: string;
  eventImage?: string;
  eventColor?: string;
  ownerEventUserId: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  status?: EventStatus;
  isPrivate?: boolean;
  addressId?: string;
  addressData?: CreateEventAddressDto;
  cateringOrderId?: string;
  categoryIds?: string[];
  eventUrl?: string;
  tickets?: CreateEventTicketDto[];
}

/**
 * Update event request DTO
 */
export interface UpdateEventDto {
  name?: string;
  description?: string;
  eventImage?: string;
  eventColor?: string;
  startDateTime?: Date | string;
  endDateTime?: Date | string;
  status?: EventStatus;
  isPrivate?: boolean;
  addressId?: string;
  cateringOrderId?: string;
  categoryIds?: string[];
  eventUrl?: string;
}

/**
 * Event query/filter parameters
 */
export interface EventQueryDto {
  search?: string;
  status?: EventStatus;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  isPrivate?: boolean;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Event list response
 */
export interface EventListResponse {
  events: EventResponseDto[];
  total: number;
  skip: number;
  take: number;
}

/**
 * Create event response
 */
export interface CreateEventResponse {
  success: boolean;
  message: string;
  event: EventResponseDto;
}

/**
 * Update event response
 */
export interface UpdateEventResponse {
  success: boolean;
  message: string;
  event: EventResponseDto;
}

/**
 * Event statistics
 */
export interface EventStats {
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  revenue: number;
  attendees: number;
}

/**
 * Question types for event registration forms
 * Backend: src/features/event-management/tickets/dto/create-ticket.dto.ts
 */
export enum QuestionType {
  SHORT_TEXT = 'shortText',
  LONG_TEXT = 'longText',
  SINGLE_SELECT = 'singleSelect',
  MULTI_SELECT = 'multiSelect',
}

/**
 * Question block for event tickets (matches backend QuestionBlockDto)
 * Backend: src/features/event-management/tickets/dto/create-ticket.dto.ts
 */
export interface QuestionBlockDto {
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

/**
 * Create event ticket DTO (matches backend CreateTicketDto)
 * Backend: src/features/event-management/tickets/dto/create-ticket.dto.ts
 */
export interface CreateEventTicketDto {
  name: string;
  description?: string;
  price?: number;
  isPaid: boolean;
  isSingleUse?: boolean;
  quantityTotal: number;
  questionForm?: QuestionBlockDto[];
  isPrivate?: boolean;
  autoApprovalGuestEmails?: string[];
  salesStartDate?: string;
  salesEndDate?: string;
}
