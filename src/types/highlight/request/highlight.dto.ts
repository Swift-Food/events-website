/**
 * Highlight request DTOs
 * Backend source: src/features/highlights/dto/request.dto.ts
 */

// Media item in a highlight
export interface HighlightMediaItem {
  url: string;
  type: 'image' | 'video';
  duration?: number; // seconds, for videos
  thumbnailUrl?: string; // for videos
}

// Create highlight request
export interface CreateHighlightDto {
  mediaItems: HighlightMediaItem[];
  caption?: string; // max 500 chars
  calendarId?: string; // UUID to link to calendar
  expiresInHours?: number; // default 24
}

// Update highlight request
export interface UpdateHighlightDto {
  caption?: string;
  calendarId?: string;
}

// Query params for fetching highlights
export interface HighlightQueryDto {
  calendarId?: string; // filter by calendar
  skip?: number; // default 0
  take?: number; // default 20, max 50
}
