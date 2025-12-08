import { CollaboratorResponseDto, CollaboratorRole } from "@/types/event-collaborator";
import { CollaboratorCard } from "./CollaboratorCard";
import { Users } from "lucide-react";

interface CollaboratorListProps {
  collaborators: CollaboratorResponseDto[];
  ownerId?: string;
  onRemove: (collaboratorId: string) => void;
  onUpdateRole: (collaboratorId: string, role: CollaboratorRole) => void;
  onResendInvite: (collaboratorId: string) => void;
}

export const CollaboratorList = ({
  collaborators,
  ownerId,
  onRemove,
  onUpdateRole,
  onResendInvite,
}: CollaboratorListProps) => {
  if (collaborators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card-secondary-background">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No collaborators yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Invite team members to help manage this event. They'll be able to view and edit event details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {collaborators.map((collaborator) => (
        <CollaboratorCard
          key={collaborator.id}
          collaborator={collaborator}
          isOwner={collaborator.eventUserId === ownerId}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
          onResendInvite={onResendInvite}
        />
      ))}
    </div>
  );
};
