import apiClient from "@/lib/auth/apiClient";
import { EventCategoryResponseDto } from "@/types/category";
import { EventListResponseDto } from "@/types/event";

export const categoriesApi = {
  /**
   * Fetch all event categories
   */
  findAll: async (): Promise<EventCategoryResponseDto[]> => {
    const response = await apiClient.get<EventCategoryResponseDto[]>("/events/categories");
    return response.data;
  },

  /**
   * Get events by category name
   */
  findEventsByCategory: async (
    categoryName: string,
    queryParams?: {
      take?: number;
      skip?: number;
      startDate?: string;
      endDate?: string;
      today?: boolean;
      currentMonth?: boolean;
      search?: string;
    }
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>(
      `/events/category/${categoryName}`,
      { params: queryParams }
    );
    return response.data;
  },
};
