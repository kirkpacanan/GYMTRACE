import { NextResponse } from "next/server";
import { dbError, supabase } from "@/lib/db";
import {
  DEFAULT_MEMBERSHIP_RATES,
  getMembershipRates,
  mapMembershipRates,
  membershipPlanQuotes,
} from "@/lib/membership-rates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rates = await getMembershipRates();
    return NextResponse.json({
      rates,
      plans: membershipPlanQuotes(rates),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load rates" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      monthlyPrice?: number;
      sixMonthDiscountPct?: number;
      yearlyDiscountPct?: number;
      dayPassPrice?: number;
    };
    const monthlyPrice = Math.floor(Number(body.monthlyPrice));
    const sixMonthDiscountPct = Math.floor(Number(body.sixMonthDiscountPct));
    const yearlyDiscountPct = Math.floor(Number(body.yearlyDiscountPct));
    const dayPassPrice = Math.floor(Number(body.dayPassPrice));
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 1) {
      return NextResponse.json(
        { error: "Monthly price must be at least 1" },
        { status: 400 },
      );
    }
    if (
      !Number.isFinite(sixMonthDiscountPct) ||
      sixMonthDiscountPct < 0 ||
      sixMonthDiscountPct > 90
    ) {
      return NextResponse.json(
        { error: "6-month discount must be 0–90%" },
        { status: 400 },
      );
    }
    if (
      !Number.isFinite(yearlyDiscountPct) ||
      yearlyDiscountPct < 0 ||
      yearlyDiscountPct > 90
    ) {
      return NextResponse.json(
        { error: "Yearly discount must be 0–90%" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(dayPassPrice) || dayPassPrice < 1) {
      return NextResponse.json(
        { error: "Day-pass price must be at least 1" },
        { status: 400 },
      );
    }

    const payload = {
      id: 1,
      monthly_price: monthlyPrice,
      six_month_discount_pct: sixMonthDiscountPct,
      yearly_discount_pct: yearlyDiscountPct,
      day_pass_price: dayPassPrice,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: lookupError } = await supabase()
      .from("membership_rates")
      .select("id")
      .eq("id", 1)
      .maybeSingle();
    dbError(lookupError);

    const result = existing
      ? await supabase()
          .from("membership_rates")
          .update(payload)
          .eq("id", 1)
          .select("*")
          .single()
      : await supabase().from("membership_rates").insert(payload).select("*").single();
    dbError(result.error);

    const rates = result.data
      ? mapMembershipRates(result.data)
      : {
          ...DEFAULT_MEMBERSHIP_RATES,
          monthlyPrice,
          sixMonthDiscountPct,
          yearlyDiscountPct,
          dayPassPrice,
          updatedAt: payload.updated_at,
        };

    return NextResponse.json({
      rates,
      plans: membershipPlanQuotes(rates),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
