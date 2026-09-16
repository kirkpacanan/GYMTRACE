import type { Attendance, DayPass, Member } from "./db";
import type { OccupancySnapshot } from "./occupancy";
import type { FaceScanResult } from "./face-mock";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}

export const api = {
  scanFace: (faceTag?: string) =>
    request<FaceScanResult>("/api/face/scan", {
      method: "POST",
      body: JSON.stringify({ faceTag }),
    }),

  occupancy: () => request<OccupancySnapshot>("/api/occupancy"),

  memberAttendance: (id: number) =>
    request<{ items: Attendance[] }>(`/api/members/${id}/attendance`),

  members: () => request<{ items: Member[] }>("/api/members"),

  createMember: (body: {
    name: string;
    contact: string;
    status?: string;
    faceTag?: string;
  }) =>
    request<Member>("/api/members", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateMember: (
    id: number,
    body: Partial<{ name: string; contact: string; status: string }>,
  ) =>
    request<Member>(`/api/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  purchaseDayPass: (body: { name: string; contact: string; method: string }) =>
    request<DayPass>("/api/day-passes/purchase", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  validateDayPass: (code: string) =>
    request<{
      granted: boolean;
      reason: string;
      dayPass?: DayPass;
      attendanceId?: number;
    }>("/api/day-passes/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  attendance: () => request<{ items: Attendance[] }>("/api/attendance"),

  dayPasses: () => request<{ items: DayPass[] }>("/api/day-passes"),

  reports: () =>
    request<{
      entriesToday: number;
      entriesWeek: number;
      dayPassCountWeek: number;
      dayPassRevenueWeek: number;
      faceEntriesWeek: number;
      weekSeries: { label: string; entries: number }[];
      totalMembers: number;
      activeMembers: number;
      memberRevenueMonth: number;
      membersPaidMonth: number;
      dayPassRevenueMonth: number;
      dayPassCountMonth: number;
      totalRevenueMonth: number;
      monthLabel: string;
      revenueWeekSeries: {
        label: string;
        members: number;
        dayPasses: number;
        total: number;
      }[];
    }>("/api/reports"),

  verifyPin: (role: "staff" | "admin", pin: string) =>
    request<{ ok: boolean }>("/api/auth/pin", {
      method: "POST",
      body: JSON.stringify({ role, pin }),
    }),
};
