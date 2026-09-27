import { durationAt, durationEnd, parseSpan, type Timeline } from "@/lib/duration";
import { delayHours, ownFraction, type Curve } from "@/lib/kinetics";
import { mark } from "@/lib/mark";
import { medicineCurve } from "@/lib/medicines";
import { findHormone, findPeptide, findWiki } from "@/lib/search";

export type DiaryKind = "hormone" | "peptide" | "wiki" | "medicine";

export type Ingestion = {
  id: string;
  kind: DiaryKind;
  substanceId: string;
  name: string;
  dose: number;
  unit: string;
  route: string;
  stomachQuarters: number;
  takenAt: string;
  curve: "cited" | "half_life" | "duration" | "none";
};

const KEY = "apothecarion-diary";
const ENDED = "apothecarion-ended";

export type EndedNotice = {
  id: string;
  name: string;
  endedAt: string;
  word: "efeito" | "curva";
};

function read(): Ingestion[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Ingestion[]) : [];
  } catch {
    return [];
  }
}

function write(rows: Ingestion[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function notices(): EndedNotice[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ENDED);
    return raw ? (JSON.parse(raw) as EndedNotice[]) : [];
  } catch {
    return [];
  }
}

function effectLimit(row: Ingestion): { hours: number; word: EndedNotice["word"] } | null {
  const kind = resolveCurve(row.kind, row.substanceId);
  if (kind === "duration") {
    const line = wikiLine(row.substanceId, row.route);
    const hours = line ? durationEnd(line.line) : 0;
    return hours > 0 ? { hours, word: "efeito" } : null;
  }
  if (kind === "half_life") {
    const half = curveOf(row.kind, row.substanceId)?.half_life_days;
    if (!half) return null;
    return { hours: delayHours(row.route, row.stomachQuarters) + half * 24 * 4, word: "curva" };
  }
  if (kind === "cited") {
    const curve = curveOf(row.kind, row.substanceId);
    if (!curve) return null;
    const half = curve.half_life_days ?? 1;
    return { hours: Math.max((curve.tmax_days ?? 0) + half * 4, 1) * 24, word: "curva" };
  }
  return null;
}

export function settleDiary(now = Date.now()): EndedNotice[] {
  if (typeof localStorage === "undefined") return [];
  const rows = read();
  const keep: Ingestion[] = [];
  const born: EndedNotice[] = [];
  for (const row of rows) {
    const limit = effectLimit(row);
    if (!limit) {
      keep.push(row);
      continue;
    }
    const end = new Date(row.takenAt).getTime() + limit.hours * 3600000;
    if (now < end) keep.push(row);
    else born.push({ id: row.id, name: row.name, endedAt: new Date(end).toISOString(), word: limit.word });
  }
  if (born.length > 0) {
    write(keep);
    const seen = new Set(notices().map((item) => item.id));
    const next = [...born.filter((item) => !seen.has(item.id)), ...notices()].slice(0, 20);
    localStorage.setItem(ENDED, JSON.stringify(next));
  }
  return notices();
}

export function loadNotices(): EndedNotice[] {
  return settleDiary();
}

export function dismissNotice(id: string) {
  localStorage.setItem(ENDED, JSON.stringify(notices().filter((item) => item.id !== id)));
}

export function loadDiary(): Ingestion[] {
  settleDiary();
  return read().sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function saveIngestion(entry: Omit<Ingestion, "id">): Ingestion {
  const row: Ingestion = { ...entry, id: crypto.randomUUID() };
  write([row, ...read()]);
  return row;
}

export function removeIngestion(id: string) {
  write(read().filter((row) => row.id !== id));
}

export function dayKey(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function weekday(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { weekday: "short" });
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export type DayGroup = { key: string; rows: Ingestion[] };

export function groupDays(rows: Ingestion[]): DayGroup[] {
  const map = new Map<string, Ingestion[]>();
  for (const row of rows) {
    const key = dayKey(row.takenAt);
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, rows: items.sort((a, b) => a.takenAt.localeCompare(b.takenAt)) }));
}

export function dosesFor(rows: Ingestion[], kind: DiaryKind, id: string): number[] {
  const seen = new Set<number>();
  const doses: number[] = [];
  for (const row of rows) {
    if (row.kind !== kind || row.substanceId !== id || seen.has(row.dose)) continue;
    seen.add(row.dose);
    doses.push(row.dose);
    if (doses.length === 8) break;
  }
  return doses;
}

export function mostUsed(rows: Ingestion[]): Ingestion[] {
  const count = new Map<string, { n: number; row: Ingestion }>();
  for (const row of rows) {
    const key = `${row.kind}:${row.substanceId}`;
    const current = count.get(key);
    if (current) current.n += 1;
    else count.set(key, { n: 1, row });
  }
  return [...count.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((item) => item.row);
}

export function curveOf(kind: DiaryKind, id: string): Curve | null {
  if (kind === "hormone") return findHormone(id)?.curve ?? null;
  if (kind === "peptide") return findPeptide(id)?.curve ?? null;
  if (kind === "medicine") return medicineCurve(id);
  return null;
}

export function wikiLine(id: string, route: string): { via: string; line: Timeline } | null {
  const row = findWiki(id);
  if (!row) return null;
  const usable = row.roas.filter((roa) => roa.onset || roa.comeup || roa.peak || roa.offset || roa.total);
  if (usable.length === 0) return null;
  const match = usable.find((roa) => (roa.name ?? "").toLowerCase() === route.toLowerCase()) ?? usable[0];
  return {
    via: match.name ?? route,
    line: {
      onset: parseSpan(match.onset),
      comeup: parseSpan(match.comeup),
      peak: parseSpan(match.peak),
      offset: parseSpan(match.offset),
      total: parseSpan(match.total),
    },
  };
}

export function resolveCurve(kind: DiaryKind, id: string): Ingestion["curve"] {
  const measured = curveKind(curveOf(kind, id));
  if (measured !== "none") return measured;
  if (kind === "wiki" && wikiLine(id, "oral")) return "duration";
  return "none";
}

export type DiarySeries = { id: string; name: string; curve: Ingestion["curve"]; tone: string };

export function curveKind(curve: Curve | null): Ingestion["curve"] {
  if (!curve) return "none";
  if (curve.model === "half_life_only" && curve.half_life_days) return "half_life";
  if (curve.model === "concentration" || curve.model === "amount" || curve.model === "release") return "cited";
  return "none";
}

export function dayPlot(rows: Ingestion[]): { points: Record<string, number | string | null>[]; series: DiarySeries[] } {
  const plotted = rows.filter((row) => resolveCurve(row.kind, row.substanceId) !== "none");
  if (plotted.length === 0) return { points: [], series: [] };
  const start = Math.min(...plotted.map((row) => new Date(row.takenAt).getTime()));
  let spanHours = 18;
  for (const row of plotted) {
    const kind = resolveCurve(row.kind, row.substanceId);
    const half = curveOf(row.kind, row.substanceId)?.half_life_days;
    if (half && kind !== "duration") spanHours = Math.max(spanHours, Math.min(half * 24, 24 * 6));
    if (kind === "duration") {
      const line = wikiLine(row.substanceId, row.route);
      if (line) spanHours = Math.max(spanHours, Math.min(durationEnd(line.line) + 2, 48));
    }
  }
  const end = start + spanHours * 3600 * 1000;
  const series = plotted.map((row, index) => ({
    id: `s${index}`,
    name: row.name,
    curve: resolveCurve(row.kind, row.substanceId),
    tone: mark(`${row.kind}:${row.substanceId}`),
  }));
  const points: Record<string, number | string | null>[] = [];
  const step = spanHours > 36 ? 60 * 60 * 1000 : 15 * 60 * 1000;
  for (let t = start; t <= end; t += step) {
    const fromStart = (t - start) / 3600000;
    const point: Record<string, number | string | null> = {
      x: spanHours > 36 ? `${Math.floor(fromStart / 24)}d ${String(Math.floor(fromStart % 24)).padStart(2, "0")}h` : new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    plotted.forEach((row, index) => {
      const hours = (t - new Date(row.takenAt).getTime()) / 3600000;
      const kind = resolveCurve(row.kind, row.substanceId);
      if (kind === "duration") {
        const line = wikiLine(row.substanceId, row.route);
        point[`s${index}`] = line ? round(durationAt(hours, line.line)) : null;
        return;
      }
      const curve = curveOf(row.kind, row.substanceId);
      point[`s${index}`] = curve ? round(ownFraction(curve, row.dose, hours, row.route, row.stomachQuarters)) : null;
    });
    points.push(point);
  }
  return { points, series };
}

function round(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value * 1000) / 1000;
}
