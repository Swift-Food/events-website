import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';

interface EventCoverResponse {
  id: string;
  images: string[];
  category: string;
}

class EventCoverService {
  private readonly baseUrl = '/event-covers';
  private cache: Record<string, string[]> | null = null;

  async getAll(): Promise<Record<string, string[]>> {
    if (this.cache) return this.cache;

    const response: AxiosResponse<EventCoverResponse[]> = await apiClient.get(
      `${this.baseUrl}/all`
    );

    const result: Record<string, string[]> = {};
    for (const entry of response.data) {
      result[entry.category] = entry.images;
    }

    this.cache = result;
    return result;
  }
}

export const eventCoverService = new EventCoverService();
