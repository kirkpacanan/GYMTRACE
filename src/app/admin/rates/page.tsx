"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import {
  formatPhp,
  membershipPlanQuotes,
  type MembershipPlanQuote,
  type MembershipRates,
} from "@/lib/membership-rates";

function RatesTable({ plans }: { plans: MembershipPlanQuote[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3">Plan</th>
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
              <td className="px-4 py-3 font-medium text-ink">{plan.label}</td>
              <td className="px-4 py-3 text-muted">{plan.months}</td>
              <td className="px-4 py-3 text-muted">{formatPhp(plan.listPrice)}</td>
              <td className="px-4 py-3 text-muted">
                {plan.discountPct > 0 ? `${plan.discountPct}%` : "—"}
              </td>
              <td className="px-4 py-3 text-lime">{formatPhp(plan.youPay)}</td>
              <td className="px-4 py-3 text-muted">
                {plan.savings > 0 ? formatPhp(plan.savings) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminRatesPage() {
  const [monthlyPrice, setMonthlyPrice] = useState("1500");
  const [sixMonthDiscountPct, setSixMonthDiscountPct] = useState("10");
  const [yearlyDiscountPct, setYearlyDiscountPct] = useState("20");
  const [saved, setSaved] = useState<MembershipRates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.membershipRates();
      setSaved(res.rates);
      setMonthlyPrice(String(res.rates.monthlyPrice));
      setSixMonthDiscountPct(String(res.rates.sixMonthDiscountPct));
      setYearlyDiscountPct(String(res.rates.yearlyDiscountPct));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const previewRates: MembershipRates = useMemo(
    () => ({
      monthlyPrice: Math.max(1, Math.floor(Number(monthlyPrice) || 1)),
      sixMonthDiscountPct: Math.min(
        90,
        Math.max(0, Math.floor(Number(sixMonthDiscountPct) || 0)),
      ),
      yearlyDiscountPct: Math.min(
        90,
        Math.max(0, Math.floor(Number(yearlyDiscountPct) || 0)),
      ),
      updatedAt: saved?.updatedAt ?? null,
    }),
    [monthlyPrice, sixMonthDiscountPct, yearlyDiscountPct, saved],
  );

  const plans = useMemo(
    () => membershipPlanQuotes(previewRates),
    [previewRates],
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.updateMembershipRates({
        monthlyPrice: previewRates.monthlyPrice,
        sixMonthDiscountPct: previewRates.sixMonthDiscountPct,
        yearlyDiscountPct: previewRates.yearlyDiscountPct,
      });
      setSaved(res.rates);
      setMessage("Membership rates saved. Public inquiry page will show these.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PinGate role="admin">
      <h1 className="display text-4xl text-ink sm:text-5xl">Membership rates</h1>
      <p className="mt-2 max-w-xl text-muted">
        Set the monthly price and volume discounts for 6-month and yearly plans.
        Visitors see the comparison table on the public inquiry page.
      </p>

      <Panel className="mt-6 p-5 sm:p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading rates…</p>
        ) : (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Monthly price (₱)"
              type="number"
              min={1}
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              required
            />
            <Input
              label="6-month discount (%)"
              type="number"
              min={0}
              max={90}
              value={sixMonthDiscountPct}
              onChange={(e) => setSixMonthDiscountPct(e.target.value)}
              required
            />
            <Input
              label="Yearly discount (%)"
              type="number"
              min={0}
              max={90}
              value={yearlyDiscountPct}
              onChange={(e) => setYearlyDiscountPct(e.target.value)}
              required
            />
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save rates"}
              </Button>
            </div>
          </form>
        )}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
      </Panel>

      <Panel className="mt-6 overflow-hidden">
        <div className="border-b border-panel-border px-4 py-3">
          <p className="eyebrow text-lime">Live preview</p>
          <h2 className="display mt-1 text-2xl text-ink">Plan comparison</h2>
        </div>
        <RatesTable plans={plans} />
      </Panel>
    </PinGate>
  );
}
