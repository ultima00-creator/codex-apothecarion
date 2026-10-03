import { findWiki } from "@/lib/search";

function numbers(value: string | number | null | undefined): number[] {
  if (typeof value === "number") return Number.isFinite(value) ? [value] : [];
  if (value == null || value === "") return [];
  return [...String(value).replaceAll(",", ".").matchAll(/\d+(?:\.\d+)?/g)].map((item) => Number(item[0])).filter((item) => Number.isFinite(item));
}

function startNumber(value: string | number | null | undefined): number | null {
  return numbers(value)[0] ?? null;
}

function endNumber(value: string | number | null | undefined): number | null {
  const all = numbers(value);
  return all.length > 0 ? all[all.length - 1] : null;
}

export function prettyAmount(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function displayUnit(unit: string | null | undefined): string {
  if (!unit) return "mg";
  if (unit === "μg" || unit === "µg" || unit === "ug") return "mcg";
  if (unit === "mL") return "ml";
  return unit;
}

export function unitOf(kind: string, id: string, name: string): string {
  if (kind === "wiki") {
    const row = findWiki(id);
    const oral = row?.roas.find((roa) => (roa.name ?? "").toLowerCase() === "oral") ?? row?.roas[0];
    if (oral?.dose_units) return displayUnit(oral.dose_units);
  }
  const text = name.toLowerCase();
  if (/clonidin|atensina/.test(text)) return "mcg";
  if (/butanodiol|butanediol|\bgbl\b|\bghb\b/.test(text)) return "ml";
  return "mg";
}

export type DoseScale = {
  unit: string;
  threshold: number | null;
  light: number | null;
  common: number | null;
  strong: number | null;
  heavy: number | null;
  raw: {
    threshold: string | number | null | undefined;
    light: string | number | null | undefined;
    common: string | number | null | undefined;
    strong: string | number | null | undefined;
    heavy: string | number | null | undefined;
  };
};

export function doseScale(kind: string, id: string, route: string): DoseScale | null {
  if (kind !== "wiki") return null;
  const row = findWiki(id);
  if (!row) return null;
  const match = row.roas.find((roa) => (roa.name ?? "").toLowerCase() === route.toLowerCase()) ?? row.roas[0];
  if (!match) return null;
  const scale = {
    unit: displayUnit(match.dose_units),
    threshold: startNumber(match.threshold),
    light: startNumber(match.light),
    common: startNumber(match.common),
    strong: startNumber(match.strong),
    heavy: startNumber(match.heavy),
    raw: {
      threshold: match.threshold,
      light: match.light,
      common: match.common,
      strong: match.strong,
      heavy: match.heavy,
    },
  };
  if (scale.threshold == null && scale.light == null && scale.common == null && scale.strong == null && scale.heavy == null) return null;
  return scale;
}

export function doseBand(kind: string, id: string, route: string, dose: number): number {
  const scale = doseScale(kind, id, route);
  if (!scale) return 0;
  return bandOf(scale, dose);
}

function bandOf(scale: DoseScale, dose: number): number {
  if (scale.heavy != null && dose >= scale.heavy) return 5;
  if (scale.strong != null && dose >= scale.strong) return 4;
  if (scale.common != null && dose >= scale.common) return 3;
  if (scale.light != null && dose >= scale.light) return 2;
  if (scale.threshold != null && dose >= scale.threshold) return 1;
  return 0;
}

export function bandIndex(scale: DoseScale, dose: number): number {
  return bandOf(scale, dose);
}

export const bandWord = ["", "limiar", "leve", "comum", "forte", "pesada"] as const;

function prettyRaw(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return String(value).replace(/\.0+(?=(\D|$))/g, "");
}

export function bandPhrase(scale: DoseScale, dose: number): string | null {
  const band = bandOf(scale, dose);
  if (band === 0) return null;
  const range =
    band === 5 ? `${prettyAmount(scale.heavy ?? dose)}+`
    : band === 4 ? prettyRaw(scale.raw.strong)
    : band === 3 ? prettyRaw(scale.raw.common)
    : band === 2 ? prettyRaw(scale.raw.light)
    : prettyRaw(scale.raw.threshold);
  return `${bandWord[band]}${range ? ` (${range} ${scale.unit})` : ""}`;
}

export type ScaleMark = { key: "limiar" | "leve" | "comum" | "forte" | "pesada"; name: string; show: string | null };

export function scaleMarks(scale: DoseScale): ScaleMark[] {
  const forte = endNumber(scale.raw.strong);
  return [
    { key: "limiar", name: "limiar", show: scale.threshold == null ? null : prettyAmount(scale.threshold) },
    { key: "leve", name: "leve", show: endNumber(scale.raw.light) == null ? null : prettyAmount(endNumber(scale.raw.light) as number) },
    { key: "comum", name: "comum", show: endNumber(scale.raw.common) == null ? null : prettyAmount(endNumber(scale.raw.common) as number) },
    { key: "forte", name: "forte", show: forte == null ? null : prettyAmount(forte) },
    { key: "pesada", name: "pesada", show: scale.strong == null && scale.heavy != null ? prettyAmount(scale.heavy) : null },
  ];
}

const dotAnchor = { threshold: 1, light: 2, common: 4, strong: 6, heavy: 8 } as const;

export function dotCount(kind: string, id: string, route: string, dose: number): number | null {
  const scale = doseScale(kind, id, route);
  if (!scale || !Number.isFinite(dose) || dose < 0) return null;
  return dotsOn(scale, dose);
}

export function dotsOn(scale: DoseScale, dose: number): number {
  if (!Number.isFinite(dose) || dose <= 0) return 0;
  const stops: [number, number][] = [];
  const push = (value: number | null, dots: number) => {
    if (value == null || value <= 0) return;
    const found = stops.find((item) => item[0] === value);
    if (found) found[1] = Math.max(found[1], dots);
    else stops.push([value, dots]);
  };
  push(scale.threshold, dotAnchor.threshold);
  push(scale.light, dotAnchor.light);
  push(scale.common, dotAnchor.common);
  push(scale.strong, dotAnchor.strong);
  push(scale.heavy, dotAnchor.heavy);
  if (stops.length === 0) return 0;
  stops.sort((a, b) => a[0] - b[0]);
  const last = stops[stops.length - 1];
  const marks: [number, number][] = [...stops, [last[0] * 2, 10]];
  if (dose < marks[0][0]) return 0;
  for (let index = 0; index < marks.length - 1; index += 1) {
    const [left, leftDots] = marks[index];
    const [right, rightDots] = marks[index + 1];
    if (dose <= right) {
      const span = right - left;
      const t = span === 0 ? 0 : (dose - left) / span;
      return Math.max(0, Math.min(10, Math.round(leftDots + t * (rightDots - leftDots))));
    }
  }
  return 10;
}
