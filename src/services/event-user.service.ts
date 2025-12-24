// services/event-user.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';

export interface EventUserStats {
  eventsCreated: number;
  eventsAttended: number;
  upcomingEvents: number;
  totalTicketsSold?: number;
}

export interface EventUserProfile {
  id: string;
  userId: string;
  organizationName: string | null;
  eventsCreated: number;
  eventsAttended: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    username: string;
    profilePicture: string;
    firstName: string | null;
    lastName: string | null;
  };
  stats?: EventUserStats;
}

export interface UpdateEventUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  organizationName?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
}

export interface EventUserResponse {
  success: boolean;
  message: string;
  eventUser: EventUserProfile;
}

class EventUserService {
  private readonly baseUrl = '/event-users';

  /**
   * Get current user's EventUser profile
   */
  async getMyProfile(): Promise<EventUserProfile> {
    const response: AxiosResponse<EventUserProfile> = await apiClient.get(
      `${this.baseUrl}/me`
    );
    return response.data;
  }

  /**
   * Get current user's full profile with stats
   */
  async getMyFullProfile(): Promise<EventUserProfile> {
    const response: AxiosResponse<EventUserProfile> = await apiClient.get(
      `${this.baseUrl}/me/profile`
    );
    return response.data;
  }

  /**
   * Get current user's stats
   */
  async getMyStats(): Promise<EventUserStats> {
    const response: AxiosResponse<EventUserStats> = await apiClient.get(
      `${this.baseUrl}/me/stats`
    );
    return response.data;
  }

  /**
   * Update current user's EventUser profile
   */
  async updateMyProfile(data: UpdateEventUserDto): Promise<EventUserResponse> {
    const response: AxiosResponse<EventUserResponse> = await apiClient.put(
      `${this.baseUrl}/me`,
      data
    );
    return response.data;
  }

  /**
   * Delete current user's EventUser profile
   */
  async deleteMyProfile(): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/me`);
  }

  /**
   * Get EventUser by userId (public)
   */
  async getByUserId(userId: string): Promise<EventUserProfile> {
    const response: AxiosResponse<EventUserProfile> = await apiClient.get(
      `${this.baseUrl}/user/${userId}`
    );
    return response.data;
  }

  /**
   * Get EventUser profile by userId (public)
   */
  async getUserProfile(userId: string): Promise<EventUserProfile> {
    const response: AxiosResponse<EventUserProfile> = await apiClient.get(
      `${this.baseUrl}/user/${userId}/profile`
    );
    return response.data;
  }

  /**
   * Get EventUser by id (public)
   */
  async getById(id: string): Promise<EventUserProfile> {
    const response: AxiosResponse<EventUserProfile> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }
}

export const eventUserService = new EventUserService();
export default eventUserService;