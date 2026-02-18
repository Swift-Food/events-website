import apiClient from "@/lib/auth/apiClient";
import { AxiosResponse } from "axios";
import {
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
} from "@/types/notification";

class NotificationService {
  private readonly baseUrl = "/notifications";

  /**
   * Get paginated notifications
   */
  async getNotifications(
    params?: NotificationQueryParams
  ): Promise<NotificationListResponse> {
    const response: AxiosResponse<NotificationListResponse> =
      await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response: AxiosResponse<UnreadCountResponse> = await apiClient.get(
      `${this.baseUrl}/unread-count`
    );
    return response.data;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
    const response: AxiosResponse<MarkAsReadResponse> = await apiClient.post(
      `${this.baseUrl}/${notificationId}/read`
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const response: AxiosResponse<MarkAllAsReadResponse> = await apiClient.post(
      `${this.baseUrl}/read-all`
    );
    return response.data;
  }

  /**
   * Delete/dismiss a notification
   */
  async deleteNotification(
    notificationId: string
  ): Promise<DeleteNotificationResponse> {
    const response: AxiosResponse<DeleteNotificationResponse> =
      await apiClient.delete(`${this.baseUrl}/${notificationId}`);
    return response.data;
  }

  /**
   * Accept a follow request
   */
  async acceptFollowRequest(userId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post(`/event-users/follow-requests/user/${userId}/accept`);
    return response.data;
  }

  /**
   * Reject a follow request
   */
  async rejectFollowRequest(userId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/event-users/follow-requests/user/${userId}`);
    return response.data;
  }

  /**
   * Accept a collaborator invite
   */
  async acceptCollaboratorInvite(collaboratorId: string): Promise<void> {
    await apiClient.post(`/events/collaborators/${collaboratorId}/accept`);
  }

  /**
   * Reject a collaborator invite
   */
  async rejectCollaboratorInvite(collaboratorId: string): Promise<void> {
    await apiClient.delete(`/events/collaborators/${collaboratorId}/reject`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
