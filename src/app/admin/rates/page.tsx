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
  const [dayPassPrice, setDayPassPrice] = useState("250");
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
      setDayPassPrice(String(res.rates.dayPassPrice));
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
      dayPassPrice: Math.max(1, Math.floor(Number(dayPassPrice) || 1)),
      updatedAt: saved?.updatedAt ?? null,
    }),
    [monthlyPrice, sixMonthDiscountPct, yearlyDiscountPct, dayPassPrice, saved],
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
        dayPassPrice: previewRates.dayPassPrice,
      });
      setSaved(res.rates);
      setMessage(
        "Rates saved. Membership inquiry and day-pass purchase will use these.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PinGate role="admin">
      <h1 className="display text-4xl text-ink sm:text-5xl">Rates</h1>
      <p className="mt-2 max-w-xl text-muted">
        Set membership plan pricing, volume discounts, and the day-pass amount.
        Visitors see these on the inquiry and day-pass purchase pages.
      </p>

      <Panel className="mt-6 p-5 sm:p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading rates…</p>
        ) : (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <Input
              label="Day-pass price (₱)"
              type="number"
              min={1}
              value={dayPassPrice}
              onChange={(e) => setDayPassPrice(e.target.value)}
              required
            />
            <div className="sm:col-span-2 lg:col-span-4">
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
          <p className="mt-1 text-sm text-muted">
            Day pass:{" "}
            <span className="text-lime">{formatPhp(previewRates.dayPassPrice)}</span>
          </p>
        </div>
        <RatesTable plans={plans} />
      </Panel>
    </PinGate>
  );
}
