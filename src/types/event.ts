export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum EventCategoryType {
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  SEMINAR = 'SEMINAR',
  NETWORKING = 'NETWORKING',
  SOCIAL = 'SOCIAL',
  SPORTS = 'SPORTS',
  ARTS = 'ARTS',
  MUSIC = 'MUSIC',
  FOOD = 'FOOD',
  OTHER = 'OTHER',
}

export interface EventQueryDto {
  status?: EventStatus;
  category?: EventCategoryType;
  startDate?: string;
  endDate?: string;
  search?: string;
  ownerId?: string;
  skip?: number;
  take?: number;
}

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

// EventListResponseDto for frontend (website/types/event.types.ts)
export interface EventListResponseDto {
  events: EventResponseDto[];
  total: number;
  skip: number;
  take: number;
}

// EventResponseDto (simplified, adjust fields as needed)
export interface EventResponseDto {
  id: string;
  name: string;
  description: string;
  eventImage: string | null;
  eventColor: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  status: EventStatus;
  isPrivate: boolean;
  eventUrl: string | null;
  viewCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner: EventOwnerResponseDto;
  address: EventAddressResponseDto;
  categories: EventCategoryResponseDto[];
  eventTickets?: EventTicketResponseDto[];
  ticketsSoldCount?: number;
  attendeesCount?: number;
}

export interface EventOwnerResponseDto {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
}

export interface EventAddressResponseDto {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  flat?: string;
  city: string;
  zipcode: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface EventCategoryResponseDto {
  id: string;
  name: string;
  type: string;
  color?: string;
}

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