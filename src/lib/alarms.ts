import { doseHorizon, fuseIngestions, type Ingestion } from "@/lib/diary";
import { displayUnit } from "@/lib/dose";
import { viaPt } from "@/lib/pt";

const KEY = "apothecarion-alarm-lot";
const RETIRED = "apothecarion-alarm-retired";

type Stamp = { uid: string; sequence: number; end?: string };

export type AlarmFiles = { cancel: string | null; publish: string | null };

function readStamps(key: string): Stamp[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stamp[]) : [];
  } catch {
    return [];
  }
}

function writeStamps(key: string, rows: Stamp[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function calendar(blocks: string[], method: "PUBLISH" | "CANCEL"): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Codex Apothecarion//PT",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "X-WR-CALNAME:Apothecarion",
    ...blocks,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function alarm(minutes: number): string {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:O efeito acaba em ${minutes} minutos`,
    `TRIGGER:-PT${minutes}M`,
    "END:VALARM",
  ].join("\r\n");
}

function eventBlock(input: { uid: string; sequence: number; end: Date; title: string; detail: string; cancelled: boolean }): string {
  const start = input.end;
  const stop = new Date(start.getTime() + 5 * 60 * 1000);
  return [
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(stop)}`,
    `SEQUENCE:${input.sequence}`,
    input.cancelled ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    `SUMMARY:${esc(input.title)}`,
    `DESCRIPTION:${esc(input.detail)}`,
    ...(input.cancelled ? [] : [alarm(10), alarm(5)]),
    "END:VEVENT",
  ].join("\r\n");
}

function doseTotal(doses: Ingestion[]): string {
  if (doses.length < 2) return "";
  const unit = displayUnit(doses[0].unit);
  if (doses.some((row) => displayUnit(row.unit) !== unit)) return "";
  const total = Math.round(doses.reduce((sum, row) => sum + row.dose, 0) * 1000) / 1000;
  return `Dose total ${total} ${unit}`;
}

export function syncAlarmCalendar(rows: Ingestion[], now = Date.now()): AlarmFiles {
  const known = new Map<string, Stamp>();
  for (const item of [...readStamps(RETIRED), ...readStamps(KEY)]) known.set(item.uid, item);
  for (const group of fuseIngestions(rows)) {
    const legacy = `apothecarion-${group.kind}-${group.substanceId}@codex`;
    if (!known.has(legacy)) known.set(legacy, { uid: legacy, sequence: 0 });
  }
  const cancelBlocks = [...known.values()].map((item) => eventBlock({
    uid: item.uid,
    sequence: item.sequence + 1,
    end: item.end ? new Date(item.end) : new Date(now),
    cancelled: true,
    title: "[Codex:Apothecarion] - aviso removido",
    detail: "Evento apagado do calendário Apothecarion.",
  }));
  const generation = now.toString(36);
  const next: Stamp[] = [];
  const publishBlocks: string[] = [];
  for (const group of fuseIngestions(rows)) {
    const ends = group.doses.flatMap((row) => {
      const end = doseHorizon(row);
      return end && end.getTime() > now ? [end] : [];
    });
    if (ends.length === 0) continue;
    const end = new Date(Math.max(...ends.map((item) => item.getTime())));
    const uid = `apothecarion-${group.kind}-${group.substanceId}-${generation}@codex`;
    next.push({ uid, sequence: 0, end: end.toISOString() });
    const detail = group.doses.map((row) => {
      const clock = new Date(row.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const horizon = doseHorizon(row);
      const until = horizon ? horizon.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "sem fim";
      return `${row.dose} ${displayUnit(row.unit)} · ${viaPt(row.route)} · ${clock} · até ~${until}`;
    }).join(" + ");
    const total = doseTotal(group.doses);
    publishBlocks.push(eventBlock({
      uid,
      sequence: 0,
      end,
      cancelled: false,
      title: `[Codex:Apothecarion] - ${group.name} [Fim efeito]`,
      detail: `${total ? `${total}\n` : ""}${detail}. Conjectura do fim do efeito.`,
    }));
  }
  const retired = [...known.values()].map((item) => ({ ...item, sequence: item.sequence + 1 }));
  writeStamps(RETIRED, [...retired, ...next].slice(-300));
  writeStamps(KEY, next);
  return {
    cancel: cancelBlocks.length > 0 ? calendar(cancelBlocks, "CANCEL") : null,
    publish: publishBlocks.length > 0 ? calendar(publishBlocks, "PUBLISH") : null,
  };
}

export function openAlarmFiles(files: AlarmFiles) {
  const queue = [
    files.cancel ? { ics: files.cancel, filename: "Codex-apagar.ics" } : null,
    files.publish ? { ics: files.publish, filename: "Codex-alarmes.ics" } : null,
  ].filter((item): item is { ics: string; filename: string } => item != null);
  queue.forEach((item, index) => {
    window.setTimeout(() => openCalendar(item.ics, item.filename), index * 600);
  });
}

export function cancelAlarmCalendar(now = Date.now()): string | null {
  const previous = [...readStamps(RETIRED), ...readStamps(KEY)];
  if (previous.length === 0) return null;
  const blocks = previous.map((item) => eventBlock({
    uid: item.uid,
    sequence: item.sequence + 1,
    end: item.end ? new Date(item.end) : new Date(now),
    cancelled: true,
    title: "[Codex:Apothecarion] - aviso removido",
    detail: "Lote de alarmes apagado.",
  }));
  writeStamps(KEY, []);
  writeStamps(RETIRED, previous.map((item) => ({ ...item, sequence: item.sequence + 1 })).slice(-300));
  return calendar(blocks, "CANCEL");
}

export function openCalendar(ics: string, filename: string) {
  const file = new File([ics], filename, { type: "text/calendar" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
