export interface DailyViewData {
  date: string;
  viewCount: number;
}

export interface ViewAnalyticsResponse {
  dailyViews: DailyViewData[];
  totalViews: number;
  periodDays: number;
}
