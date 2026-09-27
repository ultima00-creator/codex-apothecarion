import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dismissNotice, dayPlot, formatDay, groupDays, loadDiary, loadNotices, weekday, type EndedNotice, type Ingestion } from "@/lib/diary";
import { DiaryChart } from "@/components/diary-chart";
import { DiariumMark } from "@/components/marks";
import { mark } from "@/lib/mark";

export const Route = createFileRoute("/")({ component: DiaryHome });

function DiaryHome() {
  const [rows, setRows] = useState<Ingestion[]>([]);
  const [notices, setNotices] = useState<EndedNotice[]>([]);
  useEffect(() => {
    setRows(loadDiary());
    setNotices(loadNotices());
  }, []);
  const days = groupDays(rows);
  const plot = dayPlot(rows);
  return (
    <main>
      <header className="mb-3 flex items-center gap-3">
        <DiariumMark className="size-12 shrink-0" />
        <div>
          <p className="kicker">Registro</p>
          <h1 className="screen-title font-display">Diarium</h1>
        </div>
      </header>
      {notices.map((notice) => (
        <p key={notice.id} className="alert-line mb-3">
          <span>{notice.name}: {notice.word === "efeito" ? "o efeito acabou." : "o tempo desta curva acabou."}</span>
          <button
            type="button"
            className="min-h-11 shrink-0 underline"
            onClick={() => {
              dismissNotice(notice.id);
              setNotices(loadNotices());
            }}
          >
            Ciente
          </button>
        </p>
      ))}
      <Link to="/codex" className="codex-seal mb-4">
        <img src="/codex-mix.png" alt="" className="size-12 shrink-0 object-cover" />
        <span>
          <span className="kicker">Database</span>
          <span className="block font-display text-2xl leading-none">Codex</span>
        </span>
      </Link>
      <div className="mb-4">
        <DiaryChart points={plot.points} series={plot.series} empty="O traçado visual surge quando um composto em efeito traz duração ou meia-vida." />
      </div>
      {days.length === 0 ? (
        <p className="lede">Nenhum composto em efeito, Frater. Quando a duração se encerra, a linha sai e permanece o aviso.</p>
      ) : null}
      <ul>
        {days.map((day) => {
          const names = [...new Set(day.rows.map((row) => row.name))].join(", ");
          return (
            <li key={day.key} className="border-b border-rule">
              <Link to="/dia/$day" params={{ day: day.key }} className="flex min-h-16 gap-3 py-3">
                <span className="w-1 shrink-0 border-l-4" style={{ borderColor: mark(`${day.rows[0].kind}:${day.rows[0].substanceId}`) }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl leading-tight">{formatDay(day.key)}</span>
                  <span className="block truncate">{names}</span>
                  <span className="block text-sm text-muted">{weekday(day.key)}</span>
                </span>
                <span className="text-sm text-muted">{day.rows.length}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
