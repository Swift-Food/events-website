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

  getPopular: async (limit?: number): Promise<EventLocationResponseDto[]> => {
    const response = await apiClient.get<EventLocationResponseDto[]>(
      "/event-locations/popular",
      { params: limit !== undefined ? { limit } : undefined }
    );
    return response.data;
  },

  getNearbyLocations: async (
    lat: number,
    lng: number,
    limit?: number
  ): Promise<EventLocationResponseDto[]> => {
    const response = await apiClient.get<EventLocationResponseDto[]>(
      "/event-locations/nearby-locations",
      { params: { lat, lng, ...(limit !== undefined && { limit }) } }
    );
    return response.data;
  },

  getEventsNearby: async (
    lat: number,
    lng: number,
    params?: { page?: number; limit?: number }
  ): Promise<LocationEventsResponseDto> => {
    const response = await apiClient.get<LocationEventsResponseDto>(
      "/event-locations/nearby",
      { params: { lat, lng, ...params } }
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
