"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import type { FaceScanResult } from "@/lib/face-mock";

export default function MemberResultPage() {
  const [result, setResult] = useState<FaceScanResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gymtrace_last_scan");
    if (raw) setResult(JSON.parse(raw) as FaceScanResult);
  }, []);

  const granted = result?.granted;

  return (
    <PageTransition>
      <PageHeader
        title={granted ? "Access Granted" : "Access Denied"}
        subtitle={result?.reason || "Complete a face scan first."}
        backHref="/member/check-in"
      />
      <Panel className="overflow-hidden p-8 sm:p-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`display text-[clamp(3rem,12vw,7rem)] leading-none ${
            granted ? "text-success" : "text-danger"
          }`}
        >
          {granted ? "CLEAR" : "BLOCK"}
        </motion.p>
        <div className="hairline my-6 max-w-md" />
        <h2 className="display text-2xl text-ink sm:text-3xl">
          {granted
            ? result?.member?.name
            : result?.member
              ? result.member.name
              : "No match"}
        </h2>
        <p className="mt-2 max-w-lg text-muted">{result?.reason}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {granted ? (
            <>
              <Link href="/member/occupancy">
                <Button size="lg">View Occupancy</Button>
              </Link>
              <Link href="/member/history">
                <Button size="lg" variant="outline">
                  Attendance History
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/member/check-in">
                <Button size="lg">Try Again</Button>
              </Link>
              <Link href="/member/occupancy">
                <Button size="lg" variant="outline">
                  Skip to Occupancy
                </Button>
              </Link>
            </>
          )}
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
