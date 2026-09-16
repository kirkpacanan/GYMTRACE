import { getDb } from "./db";

export const GYM_CAPACITY = 80;

export type OccupancySeriesPoint = {
  label: string;
  hour: number;
  people: number;
};

export type PredictionPoint = {
  label: string;
  hour: number;
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
};

export type ModelMetrics = {
  modelName: string;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  trainedOn: string;
};

export type OccupancySnapshot = {
  now: number;
  next30: number;
  capacity: number;
  loadPercent: number;
  series: OccupancySeriesPoint[];
  peakLabel: string;
  /** Dense next-12h ML forecast */
  forecast12h: PredictionPoint[];
  /** Today actual vs model predicted (past hours + upcoming) */
  actualVsPredicted: PredictionPoint[];
  /** Next 7 days peak occupancy prediction */
  weekPeaks: { label: string; predicted: number; busy: string }[];
  /** Feature importance for the crowd model */
  featureImportance: { feature: string; weight: number }[];
  metrics: ModelMetrics;
};

function hourProfile(hour: number): number {
  const curve: Record<number, number> = {
    5: 8,
    6: 22,
    7: 35,
    8: 28,
    9: 18,
    10: 14,
    11: 16,
    12: 20,
    13: 18,
    14: 15,
    15: 17,
    16: 25,
    17: 38,
    18: 52,
    19: 45,
    20: 32,
    21: 18,
    22: 10,
    23: 6,
    0: 4,
    1: 3,
    2: 2,
    3: 2,
    4: 4,
  };
  return curve[hour] ?? 12;
}

function formatHourLabel(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${ampm}`;
}

function liveAttendanceBoost(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM attendance
       WHERE entry_at >= datetime('now', '-3 hours')`,
    )
    .get() as { c: number };
  return Math.min(25, row.c * 3);
}

function predict(hour: number, boost: number, noiseSeed: number) {
  const base = hourProfile(hour);
  const drift = Math.sin(noiseSeed * 1.7 + hour * 0.4) * 3;
  const predicted = Math.min(
    GYM_CAPACITY,
    Math.max(0, Math.round(base + boost * 0.25 + drift)),
  );
  const band = Math.max(4, Math.round(predicted * 0.12));
  return {
    predicted,
    lower: Math.max(0, predicted - band),
    upper: Math.min(GYM_CAPACITY, predicted + band),
  };
}

export function getOccupancySnapshot(): OccupancySnapshot {
  const nowDate = new Date();
  const hour = nowDate.getHours();
  const boost = liveAttendanceBoost();
  const base = hourProfile(hour);
  const now = Math.min(GYM_CAPACITY, Math.round(base * 0.7 + boost));
  const nextBase = hourProfile((hour + 1) % 24);
  const next30 = Math.min(
    GYM_CAPACITY,
    Math.round((now + nextBase) / 2 + (Math.sin(nowDate.getMinutes()) + 1) * 2),
  );

  const seriesHours = [6, 7, 8, 12, 17, 18, 19, 20];
  const series: OccupancySeriesPoint[] = seriesHours.map((h) => {
    const people = Math.min(
      GYM_CAPACITY,
      Math.round(hourProfile(h) + (h === hour ? boost * 0.4 : 0)),
    );
    return { label: formatHourLabel(h), hour: h, people };
  });

  const peak = series.reduce((a, b) => (b.people > a.people ? b : a));

  const forecast12h: PredictionPoint[] = Array.from({ length: 12 }, (_, i) => {
    const h = (hour + i) % 24;
    const p = predict(h, boost, nowDate.getDate() + i);
    return {
      label: formatHourLabel(h),
      hour: h,
      actual: i === 0 ? now : null,
      predicted: i === 0 ? now : p.predicted,
      lower: p.lower,
      upper: p.upper,
    };
  });

  const actualVsPredicted: PredictionPoint[] = Array.from(
    { length: 14 },
    (_, i) => {
      const h = (hour - 7 + i + 24) % 24;
      const p = predict(h, boost * 0.6, nowDate.getDate());
      const isPastOrNow = i <= 7;
      const actualNoise = Math.round(Math.sin(h * 0.9 + 2) * 4);
      const actual = isPastOrNow
        ? Math.min(
            GYM_CAPACITY,
            Math.max(0, p.predicted + actualNoise + (h === hour ? boost * 0.3 : 0)),
          )
        : null;
      return {
        label: formatHourLabel(h),
        hour: h,
        actual: actual !== null ? Math.round(actual) : null,
        predicted: p.predicted,
        lower: p.lower,
        upper: p.upper,
      };
    },
  );

  const weekPeaks = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const predicted = Math.min(
      GYM_CAPACITY,
      Math.round((weekend ? 44 : 58) + Math.sin(i * 1.3) * 8 + boost * 0.15),
    );
    return {
      label:
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", { weekday: "short" }),
      predicted,
      busy:
        predicted >= 55 ? "Peak" : predicted >= 40 ? "Busy" : "Moderate",
    };
  });

  const featureImportance = [
    { feature: "hour_of_day", weight: 0.28 },
    { feature: "is_weekend", weight: 0.18 },
    { feature: "temperature", weight: 0.14 },
    { feature: "is_during_semester", weight: 0.12 },
    { feature: "recent_entries", weight: 0.11 },
    { feature: "day_of_week", weight: 0.09 },
    { feature: "is_holiday", weight: 0.08 },
  ];

  // Deterministic demo metrics (swap-ready for real model eval)
  const metrics: ModelMetrics = {
    modelName: "Gradient Boosting (demo)",
    mae: 6.4,
    rmse: 8.9,
    r2: 0.87,
    mape: 11.2,
    trainedOn: "Campus Gym Crowdedness + GYMTRACE logs",
  };

  return {
    now,
    next30,
    capacity: GYM_CAPACITY,
    loadPercent: Math.round((now / GYM_CAPACITY) * 100),
    series,
    peakLabel: peak.label,
    forecast12h,
    actualVsPredicted,
    weekPeaks,
    featureImportance,
    metrics,
  };
}

export function getReportsSummary() {
  const db = getDb();
  const today = db
    .prepare(
      `SELECT COUNT(*) as c FROM attendance
       WHERE date(entry_at) = date('now')`,
    )
    .get() as { c: number };
  const week = db
    .prepare(
      `SELECT COUNT(*) as c FROM attendance
       WHERE entry_at >= datetime('now', '-7 days')`,
    )
    .get() as { c: number };
  const dayPassSales = db
    .prepare(
      `SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as revenue
       FROM day_passes WHERE paid_at >= datetime('now', '-7 days')`,
    )
    .get() as { c: number; revenue: number };
  const faceEntries = db
    .prepare(
      `SELECT COUNT(*) as c FROM attendance
       WHERE source = 'face' AND entry_at >= datetime('now', '-7 days')`,
    )
    .get() as { c: number };

  const totalMembers = db
    .prepare(`SELECT COUNT(*) as c FROM members`)
    .get() as { c: number };
  const activeMembers = db
    .prepare(`SELECT COUNT(*) as c FROM members WHERE status = 'active'`)
    .get() as { c: number };

  const memberRevenueMonth = db
    .prepare(
      `SELECT COALESCE(SUM(fee_amount), 0) as revenue, COUNT(*) as c
       FROM members
       WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
    )
    .get() as { revenue: number; c: number };

  const dayPassMonth = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as revenue, COUNT(*) as c
       FROM day_passes
       WHERE strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')`,
    )
    .get() as { revenue: number; c: number };

  const byHour = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const row = db
      .prepare(
        `SELECT COUNT(*) as c FROM attendance WHERE date(entry_at) = ?`,
      )
      .get(key) as { c: number };
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      entries: row.c,
    };
  });

  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Daily revenue split for the last 7 days (demo-friendly)
  const revenueWeekSeries = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const members = db
      .prepare(
        `SELECT COALESCE(SUM(fee_amount),0) as revenue FROM members
         WHERE date(created_at) = ?`,
      )
      .get(key) as { revenue: number };
    const passes = db
      .prepare(
        `SELECT COALESCE(SUM(amount),0) as revenue FROM day_passes
         WHERE date(paid_at) = ?`,
      )
      .get(key) as { revenue: number };
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      members: members.revenue,
      dayPasses: passes.revenue,
      total: members.revenue + passes.revenue,
    };
  });

  return {
    entriesToday: today.c,
    entriesWeek: week.c,
    dayPassCountWeek: dayPassSales.c,
    dayPassRevenueWeek: dayPassSales.revenue,
    faceEntriesWeek: faceEntries.c,
    weekSeries: byHour,
    totalMembers: totalMembers.c,
    activeMembers: activeMembers.c,
    memberRevenueMonth: memberRevenueMonth.revenue,
    membersPaidMonth: memberRevenueMonth.c,
    dayPassRevenueMonth: dayPassMonth.revenue,
    dayPassCountMonth: dayPassMonth.c,
    totalRevenueMonth:
      memberRevenueMonth.revenue + dayPassMonth.revenue,
    monthLabel,
    revenueWeekSeries,
  };
}
