/**
 * Form field types for event registration
 */

export type FormFieldType = "short-text" | "long-text" | "single-select" | "multi-select";

export interface FormField {
  id: string;
  question: string;
  type: FormFieldType;
  options?: string[];
  required: boolean;
}
