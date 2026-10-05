import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { DoseScaleView } from "@/components/dose-face";
import { tradeLine } from "@/lib/brands";
import {
  dosesFor,
  loadDiary,
  mostUsed,
  resolveCurve,
  saveIngestion,
  type DiaryKind,
  type Ingestion,
} from "@/lib/diary";
import { displayUnit, doseScale, unitOf } from "@/lib/dose";
import { mark } from "@/lib/mark";
import { viaPt } from "@/lib/pt";
import { findHormone, findPeptide, findWiki, hitById, routesFor, search, type Hit } from "@/lib/search";
import { saveNote } from "@/lib/store";
import { openCalendar, syncAlarmCalendar } from "@/lib/alarms";

export const Route = createFileRoute("/tomar")({
  validateSearch: (search: Record<string, unknown>) => ({
    kind: typeof search.kind === "string" ? search.kind : "",
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: TakePage,
});

const stomach = [
  { quarters: 0, name: "vazio", delay: "~0 h" },
  { quarters: 1, name: "1/4", delay: "~0,5 h" },
  { quarters: 2, name: "meio", delay: "~1 h" },
  { quarters: 3, name: "cheio", delay: "~1,5 h" },
  { quarters: 4, name: "muito cheio", delay: "~2 h" },
] as const;

function routeChoices(hit: Hit): string[] {
  const listed = routesFor(hit);
  return listed.length > 0 ? listed : ["oral"];
}

function referenceDose(hit: Hit): number | null {
  const basis = hit.kind === "hormone" ? findHormone(hit.id)?.curve.dose_basis_mg : hit.kind === "peptide" ? findPeptide(hit.id)?.curve.dose_basis_mg : null;
  return basis ?? null;
}

function unitFor(hit: Hit): string {
  return unitOf(hit.kind, hit.id, hit.title);
}

function subtitle(hit: Hit): string {
  if (hit.kind === "wiki") {
    const row = findWiki(hit.id);
    return tradeLine(hit.title, row?.commonNames) || hit.detail;
  }
  return hit.detail === "compound" ? tradeLine(hit.title) : hit.detail;
}

function nowLocal(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function TakePage() {
  const navigate = useNavigate();
  const preset = Route.useSearch();
  const [diary, setDiary] = useState<Ingestion[]>([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Hit | null>(null);
  const [step, setStep] = useState<"buscar" | "dose" | "fechar">("buscar");
  const [dose, setDose] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [route, setRoute] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [quarters, setQuarters] = useState(0);
  const [when, setWhen] = useState(nowLocal);
  const [note, setNote] = useState("");
  const [kept, setKept] = useState("");
  const [showNote, setShowNote] = useState(false);
  useEffect(() => setDiary(loadDiary()), []);
  useEffect(() => {
    if (!preset.kind || !preset.id) return;
    const hit = hitById(preset.kind, preset.id);
    if (!hit) return;
    setPicked(hit);
    setRoute(routeChoices(hit).length === 1 ? routeChoices(hit)[0] : "");
    setRepeat(false);
    setDose(null);
    setCustom("");
    setStep("dose");
  }, [preset.kind, preset.id]);

  const hits = search(query);
  const missed = query.trim().length >= 2 && hits.length === 0 && !picked;
  const frequent = mostUsed(diary);

  function choose(hit: Hit, nextDose: number | null) {
    setPicked(hit);
    setDose(nextDose);
    setCustom(nextDose == null ? "" : String(nextDose));
    if (nextDose != null) {
      const prior = [...diary].reverse().find((row) => row.kind === hit.kind && row.substanceId === hit.id && row.dose === nextDose && row.route);
      setRoute(prior?.route ?? "");
      setRepeat(Boolean(prior?.route));
      setStep("fechar");
      return;
    }
    setRoute(routeChoices(hit).length === 1 ? routeChoices(hit)[0] : "");
    setRepeat(false);
    setStep("dose");
  }

  async function register() {
    if (!picked || dose == null || dose < 0 || !route) return;
    saveIngestion({
      kind: picked.kind,
      substanceId: picked.id,
      name: picked.title,
      dose,
      unit: unitFor(picked),
      route,
      stomachQuarters: route === "oral" ? quarters : 0,
      takenAt: new Date(when).toISOString(),
      curve: resolveCurve(picked.kind, picked.id),
    });
    if (note.trim()) saveNote(picked.title, note.trim());
    const ics = syncAlarmCalendar(loadDiary());
    if (ics) openCalendar(ics, "Codex-alarmes.ics");
    navigate({ to: "/" });
  }

  const history = picked ? dosesFor(diary, picked.kind as DiaryKind, picked.id) : [];
  const basis = picked ? referenceDose(picked) : null;
  const scale = picked ? doseScale(picked.kind, picked.id, route) : null;
  const stomachNow = stomach.find((item) => item.quarters === quarters) ?? stomach[0];

  return (
    <main className="space-y-4">
      <div className="step-bar">
        {step === "buscar" ? (
          <Link to="/" className="text-sm text-bronze">Cancelar</Link>
        ) : (
          <button type="button" className="text-sm text-bronze" onClick={() => setStep(step === "fechar" ? "dose" : "buscar")}>Cancelar</button>
        )}
        {step === "dose" ? (
          <button type="button" className="go" disabled={dose == null || Number.isNaN(dose) || !route} onClick={() => setStep("fechar")}>Seguir</button>
        ) : null}
        {step === "fechar" ? (
          <button type="button" className="go" disabled={dose == null || Number.isNaN(dose) || !route} onClick={register}>Registrar</button>
        ) : null}
      </div>

      {step === "buscar" ? (
        <>
          <h1 className="screen-title font-display">Novo composto</h1>
          <label className="block text-sm">
            <span className="sr-only">Busca</span>
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
          </label>
          {query.trim().length < 2 && frequent.length > 0 ? (
            <section>
              <p className="mb-2 text-sm text-muted">Os que o Frater já repetiu. A pastilha é um registro anterior, não uma ordem.</p>
              {frequent.map((row) => {
                const hit: Hit = { kind: row.kind, id: row.substanceId, title: row.name, detail: tradeLine(row.name) };
                const past = dosesFor(diary, row.kind, row.substanceId);
                return (
                  <div key={`${row.kind}-${row.substanceId}`} className="recent-block">
                    <p className="recent-name">
                      <i className="swatch" style={{ background: mark(`${row.kind}:${row.substanceId}`) }} />
                      {row.name}, {viaPt(row.route)}
                    </p>
                    <div className="dose-pills">
                      {past.map((value) => (
                        <button key={value} type="button" className="dose-pill" onClick={() => choose(hit, value)}>
                          {value} {displayUnit(row.unit)}
                        </button>
                      ))}
                      <button type="button" className="dose-pill on" onClick={() => choose(hit, null)}>Outra dose</button>
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}
          {query.trim().length >= 2 ? (
            <ul>
              {hits.map((hit) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <button type="button" className="block min-h-11 w-full border-b border-rule py-2 text-left" onClick={() => choose(hit, null)}>
                    <span className="block">{hit.title}</span>
                    <span className="text-sm text-muted">{subtitle(hit) || unitFor(hit)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {missed ? (
            <section className="space-y-2 border-t border-rule pt-3">
              <p className="text-sm text-muted">Não está na database. Sem ficha e sem curva. A nota não é medição.</p>
              <textarea className="field min-h-24" value={note} onChange={(event) => setNote(event.target.value)} />
              <button
                type="button"
                className="min-h-11 border border-bronze px-4"
                disabled={!note.trim()}
                onClick={() => {
                  saveNote(query.trim(), note.trim());
                  setKept(query.trim());
                  setNote("");
                }}
              >
                Guardar nota
              </button>
              {kept ? <p className="text-sm">Nota guardada para {kept}.</p> : null}
              <Link to="/journal" className="block text-sm underline">Ver notas</Link>
            </section>
          ) : null}
        </>
      ) : null}

      {picked && step === "dose" ? (
        <section className="space-y-3">
          <h1 className="screen-title font-display">{picked.title}</h1>
          <p className="kicker">{repeat ? `repetição · ${viaPt(route)}` : "dose nova"}</p>
          {subtitle(picked) ? <p className="text-sm text-muted">{subtitle(picked)}</p> : null}
          {repeat ? (
            <p className="text-sm text-muted">Via da tomada anterior: {viaPt(route)}.</p>
          ) : routeChoices(picked).length > 1 ? (
            <div className="glass-card">
              <p className="text-sm">Via. Obrigatória quando a dose não é repetição.</p>
              <div className="dose-pills mt-2">
                {routeChoices(picked).map((item) => (
                  <button key={item} type="button" className={route === item ? "dose-pill on" : "dose-pill"} onClick={() => setRoute(item)}>
                    {viaPt(item)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Via {viaPt(routeChoices(picked)[0] ?? "oral")}. É a via desta ficha.</p>
          )}
            {scale ? (
            <div className="glass-card">
              <DoseScaleView scale={scale} dose={dose} />
            </div>
          ) : (
            <p className="text-sm text-muted">Sem faixa de dose nesta ficha. A unidade continua {unitFor(picked)}.</p>
          )}
          <div className="dose-pills">
            {history.map((value) => (
              <button key={value} type="button" className={dose === value ? "dose-pill on" : "dose-pill"} onClick={() => {
                setDose(value);
                setCustom(String(value));
                const prior = [...diary].reverse().find((row) => row.kind === picked.kind && row.substanceId === picked.id && row.dose === value && row.route);
                if (prior?.route) {
                  setRoute(prior.route);
                  setRepeat(true);
                }
              }}>
                {value} {unitFor(picked)}
              </button>
            ))}
            {basis != null ? (
              <button type="button" className={dose === basis ? "dose-pill on" : "dose-pill"} onClick={() => { setDose(basis); setCustom(String(basis)); }}>
                {basis} mg · referência da curva
              </button>
            ) : null}
          </div>
          <label className="dose-entry">
            <input
              className="field"
              inputMode="decimal"
              value={custom}
              placeholder="Dose"
              onChange={(event) => {
                const next = event.target.value.replace(",", ".");
                if (next !== "" && !/^\d*\.?\d*$/.test(next)) return;
                setCustom(next);
                setDose(next === "" || next === "." ? null : Number(next));
              }}
            />
            <b className="dose-unit">{unitFor(picked)}</b>
          </label>
        </section>
      ) : null}

      {picked && step === "fechar" ? (
        <section className="space-y-3">
          <h1 className="screen-title font-display">Fechar registro</h1>
          <p className="kicker">{picked.title} · {dose} {unitFor(picked)} · {viaPt(route)}</p>
          <div className="glass-card space-y-3">
            <label className="block text-sm">
              Hora
              <span className="mt-1 flex items-center gap-2">
                <input className="field" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
                <button type="button" className="dose-pill" onClick={() => setWhen(nowLocal())}>Agora</button>
              </span>
            </label>
            {route === "oral" ? (
              <div>
                <p className="text-sm">Estômago {stomachNow.name}</p>
                <div className="stomach-row mt-2">
                  {stomach.map((item) => (
                    <button key={item.quarters} type="button" className={quarters === item.quarters ? "on" : ""} onClick={() => setQuarters(item.quarters)}>
                      {item.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">Atraso de ~{stomachNow.delay.replace("~", "")} na via oral. Fora dela o estômago não entra.</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Via {viaPt(route)}. O estômago não atrasa esta tomada.</p>
            )}
            {showNote ? (
              <textarea className="field min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota. Não é medição." />
            ) : (
              <button type="button" className="text-sm text-bronze" onClick={() => setShowNote(true)}>+ Nota</button>
            )}
          </div>
          <button type="button" className="go w-full" disabled={dose == null || Number.isNaN(dose) || !route} onClick={register}>Registrar</button>
        </section>
      ) : null}
    </main>
  );
}
