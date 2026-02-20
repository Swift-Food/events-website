/**
 * Event status enum
 * Backend source: src/features/event-management/events/entities/event.entity.ts
 */

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Event format enum
 * Backend source: src/shared/entities/events/event.entity.ts
 */
export enum EventFormat {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  BOTH = 'both',
}

/**
 * Helper functions for event format checks
 * These handle both enum and string comparisons since API returns strings
 */
export const isVirtualEvent = (format: EventFormat | string | null | undefined): boolean => {
  return format === EventFormat.VIRTUAL || format === 'virtual';
};

export const isHybridEvent = (format: EventFormat | string | null | undefined): boolean => {
  return format === EventFormat.BOTH || format === 'both';
};

export const isInPersonEvent = (format: EventFormat | string | null | undefined): boolean => {
  return format === EventFormat.IN_PERSON || format === 'in_person';
};

export const hasOnlineComponent = (format: EventFormat | string | null | undefined): boolean => {
  return isVirtualEvent(format) || isHybridEvent(format);
};
