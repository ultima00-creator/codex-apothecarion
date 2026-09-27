import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dismissNotice, formatDay, groupDays, loadDiary, loadNotices, weekday, type EndedNotice, type Ingestion } from "@/lib/diary";
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
  return (
    <main>
      <header className="mb-4 flex items-center gap-3">
        <DiariumMark className="size-12 shrink-0 text-bronze" />
        <div>
          <h1 className="font-display text-5xl leading-none">Diarium</h1>
        </div>
      </header>
      <p className="mb-4 text-sm text-muted">Fármacos da wiki e remédios ancilares. A ala Gene-Seed não entra neste índice.</p>
      {notices.map((notice) => (
        <p key={notice.id} className="mb-3 flex items-center justify-between gap-3 border border-bronze px-3 py-2 text-sm">
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
      {days.length === 0 ? (
        <p className="text-sm">Nenhuma tomada em efeito. O + abre o índice. Quando a duração acaba, a tomada sai e fica o aviso.</p>
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
