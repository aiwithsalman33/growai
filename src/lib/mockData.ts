// src/lib/mockData.ts
//
// The mock user/account/post/review database that used to live here is gone —
// all of that is served from Postgres through `lib/api` now.
//
// What remains is the dashboard trend chart's placeholder series. The KPI
// endpoint (`/api/kpis/summary`) returns period totals, not a day-by-day time
// series, so `TrendChart` still draws these constants. Replacing them means
// adding a timeseries endpoint backed by the Business Profile Performance API
// and pointing TrendChart at it — until then, this is the last mock in the app.

export const MOCK_TIMESERIES = [
  { date: 'Mon', views: 420, searches: 310, calls: 24, directions: 45, clicks: 38 },
  { date: 'Tue', views: 510, searches: 380, calls: 32, directions: 56, clicks: 42 },
  { date: 'Wed', views: 490, searches: 360, calls: 28, directions: 51, clicks: 47 },
  { date: 'Thu', views: 630, searches: 490, calls: 41, directions: 68, clicks: 59 },
  { date: 'Fri', views: 820, searches: 640, calls: 58, directions: 94, clicks: 82 },
  { date: 'Sat', views: 980, searches: 790, calls: 74, directions: 125, clicks: 104 },
  { date: 'Sun', views: 760, searches: 580, calls: 46, directions: 88, clicks: 76 },
];

export const MOCK_TIMESERIES_30D = [
  { date: 'Wk 1', views: 3420, searches: 2450, calls: 180, directions: 380, clicks: 290 },
  { date: 'Wk 2', views: 4120, searches: 3100, calls: 220, directions: 440, clicks: 350 },
  { date: 'Wk 3', views: 3950, searches: 2980, calls: 195, directions: 415, clicks: 320 },
  { date: 'Wk 4', views: 4890, searches: 3820, calls: 265, directions: 520, clicks: 440 },
];
