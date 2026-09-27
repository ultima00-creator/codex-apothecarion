import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CycleChart } from "@/components/cycle-chart";
import { GeneSeedMark, MateriaMark } from "@/components/marks";
import { panels, type CycleLine } from "@/lib/cycle";
import { plotCompounds } from "@/lib/search";
import { loadCycles, removeCycle, saveCycle, type Cycle } from "@/lib/store";

export const Route = createFileRoute("/protocolos")({ component: CyclePage });

const compounds = plotCompounds();

function blank(): CycleLine {
  return { substanceId: "testosterone-enanthate", kind: "hormone", dose: 250, every: 7, start: 0, end: 84 };
}

function CyclePage() {
  const [weeks, setWeeks] = useState(16);
  const [lines, setLines] = useState<CycleLine[]>([blank()]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Cycle[]>([]);
  useEffect(() => setSaved(loadCycles()), []);
  const drawn = useMemo(() => panels(compounds, lines, weeks), [lines, weeks]);

  function patch(index: number, next: Partial<CycleLine>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  }

  return (
    <main className="space-y-5">
      <header>
        <div className="flex items-center gap-3">
          <GeneSeedMark className="size-12 shrink-0 text-bronze" />
          <div>
            <p className="text-xs tracking-[0.28em] text-bronze uppercase">Gene-Seed</p>
            <h1 className="font-display text-4xl leading-none">Implantation</h1>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <MateriaMark className="size-6 shrink-0 text-bronze" />
          Matéria Medica
        </p>
        <p className="mt-1 text-sm text-muted">Implantation está aberta. Augmentation e Conditioning ficam para depois.</p>
        <p className="mt-2 text-sm text-muted">Cada linha é uma substância desta ala, mais os estradiol injetáveis valerato, enantato e benzoato. A dose é a que você informa. Não é prescrição.</p>
      </header>
      <label className="block text-sm">
        Semanas do gráfico
        <input className="field mt-1" type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value) || 1)} />
      </label>
      <ul className="space-y-4">
        {lines.map((line, index) => (
          <li key={index} className="space-y-2 border border-rule p-3">
            <label className="block text-sm">
              Substância
              <select
                className="field mt-1"
                value={`${line.kind}:${line.substanceId}`}
                onChange={(e) => {
                  const [kind, id] = e.target.value.split(":") as [CycleLine["kind"], string];
                  patch(index, { kind, substanceId: id });
                }}
              >
                {compounds.map((item) => (
                  <option key={`${item.kind}:${item.id}`} value={`${item.kind}:${item.id}`}>{item.label}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">Dose (mg)
                <input className="field mt-1" type="number" min={0} step="0.1" value={line.dose} onChange={(e) => patch(index, { dose: Number(e.target.value) })} />
              </label>
              <label className="block text-sm">A cada (dias)
                <input className="field mt-1" type="number" min={0.5} step="0.5" value={line.every} onChange={(e) => patch(index, { every: Number(e.target.value) })} />
              </label>
              <label className="block text-sm">Do dia
                <input className="field mt-1" type="number" min={0} step="1" value={line.start} onChange={(e) => patch(index, { start: Number(e.target.value) })} />
              </label>
              <label className="block text-sm">Ao dia
                <input className="field mt-1" type="number" min={0} step="1" value={line.end} onChange={(e) => patch(index, { end: Number(e.target.value) })} />
              </label>
            </div>
            <button type="button" className="min-h-11 text-sm underline" onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}>
              Tirar linha
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="min-h-11 border border-bronze px-4" onClick={() => setLines((rows) => [...rows, blank()])}>
        Acrescentar substância
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
              <button type="button" className="min-h-11 text-sm underline" onClick={() => { setWeeks(row.weeks); setLines(row.lines); }}>
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
