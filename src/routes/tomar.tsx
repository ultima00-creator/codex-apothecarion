import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  dosesFor,
  loadDiary,
  mostUsed,
  resolveCurve,
  saveIngestion,
  type DiaryKind,
  type Ingestion,
} from "@/lib/diary";
import { findHormone, findPeptide, hitById, routesFor, search, type Hit } from "@/lib/search";
import { saveNote } from "@/lib/store";
import { viaPt } from "@/lib/pt";

export const Route = createFileRoute("/tomar")({
  validateSearch: (search: Record<string, unknown>) => ({
    kind: typeof search.kind === "string" ? search.kind : "",
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: TakePage,
});

function defaultRoute(hit: Hit): string {
  return routesFor(hit)[0] ?? "";
}

function referenceDose(hit: Hit): number | null {
  const basis = hit.kind === "hormone" ? findHormone(hit.id)?.curve.dose_basis_mg : hit.kind === "peptide" ? findPeptide(hit.id)?.curve.dose_basis_mg : null;
  return basis ?? null;
}

function unitFor(hit: Hit): string {
  if (hit.kind === "wiki") return "unidade";
  return "mg";
}

function TakePage() {
  const navigate = useNavigate();
  const preset = Route.useSearch();
  const [diary, setDiary] = useState<Ingestion[]>([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Hit | null>(null);
  const [dose, setDose] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [route, setRoute] = useState("oral");
  const [quarters, setQuarters] = useState(0);
  const [when, setWhen] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const [kept, setKept] = useState("");
  useEffect(() => setDiary(loadDiary()), []);
  useEffect(() => {
    if (!preset.kind || !preset.id) return;
    const hit = hitById(preset.kind, preset.id);
    if (!hit) return;
    setPicked(hit);
    setRoute(defaultRoute(hit));
    setDose(null);
    setCustom("");
  }, [preset.kind, preset.id]);

  const hits = search(query);
  const missed = query.trim().length >= 2 && hits.length === 0 && !picked;
  const frequent = mostUsed(diary);

  function choose(hit: Hit) {
    setPicked(hit);
    setRoute(defaultRoute(hit));
    setDose(null);
    setCustom("");
  }

  function register() {
    if (!picked || dose == null || dose < 0) return;
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
    navigate({ to: "/" });
  }

  const history = picked ? dosesFor(diary, picked.kind as DiaryKind, picked.id) : [];
  const basis = picked ? referenceDose(picked) : null;

  return (
    <main className="space-y-4">
      <Link to="/codex" className="text-sm text-bronze">Retornar</Link>
      <h1 className="font-display text-5xl leading-none">Novo composto</h1>
      <label className="block text-sm">
        Busca na database
        <input className="field mt-1" value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }} placeholder="nomeie o composto, Frater" />
      </label>

      {!picked && query.trim().length < 2 && frequent.length > 0 ? (
        <section className="space-y-4">
          <p className="text-sm text-muted">Os que o Frater já repetiu. A dose é um registro anterior, não uma ordem.</p>
          {frequent.map((row) => (
            <button
              key={`${row.kind}-${row.substanceId}`}
              type="button"
              className="block w-full border-b border-rule py-3 text-left"
              onClick={() => choose({ kind: row.kind, id: row.substanceId, title: row.name, detail: "" })}
            >
              <span className="block">{row.name}</span>
              <span className="text-sm text-muted">{dosesFor(diary, row.kind, row.substanceId).slice(0, 4).join(" · ") || "sem dose anterior"} {row.unit}</span>
            </button>
          ))}
        </section>
      ) : null}

      {!picked ? (
        <ul>
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <button type="button" className="block min-h-11 w-full border-b border-rule py-2 text-left" onClick={() => choose(hit)}>
                <span className="block">{hit.title}</span>
                <span className="text-sm text-muted">{hit.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {picked ? (
        <section className="space-y-3 border-t border-rule pt-3">
          <h2 className="font-display text-3xl">{picked.title}</h2>
          <p className="text-sm text-muted">{picked.kind === "wiki" ? "Ficha da wiki. Duração não é meia-vida." : picked.kind === "medicine" ? "Remédio. Meia-vida em fração da dose, não concentração." : "Dose em mg, a unidade da curva."}</p>
          <div className="flex flex-wrap gap-2">
            {history.map((value) => (
              <button key={value} type="button" className={dose === value ? "chip chip-on" : "chip"} onClick={() => { setDose(value); setCustom(""); }}>
                {value} {unitFor(picked)}
              </button>
            ))}
            {basis != null ? (
              <button type="button" className={dose === basis ? "chip chip-on" : "chip"} onClick={() => { setDose(basis); setCustom(""); }}>
                {basis} mg · referência da curva
              </button>
            ) : null}
            <button type="button" className={custom !== "" && dose === Number(custom) ? "chip chip-on" : "chip"} onClick={() => setDose(custom === "" ? null : Number(custom))}>
              Outra dose
            </button>
          </div>
          <label className="block text-sm">
            Outra dose
            <input
              className="field mt-1"
              type="number"
              min={0}
              step="0.1"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setDose(e.target.value === "" ? null : Number(e.target.value));
              }}
            />
          </label>
          <label className="block text-sm">
            Via
            {picked && routesFor(picked).length > 0 ? (
              <select className="field mt-1" value={route} onChange={(e) => setRoute(e.target.value)}>
                {routesFor(picked).map((item) => <option key={item} value={item}>{viaPt(item)}</option>)}
              </select>
            ) : (
              <p className="mt-1 text-sm text-muted">Sem via catalogada nesta ficha.</p>
            )}
          </label>
          {route === "oral" ? (
            <label className="block text-sm">
              Estômago cheio
              <select className="field mt-1" value={quarters} onChange={(e) => setQuarters(Number(e.target.value))}>
                <option value={0}>vazio</option>
                <option value={1}>1/4 · +0,5 h</option>
                <option value={2}>2/4 · +1 h</option>
                <option value={3}>3/4 · +1,5 h</option>
                <option value={4}>4/4 · +2 h</option>
              </select>
            </label>
          ) : route ? (
            <p className="text-sm text-muted">Fora da via oral o estômago não atrasa a metabolização hepática. Na curva citada o atraso não entra.</p>
          ) : null}
          <label className="block text-sm">
            Hora
            <input className="field mt-1" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <button type="button" className="min-h-11 border border-bronze px-4" disabled={dose == null || Number.isNaN(dose)} onClick={register}>
            Registrar
          </button>
        </section>
      ) : null}

      {missed ? (
        <section className="space-y-2 border-t border-rule pt-3">
          <p className="text-sm text-muted">Não está na database. Sem ficha e sem curva. A nota não é medição.</p>
          <textarea className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
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
    </main>
  );
}
