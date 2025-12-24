'use client';

/**
 * Stripe Elements Provider
 * Wraps components that need access to Stripe.js for payment processing
 */
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { type ReactNode, useMemo } from 'react';

// Stripe appearance configuration for dark theme
// Uses project colors: background (#121212), card-background (#2a2a2a)
const STRIPE_APPEARANCE: StripeElementsOptions['appearance'] = {
  theme: 'night',
  variables: {
    colorPrimary: '#22c55e',
    colorBackground: '#121212',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#2a2a2a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid rgba(34, 197, 94, 0.5)',
      boxShadow: 'none',
    },
    '.Label': {
      color: '#a1a1aa',
    },
  },
};

// Singleton pattern - initialize Stripe once
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create Stripe instance
 * Uses singleton pattern to avoid recreating on every render
 */
export function getStripe(): Promise<Stripe | null> | null {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('[StripeProvider] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
}

/**
 * Stripe Elements provider for payment forms
 * Requires clientSecret from a PaymentIntent
 *
 * @example
 * ```tsx
 * <StripeProvider clientSecret={paymentIntent.clientSecret}>
 *   <PaymentElement />
 * </StripeProvider>
 * ```
 */
export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const stripe = useMemo(() => getStripe(), []);

  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: STRIPE_APPEARANCE,
    }),
    [clientSecret]
  );

  // If Stripe fails to load, render children without Elements wrapper
  // This allows graceful degradation with error handling in child components
  if (!stripe) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}
