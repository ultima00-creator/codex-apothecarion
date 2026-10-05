import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { DiaryChart } from "@/components/diary-chart";
import { clock, dayKey, dayPlot, formatDay, fuseIngestions, loadDiary, removeIngestion, resolveCurve, type Ingestion } from "@/lib/diary";
import { displayUnit } from "@/lib/dose";
import { viaPt } from "@/lib/pt";
import { BookMark, VialMark } from "@/components/relic-marks";
import { inkFor } from "@/lib/substance-face";

export const Route = createFileRoute("/dia/$day")({ component: DayPage });

function DayPage() {
  const { day } = Route.useParams();
  const [rows, setRows] = useState<Ingestion[]>([]);
  useEffect(() => setRows(loadDiary().filter((row) => dayKey(row.takenAt) === day)), [day]);
  const plot = dayPlot(rows);
  return (
    <main className="space-y-4">
      <Link to="/" className="text-sm text-bronze">Diarium</Link>
      <h1 className="screen-title font-display kicker-row"><BookMark className="ico ico-lg" /> {formatDay(day)}</h1>
      <DiaryChart points={plot.points} series={plot.series} />
      {rows.length === 0 ? <p className="text-sm">Nada em efeito neste dia.</p> : null}
      <ul>
        {fuseIngestions(rows).map((group) => {
          const drawn = resolveCurve(group.kind, group.substanceId);
          return (
          <li key={group.key} className="flex items-start gap-3 border-t border-rule py-3">
            <VialMark className="ico" style={{ color: inkFor(group.kind, group.substanceId) }} />
            <span className="min-w-0 flex-1">
              <Link to="/abrir/$kind/$id" params={{ kind: group.kind, id: group.substanceId }} className="datum">
                {group.name}
              </Link>
              {group.doses.map((row) => (
                <span key={row.id} className="block text-sm">
                  {clock(row.takenAt)} · {row.dose} {displayUnit(row.unit)} · {viaPt(row.route)}
                  {row.route === "oral" ? ` · estômago ${row.stomachQuarters}/4` : ""}
                </span>
              ))}
              {drawn === "none" ? <span className="block text-sm text-muted">Sem duração e sem meia-vida na ficha. Não entra no gráfico.</span> : null}
              {drawn === "duration" ? <span className="block text-sm text-muted">As curvas desta substância estão fundidas. Não é meia-vida medida.</span> : null}
            </span>
            <button
              type="button"
              className="min-h-11 text-sm underline"
              onClick={() => {
                for (const row of group.doses) removeIngestion(row.id);
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
