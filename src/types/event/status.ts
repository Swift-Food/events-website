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
