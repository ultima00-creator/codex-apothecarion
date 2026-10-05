export type Protocol = {
  id: string;
  name: string;
  kind: "steroid_hormone" | "peptide" | "peptide_reconstitution";
  substanceId: string | null;
  peptideName?: string;
  model: string;
  value: number | null;
  unit: string | null;
  sourceQuality: string | null;
  plots: boolean;
  savedAt: string;
};

export type JournalNote = {
  id: string;
  name: string;
  text: string;
  savedAt: string;
};

const PROTO = "apothecarion-protocols";
const NOTES = "apothecarion-journal";

function read<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

export function loadProtocols(): Protocol[] {
  return read<Protocol>(PROTO);
}

export function saveProtocol(entry: Omit<Protocol, "id" | "savedAt">): Protocol {
  const row: Protocol = { ...entry, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
  write(PROTO, [row, ...loadProtocols()]);
  return row;
}

const CYCLES = "apothecarion-cycles";

export type CycleAdjunct = {
  wing: "agumentarium" | "conditionarium";
  substanceId: string;
  name: string;
  days: number;
};

export type Cycle = {
  id: string;
  name: string;
  weeks: number;
  lines: { substanceId: string; kind: "hormone" | "peptide"; dose: number; every: number; start: number; end: number }[];
  adjuncts?: CycleAdjunct[];
  savedAt: string;
};

export function loadCycles(): Cycle[] {
  return read<Cycle>(CYCLES);
}

export function saveCycle(entry: Omit<Cycle, "id" | "savedAt">): Cycle {
  const row: Cycle = { ...entry, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
  write(CYCLES, [row, ...loadCycles()]);
  return row;
}

export const EDIT_CYCLE = "apothecarion-edit-cycle";

export function removeCycle(id: string) {
  write(CYCLES, loadCycles().filter((row) => row.id !== id));
}

export function replaceCycle(id: string, entry: { name: string; weeks: number; lines: Cycle["lines"] }): Cycle | null {
  const rows = loadCycles();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const next = { ...rows[index], name: entry.name.trim(), weeks: entry.weeks, lines: entry.lines, savedAt: new Date().toISOString() };
  rows[index] = next;
  write(CYCLES, rows);
  return next;
}

export function renameCycle(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return loadCycles();
  const rows = loadCycles().map((row) => (row.id === id ? { ...row, name: trimmed } : row));
  write(CYCLES, rows);
  return rows;
}

export function duplicateCycle(id: string): Cycle | null {
  const row = loadCycles().find((item) => item.id === id);
  if (!row) return null;
  return saveCycle({
    name: `${row.name} cópia`,
    weeks: row.weeks,
    lines: row.lines.map((line) => ({ ...line })),
    adjuncts: (row.adjuncts ?? []).map((item) => ({ ...item })),
  });
}

export function removeAdjunct(cycleId: string, wing: CycleAdjunct["wing"], substanceId: string) {
  const rows = loadCycles().map((row) => {
    if (row.id !== cycleId) return row;
    return { ...row, adjuncts: (row.adjuncts ?? []).filter((item) => !(item.wing === wing && item.substanceId === substanceId)) };
  });
  write(CYCLES, rows);
  return rows;
}

export function addAdjunct(cycleId: string, adjunct: CycleAdjunct) {
  const rows = loadCycles().map((row) => {
    if (row.id !== cycleId) return row;
    const limit = Math.max(1, row.weeks * 7);
    const days = Math.min(limit, Math.max(1, Math.round(adjunct.days)));
    const next = { ...adjunct, days };
    const adjuncts = row.adjuncts ?? [];
    const index = adjuncts.findIndex((item) => item.wing === next.wing && item.substanceId === next.substanceId);
    if (index >= 0) {
      const copy = adjuncts.slice();
      copy[index] = next;
      return { ...row, adjuncts: copy };
    }
    return { ...row, adjuncts: [...adjuncts, next] };
  });
  write(CYCLES, rows);
  return rows;
}

export function loadNotes(): JournalNote[] {
  return read<JournalNote>(NOTES);
}

export function saveNote(name: string, text: string): JournalNote {
  const row: JournalNote = { id: crypto.randomUUID(), name, text, savedAt: new Date().toISOString() };
  write(NOTES, [row, ...loadNotes()]);
  return row;
}
