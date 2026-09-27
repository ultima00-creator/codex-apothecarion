import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { DiaryChart } from "@/components/diary-chart";
import { clock, dayKey, dayPlot, formatDay, loadDiary, removeIngestion, resolveCurve, type Ingestion } from "@/lib/diary";
import { mark } from "@/lib/mark";
import { viaPt } from "@/lib/pt";

export const Route = createFileRoute("/dia/$day")({ component: DayPage });

function DayPage() {
  const { day } = Route.useParams();
  const [rows, setRows] = useState<Ingestion[]>([]);
  useEffect(() => setRows(loadDiary().filter((row) => dayKey(row.takenAt) === day)), [day]);
  const plot = dayPlot(rows);
  return (
    <main className="space-y-4">
      <Link to="/" className="text-sm text-bronze">Diarium</Link>
      <h1 className="font-display text-4xl leading-none">{formatDay(day)}</h1>
      <DiaryChart points={plot.points} series={plot.series} />
      {rows.length === 0 ? <p className="text-sm">Nada em efeito neste dia.</p> : null}
      <ul>
        {rows.map((row) => {
          const drawn = resolveCurve(row.kind, row.substanceId);
          return (
          <li key={row.id} className="flex items-start gap-3 border-t border-rule py-3">
            <span className="w-1 shrink-0 self-stretch border-l-4" style={{ borderColor: mark(`${row.kind}:${row.substanceId}`) }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted">{clock(row.takenAt)}</span>
              <Link to="/abrir/$kind/$id" params={{ kind: row.kind, id: row.substanceId }} className="font-display text-2xl">
                {row.name}
              </Link>
              <span className="block text-sm">
                {row.dose} {row.unit} · {viaPt(row.route)}
                {row.route === "oral" ? ` · estômago ${row.stomachQuarters}/4` : ""}
              </span>
              {drawn === "none" ? <span className="block text-sm text-muted">Sem duração e sem meia-vida na ficha. Não entra no gráfico.</span> : null}
              {drawn === "duration" ? <span className="block text-sm text-muted">Linha do tempo da ficha. Não é meia-vida medida.</span> : null}
            </span>
            <button
              type="button"
              className="min-h-11 text-sm underline"
              onClick={() => {
                removeIngestion(row.id);
                setRows(loadDiary().filter((item) => dayKey(item.takenAt) === day));
              }}
            >
              Tirar
            </button>
          </li>
          );
        })}
      </ul>
    </main>
  );
}
