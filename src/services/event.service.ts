// services/event.service.ts
import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  EventResponseDto,
  EventListResponseDto,
  CreateEventResponse,
  UpdateEventResponse,
  EventStats,
} from '@/types';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
} from '@/types';

class EventService {
  private readonly baseUrl = '/events';

  async getAllEvents(query?: EventQueryDto): Promise<EventListResponseDto> {
    const response: AxiosResponse<EventListResponseDto> = await apiClient.get(
      this.baseUrl,
      { params: query }
    );
    return response.data;
  }

  async getUpcomingEvents(take: number = 10): Promise<EventListResponseDto> {
    const response: AxiosResponse<EventListResponseDto> = await apiClient.get(
      `${this.baseUrl}/upcoming`,
      { params: { take } }
    );
    return response.data;
  }

  async getTrendingEvents(take: number = 10): Promise<EventListResponseDto> {
    const response: AxiosResponse<EventListResponseDto> = await apiClient.get(
      `${this.baseUrl}/trending`,
      { params: { take } }
    );
    return response.data;
  }

  async getMyEvents(query?: EventQueryDto): Promise<EventListResponseDto> {
    const response: AxiosResponse<EventListResponseDto> = await apiClient.get(
      `${this.baseUrl}/my-events`,
      { params: query }
    );
    return response.data;
  }

  async getEventById(id: string): Promise<EventResponseDto> {
    const response: AxiosResponse<EventResponseDto> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  async getEventByUrl(eventUrl: string): Promise<EventResponseDto> {
    const response: AxiosResponse<EventResponseDto> = await apiClient.get(
      `${this.baseUrl}/url/${eventUrl}`
    );
    return response.data;
  }

  async getEventStats(id: string): Promise<EventStats> {
    const response: AxiosResponse<EventStats> = await apiClient.get(
      `${this.baseUrl}/${id}/stats`
    );
    return response.data;
  }

  async createEvent(data: CreateEventDto): Promise<CreateEventResponse> {
    const response: AxiosResponse<CreateEventResponse> = await apiClient.post(
      this.baseUrl,
      data
    );
    return response.data;
  }

  async updateEvent(
    id: string,
    data: UpdateEventDto
  ): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  async publishEvent(id: string): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/publish`
    );
    return response.data;
  }

  async cancelEvent(id: string): Promise<UpdateEventResponse> {
    const response: AxiosResponse<UpdateEventResponse> = await apiClient.patch(
      `${this.baseUrl}/${id}/cancel`
    );
    return response.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const eventService = new EventService();
export default eventService;