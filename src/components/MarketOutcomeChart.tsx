"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type SeriesPoint = { ts: string; price: number };
type ChartResponse = {
  marketId: string;
  outcomes: { id: string; name: string }[];
  series: Record<string, SeriesPoint[]>;
};

const colors = [
  "#1d4ed8",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

export default function MarketOutcomeChart({ marketId }: { marketId: string }) {
  const [range, setRange] = useState("1W");
  const [data, setData] = useState<ChartResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/markets/${marketId}/chart?range=${range}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    };
    load();
  }, [marketId, range]);

  const { rows, outcomeOrder } = useMemo(() => {
    if (!data) return { rows: [], outcomeOrder: [] as string[] };
    // Top 4 outcomes by latest price (descending).
    const latestByOutcome = data.outcomes.map((outcome) => {
      const points = data.series[outcome.id] ?? [];
      const latest = points[points.length - 1]?.price ?? 0;
      return { id: outcome.id, name: outcome.name, latest };
    });
    const top = latestByOutcome
      .sort((a, b) => b.latest - a.latest)
      .slice(0, 4);

    const allTs = new Set<string>();
    top.forEach((item) => {
      (data.series[item.id] ?? []).forEach((point) => allTs.add(point.ts));
    });
    const orderedTs = Array.from(allTs).sort();

    const rows = orderedTs.map((ts) => {
      const row: Record<string, number | string> = { ts };
      top.forEach((item) => {
        const point = (data.series[item.id] ?? []).find((p) => p.ts === ts);
        row[item.id] = point ? point.price : NaN;
      });
      return row;
    });

    return { rows, outcomeOrder: top.map((item) => item.id) };
  }, [data]);

  const outcomeNameById = useMemo(() => {
    if (!data) return new Map<string, string>();
    return new Map(data.outcomes.map((o) => [o.id, o.name]));
  }, [data]);

  if (!data || rows.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        No chart data yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Outcome price history</h3>
        <div className="flex gap-2 text-xs">
          {["1D", "1W", "1M", "ALL"].map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-full border px-3 py-1 ${
                range === value
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-700"
              }`}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <XAxis dataKey="ts" hide />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              width={40}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${(value * 100).toFixed(1)}%`,
                outcomeNameById.get(name) ?? name,
              ]}
              labelFormatter={() => ""}
            />
            {outcomeOrder.map((id, index) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                name={outcomeNameById.get(id) ?? id}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
