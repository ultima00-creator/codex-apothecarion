import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Panel } from "@/lib/cycle";

export function CycleChart({ panel }: { panel: Panel }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <figure className="border border-rule p-3">
      <figcaption className="mb-1 font-display text-2xl">{panel.title}</figcaption>
      <p className="mb-2 text-sm text-muted">{panel.unit}. {panel.note}</p>
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={panel.points}>
              <CartesianGrid stroke="var(--color-rule)" />
              <XAxis dataKey="x" stroke="var(--color-muted)" tick={{ fill: "var(--color-ink)", fontSize: 11 }} minTickGap={24} />
              <YAxis stroke="var(--color-muted)" tick={{ fill: "var(--color-ink)", fontSize: 11 }} width={48} />
              <Tooltip />
              {panel.series.map((item) => (
                <Line key={item.id} type="monotone" dataKey={item.id} name={item.name} stroke={item.tone} dot={false} strokeWidth={3} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {panel.series.map((item) => (
          <li key={item.id} style={{ color: item.tone }}>{item.name}</li>
        ))}
      </ul>
    </figure>
  );
}
