import apiClient from "@/lib/auth/apiClient";
import {
  EventQueryDto,
  EventListResponseDto,
  EventResponseDto,
} from "@/types/event";

export const eventsApi = {
  /**
   * Fetch paginated list of events with optional filters
   */
  findAll: async (
    queryParams?: EventQueryDto
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetch a single event by ID
   */
  findById: async (eventId: string): Promise<EventResponseDto> => {
    const response = await apiClient.get<EventResponseDto>(
      `/events/${eventId}`
    );
    return response.data;
  },

  /**
   * Fetch events by owner ID
   */
  findByOwnerId: async (
    ownerId: string,
    queryParams?: Omit<EventQueryDto, "ownerId">
  ): Promise<EventListResponseDto> => {
    const response = await apiClient.get<EventListResponseDto>("/events", {
      params: {
        ...queryParams,
        ownerId,
      },
    });
    return response.data;
  },
};

// Example usage:
/*
import { eventsApi } from '@/services/events';
import { EventStatus, EventCategoryType } from '@/types/event';

// Fetch all published food events with pagination
const fetchEvents = async () => {
  try {
    const result = await eventsApi.findAll({
      status: EventStatus.PUBLISHED,
      category: EventCategoryType.FOOD,
      search: 'party',
      skip: 0,
      take: 10,
    });

    console.log(`Found ${result.total} events`);
    console.log(`Showing ${result.events.length} events`);
    result.events.forEach(event => {
      console.log(`- ${event.name} by ${event.owner.username}`);
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
};

// Fetch events by date range
const fetchUpcomingEvents = async () => {
  try {
    const now = new Date().toISOString();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await eventsApi.findAll({
      status: EventStatus.PUBLISHED,
      startDate: now,
      endDate: nextMonth,
      skip: 0,
      take: 20,
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    throw error;
  }
};

// Fetch my events
const fetchMyEvents = async (userId: string) => {
  try {
    const result = await eventsApi.findByOwnerId(userId, {
      skip: 0,
      take: 10,
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch my events:', error);
    throw error;
  }
};
*/
