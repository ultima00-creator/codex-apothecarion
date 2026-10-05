import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AxisChart } from "@/components/axis-chart";
import { citedSeries, fractionSeries, level, remainingFraction, type Curve } from "@/lib/kinetics";
import { mark } from "@/lib/mark";
import { classePt, viaPt } from "@/lib/pt";
import { wikiByCompound } from "@/lib/search";
import { VialMark } from "@/components/relic-marks";
import { faceFor } from "@/lib/substance-face";

type Record = {
  id: string;
  compound: string;
  form: string | null;
  source_quality: string | null;
  sources: string[];
  protocol: boolean;
  route_default: string;
  curve: Curve;
};

export function RecordSheet({ record, kind }: { record: Record; kind: "steroid_hormone" | "peptide" }) {
  const curve = record.curve;
  const cited = curve.model === "concentration" || curve.model === "amount" || curve.model === "release";
  const [dose, setDose] = useState(curve.dose_basis_mg ?? 1);
  const [hours, setHours] = useState(0);
  const route = record.route_default;
  const [quarters, setQuarters] = useState(0);
  const wiki = wikiByCompound(record.compound);

  const points = useMemo(() => (cited ? citedSeries(curve, dose) : []), [cited, curve, dose]);
  const fraction = useMemo(
    () => (curve.half_life_days ? fractionSeries(curve.half_life_days, route, quarters) : []),
    [curve.half_life_days, route, quarters],
  );
  const now = cited ? level(curve, dose, curve.tmax_days ?? 0) : null;
  const halfHours = (curve.half_life_days ?? 0) * 24;
  const fracNow = curve.half_life_days ? remainingFraction(hours, halfHours, route, quarters) : null;

  return (
    <article className="space-y-5">
      <header>
        <p className="text-xs tracking-[0.2em] text-bronze uppercase">{kind === "peptide" ? "Peptídeo" : "Hormônio"}</p>
        <h2 className="subject kicker-row"><VialMark className="ico" style={{ color: faceFor(record.compound, record.form)?.color ?? (kind === "peptide" ? "#6aaa78" : "#c6a15a") }} /> {record.compound}</h2>
        <p className="text-muted">{record.form}</p>
        <Link to="/tomar" search={{ kind: kind === "peptide" ? "peptide" : "hormone", id: record.id }} className="go mt-3 inline-flex items-center">Registrar</Link>
        <p className="mt-2 text-sm">Meia-vida: {curve.half_life_days ?? "—"} dias. Classe: {wiki ? wiki.classes.map(classePt).join(", ") : "sem ficha na wiki"}. Descrição: {wiki?.lead_pt ? "da wiki, abaixo" : "a wiki não tem esta página"}.</p>
      </header>
      {wiki?.lead_pt ? <p>{wiki.lead_pt}</p> : null}

      {cited && now ? (
        <section className="space-y-3">
          <label className="block text-sm">
            Dose informada (mg)
            <input className="field mt-1" type="number" min={0} step="0.1" value={dose} onChange={(e) => setDose(Number(e.target.value))} />
          </label>
          <AxisChart unit={now.unit ?? curve.model} xLabel="dias" points={points} tone={mark(`${kind === "peptide" ? "peptide" : "hormone"}:${record.id}`)} />
          <table className="w-full text-left text-sm">
            <tbody>
              <tr><th className="py-1 pr-3 font-normal text-muted">No Tmax</th><td>{now.value} {now.unit}</td></tr>
              <tr><th className="py-1 pr-3 font-normal text-muted">Tmax</th><td>{curve.tmax_days ?? "—"} dias</td></tr>
              <tr><th className="py-1 pr-3 font-normal text-muted">Meia-vida</th><td>{curve.half_life_days ?? "—"} dias</td></tr>
              <tr><th className="py-1 pr-3 font-normal text-muted">Origem da curva</th><td>{curve.source ?? "—"}</td></tr>
            </tbody>
          </table>
          <p className="text-sm text-muted">Atraso de estômago não entra aqui. O Tmax já veio da fonte. 1 pg/mL = 0,1 ng/dL é nota, não eixo compartilhado.</p>
        </section>
      ) : null}

      {!cited && curve.half_life_days ? (
        <section className="space-y-3">
          <p className="text-sm">Sem Tmax e sem Cmax. O gráfico é fração da dose, não concentração.</p>
          <label className="block text-sm">
            Horas desde a tomada
            <input className="field mt-1" type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>
          <p className="text-sm">Via catalogada: {viaPt(record.route_default)}.</p>
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
          ) : (
            <p className="text-sm text-muted">Fora da via oral o estômago não atrasa a metabolização hepática.</p>
          )}
          <AxisChart unit="fração da dose" xLabel="horas" points={fraction} tone={mark(`${kind === "peptide" ? "peptide" : "hormone"}:${record.id}`)} dash />
          <p className="text-sm">Nesta hora: {fracNow == null ? "—" : fracNow} · regra do app, não medição.</p>
        </section>
      ) : null}

      <p className="border-t border-rule pt-4 text-sm">A Implantation junta as linhas no tempo. Cada composto fica no próprio eixo.</p>
      <Link to="/protocolos" className="inline-flex min-h-11 items-center text-sm underline">Abrir em Gene-Seed</Link>

      {record.sources.length > 0 ? (
        <ul className="space-y-1 text-sm break-all text-muted">
          {record.sources.map((url) => (
            <li key={url}><a className="underline" href={url}>{url}</a></li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
