// services/event.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  EventStatus,
  EventResponseDto,
} from '@/types/event';

// Re-export for convenience
export { EventStatus };
export type { EventResponseDto };

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
  startDateTime?: Date | string;
  endDateTime?: Date | string;
  status?: EventStatus;
  isPrivate?: boolean;
  addressId?: string;
  cateringOrderId?: string;
  categoryIds?: string[];
  eventUrl?: string;
}

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

export interface EventListResponse {
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
  totalRevenue: number;
  attendeesCount: number;
  checkInsCount: number;
  pendingApprovals: number;
}

// Ticket types
export enum QuestionType {
  SHORT_TEXT = 'shortText',
  LONG_TEXT = 'longText',
  MULTI_SELECT = 'multiSelect',
  SINGLE_SELECT = 'singleSelect',
}

export interface QuestionBlockDto {
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

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

class EventService {
  private readonly baseUrl = '/events';

  async getAllEvents(query?: EventQueryDto): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      this.baseUrl,
      { params: query }
    );
    return response.data;
  }

  async getUpcomingEvents(take: number = 10): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      `${this.baseUrl}/upcoming`,
      { params: { take } }
    );
    return response.data;
  }

  async getTrendingEvents(take: number = 10): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      `${this.baseUrl}/trending`,
      { params: { take } }
    );
    return response.data;
  }

  async getMyEvents(query?: EventQueryDto): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      `${this.baseUrl}/my-events`,
      { params: query }
    );
    return response.data;
  }

  async getEventById(id: string): Promise<EventResponseDto> {
    const response: AxiosResponse<EventResponseDto> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  async getEventByUrl(eventUrl: string): Promise<EventResponseDto> {
    const response: AxiosResponse<EventResponseDto> = await apiClient.get(
      `${this.baseUrl}/url/${eventUrl}`
    );
    return response.data;
  }

  async getEventStats(id: string): Promise<EventStats> {
    const response: AxiosResponse<EventStats> = await apiClient.get(
      `${this.baseUrl}/${id}/stats`
    );
    return response.data;
  }

  async createEvent(data: CreateEventDto): Promise<CreateEventResponse> {
    const response: AxiosResponse<CreateEventResponse> = await apiClient.post(
      this.baseUrl,
      data
    );
    return response.data;
  }

  async updateEvent(
    id: string,
    data: UpdateEventDto
  ): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  async publishEvent(id: string): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/publish`
    );
    return response.data;
  }

  async cancelEvent(id: string): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/cancel`
    );
    return response.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const eventService = new EventService();
export default eventService;