import apiClient from "@/lib/auth/apiClient";
import {
  EventQueryDto,
  EventListResponseDto,
  EventResponseDto,
} from "@/types/event";

export const eventsApi = {
  /**
   * Fetch paginated list of events with optional filters
   */
  findAll: async (
    queryParams?: EventQueryDto
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetch a single event by ID
   */
  findById: async (eventId: string): Promise<EventResponseDto> => {
    const response = await apiClient.get<EventResponseDto>(
      `/events/${eventId}`
    );
    return response.data;
  },

  /**
   * Fetch events by owner ID
   */
  findByOwnerId: async (
    ownerId: string,
    queryParams?: Omit<EventQueryDto, "ownerId">
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: {
        ...queryParams,
        ownerId,
      },
    });
    return response.data;
  },
};

