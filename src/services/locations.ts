import apiClient from "@/lib/auth/apiClient";
import {
  EventLocationResponseDto,
  LocationEventsResponseDto,
} from "@/types/location";

export const locationsApi = {
  findAll: async (): Promise<EventLocationResponseDto[]> => {
    const response = await apiClient.get<EventLocationResponseDto[]>(
      "/events/locations"
    );
    return response.data;
  },

  findById: async (id: string): Promise<EventLocationResponseDto> => {
    const response = await apiClient.get<EventLocationResponseDto>(
      `/events/locations/${id}`
    );
    return response.data;
  },

  findEvents: async (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<LocationEventsResponseDto> => {
    const response = await apiClient.get<LocationEventsResponseDto>(
      `/events/locations/${id}/events`,
      { params }
    );
    return response.data;
  },
};
