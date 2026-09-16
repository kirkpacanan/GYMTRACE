"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";

export default function DayPassEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gymtrace_day_pass");
    if (raw) {
      try {
        const pass = JSON.parse(raw) as { code?: string };
        if (pass.code) setCode(pass.code);
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.validateDayPass(code);
      sessionStorage.setItem(
        "gymtrace_day_pass_result",
        JSON.stringify(result),
      );
      router.push("/day-pass/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Day-Pass Entry"
        subtitle="Validate your pass code to log attendance."
        backHref="/day-pass/purchase"
      />
      <Panel className="mx-auto max-w-md p-6 sm:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Pass Code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DP-2201"
            required
            className="display tracking-wider"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Validating…" : "Validate & Enter"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          Demo codes: DP-2201, DP-2202
        </p>
      </Panel>
    </PageTransition>
  );
}
