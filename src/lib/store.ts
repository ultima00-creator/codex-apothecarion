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

export function removeCycle(id: string) {
  write(CYCLES, loadCycles().filter((row) => row.id !== id));
}

export function addAdjunct(cycleId: string, adjunct: CycleAdjunct) {
  const rows = loadCycles().map((row) => {
    if (row.id !== cycleId) return row;
    const adjuncts = row.adjuncts ?? [];
    if (adjuncts.some((item) => item.wing === adjunct.wing && item.substanceId === adjunct.substanceId)) return row;
    return { ...row, adjuncts: [...adjuncts, adjunct] };
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
