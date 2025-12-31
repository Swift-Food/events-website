import apiClient from '@/lib/auth/apiClient';
import { AxiosResponse } from 'axios';
import {
  Calendar,
  CalendarEvent,
  CalendarCollaborator,
  CalendarSubscription,
  ListCalendarsResponse,
  AcceptInviteResponse,
  CreateCalendarDto,
  UpdateCalendarDto,
  CalendarQueryDto,
  AddEventToCalendarDto,
  InviteCalendarCollaboratorDto,
  UpdateCalendarCollaboratorDto,
  UpdateSubscriptionPreferencesDto,
} from '@/types/calendar';
import { EventResponseDto } from '@/types/event';

class CalendarService {
  private readonly baseUrl = '/calendars';

  // ==================== CRUD Operations ====================

  /**
   * Create a new calendar
   */
  async createCalendar(data: CreateCalendarDto): Promise<Calendar> {
    const response: AxiosResponse<Calendar> = await apiClient.post(
      this.baseUrl,
      data
    );
    return response.data;
  }

  /**
   * Get all calendars with optional filtering
   */
  async getAllCalendars(query?: CalendarQueryDto): Promise<ListCalendarsResponse> {
    const response: AxiosResponse<ListCalendarsResponse> = await apiClient.get(
      this.baseUrl,
      { params: query }
    );
    return response.data;
  }

  /**
   * Get calendars owned by current user
   */
  async getMyCalendars(): Promise<Calendar[]> {
    const response: AxiosResponse<Calendar[]> = await apiClient.get(
      `${this.baseUrl}/me`
    );
    return response.data;
  }

  /**
   * Get calendar by ID
   */
  async getCalendarById(id: string): Promise<Calendar> {
    const response: AxiosResponse<Calendar> = await apiClient.get(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  /**
   * Get calendar by URL slug
   */
  async getCalendarByUrl(calendarUrl: string): Promise<Calendar> {
    const response: AxiosResponse<Calendar> = await apiClient.get(
      `${this.baseUrl}/url/${calendarUrl}`
    );
    return response.data;
  }

  /**
   * Update calendar
   */
  async updateCalendar(id: string, data: UpdateCalendarDto): Promise<Calendar> {
    const response: AxiosResponse<Calendar> = await apiClient.put(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete calendar
   */
  async deleteCalendar(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // ==================== Calendar Events ====================

  /**
   * Add an event to a calendar
   */
  async addEventToCalendar(
    calendarId: string,
    data: AddEventToCalendarDto
  ): Promise<CalendarEvent> {
    const response: AxiosResponse<CalendarEvent> = await apiClient.post(
      `${this.baseUrl}/${calendarId}/events`,
      data
    );
    return response.data;
  }

  /**
   * Get all events in a calendar
   */
  async getCalendarEvents(calendarId: string): Promise<EventResponseDto[]> {
    const response: AxiosResponse<EventResponseDto[]> = await apiClient.get(
      `${this.baseUrl}/${calendarId}/events`
    );
    return response.data;
  }

  /**
   * Pin or unpin an event on a calendar
   */
  async pinEventOnCalendar(
    calendarId: string,
    eventId: string,
    isPinned: boolean
  ): Promise<CalendarEvent> {
    const response: AxiosResponse<CalendarEvent> = await apiClient.patch(
      `${this.baseUrl}/${calendarId}/events/${eventId}`,
      { isPinned }
    );
    return response.data;
  }

  /**
   * Remove an event from a calendar
   */
  async removeEventFromCalendar(calendarId: string, eventId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${calendarId}/events/${eventId}`);
  }

  // ==================== Collaborators ====================

  /**
   * Invite a collaborator to a calendar
   */
  async inviteCollaborator(
    calendarId: string,
    data: InviteCalendarCollaboratorDto
  ): Promise<CalendarCollaborator> {
    const response: AxiosResponse<CalendarCollaborator> = await apiClient.post(
      `${this.baseUrl}/${calendarId}/collaborators`,
      data
    );
    return response.data;
  }

  /**
   * Accept a collaborator invitation
   */
  async acceptCollaboratorInvite(token: string): Promise<AcceptInviteResponse> {
    const response: AxiosResponse<AcceptInviteResponse> = await apiClient.post(
      `${this.baseUrl}/collaborators/accept/${token}`
    );
    return response.data;
  }

  /**
   * Get all collaborators for a calendar
   */
  async getCollaborators(calendarId: string): Promise<CalendarCollaborator[]> {
    const response: AxiosResponse<CalendarCollaborator[]> = await apiClient.get(
      `${this.baseUrl}/${calendarId}/collaborators`
    );
    return response.data;
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    calendarId: string,
    userId: string,
    data: UpdateCalendarCollaboratorDto
  ): Promise<CalendarCollaborator> {
    const response: AxiosResponse<CalendarCollaborator> = await apiClient.put(
      `${this.baseUrl}/${calendarId}/collaborators/${userId}`,
      data
    );
    return response.data;
  }

  /**
   * Remove a collaborator from a calendar
   */
  async removeCollaborator(calendarId: string, userId: string): Promise<void> {
    await apiClient.delete(
      `${this.baseUrl}/${calendarId}/collaborators/${userId}`
    );
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to a calendar
   */
  async subscribe(calendarId: string): Promise<CalendarSubscription> {
    const response: AxiosResponse<CalendarSubscription> = await apiClient.post(
      `${this.baseUrl}/${calendarId}/subscribe`
    );
    return response.data;
  }

  /**
   * Unsubscribe from a calendar
   */
  async unsubscribe(calendarId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${calendarId}/subscribe`);
  }

  /**
   * Get all subscribers for a calendar (owner/admin only)
   */
  async getSubscribers(calendarId: string): Promise<CalendarSubscription[]> {
    const response: AxiosResponse<CalendarSubscription[]> = await apiClient.get(
      `${this.baseUrl}/${calendarId}/subscribers`
    );
    return response.data;
  }

  /**
   * Get calendars the current user is subscribed to
   */
  async getMySubscriptions(): Promise<Calendar[]> {
    const response: AxiosResponse<Calendar[]> = await apiClient.get(
      `${this.baseUrl}/subscriptions/me`
    );
    return response.data;
  }

  /**
   * Update subscription preferences
   */
  async updateSubscriptionPreferences(
    calendarId: string,
    prefs: UpdateSubscriptionPreferencesDto
  ): Promise<CalendarSubscription> {
    const response: AxiosResponse<CalendarSubscription> = await apiClient.patch(
      `${this.baseUrl}/${calendarId}/subscribe/preferences`,
      prefs
    );
    return response.data;
  }

  /**
   * Check if current user is subscribed to a calendar
   */
  async isSubscribed(calendarId: string): Promise<boolean> {
    const response: AxiosResponse<{ isSubscribed: boolean }> = await apiClient.get(
      `${this.baseUrl}/${calendarId}/is-subscribed`
    );
    return response.data.isSubscribed;
  }
}

export const calendarService = new CalendarService();
export default calendarService;
