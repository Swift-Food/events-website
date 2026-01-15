// Unified Search types

import { EventResponseDto } from '../event';
import { FollowStatusType } from '../follower';

export type SearchType = 'events' | 'calendars' | 'users';

// User search result
export interface UserSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  profilePicture: string | null;
  username: string;
  followerCount: number;
  followStatus?: FollowStatusType;
}

// Calendar search result
export interface CalendarSearchResult {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPrivate: boolean;
  ownerUsername: string;
}

// Unified search query params
export interface UnifiedSearchQuery {
  q: string;
  type?: string; // Comma-separated: "events", "calendars", "users" - default: all three
  skip?: number;
  take?: number;
}

// Unified search response (events, calendars, and/or users)
export interface UnifiedSearchResponse {
  events?: { items: EventResponseDto[]; total: number };
  calendars?: { items: CalendarSearchResult[]; total: number };
  users?: { items: UserSearchResult[]; total: number };
  query: string;
  skip: number;
  take: number;
}

// Users search response (separate endpoint)
export interface UsersSearchResponse {
  users: UserSearchResult[];
  total: number;
  skip: number;
  take: number;
  query: string;
}
