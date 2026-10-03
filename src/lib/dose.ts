import { findWiki } from "@/lib/search";

function firstNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value == null || value === "") return null;
  const match = String(value).replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
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
};

export function doseScale(kind: string, id: string, route: string): DoseScale | null {
  if (kind !== "wiki") return null;
  const row = findWiki(id);
  if (!row) return null;
  const match = row.roas.find((roa) => (roa.name ?? "").toLowerCase() === route.toLowerCase()) ?? row.roas[0];
  if (!match) return null;
  return {
    unit: displayUnit(match.dose_units),
    threshold: firstNumber(match.threshold),
    light: firstNumber(match.light),
    common: firstNumber(match.common),
    strong: firstNumber(match.strong),
    heavy: firstNumber(match.heavy),
  };
}

export function doseBand(kind: string, id: string, route: string, dose: number): number {
  const scale = doseScale(kind, id, route);
  if (!scale) return 0;
  if (scale.heavy != null && dose >= scale.heavy) return 5;
  if (scale.strong != null && dose >= scale.strong) return 4;
  if (scale.common != null && dose >= scale.common) return 3;
  if (scale.light != null && dose >= scale.light) return 2;
  if (scale.threshold != null && dose >= scale.threshold) return 1;
  return 0;
}

export const bandWord = ["", "limiar", "leve", "comum", "forte", "pesada"] as const;
