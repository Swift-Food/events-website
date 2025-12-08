// services/event-collaborator.service.ts
import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  CollaboratorResponseDto,
  InviteCollaboratorByEmailDto,
  GenerateInviteLinkDto,
  InviteCollaboratorResponseDto,
  GenerateInviteLinkResponseDto,
  AcceptInviteResponseDto,
  CollaboratorListResponseDto,
  UpdateCollaboratorRoleDto,
  CollaboratorActionResponseDto,
  InvitationPreviewDto,
} from "@/types/event-collaborator";

class EventCollaboratorService {
  private readonly baseUrl = "/events";

  /**
   * Invite a collaborator by email
   * POST /events/:eventId/collaborators/invite
   */
  async inviteByEmail(
    eventId: string,
    data: InviteCollaboratorByEmailDto
  ): Promise<InviteCollaboratorResponseDto> {
    console.log(`${this.baseUrl}/${eventId}/collaborators/invite`, JSON.stringify(data))
    const response: AxiosResponse<InviteCollaboratorResponseDto> =
      await apiClient.post(
        `${this.baseUrl}/${eventId}/collaborators/invite`,
        data
      );
    console.log("Jreturn", JSON.stringify(response.data))
    return response.data;
  }

  /**
   * Generate a shareable invite link
   * POST /events/:eventId/collaborators/invite-link
   */
  async generateInviteLink(
    eventId: string,
    data: GenerateInviteLinkDto
  ): Promise<GenerateInviteLinkResponseDto> {
    const response: AxiosResponse<GenerateInviteLinkResponseDto> =
      await apiClient.post(
        `${this.baseUrl}/${eventId}/collaborators/invite-link`,
        data
      );
    return response.data;
  }

  /**
   * Accept an invitation (public endpoint - can be called during registration or after login)
   * POST /events/collaborators/accept/:token
   */
  async acceptInvite(token: string): Promise<AcceptInviteResponseDto> {
    const response: AxiosResponse<AcceptInviteResponseDto> =
      await apiClient.post(`${this.baseUrl}/collaborators/accept/${token}`);
    return response.data;
  }

  /**
   * Get all collaborators for an event
   * GET /events/:eventId/collaborators
   */
  async getCollaborators(
    eventId: string
  ): Promise<CollaboratorListResponseDto> {
    const response: AxiosResponse<CollaboratorListResponseDto> =
      await apiClient.get(`${this.baseUrl}/${eventId}/collaborators`);
    return response.data;
  }

  /**
   * Remove a collaborator from an event
   * DELETE /events/:eventId/collaborators/:collaboratorId
   */
  async removeCollaborator(
    eventId: string,
    collaboratorId: string
  ): Promise<CollaboratorActionResponseDto> {
    const response: AxiosResponse<CollaboratorActionResponseDto> =
      await apiClient.delete(
        `${this.baseUrl}/${eventId}/collaborators/${collaboratorId}`
      );
    return response.data;
  }

  /**
   * Update a collaborator's role
   * PATCH /events/:eventId/collaborators/:collaboratorId/role
   */
  async updateCollaboratorRole(
    eventId: string,
    collaboratorId: string,
    data: UpdateCollaboratorRoleDto
  ): Promise<CollaboratorActionResponseDto> {
    const response: AxiosResponse<CollaboratorActionResponseDto> =
      await apiClient.patch(
        `${this.baseUrl}/${eventId}/collaborators/${collaboratorId}/role`,
        data
      );
    return response.data;
  }

  /**
   * Resend invitation email to a collaborator
   * POST /events/:eventId/collaborators/:collaboratorId/resend
   */
  async resendInvitation(
    eventId: string,
    collaboratorId: string
  ): Promise<CollaboratorActionResponseDto> {
    const response: AxiosResponse<CollaboratorActionResponseDto> =
      await apiClient.post(
        `${this.baseUrl}/${eventId}/collaborators/${collaboratorId}/resend`
      );
    return response.data;
  }

  /**
   * Preview invitation details (public endpoint for frontend to show invitation preview)
   * GET /events/collaborators/preview/:token
   */
  async previewInvitation(token: string): Promise<InvitationPreviewDto> {
    const response: AxiosResponse<InvitationPreviewDto> = await apiClient.get(
      `${this.baseUrl}/collaborators/preview/${token}`
    );
    return response.data;
  }
}

export const eventCollaboratorService = new EventCollaboratorService();
export default eventCollaboratorService;
