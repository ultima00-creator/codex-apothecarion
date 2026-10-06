import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DoseScaleView } from "@/components/dose-face";
import { tradeLine } from "@/lib/brands";
import { doseScale } from "@/lib/dose";
import { durationAt, durationEnd, type Timeline } from "@/lib/duration";
import { wikiLine } from "@/lib/diary";
import { classePt, nomePt, tempoPt, viaPt } from "@/lib/pt";
import { BookMark, ChartMark, VialMark } from "@/components/relic-marks";
import { campaignTick } from "@/components/campaign-ink";
import { findWiki, wikiTitle } from "@/lib/search";
import { inkFor } from "@/lib/substance-face";

const levelLabel: Record<string, string> = {
  dangerous: "perigo",
  unsafe: "insegura",
  uncertain: "incerta",
};

const stomach = [
  { quarters: 0, name: "vazio", hours: 0 },
  { quarters: 1, name: "1/4", hours: 0.5 },
  { quarters: 2, name: "meio", hours: 1 },
  { quarters: 3, name: "cheio", hours: 1.5 },
  { quarters: 4, name: "muito cheio", hours: 2 },
] as const;

function clock(time: number, spanHours: number): string {
  const date = new Date(time);
  if (spanHours > 20) return date.toLocaleString("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function DurationPlot({ line, tone, oral }: { line: Timeline; tone: string; oral: boolean }) {
  const [start, setStart] = useState(() => new Date());
  const [quarters, setQuarters] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const delay = oral ? (stomach.find((item) => item.quarters === quarters)?.hours ?? 0) : 0;
  const span = Math.max(durationEnd(line) + delay + 0.5, 1);
  const plot = useMemo(() => {
    const step = span > 24 ? 0.5 : 0.25;
    const points: { x: string; y: number }[] = [];
    let nowLabel: string | null = null;
    let nowDistance = Number.POSITIVE_INFINITY;
    const now = Date.now();
    for (let hour = 0; hour <= span + 1e-9; hour += step) {
      const at = start.getTime() + hour * 3600000;
      const x = clock(at, span);
      const y = hour < delay ? 0 : (durationAt(hour - delay, line) ?? 0);
      points.push({ x, y: Math.round(y * 1000) / 1000 });
      const distance = Math.abs(at - now);
      if (distance < nowDistance && at >= start.getTime() && at <= start.getTime() + span * 3600000) {
        nowDistance = distance;
        nowLabel = x;
      }
    }
    return { points, nowLabel };
  }, [delay, line, span, start]);
  const local = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return (
    <div className="glass-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">Início</p>
        <span className="time-chips">
          <input
            className="field w-auto"
            type="datetime-local"
            value={local}
            onChange={(event) => {
              const next = new Date(event.target.value);
              if (!Number.isNaN(next.getTime())) setStart(next);
            }}
          />
          <button type="button" className="dose-pill" onClick={() => setStart(new Date())}>Agora</button>
        </span>
      </div>
      <div className="lore-screen h-52 w-full">
        {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={plot.points} barCategoryGap="34%" margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(180, 150, 110, 0.16)" vertical={false} />
            <XAxis dataKey="x" stroke="#8d7356" tick={campaignTick} tickLine={false} minTickGap={18} />
            <YAxis hide domain={[0, 1]} />
            <Tooltip contentStyle={{ background: "#140e0c", color: "#cbb892", border: "1px solid #6a3030" }} />
            {plot.nowLabel ? <ReferenceLine x={plot.nowLabel} stroke="#cbb892" strokeWidth={1} label={{ value: "Agora", fill: "#cbb892", fontSize: 11, position: "top" }} /> : null}
            <Bar dataKey="y" fill={tone} maxBarSize={22} name="duração citada" />
          </BarChart>
        </ResponsiveContainer>
        ) : null}
      </div>
      <p className="text-sm">A linha usa início, subida, pico e descida da ficha. Não é meia-vida de eliminação.</p>
      {oral ? (
        <div>
          <p className="text-sm">Atraso do estômago</p>
          <div className="stomach-row mt-2">
            {stomach.map((item) => (
              <button key={item.quarters} type="button" className={quarters === item.quarters ? "on" : ""} onClick={() => setQuarters(item.quarters)}>
                {item.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm">Início atrasado em ~{delay} h.</p>
        </div>
      ) : null}
    </div>
  );
}

export function WikiSheet({ slug }: { slug: string }) {
  const row = findWiki(slug);
  const [via, setVia] = useState("");
  if (!row) return <p>Não está no catálogo da wiki.</p>;
  const title = wikiTitle(row.slug, row.name);
  const brands = tradeLine(title, row.commonNames);
  const routes = [...new Set(row.roas.map((roa) => (roa.name ?? "").toLowerCase()).filter(Boolean))].sort((a, b) => Number(b === "oral") - Number(a === "oral"));
  const route = via && routes.includes(via) ? via : routes[0] ?? "";
  const roa = row.roas.find((item) => (item.name ?? "").toLowerCase() === route) ?? row.roas[0];
  const scale = roa ? doseScale("wiki", slug, route) : null;
  const line = wikiLine(slug, route);
  const tone = inkFor("wiki", slug);
  const ink = { color: inkFor("wiki", slug), WebkitTextFillColor: inkFor("wiki", slug) };
  const ordered = [...row.interactions].sort((a, b) => rank(a.level) - rank(b.level));
  return (
    <article className="space-y-4">
      <header>
        <p className="kicker kicker-row"><BookMark className="ico" /> Wiki</p>
        <h2 className="subject">{title}</h2>
        {brands ? <p className="text-sm text-muted">{brands}</p> : null}
      </header>
      <section className="glass-card space-y-2">
        <p className="kicker kicker-row"><BookMark className="ico" /> Resumo</p>
        {row.lead_pt ? <p>{briefLead(row.lead_pt)}</p> : <p>A página não trouxe um parágrafo de abertura.</p>}
        {row.classes.length > 0 ? (
          <p className="time-chips">
            {row.classes.map((item) => <span key={item} className="dose-pill">{classePt(item)}</span>)}
          </p>
        ) : null}
      </section>
      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h3 className="section-label"><VialMark className="ico" style={ink} /> Dose</h3>
          {routes.length > 1 ? (
            <select className="field w-auto" value={route} onChange={(event) => setVia(event.target.value)}>
              {routes.map((item) => <option key={item} value={item}>{viaPt(item)}</option>)}
            </select>
          ) : null}
        </div>
        <p className="text-sm text-muted">Tabela citada, não é prescrição. {roa ? viaPt(roa.name) : "Sem via"}.</p>
        {scale ? (
          <div className="glass-card">
            <DoseScaleView scale={scale} dose={null} />
          </div>
        ) : <p className="text-sm">Sem faixa de dose nesta via.</p>}
      </section>
      <section className="space-y-2">
        <h3 className="section-label"><ChartMark className="ico" style={ink} /> Duração</h3>
        {line ? <DurationPlot line={line.line} tone={tone} oral={route === "oral"} /> : <p className="text-sm">Sem duração nesta ficha. A curva não é inventada.</p>}
        {roa ? (
          <div className="glass-card">
            <p className="datum">{viaPt(roa.name)}</p>
            <ul className="time-chips mt-2">
              <li className="dose-pill">início {tempoPt(roa.onset)}</li>
              <li className="dose-pill">subida {tempoPt(roa.comeup)}</li>
              <li className="dose-pill">pico {tempoPt(roa.peak)}</li>
              <li className="dose-pill">descida {tempoPt(roa.offset)}</li>
              <li className="dose-pill">total {tempoPt(roa.total)}</li>
            </ul>
          </div>
        ) : null}
      </section>
      <section className="space-y-2">
        <h3 className="section-label"><VialMark className="ico" /> Interações</h3>
        <p className="text-sm text-muted">
          {row.interaction_quality === "analogy" ? "Analogia de classe. Não é interação citada nesta ficha." : row.interaction_quality === "cited" ? "Citada na ficha." : "Sem interação nesta ficha."}
        </p>
        {ordered.length > 0 ? (
          <div className="glass-card">
            {ordered.map((item) => (
              <p key={`${item.quality}-${item.level}-${item.name}`} className="warn-row">
                <span>{nomePt(item.name)}{item.quality === "analogy" ? " · analogia" : ""}</span>
                <b className={levelLabel[item.level] ?? item.level}>{levelLabel[item.level] ?? item.level}</b>
              </p>
            ))}
          </div>
        ) : null}
      </section>
      <Link to="/tomar" search={{ kind: "wiki", id: row.slug, edit: "" }} className="go inline-flex items-center">Registrar este composto</Link>
      <footer className="border-t border-rule pt-3 text-sm text-muted">
        <a className="underline" href={row.url}>{row.url}</a>
        <p className="mt-2">Colaboradores da PsychonautWiki, psychonautwiki.org, CC BY-SA 4.0.</p>
      </footer>
    </article>
  );
}

function rank(level: string): number {
  if (level === "dangerous") return 0;
  if (level === "unsafe") return 1;
  return 2;
}

export function briefLead(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (!sentences) {
    const cut = clean.slice(0, 260);
    const at = Math.max(cut.lastIndexOf(";"), cut.lastIndexOf(","), cut.lastIndexOf(" "));
    return `${(at > 80 ? cut.slice(0, at) : cut).trim()}.`;
  }
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence.trim()}` : sentence.trim();
    if (out && next.length > 380) break;
    out = next;
    const count = out.match(/[.!?]/g)?.length ?? 0;
    if (count >= 2) break;
  }
  return out.trim();
}
