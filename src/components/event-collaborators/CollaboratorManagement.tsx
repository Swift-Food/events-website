"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { CollaboratorList } from "./CollaboratorList";
import { AddCollaboratorModal } from "./AddCollaboratorModal";
import { eventCollaboratorService } from "@/services/event-collaborator.service";
import {
  CollaboratorResponseDto,
  CollaboratorRole,
} from "@/types/event-collaborator";
import { toast } from "sonner";

interface CollaboratorManagementProps {
  eventId: string;
  ownerId?: string;
  isCompact?: boolean;
}

export const CollaboratorManagement = ({
  eventId,
  ownerId,
  isCompact = false,
}: CollaboratorManagementProps) => {
  const [collaborators, setCollaborators] = useState<CollaboratorResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchCollaborators();
  }, [eventId]);

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      const response = await eventCollaboratorService.getCollaborators(eventId);
      setCollaborators(response.collaborators);
      setStats({
        total: response.total,
        accepted: response.accepted,
        pending: response.pending,
      });
    } catch (error: any) {
      console.error("Error fetching collaborators:", error);
      toast.error(error.message || "Failed to load collaborators");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteByEmail = async (email: string, role: CollaboratorRole) => {
    await eventCollaboratorService.inviteByEmail(eventId, { email, role });
    await fetchCollaborators();
  };

  const handleGenerateLink = async (role: CollaboratorRole): Promise<string> => {
    const response = await eventCollaboratorService.generateInviteLink(eventId, {
      role,
      expiresInDays: 7,
    });
    return response.inviteLink;
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm("Are you sure you want to remove this collaborator?")) {
      return;
    }

    try {
      await eventCollaboratorService.removeCollaborator(eventId, collaboratorId);
      toast.success("Collaborator removed successfully");
      await fetchCollaborators();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove collaborator");
    }
  };

  const handleUpdateRole = async (
    collaboratorId: string,
    role: CollaboratorRole
  ) => {
    try {
      await eventCollaboratorService.updateCollaboratorRole(
        eventId,
        collaboratorId,
        { role }
      );
      toast.success("Role updated successfully");
      await fetchCollaborators();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleResendInvite = async (collaboratorId: string) => {
    try {
      await eventCollaboratorService.resendInvitation(eventId, collaboratorId);
      toast.success("Invitation resent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  if (isCompact) {
    return (
      <div className="rounded-2xl bg-card-secondary-background p-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Collaborators
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats.accepted} active, {stats.pending} pending
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <CollaboratorList
                collaborators={collaborators}
                ownerId={ownerId}
                onRemove={handleRemoveCollaborator}
                onUpdateRole={handleUpdateRole}
                onResendInvite={handleResendInvite}
              />
            )}
          </div>
        )}

        <AddCollaboratorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInviteByEmail={handleInviteByEmail}
          onGenerateLink={handleGenerateLink}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Event Collaborators
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can view and edit this event
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
        >
          <UserPlus className="h-5 w-5" />
          Add Collaborator
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card-secondary-background p-6 transition-all hover:bg-white/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Collaborators
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-secondary-background p-6 transition-all hover:bg-white/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stats.accepted}
              </p>
            </div>
            <div className="rounded-xl bg-green-100 p-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-secondary-background p-6 transition-all hover:bg-white/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3">
              <UserPlus className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Collaborators List */}
      <div className="rounded-2xl bg-card-secondary-background p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Loading collaborators...
              </p>
            </div>
          </div>
        ) : (
          <CollaboratorList
            collaborators={collaborators}
            ownerId={ownerId}
            onRemove={handleRemoveCollaborator}
            onUpdateRole={handleUpdateRole}
            onResendInvite={handleResendInvite}
          />
        )}
      </div>

      <AddCollaboratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInviteByEmail={handleInviteByEmail}
        onGenerateLink={handleGenerateLink}
      />
    </div>
  );
};
