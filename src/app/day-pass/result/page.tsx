"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import type { DayPass } from "@/lib/db";

type Result = {
  granted: boolean;
  reason: string;
  dayPass?: DayPass;
};

export default function DayPassResultPage() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gymtrace_day_pass_result");
    if (raw) setResult(JSON.parse(raw) as Result);
  }, []);

  const granted = result?.granted;

  return (
    <PageTransition>
      <PageHeader
        title={granted ? "Entry Allowed" : "Entry Blocked"}
        subtitle={result?.reason || "Validate a pass first."}
        backHref="/day-pass/entry"
      />
      <Panel className="p-8 sm:p-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`display text-[clamp(3rem,10vw,6rem)] ${
            granted ? "text-success" : "text-danger"
          }`}
        >
          {granted ? "GO" : "STOP"}
        </motion.p>
        <div className="hairline my-5 max-w-sm" />
        <p className="text-lg text-ink">{result?.reason}</p>
        {result?.dayPass ? (
          <p className="mt-2 font-mono text-sm text-muted">
            {result.dayPass.code} · {result.dayPass.name}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {granted ? (
            <Link href="/">
              <Button size="lg">Back to Role Select</Button>
            </Link>
          ) : (
            <Link href="/day-pass/entry">
              <Button size="lg">Try Another Code</Button>
            </Link>
          )}
          <Link href="/day-pass/purchase">
            <Button size="lg" variant="outline">
              Buy Day Pass
            </Button>
          </Link>
        </div>
      </Panel>
    </PageTransition>
  );
}
