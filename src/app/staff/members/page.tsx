"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { Member, MemberStatus } from "@/lib/db";

export default function StaffMembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.members();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function enroll(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createMember({ name, contact, status: "active" });
      setName("");
      setContact("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enroll failed");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: number, status: MemberStatus) {
    await api.updateMember(id, { status });
    await load();
  }

  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink">Members</h1>
      <p className="mt-2 text-muted">Enroll new faces and update membership status.</p>

      <Panel className="mt-6 p-5 sm:p-6">
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-muted">
          Enroll member
        </h2>
        <form
          onSubmit={enroll}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              Enroll
            </Button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>

      <Panel className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-panel-border text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Face tag</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-panel-border/60">
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3 text-muted">{m.contact}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      m.status === "active"
                        ? "bg-success/15 text-success"
                        : m.status === "expired"
                          ? "bg-danger/15 text-danger"
                          : "bg-white/10 text-muted"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {m.faceTag}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(["active", "expired", "frozen"] as MemberStatus[]).map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={m.status === s}
                          onClick={() => void setStatus(m.id, s)}
                          className="rounded-lg border border-panel-border px-2 py-1 text-[11px] text-muted hover:border-lime/40 hover:text-lime disabled:opacity-30"
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="p-6 text-center text-muted">No members yet.</p>
        ) : null}
      </Panel>
    </PinGate>
  );
}
