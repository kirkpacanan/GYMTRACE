import {
  dbError,
  MEMBER_MONTHLY_FEE,
  supabase,
} from "./db";

export type MembershipRates = {
  monthlyPrice: number;
  sixMonthDiscountPct: number;
  yearlyDiscountPct: number;
  updatedAt: string | null;
};

export type MembershipPlanQuote = {
  id: "monthly" | "six_month" | "yearly";
  label: string;
  months: number;
  listPrice: number;
  discountPct: number;
  youPay: number;
  savings: number;
};

export const DEFAULT_MEMBERSHIP_RATES: MembershipRates = {
  monthlyPrice: MEMBER_MONTHLY_FEE,
  sixMonthDiscountPct: 10,
  yearlyDiscountPct: 20,
  updatedAt: null,
};

export function mapMembershipRates(row: {
  monthly_price?: number | null;
  six_month_discount_pct?: number | null;
  yearly_discount_pct?: number | null;
  updated_at?: string | null;
}): MembershipRates {
  return {
    monthlyPrice: Math.max(
      1,
      Number(row.monthly_price ?? MEMBER_MONTHLY_FEE),
    ),
    sixMonthDiscountPct: clampPct(row.six_month_discount_pct ?? 10),
    yearlyDiscountPct: clampPct(row.yearly_discount_pct ?? 20),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function clampPct(value: number | null | undefined) {
  const n = Math.floor(Number(value ?? 0));
  if (!Number.isFinite(n)) return 0;
  return Math.min(90, Math.max(0, n));
}

export function quoteMembershipFee(
  rates: MembershipRates,
  months: number,
): number {
  const m = Math.max(1, Math.floor(months));
  const list = rates.monthlyPrice * m;
  if (m === 12) {
    return Math.round(list * (1 - rates.yearlyDiscountPct / 100));
  }
  if (m === 6) {
    return Math.round(list * (1 - rates.sixMonthDiscountPct / 100));
  }
  return list;
}

export function membershipPlanQuotes(
  rates: MembershipRates,
): MembershipPlanQuote[] {
  const plans: { id: MembershipPlanQuote["id"]; label: string; months: number; discountPct: number }[] =
    [
      { id: "monthly", label: "Monthly", months: 1, discountPct: 0 },
      {
        id: "six_month",
        label: "6 months",
        months: 6,
        discountPct: rates.sixMonthDiscountPct,
      },
      {
        id: "yearly",
        label: "Yearly",
        months: 12,
        discountPct: rates.yearlyDiscountPct,
      },
    ];

  return plans.map((plan) => {
    const listPrice = rates.monthlyPrice * plan.months;
    const youPay = quoteMembershipFee(rates, plan.months);
    return {
      id: plan.id,
      label: plan.label,
      months: plan.months,
      listPrice,
      discountPct: plan.discountPct,
      youPay,
      savings: Math.max(0, listPrice - youPay),
    };
  });
}

export function formatPhp(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

export async function getMembershipRates(): Promise<MembershipRates> {
  const { data, error } = await supabase()
    .from("membership_rates")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  dbError(error);
  if (!data) return DEFAULT_MEMBERSHIP_RATES;
  return mapMembershipRates(data);
}
