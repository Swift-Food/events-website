import { Search, Ban, Download, Loader2 } from "lucide-react";

type FilterStatus = "all" | "active" | "pending_approval" | "pending_payment" | "waitlisted" | "cancelled" | "checked_in" | "blacklisted";

interface GuestFiltersProps {
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pendingCount: number;
  pendingPaymentCount: number;
  approvedCount: number;
  waitlistedCount: number;
  cancelledCount: number;
  checkedInCount: number;
  blacklistedCount?: number;
  onDownload?: () => void;
  isDownloading?: boolean;
  totalFilteredCount?: number;
}

export const GuestFilters = ({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  pendingCount,
  pendingPaymentCount,
  approvedCount,
  waitlistedCount,
  cancelledCount,
  checkedInCount,
  blacklistedCount = 0,
  onDownload,
  isDownloading = false,
  totalFilteredCount = 0,
}: GuestFiltersProps) => {
  const filters = [
    { value: "all" as FilterStatus, label: "All" },
    { value: "pending_approval" as FilterStatus, label: "Pending", count: pendingCount },
    { value: "waitlisted" as FilterStatus, label: "Waitlisted", count: waitlistedCount },
    { value: "pending_payment" as FilterStatus, label: "Awaiting Payment", count: pendingPaymentCount },
    { value: "active" as FilterStatus, label: "Approved", count: approvedCount },
    { value: "checked_in" as FilterStatus, label: "Checked In", count: checkedInCount },
    { value: "cancelled" as FilterStatus, label: "Cancelled", count: cancelledCount },
    { value: "blacklisted" as FilterStatus, label: "Blacklisted", count: blacklistedCount, icon: Ban, isDanger: true },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar and Download Button */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl bg-card-background py-3.5 pl-12 pr-4 text-foreground placeholder-muted-foreground outline-none transition-all focus:bg-card-secondary-background focus:ring-2 focus:ring-primary"
          />
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading || totalFilteredCount === 0}
            className="flex items-center gap-2 rounded-xl bg-card-background px-4 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-card-secondary-background disabled:cursor-not-allowed disabled:opacity-50"
            title={totalFilteredCount === 0 ? "No guests to export" : `Export ${totalFilteredCount} guests to PDF`}
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {filters.map((filter) => {
            const Icon = (filter as any).icon;
            const isDanger = (filter as any).isDanger;
            return (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  filterStatus === filter.value
                    ? isDanger
                      ? "bg-red-500 text-white"
                      : "bg-primary text-primary-foreground"
                    : isDanger
                      ? "bg-card-secondary-background text-red-400 hover:bg-red-500/10"
                      : "bg-card-secondary-background text-foreground hover:bg-white/15"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    filterStatus === filter.value
                      ? "bg-white/20"
                      : isDanger
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10"
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};