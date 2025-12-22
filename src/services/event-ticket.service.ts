// services/event-ticket.service.ts
import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  EventTicketResponseDto,
  CreateEventTicketDto,
} from "@/types";

class EventTicketService {
  private readonly baseUrl = "/tickets";

  /**
   * Create a new event ticket type
   * POST /tickets/event/:eventId
   */
  async createTicket(eventId: string, data: Omit<CreateEventTicketDto, 'eventId'>): Promise<EventTicketResponseDto> {
    const response: AxiosResponse<EventTicketResponseDto> = await apiClient.post(
      `${this.baseUrl}/event/${eventId}`,
      data
    );
    return response.data;
  }

  /**
   * Get all ticket types for an event
   */
  async getEventTickets(eventId: string): Promise<EventTicketResponseDto[]> {
    const response: AxiosResponse<EventTicketResponseDto[]> = await apiClient.get(
      `${this.baseUrl}/event/${eventId}`
    );
    return response.data;
  }

  /**
   * Get a single ticket type by ID
   */
  async getTicketById(id: string): Promise<EventTicketResponseDto> {
    const response: AxiosResponse<EventTicketResponseDto> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Update a ticket type
   */
  async updateTicket(
    id: string,
    data: Partial<CreateEventTicketDto>
  ): Promise<EventTicketResponseDto> {
    const response: AxiosResponse<EventTicketResponseDto> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a ticket type (with validation for active guest tickets)
   */
  async deleteTicket(id: string): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> =
      await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const eventTicketService = new EventTicketService();
export default eventTicketService;
