import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiaryCaption, DiarySeries } from "@/lib/diary";
import { ChartMark } from "@/components/relic-marks";
import { campaignTick } from "@/components/campaign-ink";
import { ChartLens } from "@/components/chart-lens";

export function DiaryChart({
  points,
  series,
  captions = [],
  nowLabel = null,
  empty = "Sem duração e sem meia-vida neste dia. A lista fica. A curva não é inventada.",
}: {
  points: Record<string, number | string | null>[];
  series: DiarySeries[];
  captions?: DiaryCaption[];
  nowLabel?: string | null;
  empty?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (series.length === 0) {
    return <p className="void-note"><ChartMark className="ico" />{empty}</p>;
  }
  const lines = captions.length > 0 ? captions : series.map((item) => ({ id: item.id, tone: item.tone, text: item.name }));
  return (
    <figure className="campaign-chart">
      <ChartLens data={points}>
        {(view) => (
          <div className="lore-screen h-56 w-full">
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view} barCategoryGap="18%" barGap={2} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(180, 150, 110, 0.16)" vertical={false} />
                  <XAxis dataKey="x" stroke="#8d7356" tick={campaignTick} tickLine={false} minTickGap={12} />
                  <YAxis hide domain={[0, (max: number) => Math.max(1, max || 1)]} />
                  <Tooltip
                    contentStyle={{ background: "#140e0c", color: "#cbb892", border: "1px solid #6a3030" }}
                    labelStyle={{ color: "#cbb892" }}
                    itemStyle={{ color: "#e7d3b0" }}
                  />
                  {nowLabel && view.some((point) => point.x === nowLabel) ? <ReferenceLine x={nowLabel} stroke="#cbb892" strokeWidth={1} label={{ value: "Agora", fill: "#cbb892", fontSize: 11, position: "top" }} /> : null}
                  {series.map((item) => (
                    <Bar key={item.id} dataKey={item.id} name={item.name} fill={item.tone} maxBarSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        )}
      </ChartLens>
      <ul className="mt-2 space-y-1 text-sm">
        {lines.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="mt-1 inline-block w-1 shrink-0 self-stretch" style={{ background: item.tone }} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
