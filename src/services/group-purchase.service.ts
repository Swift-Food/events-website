// services/group-purchase.service.ts
import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  CreateGroupPurchaseSessionDto,
  CreateGroupPurchaseSessionResponseDto,
  GroupPurchaseSessionDetailsDto,
  MyGroupSessionsDto,
  GroupPurchaseActionResponseDto,
  InviteMoreMembersDto,
  RespondToInviteDto,
  CompleteGroupPurchaseDto,
  CompleteGroupPurchaseResponseDto,
} from "@/types/group-purchase";

class GroupPurchaseService {
  private readonly baseUrl = "/group-purchases";

  /**
   * Create a new group purchase session and send invites
   */
  async createSession(
    data: CreateGroupPurchaseSessionDto
  ): Promise<CreateGroupPurchaseSessionResponseDto> {
    const response: AxiosResponse<CreateGroupPurchaseSessionResponseDto> =
      await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Get session details (for leader or member)
   */
  async getSession(sessionId: string): Promise<GroupPurchaseSessionDetailsDto> {
    const response: AxiosResponse<GroupPurchaseSessionDetailsDto> =
      await apiClient.get(`${this.baseUrl}/${sessionId}`);
    return response.data;
  }

  /**
   * Get my active sessions (as leader or member)
   */
  async getMySessions(): Promise<MyGroupSessionsDto> {
    const response: AxiosResponse<MyGroupSessionsDto> = await apiClient.get(
      `${this.baseUrl}/my-sessions`
    );
    return response.data;
  }

  /**
   * Dissolve session (leader only)
   */
  async dissolveSession(sessionId: string): Promise<GroupPurchaseActionResponseDto> {
    const response: AxiosResponse<GroupPurchaseActionResponseDto> =
      await apiClient.delete(`${this.baseUrl}/${sessionId}`);
    return response.data;
  }

  /**
   * Kick member (leader only)
   */
  async kickMember(
    sessionId: string,
    eventUserId: string
  ): Promise<GroupPurchaseActionResponseDto> {
    const response: AxiosResponse<GroupPurchaseActionResponseDto> =
      await apiClient.delete(`${this.baseUrl}/${sessionId}/members/${eventUserId}`);
    return response.data;
  }

  /**
   * Invite more members (leader only)
   */
  async inviteMoreMembers(
    sessionId: string,
    data: InviteMoreMembersDto
  ): Promise<GroupPurchaseActionResponseDto> {
    const response: AxiosResponse<GroupPurchaseActionResponseDto> =
      await apiClient.post(`${this.baseUrl}/${sessionId}/invites`, data);
    return response.data;
  }

  /**
   * Respond to invite (invited member)
   */
  async respondToInvite(
    sessionId: string,
    data: RespondToInviteDto
  ): Promise<GroupPurchaseActionResponseDto> {
    const response: AxiosResponse<GroupPurchaseActionResponseDto> =
      await apiClient.post(`${this.baseUrl}/${sessionId}/respond`, data);
    return response.data;
  }

  /**
   * Complete purchase (leader only, when all accepted)
   */
  async completePurchase(
    sessionId: string,
    data?: CompleteGroupPurchaseDto
  ): Promise<CompleteGroupPurchaseResponseDto> {
    const response: AxiosResponse<CompleteGroupPurchaseResponseDto> =
      await apiClient.post(`${this.baseUrl}/${sessionId}/complete`, data || {});
    return response.data;
  }
}

export const groupPurchaseService = new GroupPurchaseService();
export default groupPurchaseService;
