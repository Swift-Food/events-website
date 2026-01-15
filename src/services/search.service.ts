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
   * Search events and/or calendars
   * Default (no type): returns both events and calendars
   */
  async searchUnified(query: UnifiedSearchQuery): Promise<UnifiedSearchResponse> {
    const response: AxiosResponse<UnifiedSearchResponse> = await apiClient.get(
      `${this.baseUrl}/unified`,
      { params: query }
    );
    return response.data;
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
   * Search events and calendars together
   */
  async searchEventsAndCalendars(
    q: string,
    skip: number = 0,
    take: number = 10
  ): Promise<UnifiedSearchResponse> {
    return this.searchUnified({ q, skip, take });
  }

  /**
   * Search users/people by username
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
