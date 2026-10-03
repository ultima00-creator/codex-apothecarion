import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point } from "@/lib/kinetics";

export function AxisChart({
  unit,
  xLabel,
  points,
  tone = "var(--color-bronze)",
  dash = false,
}: {
  unit: string;
  xLabel: string;
  points: Point[];
  tone?: string;
  dash?: boolean;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <figure className="chart-ink glass-card">
      <figcaption className="mb-2 text-sm">
        {xLabel} · {unit}
      </figcaption>
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <CartesianGrid stroke="rgba(90,70,64,0.35)" />
              <XAxis dataKey="x" stroke="#8a7b72" tick={{ fill: "#2a211c", fontSize: 11 }} minTickGap={18} />
              <YAxis stroke="#8a7b72" tick={{ fill: "#2a211c", fontSize: 11 }} width={48} />
              <Tooltip
                contentStyle={{ background: "#fff", color: "#111", border: "1px solid #2a211c" }}
                formatter={(value) => [value, unit]}
                labelFormatter={(label) => `${xLabel} ${label}`}
              />
              <Area type="monotone" dataKey="y" stroke={tone} fill={tone} fillOpacity={0.28} strokeDasharray={dash ? "5 4" : undefined} strokeWidth={2.5} name={unit} />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </figure>
  );
}
