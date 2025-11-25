/**
 * Event Ticket response DTO
 * Backend source: src/features/event-management/tickets/dto/response.dto.ts
 */

export interface EventTicketResponseDto {
  id: string;
  name: string;
  price: number;
  quantity: number;
  quantitySold: number;
  status: string;
  startSale: string;
  endSale: string;
}
