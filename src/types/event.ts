export interface TicketType {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  price: number;
  isSingleUse: boolean;
  quantity: number;
}

export type FormFieldType = "short-text" | "long-text" | "single-select" | "multi-select";

export interface FormField {
  id: string;
  question: string;
  type: FormFieldType;
  options?: string[]; // For single-select and multi-select types
  required: boolean;
}
