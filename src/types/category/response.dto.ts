/**
 * Event Category response DTOs
 * Backend source: src/features/event-management/events/dto/response.dto.ts
 */

/** Category with optional event count (flat response) */
export interface EventCategoryResponseDto {
  id: string;
  name: string;
  description: string;
  image: string;
  iconName: string;
  eventCount?: number;
}

/** Subcategory without parent category (used in grouped response) */
export interface EventSubcategorySimpleResponseDto {
  id: string;
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
}

/** Subcategory with optional parent category */
export interface EventSubcategoryResponseDto {
  id: string;
  name: string;
  description: string;
  iconName: string;
  categoryId: string;
  displayOrder: number;
  category?: EventCategoryResponseDto;
}

/** Category with its subcategories grouped */
export interface EventCategoryWithSubcategoriesResponseDto {
  id: string;
  name: string;
  description: string;
  image: string;
  iconName: string;
  subcategories: EventSubcategorySimpleResponseDto[];
}
