import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CycleChart } from "@/components/cycle-chart";
import { GeneSeedMark, MateriaMark } from "@/components/marks";
import { panels, type CycleLine, type PlotCompound } from "@/lib/cycle";
import { plotCompounds } from "@/lib/search";
import { loadCycles, removeCycle, saveCycle, type Cycle } from "@/lib/store";

export const Route = createFileRoute("/protocolos")({ component: CyclePage });

const compounds = plotCompounds();
const esterWord = /enanthate|cypionate|propionate|undecanoate|decanoate|acetate|phenyl|isocaproate|valerate|benzoate|hexahydro/i;
const baseName: Record<string, string> = {
  Testosterone: "Testosterona",
  Boldenone: "Boldenona",
  "Boldenone Undecylenate (Equipoise)": "Boldenona undecileno",
  Estradiol: "Estradiol",
  Progesterone: "Progesterona",
  "T3 (Triiodothyronine)": "T3",
  Trenbolone: "Trembolona",
  "Trestolone Acetate (MENT)": "Trestolona (MENT)",
  Trestolone: "Trestolona",
  Masteron: "Masteron",
  "Mesterolone (Proviron)": "Mesterolona",
  "Nandrolone (Deca/NPP)": "Nandrolona",
  "Dihydroboldenone (DHB)": "Diidroboldenona",
  Primobolan: "Primobolan",
  "HCG (100 IU ≈ 0.01 mg / 10 μg)": "HCG",
  "Human Growth Hormone (HGH) (1mg ≈ 3 IU)": "Hormônio do crescimento",
  Semaglutide: "Semaglutida",
  Tirzepatide: "Tirzepatida",
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

function formLabel(form: string | null | undefined) {
  if (!form || form === "None") return "";
  let text = form;
  for (const [from, to] of formWord) text = text.replaceAll(from, to);
  return text.replace(/\s+/g, " ").trim();
}

function blank(weeks: number): CycleLine {
  return { substanceId: "testosterone-enanthate", kind: "hormone", dose: 250, every: 7, start: 1, end: weeks * 7 };
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

function CyclePage() {
  const [weeks, setWeeks] = useState(16);
  const [lines, setLines] = useState<CycleLine[]>([blank(16)]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Cycle[]>([]);
  useEffect(() => setSaved(loadCycles()), []);
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
      <header>
        <div className="flex items-center gap-3">
          <GeneSeedMark className="h-24 w-40 shrink-0" />
          <div>
            <p className="text-xs tracking-[0.28em] text-bronze uppercase">Gene-Seed</p>
            <h1 className="font-display text-4xl leading-none">Implantation</h1>
          </div>
        </div>
        <svg viewBox="0 0 220 18" className="mt-3 h-4 w-full text-bronze" aria-hidden="true">
          <path d="M4 9h62M154 9h62" stroke="currentColor" strokeWidth="1" />
          <path d="M70 9c10-7 18-7 28 0 10 7 18 7 28 0 8-6 16-6 24 0" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M110 4.2 113.2 9 110 13.8 106.8 9Z" fill="currentColor" />
        </svg>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <MateriaMark className="size-8 shrink-0 text-bronze" />
          Matéria Medica
        </p>
        <p className="mt-1 text-sm text-muted">Implantation está aberta. Augmentation e Conditioning ficam para depois.</p>
        <p className="mt-2 text-sm text-muted">Cada linha é um implante progenoide desta ala, mais os estradiol injetáveis valerato, enantato e benzoato. A dose é a que você informa. Não é prescrição.</p>
      </header>
      <label className="block text-sm">
        Semanas do gráfico
        <NumericField value={weeks} min={1} onChange={commitWeeks} />
      </label>
      <ul className="space-y-4">
        {lines.map((line, index) => {
          const family = families.find((item) => item.options.some((option) => option.kind === line.kind && option.id === line.substanceId)) ?? families[0];
          const second = family.options.length > 1;
          const secondLabel = family.options.some((option) => esterWord.test(option.label)) ? "Éster" : "Forma";
          return (
            <li key={index} className="crystal-line space-y-2 p-3">
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
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">Dose (mg)
                  <NumericField value={line.dose} min={0} step={0.1} onChange={(dose) => patch(index, { dose })} />
                </label>
                <label className="block text-sm">A cada (dias)
                  <NumericField value={line.every} min={0.5} step={0.5} onChange={(every) => patch(index, { every })} />
                </label>
                <label className="block text-sm">Do dia
                  <NumericField value={line.start} min={1} onChange={(start) => patch(index, { start })} />
                </label>
                <label className="block text-sm">Ao dia
                  <NumericField value={line.end} min={1} onChange={(end) => patch(index, { end })} />
                </label>
              </div>
              <button type="button" className="min-h-11 text-sm underline" onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}>
                Tirar linha
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="min-h-11 border border-bronze px-4" onClick={() => setLines((rows) => [...rows, blank(weeks)])}>
        Acrescentar implante progenoide
      </button>
      {drawn.length === 0 ? <p className="text-sm">Nenhuma linha na Implantation.</p> : null}
      {drawn.map((panel) => <CycleChart key={panel.key} panel={panel} />)}
      <section className="space-y-2 border-t border-rule pt-4">
        <label className="block text-sm">Nome da Implantation
          <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button
          type="button"
          className="min-h-11 border border-bronze px-4"
          disabled={!name.trim() || lines.length === 0}
          onClick={() => {
            saveCycle({ name: name.trim(), weeks, lines });
            setSaved(loadCycles());
            setName("");
          }}
        >
          Guardar Implantation
        </button>
        <ul className="space-y-3">
          {saved.map((row) => (
            <li key={row.id} className="border-t border-rule pt-3">
              <p className="font-display text-2xl">{row.name}</p>
              <p className="text-sm text-muted">{row.weeks} semanas · {row.lines.length} linhas</p>
              <button
                type="button"
                className="min-h-11 text-sm underline"
                onClick={() => {
                  setWeeks(row.weeks);
                  setLines(row.lines.map((line) => ({ ...line, start: Math.max(1, line.start) })));
                }}
              >
                Abrir
              </button>
              <button type="button" className="ml-4 min-h-11 text-sm underline" onClick={() => { removeCycle(row.id); setSaved(loadCycles()); }}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
