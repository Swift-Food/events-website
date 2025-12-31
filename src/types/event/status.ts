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
