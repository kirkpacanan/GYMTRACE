"use client";

import { useCallback, useEffect, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import {
  OccupancyChart,
  RevenueSplitChart,
  StatBlock,
} from "@/components/ui/Charts";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";

type RevenueData = Awaited<ReturnType<typeof api.reports>>;

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.reports());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PinGate role="admin">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-lime">{data?.monthLabel ?? "This month"}</p>
          <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">
            Revenue
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Membership and day-pass income — kept separate from occupancy so
            finance stays easy to read.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <Panel className="mt-6 p-6 text-danger">{error}</Panel>
      ) : (
        <>
          <section className="mt-8">
            <p className="eyebrow mb-3">Membership</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatBlock
                label="Total members"
                value={data?.totalMembers ?? "—"}
                hint={
                  data ? `${data.activeMembers} currently active` : undefined
                }
              />
              <StatBlock
                label="Member revenue (month)"
                value={data ? peso(data.memberRevenueMonth) : "—"}
                hint={
                  data
                    ? `${data.membersPaidMonth} memberships recorded`
                    : undefined
                }
              />
            </div>
          </section>

          <section className="mt-8">
            <p className="eyebrow mb-3">Day passes</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatBlock
                label="Day-pass revenue (month)"
                value={data ? peso(data.dayPassRevenueMonth) : "—"}
                hint={
                  data
                    ? `${data.dayPassCountMonth} passes sold`
                    : undefined
                }
              />
              <StatBlock
                label="Day-pass revenue (7d)"
                value={data ? peso(data.dayPassRevenueWeek) : "—"}
                hint={
                  data
                    ? `${data.dayPassCountWeek} passes this week`
                    : undefined
                }
              />
            </div>
          </section>

          <section className="mt-8">
            <p className="eyebrow mb-3">Combined</p>
            <StatBlock
              label="Total revenue (month)"
              value={data ? peso(data.totalRevenueMonth) : "—"}
              hint="Memberships + day passes"
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">Revenue mix (7d)</h2>
              <p className="mt-1 text-xs text-muted">
                Stacked membership vs day-pass income by day
              </p>
              {data?.revenueWeekSeries ? (
                <RevenueSplitChart data={data.revenueWeekSeries} />
              ) : null}
            </Panel>
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">Gym entries (7d)</h2>
              <p className="mt-1 text-xs text-muted">
                Foot traffic context for revenue days
              </p>
              {data ? (
                <OccupancyChart data={data.weekSeries} dataKey="entries" />
              ) : null}
            </Panel>
          </div>
        </>
      )}
    </PinGate>
  );
}
