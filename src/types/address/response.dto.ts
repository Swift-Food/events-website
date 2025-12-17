/**
 * Event Address response DTO
 * Backend source: src/features/core/address/dto/response.dto.ts
 */

export interface EventAddressResponseDto {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  flat: string | null;
  city: string;
  zipcode: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}
