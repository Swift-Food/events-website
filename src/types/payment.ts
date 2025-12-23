// types/payment.ts
/**
 * Payment-related types for Stripe Connect integration
 * Backend source: src/features/payment-features/payments
 */

// ==========================================
// STRIPE CONNECT TYPES
// ==========================================

/**
 * Stripe Connect account status
 * Returned from GET /event-users/stripe-connect/status
 */
export interface StripeConnectStatus {
  hasAccount: boolean;
  accountId: string | null;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountType: 'express' | 'standard' | 'custom' | null;
  dashboardUrl: string | null;
  // Verification requirements
  requiresVerification: boolean;
  verificationPending: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  pendingVerification: string[];
  currentDeadline: string | null; // ISO date string when verification is due
}

/**
 * Response when starting or refreshing Stripe Connect onboarding
 * Returned from POST /event-users/stripe-connect/onboard
 * Returned from GET /event-users/stripe-connect/refresh
 *
 * Note: onboardingUrl is optional - if account is fully configured with no
 * outstanding requirements, success=true but no URL is returned
 */
export interface StripeConnectOnboardingResponse {
  success: boolean;
  onboardingUrl?: string;
  message: string;
}

/**
 * Response when requesting Stripe dashboard link
 * Returned from GET /event-users/stripe-connect/dashboard
 */
export interface StripeConnectDashboardResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ==========================================
// TICKET PAYMENT TYPES
// ==========================================

/**
 * Ticket details included in payment responses
 */
export interface PaymentTicketDetails {
  ticketName: string;
  eventName: string;
  price: number;
}

/**
 * Response when creating a payment intent for a ticket
 * Returned from POST /payments/ticket/:ticketId
 */
export interface CreateTicketPaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  ticketDetails?: PaymentTicketDetails;
  error?: string;
}

// ==========================================
// ADMIN/DEBUG TYPES
// ==========================================

/**
 * Payment split breakdown (admin view)
 * Returned from GET /payments/test/verify-split/:paymentIntentId
 */
export interface PaymentSplitDetails {
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  applicationFeeAmount: number | null;
  transferDestination: string | null;
  metadata: Record<string, string>;
  platformFeePercent: string | null;
  organizerReceives: number;
}

/**
 * Platform fee configuration
 * Returned from GET /payments/test/fee-config
 */
export interface PlatformFeeConfig {
  platformFeePercent: number;
  description: string;
  stripeProcessingFee: string;
  example: {
    ticketPrice: number;
    platformFee: number;
    stripeFee: number;
    organizerReceives: number;
  };
}

// ==========================================
// COMPONENT PROPS TYPES
// ==========================================

/**
 * Props for PaymentModal component
 */
export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  ticketDetails: PaymentTicketDetails;
  amount: number;
  currency: string;
}

/**
 * Props for PaymentSuccessModal component
 */
export interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketDetails: Pick<PaymentTicketDetails, 'ticketName' | 'eventName'>;
}

/**
 * Props for StripeConnectCard component
 */
export interface StripeConnectCardProps {
  onStatusChange?: (status: StripeConnectStatus) => void;
}

/**
 * State for payment data in event registration flow
 */
export interface PaymentFlowState {
  clientSecret: string;
  amount: number;
  currency: string;
  ticketDetails: PaymentTicketDetails;
  guestTicketId: string;
}
