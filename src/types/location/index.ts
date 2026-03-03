import { EventResponseDto } from "@/types/event";

export interface EventLocationResponseDto {
  id: string;
  name: string;
  image: string | null;
  bannerImage: string | null;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  eventCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LocationEventsResponseDto {
  events: EventResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
