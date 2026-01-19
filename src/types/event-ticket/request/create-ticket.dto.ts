/**
 * Event Ticket request/mutation DTOs
 * Backend source: src/features/event-management/tickets/dto/create-ticket.dto.ts
 */

export enum QuestionType {
  SHORT_TEXT = 'shortText',
  LONG_TEXT = 'longText',
  SINGLE_SELECT = 'singleSelect',
  MULTI_SELECT = 'multiSelect',
}

export interface QuestionBlockDto {
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export interface CreateEventTicketDto {
  id?: string;
  eventId?: string;
  name: string;
  description?: string;
  price?: number;
  isPaid: boolean;
  isSingleUse?: boolean;
  quantityTotal: number;
  questionForm?: QuestionBlockDto[];
  isPrivate?: boolean;
  autoApprovalGuestEmails?: string[];
  salesStartDate?: string;
  salesEndDate?: string;
  /** Maximum group size for group ticket purchases */
  maxGroupSize?: number;
}
