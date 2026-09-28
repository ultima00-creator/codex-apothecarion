import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dismissNotice, dayPlot, formatDay, groupDays, loadDiary, loadNotices, weekday, type EndedNotice, type Ingestion } from "@/lib/diary";
import { DiaryChart } from "@/components/diary-chart";
import { DiariumMark } from "@/components/marks";
import { mark } from "@/lib/mark";
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
          <span className="datum block">{formatDay(day.key)}</span>
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
