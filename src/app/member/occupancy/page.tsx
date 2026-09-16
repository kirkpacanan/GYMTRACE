"use client";

import { useCallback, useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { OccupancyChart, StatBlock } from "@/components/ui/Charts";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { OccupancySnapshot } from "@/lib/occupancy";

export default function MemberOccupancyPage() {
  const [data, setData] = useState<OccupancySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.occupancy());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageTransition>
      <PageHeader
        title="Predicted Occupancy"
        subtitle="Live headcount and next-30-minute forecast."
        backHref="/member/check-in"
      />
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh Forecast
        </Button>
      </div>
      {error ? (
        <Panel className="p-6 text-danger">{error}</Panel>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatBlock
              label="Now"
              value={loading ? "—" : `${data?.now ?? 0} people`}
            />
            <StatBlock
              label="Next 30 min"
              value={loading ? "—" : `${data?.next30 ?? 0} people`}
            />
            <StatBlock
              label="Capacity"
              value={data?.capacity ?? 80}
              hint={
                data ? `Load ${data.loadPercent}% · Peak ${data.peakLabel}` : undefined
              }
            />
          </div>
          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-muted">
              Forecast chart
            </h2>
            {data ? <OccupancyChart data={data.series} /> : null}
          </Panel>
        </>
      )}
    </PageTransition>
  );
}
