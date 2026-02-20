import apiClient from "@/lib/auth/apiClient";
import {
  Calendar,
  ListCalendarsResponse,
  CalendarQueryDto,
} from "@/types/calendar";

/**
 * Simple API object for basic calendar operations
 * Use this for simple read operations in client components
 */
export const calendarsApi = {
  /**
   * Get all calendars with optional filtering
   */
  findAll: async (queryParams?: CalendarQueryDto): Promise<ListCalendarsResponse> => {
    const response = await apiClient.get<ListCalendarsResponse>("/calendars", {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Get featured calendars
   */
  findFeatured: async (): Promise<Calendar[]> => {
    const response = await apiClient.get<Calendar[]>("/calendars/featured");
    return response.data;
  },

  /**
   * Get calendar by ID
   */
  findById: async (calendarId: string): Promise<Calendar> => {
    const response = await apiClient.get<Calendar>(`/calendars/${calendarId}`);
    return response.data;
  },

  /**
   * Get calendar by URL slug
   */
  findByUrl: async (calendarUrl: string): Promise<Calendar> => {
    const response = await apiClient.get<Calendar>(`/calendars/url/${calendarUrl}`);
    return response.data;
  },
};
