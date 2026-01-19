// services/event-user.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import { MutualFollowsResponse } from '@/types/group-purchase';

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

  // Socials
  twitterHandle: string;
  linkedinUrl: string;
  instagramUrl: string;
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
  instagramUrl?: string;
  isProfilePublic?: boolean;
  autoAcceptFollowers?: boolean;
  showEventAttendance?: boolean;
  notifyFollowedUserEvents?: boolean;
  allowEmailNotifications?: boolean;
  allowTicketReminders?: boolean;
  allowEventUpdateEmails?: boolean;
  allowWaitlistEmails?: boolean;
  allowCollaboratorEmails?: boolean;
}

export interface EventUserResponse {
  success: boolean;
  message: string;
  eventUser: EventUserProfile;
}

export interface OrganizerEarnings {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  currency: string;
  payoutTriggered?: boolean;
  payoutMessage?: string;
}

export interface PayoutHistoryItem {
  id: string;
  amount: number;
  netAmount: number;
  status: string;
  requestedAt: string;
  notes?: string;
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

  /**
   * Get earnings and trigger auto-payout if available.
   * When organizer views this after event ends, payout is automatically processed.
   */
  async getEarnings(): Promise<OrganizerEarnings> {
    const response: AxiosResponse<OrganizerEarnings> = await apiClient.get(
      `${this.baseUrl}/me/balance`
    );
    return response.data;
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(): Promise<PayoutHistoryItem[]> {
    const response: AxiosResponse<PayoutHistoryItem[]> = await apiClient.get(
      `${this.baseUrl}/me/withdrawals`
    );
    return response.data;
  }

  /**
   * Get mutual follows (people who follow you and you follow back)
   * Used for group ticket invite search
   */
  async getMutualFollows(search?: string): Promise<MutualFollowsResponse> {
    const params = search ? { search } : {};
    const response: AxiosResponse<MutualFollowsResponse> = await apiClient.get(
      `${this.baseUrl}/me/mutual-follows`,
      { params }
    );
    return response.data;
  }
}

export const eventUserService = new EventUserService();
export default eventUserService;