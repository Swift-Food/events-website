/**
 * Catering Bundle Types
 * Mirrors backend DTOs for catering bundles
 */

export interface CateringBundleItem {
  id: string;
  cateringBundleId: string;
  restaurantId: string;
  restaurantName: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  selectedAddons?: Array<{
    addonId: string;
    name: string;
    quantity: number;
  }>;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CateringBundle {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pricePerPerson: number;
  baseGuestCount: number;
  isActive: boolean;
  items: CateringBundleItem[];
  createdAt: Date;
  updatedAt: Date;
}
