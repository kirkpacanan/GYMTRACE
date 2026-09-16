"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

const tooltipStyle = {
  background: "#11141a",
  border: "1px solid #2a303c",
  borderRadius: 0,
  color: "#f4f5f7",
  fontFamily: "monospace",
  fontSize: 12,
};

type Point = { label: string; people?: number; entries?: number };

export function OccupancyChart({
  data,
  dataKey = "people",
}: {
  data: Point[];
  dataKey?: "people" | "entries";
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#2a303c" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(212,255,58,0.06)" }}
            contentStyle={tooltipStyle}
          />
          <Bar
            dataKey={dataKey}
            fill="#d4ff3a"
            radius={[0, 0, 0, 0]}
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function ForecastAreaChart({
  data,
}: {
  data: {
    label: string;
    predicted: number;
    lower: number;
    upper: number;
  }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4ff3a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#d4ff3a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d4658" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3d4658" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a303c" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="transparent"
            fill="url(#bandFill)"
            name="Upper bound"
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#d4ff3a"
            strokeWidth={2}
            fill="url(#predFill)"
            name="Predicted"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function ActualVsPredictedChart({
  data,
}: {
  data: {
    label: string;
    actual: number | null;
    predicted: number;
  }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid stroke="#2a303c" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#7d8699", fontFamily: "monospace" }}
          />
          <Bar
            dataKey="actual"
            name="Actual"
            fill="#3d4658"
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="ML predicted"
            stroke="#d4ff3a"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#d4ff3a" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function FeatureImportanceChart({
  data,
}: {
  data: { feature: string; weight: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    pct: Math.round(d.weight * 100),
  }));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke="#2a303c" strokeDasharray="3 6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={120}
            tick={{ fill: "#7d8699", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="pct" name="Importance" fill="#d4ff3a" animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function RevenueSplitChart({
  data,
}: {
  data: { label: string; members: number; dayPasses: number }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-72 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid stroke="#2a303c" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7d8699", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#7d8699", fontFamily: "monospace" }}
          />
          <Bar dataKey="members" name="Memberships" stackId="a" fill="#d4ff3a" />
          <Bar dataKey="dayPasses" name="Day passes" stackId="a" fill="#3d4658" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="relative border border-panel-border bg-bg-elevated p-4 sm:p-5">
      <span className="absolute left-0 top-0 h-full w-[3px] bg-lime" />
      <p className="eyebrow pl-2">{label}</p>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="display mt-2 pl-2 text-4xl text-lime sm:text-5xl"
      >
        {value}
      </motion.p>
      {hint ? (
        <p className="mt-2 pl-2 font-mono text-[11px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
