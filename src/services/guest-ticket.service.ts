// services/guest-ticket.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import { EventResponseDto } from '@/types/event';

export enum GuestTicketStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  WAITLISTED = 'waitlisted',
  CHECKED_IN = 'checked_in',
}

export interface GuestTicketEventUser {
  id: string;
  organizationName: string | null;
  user: {
    id: string;
    email: string;
    username: string;
    profilePicture: string;
  };
}

export interface GuestTicketInfo {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface GuestTicket {
  id: string;
  status: GuestTicketStatus;
  qrCode: string | null;
  formResponses: Record<string, any>[];
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  event: EventResponseDto;
  eventTicket: GuestTicketInfo;
  eventUser: GuestTicketEventUser;
}

export interface RegisterForTicketDto {
  eventTicketId: string;
  formResponses?: Record<string, any>[];
}

export interface RegisterTicketResponse {
  success: boolean;
  message: string;
  ticket: GuestTicket;
}

export interface MyTicketsResponse {
  success: boolean;
  tickets: GuestTicket[];
  total: number;
}

export interface EventAttendeesResponse {
  success: boolean;
  attendees: GuestTicket[];
  total: number;
}

export interface UpdateTicketStatusDto {
  status: GuestTicketStatus;
  reason?: string;
}

export interface TicketActionResponse {
  success: boolean;
  message: string;
  ticket: GuestTicket;
}

export interface BulkActionResponse {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
}

class GuestTicketService {
  private readonly baseUrl = '/guest-tickets';

  /**
   * Register for a ticket (join an event)
   */
  async registerForTicket(data: RegisterForTicketDto): Promise<RegisterTicketResponse> {
    const response: AxiosResponse<RegisterTicketResponse> = await apiClient.post(
      `${this.baseUrl}/register`,
      data
    );
    return response.data;
  }

  /**
   * Get all my tickets (events I've joined)
   */
  async getMyTickets(): Promise<MyTicketsResponse> {
    const response: AxiosResponse<MyTicketsResponse> = await apiClient.get(
      `${this.baseUrl}/my-tickets`
    );
    return response.data;
  }

  /**
   * Get my tickets for a specific event
   */
  async getMyEventTickets(eventId: string): Promise<MyTicketsResponse> {
    const response: AxiosResponse<MyTicketsResponse> = await apiClient.get(
      `${this.baseUrl}/my-tickets/event/${eventId}`
    );
    return response.data;
  }

  /**
   * Get a single guest ticket by ID
   */
  async getTicketById(id: string): Promise<GuestTicket> {
    const response: AxiosResponse<GuestTicket> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(id: string): Promise<TicketActionResponse> {
    const response: AxiosResponse<TicketActionResponse> = await apiClient.delete(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Get event attendees (for organizers)
   */
  async getEventAttendees(eventId: string): Promise<EventAttendeesResponse> {
    const response: AxiosResponse<EventAttendeesResponse> = await apiClient.get(
      `${this.baseUrl}/event/${eventId}/attendees`
    );
    return response.data;
  }

  /**
   * Get pending tickets for an event (for organizers)
   */
  async getPendingTickets(eventId: string): Promise<EventAttendeesResponse> {
    const response: AxiosResponse<EventAttendeesResponse> = await apiClient.get(
      `${this.baseUrl}/event/${eventId}/pending`
    );
    return response.data;
  }

  /**
   * Approve a ticket
   */
  async approveTicket(id: string, reason?: string): Promise<TicketActionResponse> {
    const response: AxiosResponse<TicketActionResponse> = await apiClient.post(
      `${this.baseUrl}/${id}/approve`,
      { reason }
    );
    return response.data;
  }

  /**
   * Reject a ticket
   */
  async rejectTicket(id: string, reason?: string): Promise<TicketActionResponse> {
    const response: AxiosResponse<TicketActionResponse> = await apiClient.post(
      `${this.baseUrl}/${id}/reject`,
      { reason }
    );
    return response.data;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    id: string,
    data: UpdateTicketStatusDto
  ): Promise<TicketActionResponse> {
    const response: AxiosResponse<TicketActionResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/status`,
      data
    );
    return response.data;
  }

  /**
   * Promote from waitlist
   */
  async promoteFromWaitlist(id: string): Promise<TicketActionResponse> {
    const response: AxiosResponse<TicketActionResponse> = await apiClient.post(
      `${this.baseUrl}/${id}/promote`
    );
    return response.data;
  }

  /**
   * Bulk approve tickets
   */
  async bulkApproveTickets(ticketIds: string[]): Promise<BulkActionResponse> {
    const response: AxiosResponse<BulkActionResponse> = await apiClient.post(
      `${this.baseUrl}/bulk/approve`,
      { ticketIds }
    );
    return response.data;
  }

  /**
   * Bulk reject tickets
   */
  async bulkRejectTickets(
    ticketIds: string[],
    reason?: string
  ): Promise<BulkActionResponse> {
    const response: AxiosResponse<BulkActionResponse> = await apiClient.post(
      `${this.baseUrl}/bulk/reject`,
      { ticketIds, reason }
    );
    return response.data;
  }
}

export const guestTicketService = new GuestTicketService();
export default guestTicketService;