import { CheckCircle2, Clock, UserCheck, UserX, Users } from "lucide-react";

interface GuestStatsCardsProps {
  stats: {
    totalTickets: number;
    checkedIn: number;
    pending: number;
    percentageCheckedIn: number;
  };
  totalGuests: number;
  approvedCount: number;
  waitlistedCount: number;
  rejectedCount: number;
}

export const GuestStatsCards = ({
  stats,
  totalGuests,
  approvedCount,
  waitlistedCount,
  rejectedCount,
}: GuestStatsCardsProps) => {
  const cards = [
    // {
    //   label: "Total Guests",
    //   value: totalGuests,
    //   icon: Users,
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-100",
    // },
    {
      label: "Checked In",
      value: stats.checkedIn,
      percentage: stats.percentageCheckedIn,
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Approved",
      value: approvedCount,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Waitlisted",
      value: waitlistedCount,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg bg-card-background p-6 transition-all hover:bg-white/15"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                  {card.percentage !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      ({card.percentage.toFixed(0)}%)
                    </p>
                  )}
                </div>
              </div>
              <div className={`rounded-xl ${card.bgColor} p-3`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};