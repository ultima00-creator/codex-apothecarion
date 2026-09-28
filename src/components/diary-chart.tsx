import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiarySeries } from "@/lib/diary";

function legend(curve: DiarySeries["curve"]): string {
  if (curve === "half_life") return "meia-vida, atraso oral se houver";
  if (curve === "duration") return "duração da ficha: início, subida, pico, descida. Não é meia-vida medida";
  return "fração do próprio pico, sem atraso gástrico";
}

export function DiaryChart({
  points,
  series,
  empty = "Sem duração e sem meia-vida neste dia. A lista fica. A curva não é inventada.",
}: {
  points: Record<string, number | string | null>[];
  series: DiarySeries[];
  empty?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (series.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <figure className="chart-ink">
      <figcaption className="mb-2 text-sm text-muted">Traçado visual. Fração da própria dose. Não é medição.</figcaption>
      <div className="h-56 w-full">
        {ready ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid stroke="var(--color-rule)" />
              <XAxis dataKey="x" stroke="var(--color-muted)" tick={{ fill: "#111", fontSize: 11 }} minTickGap={18} />
              <YAxis domain={[0, 1]} stroke="var(--color-muted)" tick={{ fill: "#111", fontSize: 11 }} width={32} />
              <Tooltip
                contentStyle={{ color: "#111" }}
                labelStyle={{ color: "#111" }}
                itemStyle={{ color: "#111" }}
              />
              {series.map((item) => (
                <Line
                  key={item.id}
                  type="monotone"
                  dataKey={item.id}
                  name={item.name}
                  stroke={item.tone}
                  strokeDasharray={item.curve === "half_life" ? "5 4" : item.curve === "duration" ? "2 3" : undefined}
                  dot={false}
                  strokeWidth={3}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {series.map((item) => (
          <li key={item.id} style={{ color: "#f7fafc" }}>
            {item.name} · {legend(item.curve)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
