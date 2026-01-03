/**
 * Calendar response DTOs
 * Backend source: src/features/event-management/calendars/dto/response.dto.ts
 */

import { CalendarType, CalendarRole } from '../enums';
import { EventResponseDto } from '@/types/event';

// Address Entity (can be reused from events or defined here)
export interface Address {
  id: string;
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
}

// EventUser Entity (shared with events)
export interface EventUser {
  id: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  bio?: string;
  website?: string;
  user: {
    id: string;
    email: string;
    username?: string;
    profilePicture?: string;
  };
}

// Calendar Entity (Main Response)
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  calendarImage?: string;
  calendarColor: string;
  ownerEventUserId: string;
  calendarUrl: string;
  calendarType: CalendarType;
  isPublic: boolean;
  addressId?: string;
  subscriberCount: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date

  // Relations (populated when requested)
  owner?: EventUser;
  address?: Address;
  collaborators?: CalendarCollaborator[];
  subscriptions?: CalendarSubscription[];
}

// CalendarEvent Entity
export interface CalendarEvent {
  id: string;
  calendarId: string;
  eventId: string;
  isPinnedOnCalendar: boolean;
  addedAt: string; // ISO date

  // Relations
  calendar?: Calendar;
  event?: EventResponseDto;
}

// CalendarCollaborator Entity
export interface CalendarCollaborator {
  id: string;
  calendarId: string;
  eventUserId?: string;
  role: CalendarRole;
  inviteAccepted: boolean;
  inviteToken?: string;
  pendingEmail?: string;
  createdAt: string; // ISO date

  // Relations
  calendar?: Calendar;
  eventUser?: EventUser;
}

// CalendarSubscription Entity
export interface CalendarSubscription {
  id: string;
  calendarId: string;
  eventUserId: string;
  emailNotifications: boolean;
  newsletterEnabled: boolean;
  subscribedAt: string; // ISO date

  // Relations
  calendar?: Calendar;
  eventUser?: EventUser;
}

// API Response Formats
export interface ListCalendarsResponse {
  calendars: Calendar[];
  total: number;
  skip: number;
  take: number;
}

export interface AcceptInviteResponse {
  message: string; // "Invitation accepted successfully"
}

export interface IsSubscribedResponse {
  isSubscribed: boolean;
}
