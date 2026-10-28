"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import {
  formatPhp,
  type MembershipPlanQuote,
  type MembershipRates,
} from "@/lib/membership-rates";

export default function MembershipInquiryPage() {
  const [plans, setPlans] = useState<MembershipPlanQuote[]>([]);
  const [rates, setRates] = useState<MembershipRates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.membershipRates();
        setPlans(res.plans);
        setRates(res.rates);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load rates");
      }
    })();
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Membership rates"
        subtitle="Current gym membership pricing for inquiry. Staff completes enrollment after you choose a plan."
        backHref="/"
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-panel-border px-5 py-4 sm:px-6">
          <p className="eyebrow text-lime">Inquiry</p>
          <h2 className="display mt-1 text-3xl text-ink">Compare plans</h2>
          {rates ? (
            <p className="mt-2 text-sm text-muted">
              Monthly base {formatPhp(rates.monthlyPrice)}. 6-month discount{" "}
              {rates.sixMonthDiscountPct}%. Yearly discount{" "}
              {rates.yearlyDiscountPct}%. Day pass{" "}
              {formatPhp(rates.dayPassPrice)}.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : plans.length === 0 ? (
          <p className="p-6 text-sm text-muted">Loading rates…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Plan</th>
                  <th className="px-4 py-3">Months</th>
                  <th className="px-4 py-3">List price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">You pay</th>
                  <th className="px-4 py-3">Savings</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-panel-border/60">
                    <td className="px-5 py-4 font-medium text-ink sm:px-6">
                      {plan.label}
                    </td>
                    <td className="px-4 py-4 text-muted">{plan.months}</td>
                    <td className="px-4 py-4 text-muted">
                      {formatPhp(plan.listPrice)}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {plan.discountPct > 0 ? `${plan.discountPct}%` : "—"}
                    </td>
                    <td className="px-4 py-4 text-lime">
                      {formatPhp(plan.youPay)}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {plan.savings > 0 ? formatPhp(plan.savings) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <Button size="lg">Back to role select</Button>
        </Link>
        <Link href="/day-pass/purchase">
          <Button size="lg" variant="outline">
            Buy a day pass instead
          </Button>
        </Link>
      </div>
      <p className="mt-4 max-w-lg text-sm text-muted">
        After you pick a plan, see staff to enroll and capture your face. Staff
        uses these same rates for 1, 6, and 12 month enrollments.
      </p>
    </PageTransition>
  );
}
