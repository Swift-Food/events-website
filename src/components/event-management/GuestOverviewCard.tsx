"use client";

import { Loader2, UserCheck, CheckCircle2, Clock, Users, Bell } from "lucide-react";

interface GuestOverviewCardProps {
  isLoading: boolean;
  checkInStats: {
    checkedIn: number;
    percentageCheckedIn: number;
  };
  approvedCount: number;
  pendingApprovalCount: number;
  waitlistedCount: number;
}

export function GuestOverviewCard({
  isLoading,
  checkInStats,
  approvedCount,
  pendingApprovalCount,
  waitlistedCount,
}: GuestOverviewCardProps) {
  return (
    <div className="bg-card-background rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Guest Overview</h3>
        {pendingApprovalCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1">
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              {pendingApprovalCount} pending approval
            </span>
          </div>
        )}
      </div>
      <div className="px-5 sm:px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Checked In */}
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Checked In</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">{checkInStats.checkedIn}</span>
                <span className="text-xs text-muted-foreground">
                  ({checkInStats.percentageCheckedIn.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Approved</span>
              </div>
              <span className="text-xl font-bold text-foreground">{approvedCount}</span>
            </div>

            {/* Pending Approval */}
            <div className={`rounded-xl p-3 ${pendingApprovalCount > 0 ? "bg-amber-500/10" : "bg-white/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`h-4 w-4 ${pendingApprovalCount > 0 ? "text-amber-400" : "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <span className={`text-xl font-bold ${pendingApprovalCount > 0 ? "text-amber-400" : "text-foreground"}`}>
                {pendingApprovalCount}
              </span>
            </div>

            {/* Waitlisted */}
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Waitlisted</span>
              </div>
              <span className="text-xl font-bold text-foreground">{waitlistedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
