// components/payments/EarningsCard.tsx
"use client";

import { useEffect, useState } from "react";
import { eventUserService, OrganizerEarnings, PayoutHistoryItem } from "@/services/event-user.service";
import { Wallet, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Banknote } from "lucide-react";
import { toast } from "sonner";

export default function EarningsCard() {
  const [earnings, setEarnings] = useState<OrganizerEarnings | null>(null);
  const [payouts, setPayouts] = useState<PayoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [earningsData, historyData] = await Promise.all([
        eventUserService.getEarnings(),
        eventUserService.getPayoutHistory(),
      ]);
      setEarnings(earningsData);
      setPayouts(historyData);

      // Show toast if payout was triggered
      if (earningsData.payoutTriggered && earningsData.payoutMessage) {
        toast.success(earningsData.payoutMessage);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "rejected":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Paid";
      case "pending":
        return "Pending Approval";
      case "approved":
        return "Processing";
      case "rejected":
        return "Rejected";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card-background backdrop-blur-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-green-500/20 p-2.5">
          <Banknote className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Earnings</h3>
          <p className="text-sm text-muted-foreground">Your event ticket revenue</p>
        </div>
      </div>

      {/* Earnings Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-card-secondary-background p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">
            £{earnings?.pendingBalance?.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Until events end</p>
        </div>
        <div className="rounded-2xl bg-card-secondary-background p-4">
          <p className="text-sm text-muted-foreground mb-1">Paid Out</p>
          <p className="text-2xl font-bold text-green-500">
            £{earnings?.totalWithdrawn?.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">To your bank</p>
        </div>
      </div>

      {/* Info messages */}
      {earnings && earnings.pendingBalance > 0 && earnings.totalWithdrawn === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm bg-card-secondary-background rounded-2xl mb-4">
          <p>Earnings will be automatically paid to your bank after your events end.</p>
        </div>
      )}

      {earnings && earnings.pendingBalance === 0 && earnings.totalWithdrawn === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No earnings yet. Sell tickets to start earning!
        </div>
      )}

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground"
          >
            <span>Payout History ({payouts.length})</span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-xl bg-card-secondary-background p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payout.status)}
                    <div>
                      <p className="font-medium text-foreground">
                        £{payout.netAmount?.toFixed(2) || payout.amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    payout.status === "completed"
                      ? "bg-green-500/20 text-green-500"
                      : payout.status === "pending" || payout.status === "approved"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-red-500/20 text-red-500"
                  }`}>
                    {getStatusText(payout.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-muted-foreground">Total Earned</p>
        <p className="font-semibold text-foreground text-lg">
          £{earnings?.totalEarnings?.toFixed(2) || "0.00"}
        </p>
      </div>
    </div>
  );
}
