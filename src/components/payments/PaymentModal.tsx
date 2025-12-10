'use client';

/**
 * PaymentModal Component
 * Displays Stripe payment form for ticket purchases
 * Uses Stripe Elements for secure card input
 */
import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Loader2, CreditCard, Check, AlertCircle } from 'lucide-react';
import StripeProvider from '@/lib/stripe/StripeProvider';
import type { PaymentModalProps, PaymentSuccessModalProps, PaymentTicketDetails } from '@/types/payment';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

// ==========================================
// PAYMENT FORM (Internal Component)
// ==========================================

interface PaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  ticketDetails: PaymentTicketDetails;
  amount: number;
  currency: string;
}

function PaymentForm({ onClose, onSuccess, ticketDetails, amount, currency }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred');
        setIsProcessing(false);
        return;
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/my-tickets?payment=success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsProcessing(false);
    }
  };

  const isSubmitDisabled = !stripe || !elements || isProcessing || !isReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gradient-to-b from-card-background to-card-secondary-background rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2.5 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Complete Payment</h2>
                <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-50"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-6 pb-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-foreground">{ticketDetails.ticketName}</p>
                <p className="text-xs text-muted-foreground">{ticketDetails.eventName}</p>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(amount, currency)}</p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mb-4">
            <PaymentElement onReady={() => setIsReady(true)} options={{ layout: 'tabs' }} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 mb-4">
              <div className="flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 rounded-full border border-white/10 text-foreground font-medium hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !isReady ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay {formatCurrency(amount, currency)}
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Payments are processed securely by Stripe
          </p>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// PAYMENT MODAL (Main Export)
// ==========================================

/**
 * Payment Modal with Stripe Elements
 * Wraps PaymentForm with StripeProvider
 */
export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  clientSecret,
  ticketDetails,
  amount,
  currency,
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <StripeProvider clientSecret={clientSecret}>
      <PaymentForm
        onClose={onClose}
        onSuccess={onSuccess}
        ticketDetails={ticketDetails}
        amount={amount}
        currency={currency}
      />
    </StripeProvider>
  );
}

// ==========================================
// PAYMENT SUCCESS MODAL
// ==========================================

/**
 * Success modal shown after payment completes
 */
export function PaymentSuccessModal({ isOpen, onClose, ticketDetails }: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-gradient-to-b from-card-background to-card-secondary-background rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl shadow-black/50 text-center p-8">
        <div className="rounded-full bg-green-500/20 p-4 w-fit mx-auto mb-4">
          <Check className="h-8 w-8 text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-6">
          Your ticket for <span className="text-foreground">{ticketDetails.eventName}</span> has been
          confirmed.
        </p>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] transition-all"
        >
          View My Tickets
        </button>
      </div>
    </div>
  );
}
