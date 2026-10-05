import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { dismissNotice, clearNotices, dayPlot, doseHorizon, formatDay, fuseIngestions, groupDays, loadDiary, loadNotices, weekday, type EndedNotice, type Ingestion } from "@/lib/diary";
import { cancelAlarmCalendar, openCalendar } from "@/lib/alarms";
import { DiaryChart } from "@/components/diary-chart";
import { BookMark, VialMark } from "@/components/relic-marks";
import { inkFor } from "@/lib/substance-face";
import { displayUnit } from "@/lib/dose";
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
  const ordered = fuseIngestions(rows);
  return (
    <main className="status">
      <header className="status-bar">
        <div>
          <p className="kicker kicker-row"><img src="/relics/sigil-registro.png" alt="" className="sigil" /> Registro</p>
          <h1 className="screen-title font-display">Diarium</h1>
        </div>
        <SignalSeal />
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
      <button
        type="button"
        className="clear-alarms"
        onClick={() => {
          const ics = cancelAlarmCalendar();
          if (ics) openCalendar(ics, "Codex-limpar-alarmes.ics");
          clearNotices();
          setNotices([]);
        }}
      >
        Limpar avisos
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
              <li key={group.key}>
                <Link to="/abrir/$kind/$id" params={{ kind: group.kind, id: group.substanceId }}>
                  <VialMark className="ico" style={{ color: inkFor(group.kind, group.substanceId) }} />
                  <span className="datum">{group.name}</span>
                  {group.doses.map((row) => {
                    const when = new Date(row.takenAt);
                    const clock = when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    const end = doseHorizon(row);
                    const endClock = end ? end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
                    const endDay = end && end.toDateString() !== when.toDateString()
                      ? end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                      : null;
                    return (
                      <span key={row.id} className="tile-meta">
                        {clock} · {Math.round(row.dose * 1000) / 1000} {displayUnit(row.unit)}
                        {endClock ? ` · até ~${endDay ? `${endDay} ` : ""}${endClock}` : ""}
                      </span>
                    );
                  })}
                </Link>
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
                <span className="tile-meta">{weekday(day.key)} · {day.rows.length}</span>
                <span className="datum">{formatDay(day.key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
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
    <div className="arm-pair">
      <button
        type="button"
        className={armed ? "arm-key on" : "arm-key"}
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
        <img src="/relics/sigil-armar.png" alt="" className="sigil" />
        {armed ? "Armado" : "Armar"}
      </button>
      <button type="button" className="arm-key" onClick={() => void testSignal().then(() => { setArmed(signalArmed()); setLine(signalStatus()); })}>
        <img src="/relics/sigil-teste.png" alt="" className="sigil" />
        Teste
      </button>
      {line ? <p className="arm-line">{line}</p> : null}
    </div>
  );
}
