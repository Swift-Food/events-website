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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl sm:rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-full bg-primary/20 p-2 sm:p-2.5 text-primary shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Complete Payment</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Secure payment via Stripe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-50 shrink-0"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Order Summary */}
          <div className="px-4 sm:px-6 pb-3 sm:pb-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ticketDetails.ticketName}</p>
                  <p className="text-xs text-muted-foreground truncate">{ticketDetails.eventName}</p>
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground shrink-0">{formatCurrency(amount, currency)}</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-4 sm:pb-6">
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
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm rounded-xl border border-white/10 text-foreground font-medium hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : !isReady ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {formatCurrency(amount, currency)}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3 sm:mt-4">
              Payments are processed securely by Stripe
            </p>
          </form>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl sm:rounded-3xl border border-white/10 w-full max-w-md overflow-hidden text-center p-6 sm:p-8 my-auto">
        <div className="rounded-full bg-green-500/20 p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
          <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          Your ticket for <span className="text-foreground">{ticketDetails.eventName}</span> has been
          confirmed.
        </p>

        <button
          onClick={onClose}
          className="w-full px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-white text-sm sm:text-base font-semibold hover:bg-primary/90 transition-all"
        >
          View My Tickets
        </button>
      </div>
    </div>
  );
}
