import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type MemberStatus = "active" | "expired" | "frozen";

export type Member = {
  id: number;
  name: string;
  contact: string;
  status: MemberStatus;
  faceTag: string;
  faceEnrolled: boolean;
  feeAmount: number;
  createdAt: string;
};

/** Default monthly membership fee in PHP */
export const MEMBER_MONTHLY_FEE = 1500;

export type Attendance = {
  id: number;
  memberId: number | null;
  dayPassId: number | null;
  entryAt: string;
  source: "face" | "day_pass" | "manual";
  event: "check_in" | "check_out";
  memberName?: string | null;
  dayPassCode?: string | null;
};

export type DayPass = {
  id: number;
  code: string;
  name: string;
  contact: string;
  amount: number;
  paidAt: string;
  usedAt: string | null;
};

const globalForDb = globalThis as unknown as {
  gymtraceSupabase?: SupabaseClient;
};

export function supabase() {
  if (!globalForDb.gymtraceSupabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
      );
    }
    globalForDb.gymtraceSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalForDb.gymtraceSupabase;
}

export function dbError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function mapMember(row: {
  id: number | string;
  name: string;
  contact: string;
  status: string;
  face_tag: string;
  face_descriptor?: string | null;
  fee_amount?: number | null;
  created_at: string;
}): Member {
  return {
    id: Number(row.id),
    name: row.name,
    contact: row.contact,
    status: row.status as MemberStatus,
    faceTag: row.face_tag,
    faceEnrolled: Boolean(row.face_descriptor),
    feeAmount: Number(row.fee_amount ?? MEMBER_MONTHLY_FEE),
    createdAt: row.created_at,
  };
}

export function mapDayPass(row: {
  id: number | string;
  code: string;
  name: string;
  contact: string;
  amount: number;
  paid_at: string;
  used_at?: string | null;
}): DayPass {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    contact: row.contact,
    amount: Number(row.amount),
    paidAt: row.paid_at,
    usedAt: row.used_at ?? null,
  };
}
