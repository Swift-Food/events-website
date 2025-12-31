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

export interface MealSession {
  sessionName?: string;
  sessionDate: string;
  eventTime: string;
  collectionTime?: string;
  guestCount?: number;
  specialRequirements?: string;
  orderItems: MinimalRestaurantOrder[];
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
