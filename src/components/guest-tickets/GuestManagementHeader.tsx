import { Users } from "lucide-react";

interface GuestManagementHeaderProps {
  eventId: string;
  totalGuests: number;
  pendingCount: number;
}

export const GuestManagementHeader = ({
  eventId,
  totalGuests,
  pendingCount,
}: GuestManagementHeaderProps) => {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-3xl font-bold text-foreground">
                Guest Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalGuests} total guests
                {pendingCount > 0 && (
                  <span className="ml-2 text-amber-600">
                    • {pendingCount} pending approval
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};