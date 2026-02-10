/**
 * Catering Order Types
 * Mirrors backend DTOs for catering orders
 */

export interface MenuItemAddon {
  addonId?: string;
  name: string;
  quantity: number;
  groupTitle?: string;
}

export interface MinimalMenuItem {
  menuItemId: string;
  quantity: number;
  selectedAddons?: MenuItemAddon[];
  groupTitle?: string;
  menuItemName:string;
}

export interface MinimalRestaurantOrder {
  restaurantId: string;
  menuItems: MinimalMenuItem[];
  specialInstructions?: string;
  restaurantName:string;
}

// Bundle Selection Types
export interface BundleSelection {
  bundleId: string;
  quantity: number;
}

export interface BundleSelectionDetails {
  bundleId: string;
  bundleName: string;
  quantity: number;
  pricePerPerson: number;
  baseGuestCount: number;
  guestsServed: number;
  bundleTotal: number;
}

export interface MealSession {
  sessionName?: string;
  sessionDate: string;
  eventTime: string;
  collectionTime?: string;
  guestCount?: number;
  specialRequirements?: string;
  orderItems: MinimalRestaurantOrder[];
  bundleSelections?: BundleSelection[];
}

export interface CreateCateringOrderDto {
  userId: string;
  customerName: string;
  customerEmail: string;
  ccEmails?: string[];
  customerPhone: string;
  organization?: string;

  // Optional top-level fields for single meal orders
  eventDate?: string;
  eventTime?: string;
  collectionTime?: string;
  eventId?: string;
  guestCount?: number;
  eventType?: string;
  organizationId?: string;
  corporateUserId?: string;
  useOrganizationWallet?: boolean;

  deliveryAddress: string;
  specialRequirements?: string;

  // Single meal order items (optional if mealSessions provided)
  orderItems?: MinimalRestaurantOrder[];

  // Multi-meal sessions
  mealSessions?: MealSession[];

  // Pricing & payment
  estimatedTotal?: number;
  promoCodes?: string[];
  paymentMethodId?: string;
  paymentMethod?: 'wallet' | 'stripe_direct';
  paymentIntentId?: string;
  restaurantPayoutDetails?: {
    [restaurantId: string]: {
      selectedAccountId: string;
      accountName: string;
      stripeAccountId: string;
      earningsAmount: number;
      selectedAt: string;
    };
  };
}

/**
 * Catering Order Response Type
 * Represents a catering order fetched from the backend
 */
export interface CateringOrder {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  ccEmails?: string[];
  customerPhone: string;
  organization?: string;

  eventDate?: string;
  eventTime?: string;
  collectionTime?: string;
  eventId?: string;
  guestCount?: number;
  eventType?: string;
  organizationId?: string;
  corporateUserId?: string;

  deliveryAddress: string;
  specialRequirements?: string;

  // Pickup contact information
  pickupContactName?: string;
  pickupContactPhone?: string;
  pickupContactEmail?: string;

  /**
   * @deprecated Use mealSessions[].orderItems instead.
   * This field is no longer written to by the backend.
   * See: backend/docs/plans/2026-02-10-deprecate-order-orderItems.md
   */
  orderItems?: MinimalRestaurantOrder[];
  mealSessions?: MealSession[];

  estimatedTotal?: number;
  finalTotal?: number;
  promoCodes?: string[];

  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';

  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for updating pickup contact information
 */
export interface UpdatePickupContactDto {
  orderId: string;
  pickupContactName: string;
  pickupContactPhone: string;
  userId?: string;
  accessToken?: string;
}

/**
 * Catering Pricing Types
 */
export interface CateringMenuItemRequest {
  menuItemId: string;
  quantity: number;
  selectedAddons?: { name: string; quantity: number; groupTitle?: string }[];
  groupTitle?: string;
}

export interface CateringRestaurantOrderRequest {
  restaurantId: string;
  menuItems: CateringMenuItemRequest[];
  specialInstructions?: string;
}

export interface MealSessionRequest {
  sessionName: string;
  sessionDate: string;
  eventTime: string;
  guestCount?: number;
  specialRequirements?: string;
  orderItems: CateringRestaurantOrderRequest[];
  bundleSelections?: BundleSelection[];
}

export interface CateringPricingRequest {
  mealSessions: MealSessionRequest[];
  promoCodes?: string[];
  deliveryLocation?: { latitude: number; longitude: number };
}

export interface DeliveryFeeBreakdown {
  baseFee: number;
  portionFee: number;
  drinksFee: number;
  subtotal: number;
  distanceMultiplier: number;
  finalDeliveryFee: number;
  requiresCustomQuote: boolean;
}

export interface CateringPricingResult {
  isValid: boolean;
  subtotal: number;
  deliveryFee: number;
  restaurantPromotionDiscount?: number;
  totalDiscount?: number;
  promoDiscount?: number;
  total: number;
  error?: string;
  distanceInMiles?: number;
  deliveryFeeBreakdown?: DeliveryFeeBreakdown;
}
