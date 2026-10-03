import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Panel } from "@/lib/cycle";

export function CycleChart({ panel }: { panel: Panel }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <figure className="glass-card">
      <figcaption className="datum mb-1">{panel.title}</figcaption>
      <p className="mb-2 text-sm text-[#2a211c]">{panel.unit}. {panel.note}</p>
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={panel.points}>
              <CartesianGrid stroke="rgba(90,70,64,0.35)" />
              <XAxis dataKey="x" stroke="#8a7b72" tick={{ fill: "#2a211c", fontSize: 11 }} minTickGap={24} />
              <YAxis stroke="#8a7b72" tick={{ fill: "#2a211c", fontSize: 11 }} width={48} />
              <Tooltip contentStyle={{ background: "#fff", color: "#111", border: "1px solid #2a211c" }} />
              {panel.series.map((item) => (
                <Area key={item.id} type="monotone" dataKey={item.id} name={item.name} stroke={item.tone} fill={item.tone} fillOpacity={0.22} strokeWidth={2.5} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-[#2a211c]">
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
