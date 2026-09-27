/** Curve math. Same formulas as the Gear model and Codex/fraction.py. */

export type Curve = {
  model: string;
  unit: string | null;
  half_life_days: number | null;
  tmax_days?: number | null;
  cmax_per_mg?: number | null;
  multiplier?: number | null;
  absorption_half_life_days?: number | null;
  availability?: number | null;
  active_dose_fraction?: number | null;
  dose_basis_mg?: number | null;
  source?: string | null;
};

export type Point = { x: number; y: number };

function concentration(tDays: number, doseMg: number, curve: Curve): number {
  if (tDays < 0) return 0;
  const half = curve.half_life_days ?? 0;
  const tmax = curve.tmax_days ?? 0;
  const cmax = doseMg * (curve.cmax_per_mg ?? 0) * (curve.multiplier ?? 1);
  if (tmax <= 0 || half <= 0) return 0;
  if (tDays <= tmax) return (cmax / tmax) * tDays;
  const k = Math.log(2) / half;
  return cmax * Math.exp(-k * (tDays - tmax));
}

function amount(tDays: number, dose: number, curve: Curve): number {
  if (tDays < 0) return 0;
  const half = curve.half_life_days ?? 0;
  let absorption = curve.absorption_half_life_days ?? 0;
  const availability = curve.availability ?? 0;
  const ke = Math.log(2) / Math.max(half, 0.001);
  absorption = absorption && absorption > 0 ? absorption : half / 3;
  const ka = Math.log(2) / Math.max(absorption, 0.001);
  const value =
    Math.abs(ka - ke) < 1e-6
      ? dose * availability * ke * tDays * Math.exp(-ke * tDays)
      : dose * availability * (ka / (ka - ke)) * (Math.exp(-ke * tDays) - Math.exp(-ka * tDays));
  return Math.max(0, value);
}

function release(tDays: number, doseMg: number, curve: Curve): number {
  if (tDays < 0) return 0;
  const half = curve.half_life_days ?? 0;
  if (half <= 0) return 0;
  const lam = Math.log(2) / half;
  return doseMg * (curve.active_dose_fraction ?? 0) * lam * Math.exp(-tDays * lam);
}

export function level(curve: Curve, dose: number, tDays: number): { value: number | null; unit: string | null; model: string } {
  const model = curve.model;
  let value: number | null = null;
  if (model === "concentration") value = concentration(tDays, dose, curve);
  else if (model === "amount") value = amount(tDays, dose, curve);
  else if (model === "release") value = release(tDays, dose, curve);
  return { value, unit: curve.unit, model };
}

export function citedSeries(curve: Curve, dose: number): Point[] {
  const half = curve.half_life_days ?? 1;
  const tmax = curve.tmax_days ?? 0;
  const end = Math.max(tmax + half * 4, 2);
  const step = end / 80;
  const points: Point[] = [];
  for (let t = 0; t <= end + 1e-9; t += step) {
    const row = level(curve, dose, t);
    points.push({ x: round(t), y: round(row.value ?? 0) });
  }
  return points;
}

export function delayHours(route: string, stomachQuarters: number): number {
  if (route !== "oral") return 0;
  if (stomachQuarters < 0 || stomachQuarters > 4) throw new Error("stomach");
  return stomachQuarters * 0.5;
}

/** Fraction of dose not yet eliminated. Not a concentration. */
export function remainingFraction(tHours: number, halfLifeHours: number, route: string, stomachQuarters: number): number | null {
  if (halfLifeHours <= 0 || tHours < 0) return null;
  const delay = delayHours(route, stomachQuarters);
  if (tHours <= delay) return 1;
  return 0.5 ** ((tHours - delay) / halfLifeHours);
}

export function fractionSeries(halfLifeDays: number, route: string, stomachQuarters: number): Point[] {
  const halfH = halfLifeDays * 24;
  const delay = delayHours(route, stomachQuarters);
  const end = delay + Math.max(halfH * 4, 12);
  const step = Math.max(end / 80, 0.25);
  const points: Point[] = [];
  for (let t = 0; t <= end + 1e-9; t += step) {
    const y = remainingFraction(t, halfH, route, stomachQuarters);
    points.push({ x: round(t), y: round(y ?? 0) });
  }
  return points;
}

/** 0–1 of this dose's own peak, or remaining fraction when the record is half-life only. */
export function ownFraction(curve: Curve, dose: number, tHours: number, route: string, stomachQuarters: number): number | null {
  if (tHours < 0 || dose < 0) return 0;
  if (curve.model === "half_life_only") {
    if (!curve.half_life_days) return null;
    return remainingFraction(tHours, curve.half_life_days * 24, route, stomachQuarters);
  }
  if (curve.model !== "concentration" && curve.model !== "amount" && curve.model !== "release") return null;
  const value = level(curve, dose, tHours / 24).value;
  const peak = ownPeak(curve, dose);
  if (value == null || !peak) return null;
  return value / peak;
}

function ownPeak(curve: Curve, dose: number): number {
  if (curve.model === "concentration" && curve.tmax_days) {
    return level(curve, dose, curve.tmax_days).value ?? 0;
  }
  const half = curve.half_life_days ?? 1;
  const end = Math.max((curve.tmax_days ?? 0) + half * 4, 1);
  let max = 0;
  for (let t = 0; t <= end; t += end / 48) {
    max = Math.max(max, level(curve, dose, t).value ?? 0);
  }
  return max;
}

export function volumeMl(doseMcg: number, vialMg: number, waterMl: number): number {
  if (vialMg <= 0 || waterMl <= 0) return 0;
  return (doseMcg * waterMl) / (vialMg * 1000);
}

export function syringeUnits(volume: number): number {
  return Math.round(volume * 1000) / 10;
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
