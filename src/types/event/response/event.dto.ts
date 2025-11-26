/**
 * Event response DTOs
 * Backend source: src/features/event-management/events/dto/response.dto.ts
 */

import { EventStatus } from '../status';
import { EventOwnerResponseDto } from './owner.dto';
import { EventAddressResponseDto } from '../../address/response.dto';
import { EventCategoryResponseDto } from '../../category/response.dto';
import { EventTicketResponseDto } from '../../event-ticket/response/ticket.dto';

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
  eventUrl: string | null;
  viewCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner: EventOwnerResponseDto;
  address: EventAddressResponseDto;
  categories: EventCategoryResponseDto[];
  eventTickets?: EventTicketResponseDto[];
  ticketsSoldCount?: number;
  attendeesCount?: number;
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
