import { useState, useEffect } from "react";
import { paymentService } from "@/services/payment.service";
import type { StripeConnectStatus } from "@/types/payment";
import { toast } from "sonner";

interface UseStripeConnectOptions {
  isAuthenticated: boolean;
  eventUserId?: string;
}

interface UseStripeConnectReturn {
  status: StripeConnectStatus | null;
  isLoading: boolean;
  isStartingOnboarding: boolean;
  startOnboarding: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useStripeConnect({
  isAuthenticated,
  eventUserId,
}: UseStripeConnectOptions): UseStripeConnectReturn {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);

  // Fetch Stripe Connect status when user is authenticated
  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated || !eventUserId) return;

      setIsLoading(true);
      try {
        const fetchedStatus = await paymentService.getStripeConnectStatus();
        setStatus(fetchedStatus);
      } catch (error) {
        console.error("Error fetching Stripe Connect status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [isAuthenticated, eventUserId]);

  const startOnboarding = async () => {
    setIsStartingOnboarding(true);
    try {
      const response = await paymentService.startStripeConnectOnboarding();
      if (response.onboardingUrl) {
        window.open(response.onboardingUrl, "_blank");
        toast.success("Complete the setup in the new tab, then return here");
      }
    } catch (error: any) {
      console.error("Error starting Stripe onboarding:", error);
      toast.error(
        error.response?.data?.message || "Failed to start payment setup",
      );
    } finally {
      setIsStartingOnboarding(false);
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const fetchedStatus = await paymentService.getStripeConnectStatus();
      setStatus(fetchedStatus);
      if (fetchedStatus.onboardingComplete) {
        toast.success(
          "Payment setup complete! You can now create paid tickets.",
        );
      }
    } catch (error) {
      console.error("Error refreshing Stripe status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    isStartingOnboarding,
    startOnboarding,
    refreshStatus,
  };
}
