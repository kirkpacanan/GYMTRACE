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
  monthsPaid: number;
  expiresAt: string;
  createdAt: string;
};

/** Default monthly membership fee in PHP */
export const MEMBER_MONTHLY_FEE = 1500;

export function addCalendarMonths(from: Date, months: number) {
  const next = new Date(from.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) next.setDate(0);
  return next;
}

export function membershipExpiry(from: Date, months: number) {
  return addCalendarMonths(from, Math.max(1, months)).toISOString();
}

export function effectiveMemberStatus(
  status: MemberStatus,
  expiresAt: string,
): MemberStatus {
  if (status === "frozen") return "frozen";
  if (Date.parse(expiresAt) <= Date.now()) return "expired";
  return status === "expired" ? "expired" : "active";
}

export function nextMembershipTerm(input: {
  monthsPaid: number;
  expiresAt: string;
  monthsToAdd: number;
  status: MemberStatus;
  feeAmount: number;
  addedFee: number;
}) {
  const extra = Math.max(0, Math.floor(input.monthsToAdd));
  if (extra === 0) {
    return {
      monthsPaid: input.monthsPaid,
      expiresAt: input.expiresAt,
      feeAmount: input.feeAmount,
      status: input.status,
    };
  }
  const ended = Date.parse(input.expiresAt) <= Date.now();
  const monthsPaid = input.monthsPaid + extra;
  const expiresAt = ended
    ? membershipExpiry(new Date(), extra)
    : membershipExpiry(new Date(input.expiresAt), extra);
  return {
    monthsPaid,
    expiresAt,
    feeAmount: input.feeAmount + Math.max(0, input.addedFee),
    status: input.status === "frozen" ? "frozen" : "active",
  };
}

export function formatMembershipEnd(member: Pick<Member, "status" | "expiresAt">) {
  const date = new Date(member.expiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (member.status === "frozen") return `Frozen until ${date}`;
  if (member.status === "expired") return `Ended ${date}`;
  return `Active until ${date}`;
}

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
  months_paid?: number | null;
  expires_at?: string | null;
  created_at: string;
}): Member {
  const monthsPaid = Math.max(1, Number(row.months_paid ?? 1));
  const expiresAt = row.expires_at
    ? String(row.expires_at)
    : membershipExpiry(new Date(row.created_at), monthsPaid);
  const stored = row.status as MemberStatus;
  return {
    id: Number(row.id),
    name: row.name,
    contact: row.contact,
    status: effectiveMemberStatus(stored, expiresAt),
    faceTag: row.face_tag,
    faceEnrolled: Boolean(row.face_descriptor),
    feeAmount: Number(row.fee_amount ?? MEMBER_MONTHLY_FEE * monthsPaid),
    monthsPaid,
    expiresAt,
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
