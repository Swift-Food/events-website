'use client';

/**
 * StripeConnectCard Component
 * Displays Stripe Connect onboarding status and controls
 * Allows organizers to set up payment receiving capabilities
 */
import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '@/services/payment.service';
import type { StripeConnectStatus, StripeConnectCardProps } from '@/types/payment';
import {
  CreditCard,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Banknote,
  ShieldAlert,
  FileCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// Default status for users who haven't started onboarding
const DEFAULT_STATUS: StripeConnectStatus = {
  hasAccount: false,
  accountId: null,
  onboardingComplete: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  accountType: null,
  dashboardUrl: null,
  requiresVerification: false,
  verificationPending: false,
  currentlyDue: [],
  eventuallyDue: [],
  pastDue: [],
  disabledReason: null,
  pendingVerification: [],
  currentDeadline: null,
};

// Format deadline for display
const formatDeadline = (deadline: string | null): string | null => {
  if (!deadline) return null;
  try {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
};

export default function StripeConnectCard({ onStatusChange }: StripeConnectCardProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const connectStatus = await paymentService.getStripeConnectStatus();
      setStatus(connectStatus);
      onStatusChange?.(connectStatus);
    } catch (error) {
      console.error('[StripeConnectCard] Failed to fetch status:', error);
      setStatus(DEFAULT_STATUS);
    } finally {
      setIsLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleStartOnboarding = async () => {
    try {
      setIsOnboarding(true);
      const response = await paymentService.startStripeConnectOnboarding();

      if (response.success && response.onboardingUrl) {
        window.open(response.onboardingUrl, '_blank');
        toast.success('Opening Stripe onboarding... Complete the setup to receive payments.');
      } else {
        throw new Error('Failed to get onboarding URL');
      }
    } catch (error: unknown) {
      console.error('[StripeConnectCard] Onboarding failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to start onboarding';
      toast.error(message);
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setIsOpeningDashboard(true);
      const response = await paymentService.getStripeDashboardLink();

      if (response.success && response.url) {
        window.open(response.url, '_blank');
      } else {
        throw new Error('Failed to get dashboard URL');
      }
    } catch (error: unknown) {
      console.error('[StripeConnectCard] Dashboard open failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to open dashboard';
      toast.error(message);
    } finally {
      setIsOpeningDashboard(false);
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      setIsOnboarding(true);
      const response = await paymentService.refreshStripeConnectOnboarding();

      if (response.success && response.onboardingUrl) {
        window.open(response.onboardingUrl, '_blank');
        toast.success('Opening Stripe onboarding...');
      } else {
        throw new Error('Failed to refresh onboarding');
      }
    } catch (error: unknown) {
      console.error('[StripeConnectCard] Refresh failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to refresh onboarding';
      toast.error(message);
    } finally {
      setIsOnboarding(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not onboarded - show setup prompt
  if (!status?.hasAccount) {
    return (
      <StripeConnectCardLayout
        icon={<CreditCard className="h-5 w-5" />}
        iconBgClass="bg-primary/20"
        iconColorClass="text-primary"
        title="Payment Setup"
        subtitle="Accept payments for your events"
      >
        <AlertBox variant="warning">
          <p className="text-sm text-amber-300 font-medium">Setup Required</p>
          <p className="text-sm text-amber-300/80 mt-1">
            To create paid tickets and receive payments, you need to connect your Stripe account.
          </p>
        </AlertBox>

        <PrimaryButton
          onClick={handleStartOnboarding}
          isLoading={isOnboarding}
          loadingText="Setting up..."
        >
          <CreditCard className="h-4 w-4" />
          Set Up Payments
          <ExternalLink className="h-4 w-4" />
        </PrimaryButton>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Powered by Stripe. 5% platform fee on paid tickets.
        </p>
      </StripeConnectCardLayout>
    );
  }

  // Onboarding in progress
  if (!status.onboardingComplete) {
    return (
      <StripeConnectCardLayout
        icon={<CreditCard className="h-5 w-5" />}
        iconBgClass="bg-amber-500/20"
        iconColorClass="text-amber-400"
        title="Payment Setup"
        subtitle="Complete your account setup"
      >
        <AlertBox variant="warning">
          <p className="text-sm text-amber-300 font-medium">Onboarding Incomplete</p>
          <p className="text-sm text-amber-300/80 mt-1">
            Your Stripe account needs more information before you can receive payments.
          </p>
        </AlertBox>

        <div className="space-y-2 mb-4">
          <StatusItem label="Account Created" completed />
          <StatusItem label="Details Submitted" completed={status.detailsSubmitted} />
          <StatusItem label="Charges Enabled" completed={status.chargesEnabled} />
          <StatusItem label="Payouts Enabled" completed={status.payoutsEnabled} />
        </div>

        <button
          onClick={handleRefreshOnboarding}
          disabled={isOnboarding}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-400 disabled:opacity-50"
        >
          {isOnboarding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Continue Setup
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </button>
      </StripeConnectCardLayout>
    );
  }

  // Check if verification is needed (even if "onboarded")
  const hasVerificationIssues = status.requiresVerification ||
    status.currentlyDue.length > 0 ||
    status.eventuallyDue.length > 0 ||
    status.pastDue.length > 0;

  const hasUrgentIssues = status.pastDue.length > 0 || status.currentlyDue.length > 0;

  // Show verification required state
  if (hasVerificationIssues && !status.verificationPending) {
    return (
      <StripeConnectCardLayout
        icon={<ShieldAlert className="h-5 w-5" />}
        iconBgClass={hasUrgentIssues ? "bg-red-500/20" : "bg-amber-500/20"}
        iconColorClass={hasUrgentIssues ? "text-red-400" : "text-amber-400"}
        title="Verification Required"
        subtitle="Complete identity verification to continue"
      >
        <AlertBox variant="warning">
          <p className="text-sm text-amber-300 font-medium">
            {hasUrgentIssues ? 'Action Required' : 'Verification Needed'}
          </p>
          <p className="text-sm text-amber-300/80 mt-1">
            {status.pastDue.length > 0
              ? 'Your account requires immediate attention. Payouts may be paused until verification is complete.'
              : 'To continue receiving payments, please verify your identity. This is a quick one-time process required by financial regulations.'}
          </p>
        </AlertBox>

        <div className="space-y-2 mb-4">
          <StatusItem label="Account Created" completed />
          <StatusItem label="Details Submitted" completed={status.detailsSubmitted} />
          <StatusItem
            label="Identity Verified"
            completed={!status.requiresVerification && status.currentlyDue.length === 0}
          />
          <StatusItem label="Payouts Enabled" completed={status.payoutsEnabled} />
        </div>

        {/* Show what's needed */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5" />
            What you'll need:
          </p>
          <ul className="text-xs text-foreground/80 space-y-1 ml-5 list-disc">
            <li>A valid government-issued ID (passport, driver's license, or national ID)</li>
            <li>Takes about 2 minutes to complete</li>
          </ul>
        </div>

        <button
          onClick={handleRefreshOnboarding}
          disabled={isOnboarding}
          className={`w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition-all disabled:opacity-50 ${
            hasUrgentIssues
              ? 'bg-red-500 hover:bg-red-400'
              : 'bg-amber-500 hover:bg-amber-400'
          }`}
        >
          {isOnboarding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4" />
              Complete Verification
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          {status.currentDeadline
            ? `Complete by ${formatDeadline(status.currentDeadline)} to avoid payment interruption`
            : 'Required by financial regulations (KYC/AML)'}
        </p>
      </StripeConnectCardLayout>
    );
  }

  // Verification is pending (submitted, waiting for Stripe to verify)
  if (status.verificationPending) {
    return (
      <StripeConnectCardLayout
        icon={<Clock className="h-5 w-5" />}
        iconBgClass="bg-blue-500/20"
        iconColorClass="text-blue-400"
        title="Verification Pending"
        subtitle="Your documents are being reviewed"
      >
        <AlertBox variant="success">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Under Review</p>
              <p className="text-sm text-blue-300/80 mt-1">
                Your identity documents have been submitted and are being verified. This usually takes just a few minutes.
              </p>
            </div>
          </div>
        </AlertBox>

        <div className="space-y-2 mb-4">
          <StatusItem label="Account Created" completed />
          <StatusItem label="Details Submitted" completed />
          <StatusItem label="Documents Submitted" completed />
          <StatusItem label="Verification Complete" completed={false} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-400"
          >
            <RefreshCw className="h-4 w-4" />
            Check Status
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          We'll notify you once verification is complete
        </p>
      </StripeConnectCardLayout>
    );
  }

  // Fully onboarded - show success state
  return (
    <StripeConnectCardLayout
      icon={<Check className="h-5 w-5" />}
      iconBgClass="bg-green-500/20"
      iconColorClass="text-green-400"
      title="Payments Active"
      subtitle="Your account is ready to receive payments"
    >
      <AlertBox variant="success">
        <div className="flex gap-3">
          <Banknote className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-300 font-medium">Ready to Accept Payments</p>
            <p className="text-sm text-green-300/80 mt-1">
              You can now create paid tickets. Payments will be deposited directly to your connected account.
            </p>
          </div>
        </div>
      </AlertBox>

      <div className="space-y-2 mb-4">
        <StatusItem label="Account Verified" completed />
        <StatusItem label="Charges Enabled" completed={status.chargesEnabled} />
        <StatusItem label="Payouts Enabled" completed={status.payoutsEnabled} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleOpenDashboard}
          disabled={isOpeningDashboard}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-card-secondary-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/15 disabled:opacity-50"
        >
          {isOpeningDashboard ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Stripe Dashboard
            </>
          )}
        </button>

        <button
          onClick={fetchStatus}
          className="flex items-center justify-center gap-2 rounded-full bg-card-secondary-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/15"
          aria-label="Refresh status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        5% platform fee on paid tickets
      </p>
    </StripeConnectCardLayout>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface StripeConnectCardLayoutProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  subtitle: string;
}

function StripeConnectCardLayout({
  children,
  icon,
  iconBgClass,
  iconColorClass,
  title,
  subtitle,
}: StripeConnectCardLayoutProps) {
  return (
    <div className="rounded-2xl bg-card-background backdrop-blur-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`rounded-full p-2.5 ${iconBgClass} ${iconColorClass}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface AlertBoxProps {
  children: React.ReactNode;
  variant: 'warning' | 'success';
}

function AlertBox({ children, variant }: AlertBoxProps) {
  const styles = {
    warning: 'bg-amber-500/10 border-amber-500/20',
    success: 'bg-green-500/10 border-green-500/20',
  };

  return (
    <div className={`rounded-xl border p-4 mb-4 ${styles[variant]}`}>
      {variant === 'warning' && (
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>{children}</div>
        </div>
      )}
      {variant === 'success' && children}
    </div>
  );
}

interface StatusItemProps {
  label: string;
  completed: boolean;
}

function StatusItem({ label, completed }: StatusItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {completed ? (
        <div className="flex items-center gap-1.5 text-green-400">
          <Check className="h-4 w-4" />
          <span className="text-xs font-medium">Done</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Pending</span>
        </div>
      )}
    </div>
  );
}

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
  loadingText: string;
}

function PrimaryButton({ children, onClick, isLoading, loadingText }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
