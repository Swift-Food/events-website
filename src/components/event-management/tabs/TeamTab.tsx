"use client";

import { CollaboratorManagement } from "@/components/event-collaborators/CollaboratorManagement";

interface TeamTabProps {
  eventId: string;
  ownerId?: string;
}

export function TeamTab({ eventId, ownerId }: TeamTabProps) {
  return (
    <CollaboratorManagement
      eventId={eventId}
      ownerId={ownerId}
      isCompact={false}
    />
  );
}
