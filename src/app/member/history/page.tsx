"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { Attendance } from "@/lib/db";

function formatEntry(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MemberHistoryPage() {
  const [items, setItems] = useState<Attendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [memberLabel, setMemberLabel] = useState("Member");

  useEffect(() => {
    const idRaw = sessionStorage.getItem("gymtrace_member_id") || "1";
    const id = Number(idRaw);
    const scan = sessionStorage.getItem("gymtrace_last_scan");
    if (scan) {
      try {
        const parsed = JSON.parse(scan) as { member?: { name?: string } };
        if (parsed.member?.name) setMemberLabel(parsed.member.name);
      } catch {
        /* ignore */
      }
    }
    api
      .memberAttendance(id)
      .then((res) => setItems(res.items))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load history"),
      );
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Attendance History"
        subtitle={`Personal visits for ${memberLabel}.`}
        backHref="/member/check-in"
      />
      <Panel className="divide-y divide-panel-border overflow-hidden">
        {error ? (
          <p className="p-6 text-danger">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted">
            No attendance records yet. Complete a face check-in first.
          </p>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-medium text-ink">{formatEntry(item.entryAt)}</p>
                <p className="text-xs uppercase tracking-wider text-muted">
                  {item.source.replace("_", " ")}
                </p>
              </div>
              <span className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs text-lime">
                Entry
              </span>
            </motion.div>
          ))
        )}
      </Panel>
    </PageTransition>
  );
}
