import { CalendarType, CalendarRole } from '../enums';

// Location DTO
export interface LocationDto {
  latitude: number;
  longitude: number;
}

// Address DTOs
export interface CreateCalendarAddressDto {
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location?: LocationDto;
}

export interface UpdateCalendarAddressDto {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  placeId?: string;
  flat?: string;
  city?: string;
  zipcode?: string;
  location?: LocationDto;
}

// Calendar CRUD DTOs
export interface CreateCalendarDto {
  name: string; // Required, 1-255 chars
  description?: string;
  calendarImage?: string; // URL, max 500 chars
  calendarColor?: string; // Hex color, default: '#6366f1'
  ownerEventUserId: string; // UUID - Required
  calendarUrl: string; // Required, 3-100 chars, unique slug
  calendarType?: CalendarType; // Default: 'personal'
  isPublic?: boolean; // Default: true
  addressId?: string; // UUID
  addressData?: CreateCalendarAddressDto;
  autoDeletePastEventsAfterDays?: number | null; // null = never, 0 = immediately, 7 = 7 days after
}

export interface UpdateCalendarDto {
  name?: string; // Max 255 chars
  description?: string;
  calendarImage?: string; // URL, max 500 chars
  calendarColor?: string; // Hex color
  calendarUrl?: string; // Max 100 chars
  calendarType?: CalendarType;
  isPublic?: boolean;
  addressId?: string; // UUID
  addressData?: UpdateCalendarAddressDto;
  autoDeletePastEventsAfterDays?: number | null; // null = never, 0 = immediately, 7 = 7 days after
}

export interface CalendarQueryDto {
  calendarType?: CalendarType;
  search?: string;
  ownerId?: string;
  isPublic?: boolean;
  skip?: number; // Default: 0
  take?: number; // Default: 20
}

// Query params for calendar events
export type CalendarEventsFilter = 'upcoming' | 'past' | 'all';

export interface CalendarEventsQueryDto {
  filter?: CalendarEventsFilter;
}

// Calendar Events DTOs
export interface AddEventToCalendarDto {
  eventId: string; // UUID - Required
  isPinnedOnCalendar?: boolean; // Default: false
}

export interface UpdateCalendarEventDto {
  isPinned: boolean;
}

// Collaborator DTOs
export interface InviteCalendarCollaboratorDto {
  eventUserId?: string; // UUID (use this OR email)
  email?: string; // Email (use this OR eventUserId)
  role: CalendarRole; // Required
}

export interface UpdateCalendarCollaboratorDto {
  role: CalendarRole; // Required
}

// Subscription DTOs
export interface UpdateSubscriptionPreferencesDto {
  emailNotifications?: boolean;
  newsletterEnabled?: boolean;
}
