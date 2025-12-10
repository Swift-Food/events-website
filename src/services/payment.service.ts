// services/payment.service.ts
/**
 * Payment Service
 * Handles Stripe Connect and ticket payment API calls
 */
import apiClient from '@/lib/auth/apiClient';
import type { AxiosResponse } from 'axios';
import type {
  StripeConnectStatus,
  StripeConnectOnboardingResponse,
  StripeConnectDashboardResponse,
  CreateTicketPaymentResponse,
  PaymentSplitDetails,
  PlatformFeeConfig,
} from '@/types/payment';

// API Route constants
const API_ROUTES = {
  STRIPE_CONNECT: {
    ONBOARD: '/event-users/stripe-connect/onboard',
    STATUS: '/event-users/stripe-connect/status',
    DASHBOARD: '/event-users/stripe-connect/dashboard',
    REFRESH: '/event-users/stripe-connect/refresh',
  },
  PAYMENTS: {
    TICKET: (ticketId: string) => `/payments/ticket/${ticketId}`,
    FEE_CONFIG: '/payments/test/fee-config',
    VERIFY_SPLIT: (paymentIntentId: string) => `/payments/test/verify-split/${paymentIntentId}`,
    ORGANIZER_STATUS: (eventUserId: string) => `/payments/test/organizer-status/${eventUserId}`,
  },
} as const;

class PaymentService {
  // ==========================================
  // STRIPE CONNECT ENDPOINTS
  // ==========================================

  /**
   * Start Stripe Connect onboarding for the current user
   * Opens Stripe-hosted onboarding flow
   */
  async startStripeConnectOnboarding(): Promise<StripeConnectOnboardingResponse> {
    const response: AxiosResponse<StripeConnectOnboardingResponse> = await apiClient.post(
      API_ROUTES.STRIPE_CONNECT.ONBOARD
    );
    return response.data;
  }

  /**
   * Get current user's Stripe Connect account status
   */
  async getStripeConnectStatus(): Promise<StripeConnectStatus> {
    const response: AxiosResponse<StripeConnectStatus> = await apiClient.get(
      API_ROUTES.STRIPE_CONNECT.STATUS
    );
    return response.data;
  }

  /**
   * Get link to Stripe Connect Express dashboard
   */
  async getStripeDashboardLink(): Promise<StripeConnectDashboardResponse> {
    const response: AxiosResponse<StripeConnectDashboardResponse> = await apiClient.get(
      API_ROUTES.STRIPE_CONNECT.DASHBOARD
    );
    return response.data;
  }

  /**
   * Refresh Stripe Connect onboarding link (if previous expired)
   */
  async refreshStripeConnectOnboarding(): Promise<StripeConnectOnboardingResponse> {
    const response: AxiosResponse<StripeConnectOnboardingResponse> = await apiClient.get(
      API_ROUTES.STRIPE_CONNECT.REFRESH
    );
    return response.data;
  }

  // ==========================================
  // TICKET PAYMENT ENDPOINTS
  // ==========================================

  /**
   * Create a payment intent for a guest ticket
   * @param guestTicketId - The ID of the guest ticket (not event ticket)
   * @returns clientSecret for Stripe.js Elements
   */
  async createTicketPaymentIntent(guestTicketId: string): Promise<CreateTicketPaymentResponse> {
    const response: AxiosResponse<CreateTicketPaymentResponse> = await apiClient.post(
      API_ROUTES.PAYMENTS.TICKET(guestTicketId)
    );
    return response.data;
  }

  // ==========================================
  // ADMIN/TEST ENDPOINTS
  // ==========================================

  /**
   * Get platform fee configuration (admin only)
   */
  async getPlatformFeeConfig(): Promise<PlatformFeeConfig> {
    const response: AxiosResponse<PlatformFeeConfig> = await apiClient.get(
      API_ROUTES.PAYMENTS.FEE_CONFIG
    );
    return response.data;
  }

  /**
   * Verify payment split details (admin only)
   * Shows how payment was distributed between platform and organizer
   */
  async verifyPaymentSplit(paymentIntentId: string): Promise<PaymentSplitDetails> {
    const response: AxiosResponse<PaymentSplitDetails> = await apiClient.get(
      API_ROUTES.PAYMENTS.VERIFY_SPLIT(paymentIntentId)
    );
    return response.data;
  }

  /**
   * Check organizer's Stripe Connect status (admin only)
   */
  async getOrganizerPaymentStatus(eventUserId: string): Promise<StripeConnectStatus> {
    const response: AxiosResponse<StripeConnectStatus> = await apiClient.get(
      API_ROUTES.PAYMENTS.ORGANIZER_STATUS(eventUserId)
    );
    return response.data;
  }
}

// Singleton instance
export const paymentService = new PaymentService();
export default paymentService;
