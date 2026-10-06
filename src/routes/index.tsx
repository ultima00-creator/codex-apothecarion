import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dayPlot, doseHorizon, formatDay, fuseIngestions, groupDays, loadDiary, weekday, type Ingestion } from "@/lib/diary";
import { openAlarmFiles, syncAlarmCalendar } from "@/lib/alarms";
import { DiaryChart } from "@/components/diary-chart";
import { BookMark, VialMark } from "@/components/relic-marks";
import { inkFor } from "@/lib/substance-face";
import { displayUnit } from "@/lib/dose";

export const Route = createFileRoute("/")({ component: DiaryHome });

function DiaryHome() {
  const [rows, setRows] = useState<Ingestion[]>([]);
  useEffect(() => {
    const pull = () => setRows(loadDiary());
    pull();
    window.addEventListener("apothecarion-settled", pull);
    return () => window.removeEventListener("apothecarion-settled", pull);
  }, []);
  const days = groupDays(rows);
  const plot = dayPlot(rows);
  const ordered = fuseIngestions(rows);
  return (
    <main className="status">
      <header className="status-bar">
        <div>
          <p className="kicker kicker-row"><img src="/relics/sigil-registro.png" alt="" className="sigil" /> Registro</p>
          <h1 className="screen-title font-display">Diarium</h1>
        </div>
      </header>
      <button
        type="button"
        className="clear-alarms"
        onClick={() => openAlarmFiles(syncAlarmCalendar(loadDiary()))}
      >
        Rearmar
      </button>
      <div className="status-void">
        <DiaryChart points={plot.points} series={plot.series} captions={plot.captions} nowLabel={plot.nowLabel} empty="O traçado visual surge quando um composto em efeito traz duração ou meia-vida." />
      </div>
      {ordered.length === 0 ? (
        <Link to="/codex" className="status-gate">
          <img src="/relics/sigil-codex.png" alt="" className="sigil" />
          <span className="kicker">Database</span>
          <span className="datum">Registrar</span>
        </Link>
      ) : (
        <ul className="ledger">
          {ordered.map((group) => (
              <li key={group.key} className="ledger-card">
                <Link to="/abrir/$kind/$id" params={{ kind: group.kind, id: group.substanceId }} className="ledger-head">
                  <VialMark className="ico" style={{ color: inkFor(group.kind, group.substanceId) }} />
                  <span className="datum">{group.name}</span>
                </Link>
                {group.doses.map((row) => {
                  const when = new Date(row.takenAt);
                  const clock = when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const end = doseHorizon(row);
                  const endClock = end ? end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
                  const endDay = end && end.toDateString() !== when.toDateString()
                    ? end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                    : null;
                  return (
                    <div key={row.id} className="ledger-dose">
                      <span className="tile-meta">
                        {clock} · {Math.round(row.dose * 1000) / 1000} {displayUnit(row.unit)}
                        {endClock ? ` · até ~${endDay ? `${endDay} ` : ""}${endClock}` : ""}
                      </span>
                      <Link to="/tomar" search={{ kind: "", id: "", edit: row.id }} className="ledger-edit">Editar</Link>
                    </div>
                  );
                })}
              </li>
            ))}
        </ul>
      )}
      {days.length > 1 ? (
        <ul className="ledger">
          {days.map((day) => (
            <li key={day.key}>
              <Link to="/dia/$day" params={{ day: day.key }}>
                <BookMark className="ico" />
                <span className="ledger-copy">
                  <span className="datum">{formatDay(day.key)}</span>
                  <span className="tile-meta">{weekday(day.key)} · {day.rows.length}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
