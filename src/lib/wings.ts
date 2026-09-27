import agumentarium from "@/data/agumentarium.json";
import conditionarium from "@/data/conditionarium.json";

export type WingId = "agumentarium" | "conditionarium";

export type WingCompound = {
  id: string;
  name: string;
  aliases: string[];
  className: string;
  description: string;
  halfLifeDays: number | null;
};

const tables: Record<WingId, WingCompound[]> = {
  agumentarium: agumentarium as WingCompound[],
  conditionarium: conditionarium as WingCompound[],
};

export const wingCopy: Record<WingId, { title: string; line: string; seal: string }> = {
  agumentarium: {
    title: "Agumentarium",
    line: "Selecione seu Combat-Stimm.",
    seal: "/agumentarium-seal.png",
  },
  conditionarium: {
    title: "Conditionarium",
    line: "Selecione seu Med-Stimm.",
    seal: "/conditionarium-seal.png",
  },
};

export function wingCompounds(wing: WingId): WingCompound[] {
  return tables[wing];
}

export function findWingCompound(wing: WingId, id: string): WingCompound | null {
  return tables[wing].find((row) => row.id === id) ?? null;
}

export function searchWing(wing: WingId, query: string): WingCompound[] {
  const needle = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (needle.length < 2) return [];
  return tables[wing]
    .filter((row) =>
      [row.name, row.className, row.description, ...row.aliases]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(needle),
    )
    .slice(0, 40);
}

const FAV = "apothecarion-wing-fav";

export function loadWingFavs(wing: WingId): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return parsed[wing] ?? [];
  } catch {
    return [];
  }
}

export function toggleWingFav(wing: WingId, id: string): string[] {
  const raw = localStorage.getItem(FAV);
  const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  const current = parsed[wing] ?? [];
  parsed[wing] = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  localStorage.setItem(FAV, JSON.stringify(parsed));
  return parsed[wing];
}
