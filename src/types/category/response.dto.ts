/**
 * Event Category response DTO
 * Backend source: src/features/event-management/categories/dto/response.dto.ts
 */

export interface EventCategoryResponseDto {
  id: string;
  name: string;
  type: string;
  color?: string;
}
