"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2, Eye } from "lucide-react";
import { eventService } from "@/services/event.service";
import { ViewAnalyticsResponse, DailyViewData } from "@/types";

interface ViewAnalyticsCardProps {
  eventId: string;
}

export function ViewAnalyticsCard({ eventId }: ViewAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<ViewAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await eventService.getViewAnalytics(eventId, 30);
        setAnalytics(data);
      } catch (err: any) {
        console.error("Failed to fetch view analytics:", err);
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="bg-card-background rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background rounded-2xl border border-white/5 p-5 sm:p-6">
        <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
      </div>
    );
  }

  if (!analytics) return null;

  const maxViews = Math.max(...analytics.dailyViews.map((d) => d.viewCount), 1);

  // Get last 7 days for mobile, all for desktop
  const last7Days = analytics.dailyViews.slice(-7);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { day: "numeric" });
  };

  return (
    <div className="bg-card-background rounded-2xl border border-white/5 p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Daily Views</h3>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Views Today - prominent */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {analytics.viewsToday}
            </div>
            <p className="text-xs text-muted-foreground">today</p>
          </div>
          {/* Total Views - secondary */}
          <div className="text-right border-l border-white/10 pl-4">
            <div className="text-lg font-bold text-muted-foreground">
              {analytics.totalViews}
            </div>
            <p className="text-xs text-muted-foreground">total</p>
          </div>
        </div>
      </div>

      {/* Tracking Status */}
      {!analytics.isTrackingActive && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-500">
            Tracking paused — event has started
          </p>
        </div>
      )}

      {/* Chart - Desktop (all 30 days) */}
      <div className="hidden sm:block">
        <div className="flex gap-[2px] h-24">
          {analytics.dailyViews.map((day, index) => (
            <div
              key={day.date}
              className="flex-1 group relative flex flex-col justify-end"
            >
              <div
                className="w-full bg-primary/60 hover:bg-primary transition-colors rounded-t-sm"
                style={{
                  height: `${Math.max((day.viewCount / maxViews) * 100, day.viewCount > 0 ? 4 : 0)}%`,
                  minHeight: day.viewCount > 0 ? "2px" : "0px",
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-card-secondary-background border border-white/10 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                  <div className="font-medium text-foreground">{day.viewCount} views</div>
                  <div className="text-muted-foreground">{formatDate(day.date)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{formatDate(analytics.dailyViews[0]?.date)}</span>
          <span>{formatDate(analytics.dailyViews[Math.floor(analytics.dailyViews.length / 2)]?.date)}</span>
          <span>{formatDate(analytics.dailyViews[analytics.dailyViews.length - 1]?.date)}</span>
        </div>
      </div>

      {/* Chart - Mobile (last 7 days) */}
      <div className="sm:hidden">
        <div className="flex gap-1 h-20">
          {last7Days.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-full flex justify-center shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {day.viewCount > 0 ? day.viewCount : ""}
                </span>
              </div>
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-primary/60 rounded-t-sm"
                  style={{
                    height: `${Math.max((day.viewCount / maxViews) * 100, day.viewCount > 0 ? 8 : 0)}%`,
                    minHeight: day.viewCount > 0 ? "4px" : "0px",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatShortDate(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
