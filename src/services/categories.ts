import apiClient from "@/lib/auth/apiClient";
import {
  EventCategoryResponseDto,
  EventCategoryWithSubcategoriesResponseDto,
  EventSubcategoryResponseDto,
} from "@/types/category";
import { EventListResponseDto } from "@/types/event";

export const categoriesApi = {
  /**
   * Fetch all event categories (flat list)
   */
  findAll: async (): Promise<EventCategoryResponseDto[]> => {
    const response = await apiClient.get<EventCategoryResponseDto[]>("/events/categories");
    return response.data;
  },

  /**
   * Fetch categories with their subcategories grouped
   */
  findAllWithSubcategories: async (): Promise<EventCategoryWithSubcategoriesResponseDto[]> => {
    const response = await apiClient.get<EventCategoryWithSubcategoriesResponseDto[]>(
      "/events/categories?grouped=true"
    );
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

  /**
   * Get all subcategories as a flat list (derived from grouped response)
   */
  findAllSubcategories: async (): Promise<EventSubcategoryResponseDto[]> => {
    const grouped = await categoriesApi.findAllWithSubcategories();
    return grouped.flatMap((category) =>
      category.subcategories.map((sub) => ({
        ...sub,
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          iconName: category.iconName,
        },
      }))
    );
  },

  /**
   * Get events by subcategory ID
   */
  findEventsBySubcategoryId: async (
    subcategoryId: string,
    queryParams?: {
      take?: number;
      skip?: number;
      startDate?: string;
      endDate?: string;
      today?: boolean;
      currentMonth?: boolean;
      includePast?: boolean;
      search?: string;
    }
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: { ...queryParams, subcategoryId },
    });
    return response.data;
  },

  /**
   * Get events by subcategory name
   */
  findEventsBySubcategoryName: async (
    subcategoryName: string,
    queryParams?: {
      take?: number;
      skip?: number;
      startDate?: string;
      endDate?: string;
      today?: boolean;
      currentMonth?: boolean;
      includePast?: boolean;
      search?: string;
    }
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: { ...queryParams, subcategory: subcategoryName },
    });
    return response.data;
  },
};
