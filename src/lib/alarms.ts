import { doseHorizon, fuseIngestions, type Ingestion } from "@/lib/diary";
import { displayUnit } from "@/lib/dose";
import { viaPt } from "@/lib/pt";

const KEY = "apothecarion-alarm-lot";

type Stamp = { uid: string; sequence: number };

function readLot(): Stamp[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Stamp[]) : [];
    return parsed.filter((item) => item && typeof item.uid === "string");
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

function calendar(blocks: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Codex Apothecarion//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
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

function eventBlock(input: { uid: string; sequence: number; end: Date; title: string; detail: string }): string {
  const start = input.end;
  const stop = new Date(start.getTime() + 5 * 60 * 1000);
  return [
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(stop)}`,
    `SEQUENCE:${input.sequence}`,
    "STATUS:CONFIRMED",
    `SUMMARY:${esc(input.title)}`,
    `DESCRIPTION:${esc(input.detail)}`,
    alarm(10),
    alarm(5),
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
    const sequence = old ? old.sequence + 1 : 1;
    next.push({ uid, sequence });
    const detail = group.doses.map((row) => {
      const clock = new Date(row.takenAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const horizon = doseHorizon(row);
      const until = horizon ? horizon.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "sem fim";
      return `${row.dose} ${displayUnit(row.unit)} · ${viaPt(row.route)} · ${clock} · até ~${until}`;
    }).join(" + ");
    const total = doseTotal(group.doses);
    blocks.push(eventBlock({
      uid,
      sequence,
      end,
      title: `[Codex:Apothecarion] - ${group.name} [Fim efeito]`,
      detail: `${total ? `${total}\n` : ""}${detail}. Conjectura do fim do efeito.`,
    }));
  }
  writeLot(next);
  if (blocks.length === 0) return null;
  return calendar(blocks);
}

export function openAlarmFiles(ics: string | null) {
  if (ics) openCalendar(ics, "Codex-alarmes.ics");
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
