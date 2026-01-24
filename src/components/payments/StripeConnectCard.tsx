'use client';

/**
 * StripeConnectCard Component
 * Horizontal banner with expandable details for Stripe Connect status
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
  ShieldAlert,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserSquare2,
} from 'lucide-react';
import { toast } from 'sonner';

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

// Get verification message based on urgency level
const getVerificationMessage = (status: StripeConnectStatus | null): { isUrgent: boolean; message: string } => {
  if (!status) return { isUrgent: false, message: '' };

  // URGENT: Past due - payouts already paused
  if (status.pastDue.length > 0) {
    return {
      isUrgent: true,
      message: 'Payouts paused — complete verification to resume receiving payments.',
    };
  }

  // Currently due with deadline - working but deadline approaching
  if (status.currentlyDue.length > 0 && status.currentDeadline) {
    return {
      isUrgent: false,
      message: `Payments active. Complete by ${formatDeadline(status.currentDeadline)} to avoid payout interruption.`,
    };
  }

  // Currently due without deadline
  if (status.currentlyDue.length > 0) {
    return {
      isUrgent: false,
      message: 'Payments active. Complete verification soon to avoid payout interruption.',
    };
  }

  // Grace period - eventuallyDue but no currentlyDue/pastDue
  if (status.eventuallyDue.length > 0) {
    return {
      isUrgent: false,
      message: 'Identity verification is required by financial regulations (KYC/AML) for all payment platforms. This is a one-time process to ensure secure transactions.',
    };
  }

  // Fallback - general verification needed
  return {
    isUrgent: false,
    message: 'Payments active. Verification required by financial regulations (KYC/AML).',
  };
};

export default function StripeConnectCard({ onStatusChange }: StripeConnectCardProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      setIsActionLoading(true);
      const response = await paymentService.startStripeConnectOnboarding();
      if (response.success && response.onboardingUrl) {
        window.open(response.onboardingUrl, '_blank');
        toast.success('Complete the setup in the new tab');
      } else {
        throw new Error('Failed to get onboarding URL');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start onboarding';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      setIsActionLoading(true);
      const response = await paymentService.refreshStripeConnectOnboarding();
      console.log('[StripeConnectCard] Refresh response:', response);
      if (response.success && response.onboardingUrl) {
        window.open(response.onboardingUrl, '_blank');
        toast.success('Complete the setup in the new tab');
      } else if (response.success && !response.onboardingUrl) {
        // Account is already fully configured - no onboarding needed
        toast.success('Stripe Connect is already fully configured!');
        fetchStatus(); // Refresh status to update UI
      } else {
        throw new Error('Failed to refresh onboarding');
      }
    } catch (error: unknown) {
      console.error('[StripeConnectCard] Refresh error:', error);
      // Try to extract backend error message
      let message = 'Failed to refresh onboarding';
      if (error instanceof Error) {
        message = error.message;
      }
      // Check for axios error with response data
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        message = axiosError.response?.data?.message || axiosError.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setIsActionLoading(true);
      const response = await paymentService.getStripeDashboardLink();
      if (response.success && response.url) {
        window.open(response.url, '_blank');
      } else {
        throw new Error('Failed to get dashboard URL');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to open dashboard';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card-background p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Determine state
  const hasVerificationIssues = status?.requiresVerification ||
    (status?.currentlyDue?.length ?? 0) > 0 ||
    (status?.eventuallyDue?.length ?? 0) > 0 ||
    (status?.pastDue?.length ?? 0) > 0;

  const hasUrgentIssues = (status?.pastDue?.length ?? 0) > 0 || (status?.currentlyDue?.length ?? 0) > 0;

  // Not onboarded
  if (!status?.hasAccount) {
    return (
      <Banner
        icon={<CreditCard className="h-5 w-5" />}
        iconBg="bg-primary/20"
        iconColor="text-primary"
        title="Set up payments"
        description="Connect Stripe to create paid tickets and receive payments"
        action={
          <ActionButton onClick={handleStartOnboarding} isLoading={isActionLoading}>
            Get Started
          </ActionButton>
        }
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        expandedContent={
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusItem
                label="Stripe Account"
                description="Create a connected Stripe account to receive payments"
                completed={false}
              />
              <StatusItem
                label="Business Details"
                description="Provide basic information about yourself or your business"
                completed={false}
              />
              <StatusItem
                label="Bank Account"
                description="Add a bank account to receive payouts"
                completed={false}
              />
              <StatusItem
                label="Identity Verification"
                description="Government ID required (passport, driver's license, or national ID)"
                completed={false}
              />
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Fees:</span> 5% platform fee + Stripe processing (~2.9% + 30p)</p>
              <p><span className="font-medium text-foreground">Grace period:</span> Start accepting payments immediately, verify later</p>
              <p className="text-muted-foreground/70 italic">Student IDs not accepted — government ID required by law</p>
            </div>
          </div>
        }
      />
    );
  }

  // Onboarding incomplete
  if (!status.onboardingComplete) {
    return (
      <Banner
        icon={<AlertCircle className="h-5 w-5" />}
        iconBg="bg-amber-500/20"
        iconColor="text-amber-400"
        title="Complete payment setup"
        description="Finish your Stripe account setup to start accepting payments"
        action={
          <ActionButton onClick={handleRefreshOnboarding} isLoading={isActionLoading} variant="warning">
            Continue Setup
          </ActionButton>
        }
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        expandedContent={
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusItem
                label="Account Created"
                description="Your Stripe Connect account has been created"
                completed={true}
              />
              <StatusItem
                label="Details Submitted"
                description="Business and personal information provided"
                completed={status.detailsSubmitted}
              />
              <StatusItem
                label="Charges Enabled"
                description="Ability to accept payments from customers"
                completed={status.chargesEnabled}
              />
              <StatusItem
                label="Payouts Enabled"
                description="Ability to receive money to your bank account"
                completed={status.payoutsEnabled}
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-300">
                Complete the remaining steps in Stripe to start accepting payments. This usually takes just a few minutes.
              </p>
            </div>
          </div>
        }
      />
    );
  }

  // Verification required
  if (hasVerificationIssues && !status.verificationPending) {
    // Get banner description based on urgency
    const getBannerDescription = (): string => {
      if (status.pastDue.length > 0) {
        return "Payouts paused — complete verification to resume";
      }
      if (status.currentlyDue.length > 0 && status.currentDeadline) {
        return `Payments active • Verify by ${formatDeadline(status.currentDeadline)}`;
      }
      if (status.currentlyDue.length > 0) {
        return "Payments active • Verification needed soon";
      }
      // Grace period
      return "Payments active • Verify to avoid future interruption";
    };

    return (
      <Banner
        icon={<ShieldAlert className="h-5 w-5" />}
        iconBg={hasUrgentIssues ? "bg-red-500/20" : "bg-amber-500/20"}
        iconColor={hasUrgentIssues ? "text-red-400" : "text-amber-400"}
        title="Verification required"
        description={getBannerDescription()}
        action={
          <ActionButton
            onClick={handleRefreshOnboarding}
            isLoading={isActionLoading}
            variant={hasUrgentIssues ? "danger" : "warning"}
          >
            Verify Now
          </ActionButton>
        }
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        expandedContent={
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusItem
                label="Account Active"
                description="Your Stripe Connect account is set up"
                completed={true}
              />
              <StatusItem
                label="Details Submitted"
                description="Business and personal information provided"
                completed={status.detailsSubmitted}
              />
              <StatusItem
                label="Identity Verified"
                description="Government ID verification for compliance"
                completed={!status.requiresVerification && status.currentlyDue.length === 0}
              />
              <StatusItem
                label="Payouts Enabled"
                description="Ability to receive money to your bank account"
                completed={status.payoutsEnabled}
              />
            </div>

            {/* Verification info - single unified section */}
            {(() => {
              const { isUrgent } = getVerificationMessage(status);
              const borderColor = isUrgent ? 'border-red-500/30' : 'border-amber-500/30';
              const iconBg = isUrgent ? 'bg-red-500/20' : 'bg-amber-500/20';
              const iconColor = isUrgent ? 'text-red-400' : 'text-amber-400';
              const accentColor = isUrgent ? 'text-red-300' : 'text-amber-300';

              return (
                <div className={`border ${borderColor} rounded-xl p-4`}>
                  <div className="flex gap-3">
                    <div className={`${iconBg} rounded-lg p-2 h-fit`}>
                      <UserSquare2 className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-foreground font-medium">Government ID required</p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Passport, driver's license, or national ID — takes ~2 mins
                        </p>
                      </div>
                      <p className={`text-xs ${accentColor}`}>
                        {isUrgent
                          ? 'Complete verification now to resume payouts.'
                          : 'Required by financial regulations (KYC/AML) for all payment platforms.'
                        }
                      </p>
                      <p className="text-muted-foreground/60 text-xs italic">
                        Student IDs not accepted
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        }
      />
    );
  }

  // Verification pending
  if (status.verificationPending) {
    return (
      <Banner
        icon={<Clock className="h-5 w-5" />}
        iconBg="bg-blue-500/20"
        iconColor="text-blue-400"
        title="Verification in progress"
        description="Your documents are being reviewed — usually takes a few minutes"
        action={
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        expandedContent={
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusItem
                label="Account Created"
                description="Your Stripe Connect account is active"
                completed={true}
              />
              <StatusItem
                label="Details Submitted"
                description="Business and personal information provided"
                completed={true}
              />
              <StatusItem
                label="Documents Submitted"
                description="Identity documents uploaded for review"
                completed={true}
              />
              <StatusItem
                label="Verification Complete"
                description="Waiting for Stripe to verify your documents"
                completed={false}
                pending={true}
              />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                Stripe is reviewing your documents. This usually takes a few minutes, but can take up to 24 hours in some cases.
              </p>
            </div>
          </div>
        }
      />
    );
  }

  // Fully active
  return (
    <Banner
      icon={<Check className="h-5 w-5" />}
      iconBg="bg-green-500/20"
      iconColor="text-green-400"
      title="Payments active"
      description="You're ready to accept payments for your events"
      action={
        <button
          onClick={handleOpenDashboard}
          disabled={isActionLoading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isActionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Stripe Dashboard
              <ExternalLink className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      }
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatusItem
              label="Account Verified"
              description="Your identity has been verified by Stripe"
              completed={true}
            />
            <StatusItem
              label="Charges Enabled"
              description="You can accept payments from customers"
              completed={status.chargesEnabled}
            />
            <StatusItem
              label="Payouts Enabled"
              description="Payments are deposited to your bank account"
              completed={status.payoutsEnabled}
            />
            <StatusItem
              label="Account Type"
              description={`Stripe ${status.accountType || 'Express'} account`}
              completed={true}
            />
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-xs text-green-300">
              Your account is fully set up. Payments will be deposited to your bank (minus 5% platform fee + Stripe processing fees).
            </p>
          </div>
        </div>
      }
    />
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface BannerProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  action: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedContent: React.ReactNode;
}

function Banner({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  action,
  isExpanded,
  onToggleExpand,
  expandedContent
}: BannerProps) {
  return (
    <div className="rounded-2xl bg-card-background overflow-hidden">
      {/* Main banner row */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon + Text */}
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor} shrink-0`}>
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  Hide details
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View details
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
            {action}
          </div>
        </div>
      </div>

      {/* Expandable details section */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-white/5">
          <div className="pt-4">
            {expandedContent}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusItemProps {
  label: string;
  description: string;
  completed: boolean;
  pending?: boolean;
}

function StatusItem({ label, description, completed, pending }: StatusItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
      <div className={`shrink-0 mt-0.5 ${
        completed
          ? 'text-green-400'
          : pending
            ? 'text-blue-400'
            : 'text-muted-foreground'
      }`}>
        {completed ? (
          <Check className="h-4 w-4" />
        ) : pending ? (
          <Clock className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${
          completed
            ? 'text-foreground'
            : pending
              ? 'text-blue-300'
              : 'text-muted-foreground'
        }`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isLoading: boolean;
  variant?: 'primary' | 'warning' | 'danger';
}

function ActionButton({ children, onClick, isLoading, variant = 'primary' }: ActionButtonProps) {
  const styles = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    warning: 'bg-amber-500 hover:bg-amber-400 text-black',
    danger: 'bg-red-500 hover:bg-red-400 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${styles[variant]}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {children}
          <ChevronRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
