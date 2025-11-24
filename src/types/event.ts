export interface TicketType {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  price: number;
  isSingleUse: boolean;
}
