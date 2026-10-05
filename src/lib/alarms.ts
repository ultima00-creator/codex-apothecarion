import { doseHorizon, fuseIngestions, type Ingestion } from "@/lib/diary";
import { displayUnit } from "@/lib/dose";
import { viaPt } from "@/lib/pt";

const KEY = "apothecarion-alarm-lot";

type Stamp = { uid: string; sequence: number };

function readLot(): Stamp[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stamp[]) : [];
  } catch {
    return [];
  }
}

function writeLot(rows: Stamp[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
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
    "X-WR-CALNAME:Codex Apothecarion",
    ...blocks,
    "END:VCALENDAR",
    "",
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
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:O efeito acabou",
    "TRIGGER:PT0S",
    "END:VALARM",
    "END:VEVENT",
  ].join("\r\n");
}

export function reminderSlips(rows: Ingestion[], now = Date.now()): { name: string; when: string; phrase: string }[] {
  const today = new Date(now);
  const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const slips: { name: string; when: string; phrase: string }[] = [];
  for (const group of fuseIngestions(rows)) {
    const ends = group.doses.flatMap((row) => {
      const end = doseHorizon(row);
      return end && end.getTime() > now ? [end] : [];
    });
    if (ends.length === 0) continue;
    const end = new Date(Math.max(...ends.map((item) => item.getTime())));
    const clock = end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const days = Math.round((dayStart(end) - dayStart(today)) / 86400000);
    const when = days <= 0 ? `hoje às ${clock}` : days === 1 ? `amanhã às ${clock}` : `dia ${end.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} às ${clock}`;
    slips.push({
      name: group.name,
      when,
      phrase: `Lembra-me ${when}: fim do efeito do ${group.name}`,
    });
  }
  return slips;
}

export function syncAlarmCalendar(rows: Ingestion[], now = Date.now()): string | null {
  const previous = readLot();
  const prior = new Map(previous.map((item) => [item.uid, item]));
  const next: Stamp[] = [];
  const blocks: string[] = [];
  for (const group of fuseIngestions(rows)) {
    const ends = group.doses.flatMap((row) => {
      const end = doseHorizon(row);
      return end && end.getTime() > now ? [end] : [];
    });
    if (ends.length === 0) continue;
    const end = new Date(Math.max(...ends.map((item) => item.getTime())));
    const uid = `apothecarion-${group.kind}-${group.substanceId}@codex`;
    const old = prior.get(uid);
    const sequence = old ? old.sequence + 1 : 0;
    next.push({ uid, sequence });
    prior.delete(uid);
    const detail = group.doses.map((row) => {
      const clock = new Date(row.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const horizon = doseHorizon(row);
      const until = horizon ? horizon.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "sem fim";
      return `${row.dose} ${displayUnit(row.unit)} · ${viaPt(row.route)} · ${clock} · até ~${until}`;
    }).join(" + ");
    blocks.push(eventBlock({
      uid,
      sequence,
      end,
      cancelled: false,
      title: `Fim do efeito · ${group.name}`,
      detail: `${detail}. Conjectura do fim do efeito.`,
    }));
  }
  for (const old of prior.values()) {
    blocks.push(eventBlock({
      uid: old.uid,
      sequence: old.sequence + 1,
      end: new Date(now),
      cancelled: true,
      title: "Aviso removido",
      detail: "Este alarme saiu do lote ativo.",
    }));
  }
  writeLot(next);
  if (blocks.length === 0) return null;
  return calendar(blocks, "PUBLISH");
}

export function cancelAlarmCalendar(now = Date.now()): string | null {
  const previous = readLot();
  if (previous.length === 0) return null;
  const blocks = previous.map((item) => eventBlock({
    uid: item.uid,
    sequence: item.sequence + 1,
    end: new Date(now),
    cancelled: true,
    title: "Aviso removido",
    detail: "Lote de alarmes apagado.",
  }));
  writeLot([]);
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
