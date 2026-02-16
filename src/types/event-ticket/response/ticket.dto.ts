/**
 * Event Ticket response DTO
 * Backend source: src/features/event-management/tickets/dto/response.dto.ts
 */

export interface QuestionBlock {
  question: string;
  type: 'shortText' | 'longText' | 'multiSelect' | 'singleSelect';
  options?: string[];
  required: boolean;
}

export interface EventTicketResponseDto {
  id: string;
  eventId?: string;
  name: string;
  description: string | null;
  price: string;
  isSingleUse?: boolean;
  // Quantity fields are optional - only included for event organizers/admin collaborators
  quantityTotal?: number;
  quantitySold?: number;
  quantityLeft?: number;
  questionForm: QuestionBlock[] | null;
  isPrivate: boolean;
  autoApprovalGuestEmailsCount?: number;
  salesStartDate: string | null;
  salesEndDate: string | null;
  isAvailable: boolean;
  // Status fields - always included for public display
  isSoldOut: boolean;
  isNearlySoldOut: boolean;
  /** Maximum group size for group ticket purchases */
  maxGroupSize?: number;
  /** External URL for tickets sold outside the platform */
  externalTicketUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
