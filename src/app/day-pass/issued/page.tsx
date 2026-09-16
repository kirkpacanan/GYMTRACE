"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import type { DayPass } from "@/lib/db";

export default function DayPassIssuedPage() {
  const [pass, setPass] = useState<DayPass | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gymtrace_day_pass");
    if (raw) setPass(JSON.parse(raw) as DayPass);
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Day Pass Issued"
        subtitle="Show this code at the entrance kiosk."
        backHref="/day-pass/purchase"
      />
      <Panel className="p-8 sm:p-12">
        <p className="eyebrow text-lime">Access code</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="display mt-4 text-[clamp(3.5rem,14vw,8rem)] text-lime"
        >
          {pass?.code ?? "—"}
        </motion.p>
        <div className="hairline my-6 max-w-md" />
        <p className="text-muted">
          {pass ? `${pass.name} · ₱${pass.amount}` : "No pass in session"}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/day-pass/entry">
            <Button size="lg">Continue to Entry</Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="ghost">
              Role Select
            </Button>
          </Link>
        </div>
      </Panel>
    </PageTransition>
  );
}
