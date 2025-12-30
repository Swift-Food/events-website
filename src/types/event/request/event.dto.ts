/**
 * Event request/mutation DTOs
 * Backend source: src/features/event-management/events/dto/create-event.dto.ts
 */

import { EventStatus } from '../status';
import { EventCategoryType } from '../../category/types';
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
  addressId?: string;
  addressData?: CreateEventAddressDto;
  cateringOrderId?: string;
  categoryIds?: string[];
  eventUrl?: string;
  tickets?: CreateEventTicketDto[];
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
  addressId?: string;
  addressData?: CreateEventAddressDto;
  cateringOrderId?: string;
  categoryIds?: string[];
  eventUrl?: string;
  tickets?: CreateEventTicketDto[];
}

export interface EventQueryDto {
  search?: string;
  status?: EventStatus;
  categoryId?: string;
  category?: EventCategoryType;
  startDate?: string;
  endDate?: string;
  today?: boolean;
  currentMonth?: boolean;
  isPrivate?: boolean;
  ownerId?: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
