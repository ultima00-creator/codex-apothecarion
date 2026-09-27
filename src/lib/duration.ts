/** Timeline from a wiki duration card. Not an elimination half-life. */

export type Span = { min: number; max: number };

export type Timeline = {
  onset: Span | null;
  comeup: Span | null;
  peak: Span | null;
  offset: Span | null;
  total: Span | null;
};

const hoursOf: Record<string, number> = {
  second: 1 / 3600,
  seconds: 1 / 3600,
  minute: 1 / 60,
  minutes: 1 / 60,
  hour: 1,
  hours: 1,
  day: 24,
  days: 24,
};

export function parseSpan(text: string | number | null | undefined): Span | null {
  if (text == null || text === "") return null;
  const raw = String(text).trim().toLowerCase();
  const range = raw.match(/([\d.]+)\s*[–-]\s*([\d.]+)\s*(seconds|second|minutes|minute|hours|hour|days|day)?/);
  if (range) {
    const factor = hoursOf[range[3] ?? "hour"] ?? 1;
    const min = Number(range[1]) * factor;
    const max = Number(range[2]) * factor;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return null;
    return { min, max };
  }
  const single = raw.match(/([\d.]+)\s*(seconds|second|minutes|minute|hours|hour|days|day)?/);
  if (!single) return null;
  const factor = hoursOf[single[2] ?? "hour"] ?? 1;
  const value = Number(single[1]) * factor;
  if (!Number.isFinite(value) || value <= 0) return null;
  return { min: value, max: value };
}

function mid(span: Span | null): number {
  if (!span) return 0;
  return (span.min + span.max) / 2;
}

export function durationAt(tHours: number, line: Timeline): number | null {
  if (tHours < 0) return 0;
  let start = mid(line.onset);
  let rise = mid(line.comeup);
  let hold = mid(line.peak);
  let fall = mid(line.offset);
  const phased = rise + hold + fall > 0;
  if (!phased) {
    if (!line.total) return null;
    const total = mid(line.total);
    start = 0;
    rise = total * 0.2;
    hold = total * 0.5;
    fall = total * 0.3;
  }
  if (rise + hold + fall <= 0) return null;
  if (tHours < start) return 0;
  const elapsed = tHours - start;
  if (elapsed <= rise) return rise === 0 ? 1 : elapsed / rise;
  if (elapsed <= rise + hold) return 1;
  if (elapsed <= rise + hold + fall) {
    const drop = fall === 0 ? 1 : (elapsed - rise - hold) / fall;
    return 1 - drop;
  }
  return 0;
}

export function durationEnd(line: Timeline): number {
  const start = mid(line.onset);
  const body = mid(line.comeup) + mid(line.peak) + mid(line.offset);
  if (body > 0) return start + body;
  return mid(line.total);
}
