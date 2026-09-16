"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScanRing } from "@/components/motion/ScanRing";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";

export default function MemberCheckInPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "granted" | "denied">(
    "idle",
  );
  const [statusText, setStatusText] = useState("Ready to scan");

  async function startScan() {
    if (scanning) return;
    setScanning(true);
    setStatus("scanning");
    setStatusText("Scanning biometrics…");
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const result = await api.scanFace();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gymtrace_last_scan", JSON.stringify(result));
        if (result.member) {
          sessionStorage.setItem(
            "gymtrace_member_id",
            String(result.member.id),
          );
        }
      }
      setStatus(result.granted ? "granted" : "denied");
      setStatusText(
        result.granted
          ? `Welcome, ${result.member?.name}`
          : result.reason,
      );
      setTimeout(() => {
        router.push("/member/result");
      }, 700);
    } catch (e) {
      setStatus("denied");
      setStatusText(
        e instanceof Error ? e.message : "Scan failed — try again",
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Face Check-In"
        subtitle="Verify membership → log entry → refresh occupancy."
        backHref="/"
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <Panel className="p-5 sm:p-8">
          <ScanRing
            scanning={scanning || status === "scanning"}
            status={status}
          />
        </Panel>
        <div className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Scanner status</p>
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="display mt-2 text-3xl text-ink sm:text-4xl"
            >
              {statusText}
            </motion.p>
          </div>
          <div className="hairline" />
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={startScan} disabled={scanning}>
              {scanning ? "Scanning…" : "Start Face Scan"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/member/occupancy")}
            >
              View Occupancy
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push("/member/history")}
            >
              My Attendance
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
