// Unified Search types

import { EventResponseDto } from '../event';
import { FollowStatusType } from '../follower';

export type SearchType = 'events' | 'calendars' | 'users' | 'all';

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

// Individual search result with type discrimination
export interface SearchResult {
  type: 'event' | 'calendar' | 'user';
  event?: EventResponseDto;
  calendar?: CalendarSearchResult;
  user?: UserSearchResult;
}

// Unified search response
export interface UnifiedSearchResponse {
  results: SearchResult[];
  events?: { items: EventResponseDto[]; total: number };
  calendars?: { items: CalendarSearchResult[]; total: number };
  users?: { items: UserSearchResult[]; total: number };
  query: string;
}

// Dedicated users search response
export interface UsersSearchResponse {
  users: UserSearchResult[];
  total: number;
  skip: number;
  take: number;
  query: string;
}
