/**
 * Highlight response DTOs
 * Backend source: src/features/highlights/dto/response.dto.ts
 */

import { HighlightMediaItem } from '../request/highlight.dto';

// Highlight owner info
export interface HighlightOwner {
  id: string;
  organizationName: string;
  profilePicture?: string;
}

// Highlight response
export interface HighlightResponseDto {
  id: string;
  mediaItems: HighlightMediaItem[];
  mediaType: 'image' | 'video' | 'mixed';
  caption?: string;
  calendarId?: string;
  expiresAt: string; // ISO date
  createdAt: string; // ISO date
  owner?: HighlightOwner;
}

// List response
export interface HighlightListResponseDto {
  highlights: HighlightResponseDto[];
  total: number;
  skip: number;
  take: number;
}
