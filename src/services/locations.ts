import apiClient from "@/lib/auth/apiClient";
import {
  EventLocationResponseDto,
  EventContinentResponseDto,
  LocationEventsResponseDto,
} from "@/types/location";

export const locationsApi = {
  findAll: async (): Promise<EventLocationResponseDto[]> => {
    const response = await apiClient.get<EventLocationResponseDto[]>(
      "/event-locations"
    );
    return response.data;
  },

  findById: async (id: string): Promise<EventLocationResponseDto> => {
    const response = await apiClient.get<EventLocationResponseDto>(
      `/event-locations/${id}`
    );
    return response.data;
  },

  findEvents: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<LocationEventsResponseDto> => {
    const response = await apiClient.get<LocationEventsResponseDto>(
      `/event-locations/${id}/events`,
      { params }
    );
    return response.data;
  },
};

export const continentsApi = {
  findAll: async (): Promise<EventContinentResponseDto[]> => {
    const response = await apiClient.get<EventContinentResponseDto[]>(
      "/event-continents"
    );
    return response.data;
  },

  findById: async (id: string): Promise<EventContinentResponseDto> => {
    const response = await apiClient.get<EventContinentResponseDto>(
      `/event-continents/${id}`
    );
    return response.data;
  },
};
