import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { campaignTick } from "@/components/campaign-ink";
import { ChartLens } from "@/components/chart-lens";
import type { Panel } from "@/lib/cycle";

function columns(panel: Panel) {
  const points = panel.points;
  const maxBars = 14;
  if (points.length <= maxBars) return points;
  const size = Math.ceil(points.length / maxBars);
  const out: Record<string, number>[] = [];
  for (let i = 0; i < points.length; i += size) {
    const slice = points.slice(i, i + size);
    const row: Record<string, number> = { x: slice[Math.floor(slice.length / 2)].x };
    for (const series of panel.series) {
      row[series.id] = Math.max(...slice.map((point) => Number(point[series.id]) || 0));
    }
    out.push(row);
  }
  return out;
}

export function CycleChart({ panel }: { panel: Panel }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <figure className="campaign-chart">
      <figcaption className="datum mb-1">{panel.title}</figcaption>
      <p className="mb-2 text-sm">{panel.unit}. {panel.note}</p>
      <ChartLens data={panel.points}>
        {(view) => {
          const data = columns({ ...panel, points: view });
          return (
            <div className="lore-screen h-56 w-full">
              {ready ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barCategoryGap="22%" barGap={4} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(180, 150, 110, 0.12)" vertical={false} />
                    <XAxis dataKey="x" stroke="#8d7356" tick={campaignTick} tickLine={false} minTickGap={18} />
                    <YAxis stroke="#8d7356" tick={campaignTick} axisLine={false} tickLine={false} width={42} />
                    <Tooltip contentStyle={{ background: "#140e0c", color: "#cbb892", border: "1px solid #6a3030" }} />
                    {panel.series.map((item) => (
                      <Bar key={item.id} dataKey={item.id} name={item.name} fill={item.tone} maxBarSize={28} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          );
        }}
      </ChartLens>
      <ul className="mt-2 space-y-1 text-sm">
        {panel.series.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="mt-1 inline-block w-1 shrink-0 self-stretch" style={{ background: item.tone }} />
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}