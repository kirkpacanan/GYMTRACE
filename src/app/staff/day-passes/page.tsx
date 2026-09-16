"use client";

import { useEffect, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { DayPass } from "@/lib/db";

export default function StaffDayPassesPage() {
  const [items, setItems] = useState<DayPass[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dayPasses()
      .then((r) => setItems(r.items))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load"),
      );
  }, []);

  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink">Day Passes</h1>
      <p className="mt-2 text-muted">Sales and usage status for guest passes.</p>
      <Panel className="mt-6 overflow-x-auto">
        {error ? (
          <p className="p-6 text-danger">{error}</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Used</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-panel-border/60">
                  <td className="px-4 py-3 font-mono text-lime">{p.code}</td>
                  <td className="px-4 py-3 text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.contact}</td>
                  <td className="px-4 py-3">₱{p.amount}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(
                      p.paidAt.includes("T")
                        ? p.paidAt
                        : p.paidAt.replace(" ", "T") + "Z",
                    ).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {p.usedAt ? (
                      <span className="text-muted">Used</span>
                    ) : (
                      <span className="text-success">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!error && items.length === 0 ? (
          <p className="p-8 text-center text-muted">No day-pass sales yet.</p>
        ) : null}
      </Panel>
    </PinGate>
  );
}
