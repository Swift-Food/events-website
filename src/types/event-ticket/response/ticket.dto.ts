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
  quantityTotal: number;
  quantitySold: number;
  quantityLeft: number;
  questionForm: QuestionBlock[] | null;
  isPrivate: boolean;
  autoApprovalGuestEmailsCount?: number;
  salesStartDate: string | null;
  salesEndDate: string | null;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}
