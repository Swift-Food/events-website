// services/search.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  UnifiedSearchQuery,
  UnifiedSearchResponse,
  UsersSearchResponse,
} from '@/types/search';

class SearchService {
  private readonly baseUrl = '/search';

  /**
   * Search events, calendars, and/or users
   * Default (no type): returns all three
   */
  async searchUnified(query: UnifiedSearchQuery): Promise<UnifiedSearchResponse> {
    const response: AxiosResponse<UnifiedSearchResponse> = await apiClient.get(
      `${this.baseUrl}/unified`,
      { params: query }
    );
    return response.data;
  }

  /**
   * Search all (events + calendars + users)
   */
  async searchAll(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, skip, take });
  }

  /**
   * Search events only
   */
  async searchEvents(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, type: 'events', skip, take });
  }

  /**
   * Search calendars only
   */
  async searchCalendars(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, type: 'calendars', skip, take });
  }

  /**
   * Search users only via unified endpoint
   */
  async searchUsersUnified(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, type: 'users', skip, take });
  }

  /**
   * Search events and calendars (no users)
   */
  async searchEventsAndCalendars(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, type: 'events,calendars', skip, take });
  }

  /**
   * Search users/people (legacy endpoint)
   */
  async searchUsers(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UsersSearchResponse> {
    const response: AxiosResponse<UsersSearchResponse> = await apiClient.get(
      `${this.baseUrl}/users`,
      { params: { q, skip, take } }
    );
    return response.data;
  }
}

export const searchService = new SearchService();
export default searchService;
