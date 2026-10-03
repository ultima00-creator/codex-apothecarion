import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dismissNotice, dayPlot, formatDay, groupDays, loadDiary, loadNotices, weekday, type EndedNotice, type Ingestion } from "@/lib/diary";
import { DiaryChart } from "@/components/diary-chart";
import { DiariumMark } from "@/components/marks";
import { tradeLine } from "@/lib/brands";
import { doseBand } from "@/lib/dose";
import { mark } from "@/lib/mark";
import { viaPt } from "@/lib/pt";
import { armSignal, disarmSignal, signalArmed, signalStatus, testSignal } from "@/lib/signal";

export const Route = createFileRoute("/")({ component: DiaryHome });

function DiaryHome() {
  const [rows, setRows] = useState<Ingestion[]>([]);
  const [notices, setNotices] = useState<EndedNotice[]>([]);
  useEffect(() => {
    const pull = () => {
      setRows(loadDiary());
      setNotices(loadNotices());
    };
    pull();
    window.addEventListener("apothecarion-settled", pull);
    return () => window.removeEventListener("apothecarion-settled", pull);
  }, []);
  const days = groupDays(rows);
  const plot = dayPlot(rows);
  const ordered = [...rows].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  const totals = new Map<string, { name: string; unit: string; dose: number; tone: string }>();
  for (const row of rows) {
    const key = `${row.kind}:${row.substanceId}:${row.unit}`;
    const current = totals.get(key) ?? { name: row.name, unit: row.unit, dose: 0, tone: mark(`${row.kind}:${row.substanceId}`) };
    current.dose += row.dose;
    totals.set(key, current);
  }
  return (
    <main>
      <header className="mb-3 flex items-center gap-3">
        <DiariumMark className="size-12 shrink-0" />
        <div>
          <p className="kicker">Registro</p>
          <h1 className="screen-title font-display">Diarium</h1>
        </div>
      </header>
      <SignalSeal />
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
          <span className="datum block">Compound Codex</span>
        </span>
      </Link>
      <div className="mb-4">
        <DiaryChart points={plot.points} series={plot.series} captions={plot.captions} nowLabel={plot.nowLabel} empty="O traçado visual surge quando um composto em efeito traz duração ou meia-vida." />
      </div>
      {ordered.length === 0 ? (
        <p className="lede">Nenhum composto em efeito, Frater. Quando a duração se encerra, a linha sai e permanece o aviso.</p>
      ) : (
        <ul className="journal-list">
          {ordered.map((row) => {
            const when = new Date(row.takenAt);
            const clock = when.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
            const brands = tradeLine(row.name);
            return (
              <li key={row.id} className="journal-row">
                <span className="journal-bar" style={{ background: mark(`${row.kind}:${row.substanceId}`) }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted">{clock}</span>
                  <span className="datum block">{row.name}</span>
                  {brands ? <span className="block text-sm text-muted">{brands}</span> : null}
                  <span className="block text-sm">{row.dose} {row.unit} {viaPt(row.route)}</span>
                </span>
                <DoseDots n={doseBand(row.kind, row.substanceId, row.route, row.dose)} />
              </li>
            );
          })}
        </ul>
      )}
      {totals.size > 0 ? (
        <section className="mt-5">
          <p className="kicker">Dose acumulada</p>
          <ul className="journal-list mt-2">
            {[...totals.values()].map((row) => (
              <li key={`${row.name}-${row.unit}`} className="journal-row">
                <span className="journal-bar" style={{ background: row.tone }} />
                <span className="min-w-0 flex-1">
                  <span className="datum block">{row.name}</span>
                  <span className="block text-sm">{Math.round(row.dose * 1000) / 1000} {row.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {days.length > 1 ? (
        <ul className="mt-4">
          {days.map((day) => (
            <li key={day.key} className="border-b border-rule">
              <Link to="/dia/$day" params={{ day: day.key }} className="flex min-h-12 items-center justify-between py-2 text-sm">
                <span>{formatDay(day.key)}</span>
                <span className="text-muted">{weekday(day.key)} · {day.rows.length}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Link to="/tomar" search={{ kind: "", id: "" }} className="fab" aria-label="Novo composto">+</Link>
    </main>
  );
}

function DoseDots({ n }: { n: number }) {
  return (
    <span className="dose-dots" aria-label={n ? `${n} de 5` : undefined}>
      {[0, 1, 2, 3, 4].map((col) => <i key={col} className={col < n ? "on" : ""} />)}
    </span>
  );
}

function SignalSeal() {
  const [armed, setArmed] = useState(false);
  const [line, setLine] = useState("");
  useEffect(() => {
    setArmed(signalArmed());
    setLine(signalStatus());
  }, []);
  return (
    <section className="mb-4 space-y-2">
      <p className="kicker">Sinais</p>
      <p className="text-sm text-muted">{line}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={armed ? "chip chip-on" : "chip"}
          onClick={() => {
            if (armed) {
              disarmSignal();
              setArmed(false);
              setLine(signalStatus());
              return;
            }
            void armSignal().then((result) => {
              setArmed(result === "on");
              setLine(
                result === "need-home"
                  ? "No iPhone, instale na Tela de Início e abra por lá."
                  : result === "denied"
                    ? "Permissão negada. Ajustes → Apothecarion → Notificações."
                    : result === "missing"
                      ? "Este aparelho não expõe a notificação."
                      : signalStatus(),
              );
            });
          }}
        >
          {armed ? "Sinais armados" : "Armar sinais"}
        </button>
        <button type="button" className="chip" onClick={() => void testSignal().then(() => { setArmed(signalArmed()); setLine(signalStatus()); })}>
          Sinal de teste
        </button>
      </div>
    </section>
  );
}
