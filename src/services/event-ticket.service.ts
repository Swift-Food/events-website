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

  /**
   * Upload CSV file with approved invitee emails for a ticket
   * POST /tickets/:ticketId/approved-emails/upload
   * @param ticketId - The ticket ID to add approved emails to
   * @param file - CSV file containing emails
   * @param replace - If true, replaces all existing emails; if false, appends to existing list
   */
  async uploadApprovedEmailsCsv(
    ticketId: string,
    file: File,
    replace: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse<{ success: boolean; message: string }> =
      await apiClient.post(
        `${this.baseUrl}/${ticketId}/approved-emails/upload${replace ? "?replace=true" : ""}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    return response.data;
  }
}

export const eventTicketService = new EventTicketService();
export default eventTicketService;
