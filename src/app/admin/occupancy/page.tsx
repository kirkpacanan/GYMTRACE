"use client";

import { useCallback, useEffect, useState } from "react";
import { PinGate } from "@/components/screens/PinGate";
import { Button } from "@/components/ui/Button";
import {
  ActualVsPredictedChart,
  FeatureImportanceChart,
  ForecastAreaChart,
  OccupancyChart,
  StatBlock,
} from "@/components/ui/Charts";
import { Panel } from "@/components/ui/Panel";
import { api } from "@/lib/api-client";
import type { OccupancySnapshot } from "@/lib/occupancy";

export default function AdminOccupancyPage() {
  const [data, setData] = useState<OccupancySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.occupancy());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PinGate role="admin">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-lime">Machine learning</p>
          <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">
            Occupancy
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Live headcount plus crowd prediction charts from the campus gym
            model.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh Forecast
        </Button>
      </div>

      {error ? (
        <Panel className="mt-6 p-6 text-danger">{error}</Panel>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatBlock label="Now" value={`${data?.now ?? "—"} people`} />
            <StatBlock
              label="Next 30 min"
              value={`${data?.next30 ?? "—"} people`}
              hint="Model forecast"
            />
            <StatBlock
              label="Load"
              value={data ? `${data.loadPercent}%` : "—"}
              hint={
                data
                  ? `Cap ${data.capacity} · Peak ${data.peakLabel}`
                  : undefined
              }
            />
          </div>

          {data?.metrics ? (
            <Panel className="mt-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Active model</p>
                  <h2 className="display mt-2 text-2xl text-ink">
                    {data.metrics.modelName}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {data.metrics.trainedOn}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "MAE", v: data.metrics.mae },
                    { k: "RMSE", v: data.metrics.rmse },
                    { k: "R²", v: data.metrics.r2 },
                    { k: "MAPE", v: `${data.metrics.mape}%` },
                  ].map((m) => (
                    <div
                      key={m.k}
                      className="border border-panel-border bg-bg-elevated px-3 py-2 text-center"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        {m.k}
                      </p>
                      <p className="display mt-1 text-xl text-lime">{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">12-hour forecast</h2>
              <p className="mt-1 text-xs text-muted">
                Predicted headcount with uncertainty band
              </p>
              {data ? <ForecastAreaChart data={data.forecast12h} /> : null}
            </Panel>
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">Actual vs predicted</h2>
              <p className="mt-1 text-xs text-muted">
                Past hours (bars) against ML line — upcoming hours predicted only
              </p>
              {data ? (
                <ActualVsPredictedChart data={data.actualVsPredicted} />
              ) : null}
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">Peak hours</h2>
              <p className="mt-1 text-xs text-muted">
                Typical busy windows · peak {data?.peakLabel ?? "—"}
              </p>
              {data ? <OccupancyChart data={data.series} /> : null}
            </Panel>
            <Panel className="p-4 sm:p-6">
              <h2 className="display text-xl text-ink">Feature importance</h2>
              <p className="mt-1 text-xs text-muted">
                What drives the crowdedness prediction
              </p>
              {data ? (
                <FeatureImportanceChart data={data.featureImportance} />
              ) : null}
            </Panel>
          </div>

          <Panel className="mt-6 overflow-hidden">
            <div className="border-b border-panel-border px-5 py-4">
              <h2 className="display text-xl text-ink">7-day peak outlook</h2>
              <p className="mt-1 text-xs text-muted">
                Predicted daily peak occupancy
              </p>
            </div>
            <div className="grid sm:grid-cols-7">
              {data?.weekPeaks.map((d) => (
                <div
                  key={d.label}
                  className="border-b border-panel-border p-4 sm:border-b-0 sm:border-r sm:last:border-r-0"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {d.label}
                  </p>
                  <p className="display mt-2 text-3xl text-lime">{d.predicted}</p>
                  <p className="mt-1 text-xs text-muted">{d.busy}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </PinGate>
  );
}
