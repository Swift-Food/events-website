// services/event.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';

// Types based on your DTOs
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface LocationDto {
  latitude: number;
  longitude: number;
}

export interface CreateEventAddressDto {
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location: LocationDto;
}

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

export interface EventOwner {
  id: string;
  userId: string;
  organizationName: string | null;
  user?: {
    id: string;
    email: string;
    username: string;
    profilePicture: string;
  };
}

export interface EventAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  apartmentNumber?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface EventTicket {
  id: string;
  name: string;
  description: string;
  price: string;
  quantityTotal: number;
  quantitySold: number;
  quantityLeft: number;
  isPrivate: boolean;
  salesStartDate: Date | null;
  salesEndDate: Date | null;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  eventImage: string | null;
  eventColor: string;
  startDateTime: Date;
  endDateTime: Date;
  status: EventStatus;
  isPrivate: boolean;
  eventUrl: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  owner: EventOwner;
  address: EventAddress;
  categories: EventCategory[];
  eventTickets?: EventTicket[];
  ticketsSoldCount?: number;
  attendeesCount?: number;
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
  addressData?: CreateEventAddressDto
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
  events: Event[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateEventResponse {
  success: boolean;
  message: string;
  event: Event;
}

export interface UpdateEventResponse {
  success: boolean;
  message: string;
  event: Event;
}

class EventService {
  private readonly baseUrl = '/events';

  /**
   * Get all events with optional filters
   */
  async getAllEvents(query?: EventQueryDto): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      this.baseUrl,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(take: number = 10): Promise<EventListResponse> {
    const response: AxiosResponse<EventListResponse> = await apiClient.get(
      `${this.baseUrl}/upcoming`,
      { params: { take } }
    );
    return response.data;
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string): Promise<Event> {
    const response: AxiosResponse<Event> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Create a new event
   */
  async createEvent(data: CreateEventDto): Promise<CreateEventResponse> {
    const response: AxiosResponse<CreateEventResponse> = await apiClient.post(
      this.baseUrl,
      data
    );
    return response.data;
  }

  /**
   * Update an existing event
   */
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

  /**
   * Publish an event (change status from draft to published)
   */
  async publishEvent(id: string): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/publish`
    );
    return response.data;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

// Export a singleton instance
export const eventService = new EventService();
export default eventService;