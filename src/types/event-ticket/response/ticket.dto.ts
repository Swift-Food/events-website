/**
 * Event Ticket response DTO
 * Backend source: src/features/event-management/tickets/dto/response.dto.ts
 */

export interface EventTicketResponseDto {
  id: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  quantityLeft: number;
  status: string;
  startSale: string;
  endSale: string;
}
