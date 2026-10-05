import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { campaignTick } from "@/components/campaign-ink";
import { ChartLens } from "@/components/chart-lens";
import type { Point } from "@/lib/kinetics";

export function AxisChart({
  unit,
  xLabel,
  points,
  tone = "#8e2430",
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
    <figure className="campaign-chart">
      <figcaption className="mb-2 text-sm">
        {xLabel} · {unit}
      </figcaption>
      <ChartLens data={points}>
        {(view) => (
          <div className="lore-screen h-56 w-full">
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view} barCategoryGap="18%" margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(180, 150, 110, 0.16)" vertical={false} />
                  <XAxis dataKey="x" stroke="#8d7356" tick={campaignTick} tickLine={false} minTickGap={12} />
                  <YAxis stroke="#8d7356" tick={campaignTick} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ background: "#140e0c", color: "#cbb892", border: "1px solid #6a3030" }}
                    formatter={(value) => [value, unit]}
                    labelFormatter={(label) => `${xLabel} ${label}`}
                  />
                  <Bar dataKey="y" fill={tone} fillOpacity={dash ? 0.72 : 1} maxBarSize={26} name={unit} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        )}
      </ChartLens>
    </figure>
  );
}