import { level, ownFraction, remainingFraction, type Curve } from "@/lib/kinetics";
import { mark } from "@/lib/mark";
import { findHormone } from "@/lib/search";

export type CycleKind = "hormone" | "peptide";

export type CycleLine = {
  substanceId: string;
  kind: CycleKind;
  dose: number;
  every: number;
  start: number;
  end: number;
};

export type PlotCompound = {
  kind: CycleKind;
  id: string;
  compound: string;
  label: string;
  curve: Curve;
};

export function doseDays(line: CycleLine): number[] {
  if (line.every <= 0 || line.end < line.start) return [];
  const days: number[] = [];
  for (let day = line.start; day <= line.end + 1e-9; day += line.every) days.push(day);
  return days;
}

export function atDay(curve: Curve, dose: number, taken: number[], day: number): number {
  let sum = 0;
  for (const start of taken) {
    const elapsed = day - start;
    if (elapsed < 0) continue;
    if (curve.model === "half_life_only") {
      if (!curve.half_life_days) continue;
      sum += remainingFraction(elapsed * 24, curve.half_life_days * 24, "intramuscular", 0) ?? 0;
      continue;
    }
    sum += level(curve, dose, elapsed).value ?? 0;
  }
  return sum;
}

export type Panel = {
  key: string;
  title: string;
  unit: string;
  note: string;
  points: Record<string, number>[];
  series: { id: string; name: string; tone: string }[];
};

const durateston = [
  { id: "testosterone-propionate", share: 30 / 250, name: "Propionato" },
  { id: "testosterone-phenylpropionate", share: 60 / 250, name: "Fenilpropionato" },
  { id: "testosterone-isocaproate", share: 60 / 250, name: "Isocaproato" },
  { id: "testosterone-decanoate", share: 100 / 250, name: "Decanoato" },
];

export function panels(compounds: PlotCompound[], lines: CycleLine[], weeks: number): Panel[] {
  const end = Math.max(weeks * 7, ...lines.map((line) => line.end), 1);
  const step = end > 80 ? 1 : 0.5;
  const groups = new Map<string, { title: string; unit: string; note: string; rows: { id: string; name: string; tone: string; y: (day: number) => number }[] }>();
  lines.forEach((line, index) => {
    if (line.substanceId === "testosterone-durateston") {
      if (!Number.isFinite(line.dose) || line.dose < 0) return;
      const key = "Durateston|fração";
      const group = groups.get(key) ?? {
        title: "Durateston",
        unit: "fração do próprio pico",
        note: "250 mg/ml: propionato 30, fenilpropionato 60, isocaproato 60, decanoato 100. Cada linha é a fração do pico daquele éster.",
        rows: [],
      };
      const taken = doseDays(line);
      durateston.forEach((part, partIndex) => {
        const hormone = findHormone(part.id);
        if (!hormone) return;
        const mg = line.dose * part.share;
        const id = `s${index}e${partIndex}`;
        group.rows.push({
          id,
          name: `${part.name} · ${Math.round(mg * 10) / 10} mg`,
          tone: mark(`hormone:${part.id}`),
          y: (day) => ownFraction(hormone.curve, mg, day * 24, "intramuscular", 0) ?? 0,
        });
      });
      groups.set(key, group);
      return;
    }
    const compound = compounds.find((item) => item.kind === line.kind && item.id === line.substanceId);
    if (!compound || !Number.isFinite(line.dose) || line.dose < 0) return;
    const unit = compound.curve.model === "half_life_only" ? "fração da dose" : (compound.curve.unit ?? compound.curve.model);
    const key = `${compound.compound}|${unit}`;
    const group = groups.get(key) ?? {
      title: compound.compound,
      unit,
      note: compound.curve.model === "half_life_only" ? "Fração somada das tomadas. Não é concentração." : "Mesmo composto e mesma unidade. Outro composto não entra neste eixo.",
      rows: [],
    };
    const taken = doseDays(line);
    const id = `s${index}`;
    group.rows.push({
      id,
      name: compound.label,
      tone: mark(`${line.kind}:${line.substanceId}`),
      y: (day) => atDay(compound.curve, line.dose, taken, day),
    });
    groups.set(key, group);
  });
  return [...groups.entries()].map(([key, group]) => {
    const points: Record<string, number>[] = [];
    for (let day = 0; day <= end + 1e-9; day += step) {
      const point: Record<string, number> = { x: Math.round(day * 10) / 10 };
      for (const row of group.rows) point[row.id] = Math.round(row.y(day) * 1000) / 1000;
      points.push(point);
    }
    return { key, title: group.title, unit: group.unit, note: group.note, points, series: group.rows.map(({ id, name, tone }) => ({ id, name, tone })) };
  });
}
