import { Search } from "lucide-react";

type FilterStatus = "all" | "active" | "pending_approval" | "waitlisted" | "cancelled" | "checked_in";

interface GuestFiltersProps {
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pendingCount: number;
  approvedCount: number;
  waitlistedCount: number;
  cancelledCount: number;
  checkedInCount: number;
}

export const GuestFilters = ({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  pendingCount,
  approvedCount,
  waitlistedCount,
  cancelledCount,
  checkedInCount,
}: GuestFiltersProps) => {
  const filters = [
    { value: "all" as FilterStatus, label: "All" },
    { value: "pending_approval" as FilterStatus, label: "Pending", count: pendingCount },
    { value: "active" as FilterStatus, label: "Approved", count: approvedCount },
    { value: "checked_in" as FilterStatus, label: "Checked In", count: checkedInCount },
    { value: "waitlisted" as FilterStatus, label: "Waitlisted", count: waitlistedCount },
    { value: "cancelled" as FilterStatus, label: "Cancelled", count: cancelledCount },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl bg-card-background py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground outline-none transition-all focus:bg-card-secondary-background focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                filterStatus === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card-secondary-background text-foreground hover:bg-white/15"
              }`}
            >
              {filter.label}
             
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};