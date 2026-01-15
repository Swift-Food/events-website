// services/follow.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  IsFollowingResponse,
  FollowActionResponse,
  FollowRelationshipResponse,
  FollowersListResponse,
  FollowingListResponse,
} from '@/types/follower';

interface PaginationParams {
  skip?: number;
  take?: number;
}

class FollowService {
  private readonly baseUrl = '/event-users';

  /**
   * Check if current user is following a user
   */
  async isFollowing(userId: string): Promise<IsFollowingResponse> {
    const response: AxiosResponse<IsFollowingResponse> = await apiClient.get(
      `${this.baseUrl}/${userId}/is-following`
    );
    return response.data;
  }

  /**
   * Get bidirectional follow relationship with a user
   */
  async getFollowRelationship(userId: string): Promise<FollowRelationshipResponse> {
    const response: AxiosResponse<FollowRelationshipResponse> = await apiClient.get(
      `${this.baseUrl}/${userId}/follow-relationship`
    );
    return response.data;
  }

  /**
   * Follow a user
   * If target has autoAcceptFollowers: true → instant follow
   * If autoAcceptFollowers: false → creates pending request
   */
  async followUser(userId: string): Promise<FollowActionResponse> {
    const response: AxiosResponse<FollowActionResponse> = await apiClient.post(
      `${this.baseUrl}/${userId}/follow`
    );
    return response.data;
  }

  /**
   * Unfollow a user or cancel pending follow request
   */
  async unfollowUser(userId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${userId}/follow`);
  }

  /**
   * Get a user's followers
   */
  async getFollowers(userId: string, params?: PaginationParams): Promise<FollowersListResponse> {
    const response: AxiosResponse<FollowersListResponse> = await apiClient.get(
      `${this.baseUrl}/${userId}/followers`,
      { params: { skip: params?.skip ?? 0, take: params?.take ?? 20 } }
    );
    return response.data;
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, params?: PaginationParams): Promise<FollowingListResponse> {
    const response: AxiosResponse<FollowingListResponse> = await apiClient.get(
      `${this.baseUrl}/${userId}/following`,
      { params: { skip: params?.skip ?? 0, take: params?.take ?? 20 } }
    );
    return response.data;
  }
}

export const followService = new FollowService();
export default followService;
