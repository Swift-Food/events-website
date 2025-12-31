"use client";

import { useEffect, useState } from "react";
import { blacklistService } from "@/services/blacklist.service";
import {
  BlacklistEntryDto,
  BlacklistAppealStatus,
  EventBlacklistListDto,
} from "@/types/blacklist";
import { format } from "date-fns";
import {
  Ban,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Loader,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { AddToBlacklistModal } from "./AddToBlacklistModal";
import { AppealReviewModal } from "./AppealReviewModal";

interface BlacklistSectionProps {
  eventId: string;
  onBlacklistCountChange?: (count: number) => void;
}

export function BlacklistSection({ eventId, onBlacklistCountChange }: BlacklistSectionProps) {
  const [blacklistData, setBlacklistData] = useState<EventBlacklistListDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntryDto | null>(null);

  useEffect(() => {
    fetchBlacklist();
  }, [eventId]);

  const fetchBlacklist = async () => {
    try {
      setIsLoading(true);
      const data = await blacklistService.getEventBlacklist(eventId);
      setBlacklistData(data);
      onBlacklistCountChange?.(data.total);
    } catch (error: any) {
      console.error("Error fetching blacklist:", error);
      toast.error(error.response?.data?.message || "Failed to load blacklist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (entry: BlacklistEntryDto) => {
    if (entry.appealStatus === BlacklistAppealStatus.DENIED) {
      toast.error("Cannot unblock - appeal was denied (permanent ban)");
      return;
    }

    try {
      const result = await blacklistService.removeFromBlacklist(entry.id);
      if (result.success) {
        toast.success("User unblocked successfully");
        await fetchBlacklist();
      } else {
        toast.error(result.message || "Failed to unblock user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  };

  const handleOpenAppealReview = (entry: BlacklistEntryDto) => {
    setSelectedEntry(entry);
    setShowAppealModal(true);
  };

  const handleAppealResponse = async (approved: boolean, responseMessage: string) => {
    if (!selectedEntry) return;

    try {
      const result = approved
        ? await blacklistService.approveAppeal(selectedEntry.id, { responseMessage })
        : await blacklistService.denyAppeal(selectedEntry.id, { responseMessage });

      if (result.success) {
        toast.success(approved ? "Appeal approved - user unblocked" : "Appeal denied - user permanently banned");
        setShowAppealModal(false);
        setSelectedEntry(null);
        await fetchBlacklist();
      } else {
        toast.error(result.message || "Failed to process appeal");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process appeal");
    }
  };

  const handleAddToBlacklist = async (email: string, reason: string) => {
    try {
      const result = await blacklistService.blacklistUser(eventId, {
        blockedEmail: email,
        reason,
      });

      if (result.success) {
        toast.success(result.message || "User added to blacklist");
        setShowAddModal(false);
        await fetchBlacklist();
      } else {
        throw new Error(result.message || "Failed to add to blacklist");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to add to blacklist");
      throw error;
    }
  };

  const getAppealStatusBadge = (status: BlacklistAppealStatus) => {
    switch (status) {
      case BlacklistAppealStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
            <Clock className="h-3 w-3" />
            Appeal Pending
          </span>
        );
      case BlacklistAppealStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Appeal Approved
          </span>
        );
      case BlacklistAppealStatus.DENIED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
            <XCircle className="h-3 w-3" />
            Permanent Ban
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with pending appeals badge and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">Blacklisted Users</h3>
          {blacklistData && blacklistData.pendingAppealsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {blacklistData.pendingAppealsCount} pending appeal{blacklistData.pendingAppealsCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <Plus className="h-4 w-4" />
          Add to Blacklist
        </button>
      </div>

      {/* Blacklist Table */}
      {blacklistData && blacklistData.blacklist.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-card-background">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="p-4 text-left text-sm font-semibold text-muted-foreground">User</th>
                  <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Reason</th>
                  <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Date Blocked</th>
                  <th className="p-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklistData.blacklist.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-700 last:border-b-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                          <UserX className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          {entry.blockedUser ? (
                            <>
                              <p className="font-medium text-foreground">
                                {entry.blockedUser.firstName} {entry.blockedUser.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {entry.blockedUser.email}
                              </p>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm text-foreground">{entry.blockedEmail}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="max-w-xs truncate text-sm text-foreground">{entry.reason}</p>
                      {entry.hadTicketCancelled && (
                        <span className="mt-1 inline-block text-xs text-amber-400">Ticket was cancelled</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getAppealStatusBadge(entry.appealStatus)}
                      {entry.appealStatus === BlacklistAppealStatus.NONE && entry.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                          <Ban className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-foreground">
                        {format(new Date(entry.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), "h:mm a")}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {entry.appealStatus === BlacklistAppealStatus.PENDING && (
                          <button
                            onClick={() => handleOpenAppealReview(entry)}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                          >
                            Review Appeal
                          </button>
                        )}
                        <button
                          onClick={() => handleUnblock(entry)}
                          disabled={entry.appealStatus === BlacklistAppealStatus.DENIED}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Unblock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card-background p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">No blacklisted users</h3>
          <p className="text-sm text-muted-foreground">
            Users you blacklist will appear here
          </p>
        </div>
      )}

      {/* Add to Blacklist Modal */}
      <AddToBlacklistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleAddToBlacklist}
      />

      {/* Appeal Review Modal */}
      <AppealReviewModal
        isOpen={showAppealModal}
        entry={selectedEntry}
        onClose={() => {
          setShowAppealModal(false);
          setSelectedEntry(null);
        }}
        onRespond={handleAppealResponse}
      />
    </div>
  );
}
