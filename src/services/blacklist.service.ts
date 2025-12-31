// services/blacklist.service.ts
import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  BlacklistUserDto,
  BulkBlacklistDto,
  SubmitAppealDto,
  AppealResponseDto,
  BlacklistStatusDto,
  EventBlacklistListDto,
  BlacklistActionResultDto,
  BulkBlacklistResultDto,
  BlacklistEntryDto,
} from "@/types/blacklist";

class BlacklistService {
  private readonly baseUrl = "/blacklist";

  // ============ Admin Methods ============

  /**
   * Block a user from an event
   * POST /blacklist/events/:eventId/block
   */
  async blacklistUser(
    eventId: string,
    data: BlacklistUserDto
  ): Promise<BlacklistActionResultDto> {
    const response: AxiosResponse<BlacklistActionResultDto> =
      await apiClient.post(`${this.baseUrl}/events/${eventId}/block`, data);
    return response.data;
  }

  /**
   * Bulk block users from an event
   * POST /blacklist/events/:eventId/bulk-block
   */
  async bulkBlacklistUsers(
    eventId: string,
    data: BulkBlacklistDto
  ): Promise<BulkBlacklistResultDto> {
    const response: AxiosResponse<BulkBlacklistResultDto> =
      await apiClient.post(`${this.baseUrl}/events/${eventId}/bulk-block`, data);
    return response.data;
  }

  /**
   * Remove user from blacklist (unblock)
   * DELETE /blacklist/:id
   */
  async removeFromBlacklist(id: string): Promise<BlacklistActionResultDto> {
    const response: AxiosResponse<BlacklistActionResultDto> =
      await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Get all blacklisted users for an event
   * GET /blacklist/events/:eventId
   */
  async getEventBlacklist(eventId: string): Promise<EventBlacklistListDto> {
    const response: AxiosResponse<EventBlacklistListDto> =
      await apiClient.get(`${this.baseUrl}/events/${eventId}`);
    return response.data;
  }

  /**
   * Get pending appeals for an event
   * GET /blacklist/events/:eventId/appeals
   */
  async getPendingAppeals(eventId: string): Promise<BlacklistEntryDto[]> {
    const response: AxiosResponse<BlacklistEntryDto[]> =
      await apiClient.get(`${this.baseUrl}/events/${eventId}/appeals`);
    return response.data;
  }

  /**
   * Approve an appeal
   * POST /blacklist/:id/approve-appeal
   */
  async approveAppeal(
    id: string,
    data: AppealResponseDto
  ): Promise<BlacklistActionResultDto> {
    const response: AxiosResponse<BlacklistActionResultDto> =
      await apiClient.post(`${this.baseUrl}/${id}/approve-appeal`, data);
    return response.data;
  }

  /**
   * Deny an appeal (permanent ban)
   * POST /blacklist/:id/deny-appeal
   */
  async denyAppeal(
    id: string,
    data: AppealResponseDto
  ): Promise<BlacklistActionResultDto> {
    const response: AxiosResponse<BlacklistActionResultDto> =
      await apiClient.post(`${this.baseUrl}/${id}/deny-appeal`, data);
    return response.data;
  }

  // ============ User-Facing Methods ============

  /**
   * Check if current user is blacklisted for an event
   * GET /blacklist/events/:eventId/my-status
   */
  async getMyBlacklistStatus(eventId: string): Promise<BlacklistStatusDto> {
    const response: AxiosResponse<BlacklistStatusDto> =
      await apiClient.get(`${this.baseUrl}/events/${eventId}/my-status`);
    return response.data;
  }

  /**
   * Submit an appeal
   * POST /blacklist/:id/appeal
   */
  async submitAppeal(
    id: string,
    data: SubmitAppealDto
  ): Promise<BlacklistActionResultDto> {
    const response: AxiosResponse<BlacklistActionResultDto> =
      await apiClient.post(`${this.baseUrl}/${id}/appeal`, data);
    return response.data;
  }
}

export const blacklistService = new BlacklistService();
export default blacklistService;
