"use client";

import { useCallback, useEffect, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { DayPass } from "@/lib/db";

export default function StaffDayPassesPage() {
  const [items, setItems] = useState<DayPass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DayPass | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api.dayPasses();
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removePass() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteDayPass(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink">Day Passes</h1>
      <p className="mt-2 text-muted">Sales and usage status for guest passes.</p>

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Panel className="w-full max-w-md p-5 sm:p-6">
            <p className="eyebrow text-danger">Delete day pass</p>
            <h2 className="display mt-2 text-3xl text-ink">{deleting.code}</h2>
            <p className="mt-3 text-sm text-muted">
              Removes {deleting.name}&apos;s pass and any linked attendance
              check-ins for this code.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => void removePass()}
              >
                {busy ? "Deleting…" : "Delete"}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel className="mt-6 overflow-x-auto">
        {error ? (
          <p className="p-6 text-danger">{error}</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Actions</th>
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
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      className="rounded-lg border border-danger/40 px-2 py-1 text-[11px] uppercase tracking-wide text-danger hover:bg-danger/10"
                    >
                      Delete
                    </button>
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
