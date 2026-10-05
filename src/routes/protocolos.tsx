import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CycleChart } from "@/components/cycle-chart";
import { ChartMark, VialMark } from "@/components/relic-marks";
import { faceFor } from "@/lib/substance-face";
import { panels, type CycleLine, type PlotCompound } from "@/lib/cycle";
import { plotCompounds } from "@/lib/search";
import { loadCycles, replaceCycle, saveCycle, EDIT_CYCLE, type Cycle } from "@/lib/store";

export const Route = createFileRoute("/protocolos")({ component: CyclePage });

const compounds = plotCompounds();
const esterWord = /enanthate|cypionate|propionate|undecanoate|decanoate|acetate|phenyl|isocaproate|valerate|benzoate|hexahydro/i;
const baseName: Record<string, string> = {
  Testosterone: "Testosterona",
  Boldenone: "Boldenona",
  "Boldenone Undecylenate (Equipoise)": "Boldenona undecileno",
  Estradiol: "Estradiol",
  "Estradiol Injetável": "Estradiol injetável",
  Progesterone: "Progesterona",
  "T3 (Triiodothyronine)": "T3",
  Trenbolone: "Trembolona",
  "Trestolone Acetate (MENT)": "Trestolona (MENT)",
  Trestolone: "Trestolona",
  Masteron: "Masteron",
  "Mesterolone (Proviron)": "Mesterolona",
  "Nandrolone (Deca/NPP)": "Nandrolona",
  "Dihydroboldenone (DHB)": "Dihidroboldenona",
  Primobolan: "Primobolan",
  "HCG (100 IU ≈ 0.01 mg / 10 μg)": "HCG",
  "Human Growth Hormone (HGH) (1mg ≈ 3 IU)": "Hormônio do crescimento",
  Semaglutide: "Semaglutida",
  Tirzepatide: "Tirzepatida",
  Durateston: "Durateston",
};
const formWord: [string, string][] = [
  ["Hexahydrobenzylcarbonate", "hexaidrobenzilcarbonato"],
  ["Phenylpropionate", "fenilpropionato"],
  ["Undecanoate", "undecanoato"],
  ["Undecylenate", "undecileno"],
  ["Isocaproate", "isocaproato"],
  ["Enanthate", "enantato"],
  ["Cypionate", "cipionato"],
  ["Propionate", "propionato"],
  ["Decanoate", "decanoato"],
  ["Acetate", "acetato"],
  ["Valerate", "valerato"],
  ["Benzoate", "benzoato"],
  ["Suspension", "suspensão"],
  ["Injectable", "injetável"],
  ["Injections", "injetável"],
  ["Topical", "tópico"],
  ["Sublingual", "sublingual"],
  ["Oral", "oral"],
  ["Caster Oil", "óleo de rícino"],
  ["MCT Oil", "óleo MCT"],
  ["Test Base", "base"],
  ["(intramuscular, oil)", "(intramuscular, óleo)"],
  ["(intramuscular, anecdotal)", "(intramuscular, anedótico)"],
  ["(intramuscular, analogy)", "(intramuscular, analogia)"],
  ["Gel", "gel"],
  ["None", ""],
];

type Family = { key: string; compound: string; options: PlotCompound[] };

function familiesOf(rows: PlotCompound[]): Family[] {
  const map = new Map<string, Family>();
  for (const row of rows) {
    const key = `${row.kind}:${row.compound}`;
    const family = map.get(key) ?? { key, compound: row.compound, options: [] };
    family.options.push(row);
    map.set(key, family);
  }
  return [...map.values()];
}

const families = familiesOf(compounds);

function baseLabel(compound: string) {
  return baseName[compound] ?? compound;
}

function declaredDays(days: number, weeks: number) {
  const cap = Math.max(1, weeks * 7);
  if (typeof days !== "number" || !Number.isFinite(days)) return cap;
  return Math.min(cap, Math.max(1, Math.round(days)));
}

function formLabel(form: string | null | undefined) {
  if (!form || form === "None") return "";
  let text = form;
  for (const [from, to] of formWord) text = text.replaceAll(from, to);
  return text.replace(/\s+/g, " ").trim();
}

function blank(weeks: number): CycleLine {
  return { substanceId: "testosterone-enanthate", kind: "hormone", dose: 10, every: 1, start: 1, end: weeks * 7 };
}

function NumericField({
  value,
  min,
  step = 1,
  onChange,
}: {
  value: number;
  min?: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [focused, value]);
  return (
    <input
      className="field mt-1"
      inputMode="decimal"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(event) => {
        const next = event.target.value.replace(",", ".");
        if (next !== "" && !/^\d*\.?\d*$/.test(next)) return;
        setText(next);
        if (next === "" || next === ".") return;
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = Number(text);
        if (text.trim() === "" || !Number.isFinite(parsed)) {
          setText(String(value));
          return;
        }
        const clamped = min == null ? parsed : Math.max(min, parsed);
        onChange(clamped);
        setText(String(clamped));
      }}
    />
  );
}

function VolumeDose({
  concentration,
  onApply,
}: {
  concentration: number;
  onApply: (mg: number) => void;
}) {
  const [ml, setMl] = useState(0.1);
  const [conc, setConc] = useState(concentration);
  const mg = Math.round(ml * conc * 1000) / 1000;
  return (
    <div className="glass-inset space-y-2 p-3">
      <p className="kicker">ml para mg</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">ml
          <NumericField value={ml} min={0} step={0.01} onChange={setMl} />
        </label>
        <label className="block text-sm">mg/ml
          <NumericField value={conc} min={0} step={1} onChange={setConc} />
        </label>
      </div>
      <p className="text-sm">{ml} ml × {conc} mg/ml = {mg} mg</p>
      <button type="button" className="chip" onClick={() => onApply(mg)}>Usar {mg} mg na dose</button>
    </div>
  );
}

function CyclePage() {
  const [weeks, setWeeks] = useState(10);
  const [lines, setLines] = useState<CycleLine[]>([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Cycle[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => {
    const loaded = loadCycles();
    setSaved(loaded);
    const id = sessionStorage.getItem(EDIT_CYCLE);
    if (!id) return;
    sessionStorage.removeItem(EDIT_CYCLE);
    const row = loaded.find((item) => item.id === id);
    if (!row) return;
    setEditing(row.id);
    setName(row.name);
    setWeeks(row.weeks);
    setLines(row.lines.map((line) => ({ ...line, start: Math.max(1, line.start) })));
  }, []);
  const drawn = useMemo(() => panels(compounds, lines, weeks), [lines, weeks]);

  function patch(index: number, next: Partial<CycleLine>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  }

  function commitWeeks(next: number) {
    const clamped = Math.min(52, Math.max(1, Math.round(next)));
    setLines((rows) => rows.map((row) => (row.end === weeks * 7 ? { ...row, end: clamped * 7 } : row)));
    setWeeks(clamped);
  }

  return (
    <main className="space-y-5">
      <header className="gene-head">
        <img src="/relics/gene-vault.png" alt="" className="vault-mini" />
        <p className="kicker">Gene-Seed</p>
        <h1 className="screen-title font-display">Implantation</h1>
        <p className="kicker">Matéria Medica</p>
      </header>
      <p className="lede">A dose é a que o Frater declara. Não é prescrição. Agumentarium e Conditionarium acendem com uma Implantation guardada.</p>
      <div className="command-bar">
        {saved.length > 0 ? <Link to="/agumentarium" className="command-key">Combat-Stimm</Link> : <span className="command-key is-off">Combat-Stimm</span>}
        {saved.length > 0 ? <Link to="/conditionarium" className="command-key">Med-Stimm</Link> : <span className="command-key is-off">Med-Stimm</span>}
        <Link to="/administracao" className="command-key">Administração</Link>
      </div>
      <label className="week-row text-sm">
        <span className="kicker-row"><ChartMark className="ico" /> Semanas do gráfico</span>
        <NumericField value={weeks} min={1} onChange={commitWeeks} />
      </label>
      <ul className="space-y-4">
        {lines.map((line, index) => {
          const family = families.find((item) => item.options.some((option) => option.kind === line.kind && option.id === line.substanceId)) ?? families[0];
          const second = family.options.length > 1;
          const secondLabel = family.options.some((option) => esterWord.test(option.label)) ? "Éster" : "Forma";
          const option = family.options.find((item) => item.id === line.substanceId) ?? family.options[0];
          const face = faceFor(option.compound, option.label);
          const src = face?.src ?? (option.kind === "peptide" ? "/relics/bottle-green.png" : "/relics/bottle-gold.png");
          const ink = { color: face?.color ?? (option.kind === "peptide" ? "#6aaa78" : "#c6a15a") };
          return (
            <li key={index} className="crystal-line space-y-2 p-3">
              <div className="seed-pick">
                <img src={src} alt="" className="seed-mark" />
                <div className="min-w-0 flex-1 space-y-2">
              <label className="block text-sm">
                Implantes Progenoides
                <select
                  className="field mt-1"
                  value={family.key}
                  onChange={(event) => {
                    const next = families.find((item) => item.key === event.target.value) ?? family;
                    const option = next.options[0];
                    patch(index, { kind: option.kind, substanceId: option.id });
                  }}
                >
                  {families.map((item) => (
                    <option key={item.key} value={item.key}>{baseLabel(item.compound)}</option>
                  ))}
                </select>
              </label>
              {second ? (
                <label className="block text-sm">
                  {secondLabel}
                  <select
                    className="field mt-1"
                    value={line.substanceId}
                    onChange={(event) => {
                      const option = family.options.find((item) => item.id === event.target.value) ?? family.options[0];
                      patch(index, { kind: option.kind, substanceId: option.id });
                    }}
                  >
                    {family.options.map((option) => (
                      <option key={option.id} value={option.id}>{formLabel(option.label.replace(option.compound, "").trim()) || baseLabel(option.compound)}</option>
                    ))}
                  </select>
                </label>
              ) : null}
                </div>
              </div>
              <VolumeDose
                key={line.substanceId}
                concentration={line.substanceId === "testosterone-durateston" ? 250 : 100}
                onApply={(dose) => patch(index, { dose })}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <VialMark className="ico" style={ink} /> Dose (mg)
                  <NumericField value={line.dose} min={0} step={0.1} onChange={(dose) => patch(index, { dose })} />
                </label>
                <label className="block text-sm">
                  <ChartMark className="ico" style={ink} /> A cada (dias)
                  <NumericField value={line.every} min={0.5} step={0.5} onChange={(every) => patch(index, { every })} />
                </label>
                <label className="block text-sm">Do dia
                  <NumericField value={line.start} min={1} onChange={(start) => patch(index, { start })} />
                </label>
                <label className="block text-sm">Ao dia
                  <NumericField value={line.end} min={1} onChange={(end) => patch(index, { end })} />
                </label>
              </div>
              <button type="button" className="command-key" onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}>
                Tirar
              </button>
            </li>
          );
        })}
      </ul>
      {lines.length === 0 ? <p className="text-sm">Nenhum implante nesta Implantation. Acrescente só o que for guardar.</p> : null}
      <button type="button" className="command-key" onClick={() => setLines((rows) => [...rows, blank(weeks)])}>
        Acrescentar
      </button>
      {drawn.length === 0 ? <p className="text-sm">Nenhuma linha na Implantation.</p> : <p className="text-sm text-muted">Traçado visual da Implantation. Não é medição.</p>}
      {drawn.map((panel) => <CycleChart key={panel.key} panel={panel} />)}
      {saved.some((row) => (row.adjuncts ?? []).length > 0) ? (
        <section className="space-y-4 border-t border-rule pt-4">
          {saved.map((row) => {
            const groups = [
              { wing: "agumentarium" as const, title: "Combat-Stimm" },
              { wing: "conditionarium" as const, title: "Med-Stimm" },
            ];
            const filled = groups
              .map((group) => ({ ...group, items: (row.adjuncts ?? []).filter((item) => item.wing === group.wing) }))
              .filter((group) => group.items.length > 0);
            if (filled.length === 0) return null;
            return (
              <div key={row.id}>
                <p className="datum">{row.name}</p>
                {filled.map((group) => (
                  <div key={group.wing} className="mt-2">
                    <p className="kicker">{group.title}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.substanceId} className="text-sm">{item.name} — {declaredDays(item.days, row.weeks)} dias</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      ) : null}
      <section className="space-y-2 border-t border-rule pt-4">
        <label className="block text-sm">Nome da Implantation
          <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {editing ? <p className="text-sm text-muted">Esta gravação atualiza a Implantation aberta. Não cria outra.</p> : null}
        <button
          type="button"
          className="command-key"
          disabled={!name.trim() || lines.length === 0}
          onClick={() => {
            if (editing) replaceCycle(editing, { name: name.trim(), weeks, lines });
            else {
              saveCycle({ name: name.trim(), weeks, lines });
              setName("");
            }
            setSaved(loadCycles());
          }}
        >
          {editing ? "Atualizar" : "Guardar"}
        </button>
      </section>
    </main>
  );
}
