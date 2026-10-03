import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiaryCaption, DiarySeries } from "@/lib/diary";

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
    return <p className="text-sm text-muted">{empty}</p>;
  }
  const lines = captions.length > 0 ? captions : series.map((item) => ({ id: item.id, tone: item.tone, text: item.name }));
  return (
    <figure className="chart-ink glass-card">
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <CartesianGrid stroke="rgba(90,70,64,0.35)" />
              <XAxis dataKey="x" stroke="#8a7b72" tick={{ fill: "#2a211c", fontSize: 11 }} minTickGap={18} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                contentStyle={{ background: "#fff", color: "#111", border: "1px solid #2a211c" }}
                labelStyle={{ color: "#111" }}
                itemStyle={{ color: "#111" }}
              />
              {nowLabel ? <ReferenceLine x={nowLabel} stroke="#1a120f" strokeWidth={2} label={{ value: "Agora", fill: "#1a120f", fontSize: 11, position: "top" }} /> : null}
              {series.map((item) => (
                <Area
                  key={item.id}
                  type="monotone"
                  dataKey={item.id}
                  name={item.name}
                  stroke={item.tone}
                  fill={item.tone}
                  fillOpacity={0.28}
                  strokeDasharray={item.curve === "half_life" ? "5 4" : item.curve === "duration" ? "2 3" : undefined}
                  strokeWidth={2.5}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-[#2a211c]">
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
