// services/guest-ticket.service.ts
import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  GuestTicketResponseDto,
  RegisterForTicketDto,
  RegisterTicketResponseDto,
  MyTicketsResponseDto,
  PendingTicketsResponseDto,
  UpdateTicketStatusDto,
  TicketActionResponseDto,
  BulkActionResponseDto,
} from "@/types/guest-ticket";

class GuestTicketService {
  private readonly baseUrl = "/guest-tickets";

  /**
   * Register for a ticket (join an event)
   */
  async registerForTicket(
    data: RegisterForTicketDto
  ): Promise<RegisterTicketResponseDto> {
    const response: AxiosResponse<RegisterTicketResponseDto> =
      await apiClient.post(`${this.baseUrl}/register`, data);
    return response.data;
  }

  /**
   * Get all my tickets (events I've joined)
   */
  async getMyTickets(): Promise<MyTicketsResponseDto> {
    const response: AxiosResponse<MyTicketsResponseDto> = await apiClient.get(
      `${this.baseUrl}/my-tickets`
    );
    return response.data;
  }

  /**
   * Get my tickets for a specific event
   */
  async getMyEventTickets(eventId: string): Promise<GuestTicketResponseDto[]> {
    const response: AxiosResponse<GuestTicketResponseDto[]> =
      await apiClient.get(`${this.baseUrl}/my-tickets/event/${eventId}`);
    return response.data;
  }

  /**
   * Get a single guest ticket by ID
   */
  async getTicketById(id: string): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(id: string): Promise<TicketActionResponseDto> {
    const response: AxiosResponse<TicketActionResponseDto> =
      await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Get event attendees (for organizers)
   */
  async getEventAttendees(eventId: string): Promise<GuestTicketResponseDto[]> {
    const response: AxiosResponse<GuestTicketResponseDto[]> =
      await apiClient.get(`${this.baseUrl}/event/${eventId}/attendees`);
    return response.data;
  }

  /**
   * Get pending tickets for an event (for organizers)
   */
  async getPendingTickets(eventId: string): Promise<PendingTicketsResponseDto> {
    const response: AxiosResponse<PendingTicketsResponseDto> =
      await apiClient.get(`${this.baseUrl}/event/${eventId}/pending`);
    return response.data;
  }

  /**
   * Approve a ticket
   */
  async approveTicket(
    id: string,
    reason?: string
  ): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> =
      await apiClient.post(`${this.baseUrl}/${id}/approve`, { reason });
    return response.data;
  }

  /**
   * Reject a ticket
   */
  async rejectTicket(
    id: string,
    reason?: string
  ): Promise<TicketActionResponseDto> {
    const response: AxiosResponse<TicketActionResponseDto> =
      await apiClient.post(`${this.baseUrl}/${id}/reject`, { reason });
    return response.data;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    id: string,
    data: UpdateTicketStatusDto
  ): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> =
      await apiClient.patch(`${this.baseUrl}/${id}/status`, data);
    return response.data;
  }

  /**
   * Promote from waitlist
   */
  async promoteFromWaitlist(id: string): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> =
      await apiClient.post(`${this.baseUrl}/${id}/promote`);
    return response.data;
  }

  /**
   * Bulk approve tickets
   */
  async bulkApproveTickets(
    ticketIds: string[]
  ): Promise<BulkActionResponseDto> {
    const response: AxiosResponse<BulkActionResponseDto> = await apiClient.post(
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
  ): Promise<BulkActionResponseDto> {
    const response: AxiosResponse<BulkActionResponseDto> = await apiClient.post(
      `${this.baseUrl}/bulk/reject`,
      { ticketIds, reason }
    );
    return response.data;
  }

  /**
   * Check in a ticket using QR code
   */
  async checkInTicket(qrCode: string): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> = await apiClient.post(
      `${this.baseUrl}/check-in`,
      { qrCode }
    );
    return response.data;
  }

  /**
   * Bulk check in tickets by QR codes
   */
  async bulkCheckInTickets(qrCodes: string[]): Promise<BulkActionResponseDto> {
    const response: AxiosResponse<BulkActionResponseDto> = await apiClient.post(
      `${this.baseUrl}/bulk/check-in`,
      { qrCodes }
    );
    return response.data;
  }

  /**
   * Get check-in statistics for an event
   */
  async getCheckInStats(eventId: string): Promise<{
    totalTickets: number;
    checkedIn: number;
    pending: number;
    percentageCheckedIn: number;
  }> {
    const response: AxiosResponse<{
      totalTickets: number;
      checkedIn: number;
      pending: number;
      percentageCheckedIn: number;
    }> = await apiClient.get(`${this.baseUrl}/event:${eventId}/check-in-stats`);
    return response.data;
  }
}

export const guestTicketService = new GuestTicketService();
export default guestTicketService;
