import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point } from "@/lib/kinetics";

export function AxisChart({
  unit,
  xLabel,
  points,
  tone = "var(--color-bronze)",
}: {
  unit: string;
  xLabel: string;
  points: Point[];
  tone?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <figure>
      <figcaption className="mb-2 text-sm text-muted">
        {xLabel} · {unit}
      </figcaption>
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid stroke="var(--color-rule)" />
              <XAxis dataKey="x" stroke="var(--color-muted)" tick={{ fill: "var(--color-ink)", fontSize: 12 }} />
              <YAxis stroke="var(--color-muted)" tick={{ fill: "var(--color-ink)", fontSize: 12 }} width={56} />
              <Tooltip
                formatter={(value) => [value, unit]}
                labelFormatter={(label) => `${xLabel} ${label}`}
              />
              <Line type="monotone" dataKey="y" stroke={tone} dot={false} strokeWidth={2} name={unit} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </figure>
  );
}
