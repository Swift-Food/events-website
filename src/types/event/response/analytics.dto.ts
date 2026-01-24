export interface DailyViewData {
  date: string;
  viewCount: number;
}

export interface ViewAnalyticsResponse {
  dailyViews: DailyViewData[];
  totalViews: number;
  viewsToday: number;
  periodDays: number;
  isTrackingActive: boolean;
}
