/**
 * Event request/mutation DTOs
 * Backend source: src/features/event-management/events/dto/create-event.dto.ts
 */

import { EventStatus, EventFormat } from '../status';
import { LocationDto } from '../../address/location.dto';
import { CreateEventTicketDto } from '../../event-ticket/request/create-ticket.dto';

export interface CreateEventAddressDto {
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location?: LocationDto;
}

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
  requiresApproval?: boolean;
  format?: EventFormat;
  virtualMeetingUrl?: string;
  virtualCapacity?: number;
  addressId?: string;
  addressData?: CreateEventAddressDto;
  cateringOrderId?: string;
  subcategoryIds?: string[];
  eventUrl?: string;
  tickets?: CreateEventTicketDto[];
  acceptingNewTickets?: boolean;
  stopAcceptingOnStart?: boolean;
  hideFullAddress?: boolean;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  eventImage?: string;
  eventColor?: string;
  ownerEventUserId?: string;
  startDateTime?: Date | string;
  endDateTime?: Date | string;
  status?: EventStatus;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  format?: EventFormat;
  virtualMeetingUrl?: string;
  virtualCapacity?: number;
  addressId?: string;
  addressData?: CreateEventAddressDto;
  cateringOrderId?: string;
  subcategoryIds?: string[];
  eventUrl?: string;
  tickets?: CreateEventTicketDto[];
  acceptingNewTickets?: boolean;
  stopAcceptingOnStart?: boolean;
  hideFullAddress?: boolean;
}

export interface EventQueryDto {
  search?: string;
  status?: EventStatus;
  category?: string;
  subcategoryId?: string;
  startDate?: string;
  endDate?: string;
  today?: boolean;
  currentMonth?: boolean;
  includePast?: boolean;
  isPrivate?: boolean;
  ownerId?: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
