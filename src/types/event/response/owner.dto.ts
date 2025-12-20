/**
 * Event Owner response DTO
 * Backend source: src/features/user-management/event-user/dto/response.dto.ts
 */

import { User } from "@/types/user";

export interface EventOwnerResponseDto {
  id: string;
  userId: string;
  organizationName: string | null;
  user: User;
}
