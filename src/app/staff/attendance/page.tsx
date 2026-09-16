"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PinGate } from "@/components/screens/PinGate";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { Attendance } from "@/lib/db";

function formatEntry(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return d.toLocaleString();
}

export default function StaffAttendancePage() {
  const [items, setItems] = useState<Attendance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .attendance()
      .then((r) => setItems(r.items))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load logs"),
      );
  }, []);

  return (
    <PinGate role="staff">
      <h1 className="display text-4xl text-ink">Attendance</h1>
      <p className="mt-2 text-muted">Recent face and day-pass entries.</p>
      <Panel className="mt-6 divide-y divide-panel-border overflow-hidden">
        {error ? (
          <p className="p-6 text-danger">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted">No attendance yet.</p>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="font-medium text-ink">
                  {item.memberName ||
                    item.dayPassCode ||
                    `Entry #${item.id}`}
                </p>
                <p className="text-xs text-muted">{formatEntry(item.entryAt)}</p>
              </div>
              <span className="rounded-full border border-panel-border px-3 py-1 text-xs uppercase tracking-wider text-muted">
                {item.source.replace("_", " ")}
              </span>
            </motion.div>
          ))
        )}
      </Panel>
    </PinGate>
  );
}
