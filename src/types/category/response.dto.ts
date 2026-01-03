/**
 * Event Category response DTO
 * Backend source: src/features/event-management/categories/dto/response.dto.ts
 */

import { EventCategoryType } from './types';

export interface EventCategoryResponseDto {
  id: string;
  name: EventCategoryType;
  description?: string;
  image?: string | null;
  iconName?: string | null;
  eventCount?: number;
}
