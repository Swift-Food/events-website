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
  RefundTicketRequestDto,
  RefundResult,
  RefundEligibilityResult,
  GenerateTicketInviteLinkDto,
  GenerateTicketInviteLinkResponseDto,
  AcceptTicketInviteResponseDto,
  TicketInvitationPreviewDto,
  InviteLinksListResponseDto,
  WaitlistPositionResponseDto,
  LeaveWaitlistResponseDto,
  WaitlistResponseDto,
  WaitlistCountResponseDto,
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
   * Check in a ticket using short 8-character code
   * Accepts codes with or without hyphen (e.g., "ABCD1234" or "ABCD-1234")
   */
  async checkInByCode(code: string): Promise<GuestTicketResponseDto> {
    const response: AxiosResponse<GuestTicketResponseDto> = await apiClient.post(
      `${this.baseUrl}/check-in/code`,
      { code }
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
    }> = await apiClient.get(`${this.baseUrl}/event/${eventId}/check-in-stats`);
    return response.data;
  }

  /**
   * Request a refund for a ticket
   * Can be requested by ticket owner or event organizer
   */
  async refundTicket(
    ticketId: string,
    data: RefundTicketRequestDto
  ): Promise<RefundResult> {
    const response: AxiosResponse<RefundResult> = await apiClient.post(
      `${this.baseUrl}/${ticketId}/refund`,
      data
    );
    return response.data;
  }

  /**
   * Check if a ticket is eligible for refund
   */
  async checkRefundEligibility(
    ticketId: string
  ): Promise<RefundEligibilityResult> {
    const response: AxiosResponse<RefundEligibilityResult> =
      await apiClient.get(`${this.baseUrl}/${ticketId}/refund-eligibility`);
    return response.data;
  }

  /**
   * Refund all paid tickets for an event
   * POST /guest-tickets/events/:eventId/refund-all
   */
  async refundAllEventTickets(eventId: string): Promise<{
    success: boolean;
    totalRefunded: number;
    totalAmount: number;
    failed: number;
  }> {
    const response = await apiClient.post(
      `${this.baseUrl}/events/${eventId}/refund-all`
    );
    return response.data;
  }

  /**
   * Get count of refundable paid tickets for an event
   * GET /guest-tickets/events/:eventId/refundable-count
   */
  async getRefundableTicketCount(eventId: string): Promise<{
    count: number;
    totalAmount: number;
  }> {
    const response = await apiClient.get(
      `${this.baseUrl}/events/${eventId}/refundable-count`
    );
    return response.data;
  }

  /**
   * Generate a shareable ticket invite link
   * POST /guest-tickets/events/:eventId/invite-link
   */
  async generateTicketInviteLink(
    eventId: string,
    data: GenerateTicketInviteLinkDto
  ): Promise<GenerateTicketInviteLinkResponseDto> {
    const response: AxiosResponse<GenerateTicketInviteLinkResponseDto> =
      await apiClient.post(`${this.baseUrl}/events/${eventId}/invite-link`, data);
    return response.data;
  }

  /**
   * Accept a ticket invitation (public endpoint - can be called during registration or after login)
   * POST /guest-tickets/accept/:token
   */
  async acceptTicketInvite(token: string): Promise<AcceptTicketInviteResponseDto> {
    const response: AxiosResponse<AcceptTicketInviteResponseDto> =
      await apiClient.post(`${this.baseUrl}/accept/${token}`);
    return response.data;
  }

  /**
   * Preview ticket invitation details (public endpoint for frontend to show invitation preview)
   * GET /guest-tickets/preview/:token
   */
  async previewTicketInvitation(token: string): Promise<TicketInvitationPreviewDto> {
    const response: AxiosResponse<TicketInvitationPreviewDto> =
      await apiClient.get(`${this.baseUrl}/preview/${token}`);
    return response.data;
  }

  /**
   * Get all invite links for an event
   * GET /guest-tickets/events/:eventId/invite-links
   */
  async getInviteLinksForEvent(eventId: string): Promise<InviteLinksListResponseDto> {
    const response: AxiosResponse<InviteLinksListResponseDto> =
      await apiClient.get(`${this.baseUrl}/events/${eventId}/invite-links`);
    return response.data;
  }

  /**
   * Revoke an invite link
   * DELETE /guest-tickets/invite-link/:id
   */
  async revokeInviteLink(id: string): Promise<TicketActionResponseDto> {
    const response: AxiosResponse<TicketActionResponseDto> =
      await apiClient.delete(`${this.baseUrl}/invite-link/${id}`);
    return response.data;
  }

  // ==================== WAITLIST METHODS ====================

  /**
   * Get waitlist position for a guest ticket
   * GET /guest-tickets/:id/waitlist-position
   */
  async getWaitlistPosition(ticketId: string): Promise<WaitlistPositionResponseDto> {
    const response: AxiosResponse<WaitlistPositionResponseDto> =
      await apiClient.get(`${this.baseUrl}/${ticketId}/waitlist-position`);
    return response.data;
  }

  /**
   * Leave the waitlist (cancel a waitlisted ticket)
   * DELETE /guest-tickets/:id/waitlist
   */
  async leaveWaitlist(ticketId: string): Promise<LeaveWaitlistResponseDto> {
    const response: AxiosResponse<LeaveWaitlistResponseDto> =
      await apiClient.delete(`${this.baseUrl}/${ticketId}/waitlist`);
    return response.data;
  }

  /**
   * Get full waitlist for an event ticket (admin only)
   * GET /guest-tickets/event-ticket/:eventTicketId/waitlist
   */
  async getEventTicketWaitlist(eventTicketId: string): Promise<WaitlistResponseDto> {
    const response: AxiosResponse<WaitlistResponseDto> =
      await apiClient.get(`${this.baseUrl}/event-ticket/${eventTicketId}/waitlist`);
    return response.data;
  }

  /**
   * Get waitlist count for an event ticket (public)
   * GET /guest-tickets/event-ticket/:eventTicketId/waitlist-count
   */
  async getWaitlistCount(eventTicketId: string): Promise<WaitlistCountResponseDto> {
    const response: AxiosResponse<WaitlistCountResponseDto> =
      await apiClient.get(`${this.baseUrl}/event-ticket/${eventTicketId}/waitlist-count`);
    return response.data;
  }

  // ==================== APPLE WALLET METHODS ====================

  /**
   * Check if Apple Wallet is available for a ticket
   * GET /guest-tickets/:id/wallet/available
   */
  async checkWalletAvailable(ticketId: string): Promise<{
    available: boolean;
    ticketStatus: string;
    canAddToWallet: boolean;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${ticketId}/wallet/available`);
    return response.data;
  }

  /**
   * Get a short-lived download token for Apple Wallet pass
   * GET /guest-tickets/:id/wallet/token
   * Returns a download URL with a signed token (valid for 60 seconds)
   */
  async getWalletDownloadToken(ticketId: string): Promise<{ downloadUrl: string }> {
    const response = await apiClient.get(`${this.baseUrl}/${ticketId}/wallet/token`);
    return response.data;
  }

  /**
   * Download Apple Wallet pass for a ticket
   * GET /guest-tickets/:id/wallet
   * Returns the .pkpass file as a blob
   * @deprecated Use getWalletDownloadToken for iOS Safari compatibility
   */
  async downloadWalletPass(ticketId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/${ticketId}/wallet`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const guestTicketService = new GuestTicketService();
export default guestTicketService;
