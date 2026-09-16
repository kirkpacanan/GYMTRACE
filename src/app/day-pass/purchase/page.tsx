"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";

export default function DayPassPurchasePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<"GCash" | "Card">("GCash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const pass = await api.purchaseDayPass({ name, contact, method });
      sessionStorage.setItem("gymtrace_day_pass", JSON.stringify(pass));
      router.push("/day-pass/issued");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Purchase Day Pass"
        subtitle="One-day access · ₱250 · mock GCash / Card payment."
        backHref="/"
      />
      <Panel className="mx-auto max-w-lg p-6 sm:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full name"
          />
          <Input
            label="Contact"
            name="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            placeholder="09XXXXXXXXX"
          />
          <div>
            <p className="mb-2 text-sm text-muted">Payment</p>
            <div className="flex gap-2">
              {(["GCash", "Card"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
                    method === m
                      ? "border-lime bg-lime/10 text-lime"
                      : "border-panel-border text-muted hover:border-lime/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-3 display text-2xl text-lime">₱250</p>
          </div>
          {error ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={loading} className="flex-1">
              {loading ? "Processing…" : "Pay & Issue Pass"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have a code?{" "}
          <button
            type="button"
            className="text-lime hover:underline"
            onClick={() => router.push("/day-pass/entry")}
          >
            Enter gym
          </button>
        </p>
      </Panel>
    </PageTransition>
  );
}
