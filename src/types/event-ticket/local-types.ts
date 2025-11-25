/**
 * Local frontend-only ticket types (not from backend)
 * Used for UI state management in event creation flow
 */

export interface TicketType {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  price: number;
  isSingleUse: boolean;
  quantity: number;
}
