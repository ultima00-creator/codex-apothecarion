import agumentarium from "@/data/agumentarium.json";
import conditionarium from "@/data/conditionarium.json";

export type WingId = "agumentarium" | "conditionarium";

export type WingCompound = {
  id: string;
  name: string;
  aliases: string[];
  className: string;
  description: string;
  halfLife: string;
  halfLifeDays: number | null;
  minDose: string;
  maxDose: string;
  warning: string;
};

const tables: Record<WingId, WingCompound[]> = {
  agumentarium: agumentarium as WingCompound[],
  conditionarium: conditionarium as WingCompound[],
};

export const wingCopy: Record<WingId, { title: string; line: string; seal: string; aside: string }> = {
  agumentarium: {
    title: "Agumentarium",
    line: "Selecione seu Combat-Stimm.",
    seal: "/agumentarium-tome.png",
    aside: "Desempenho físico. AAS, SARM, GH e insulina não entram. É estudo, não protocolo.",
  },
  conditionarium: {
    title: "Conditionarium",
    line: "Selecione seu Med-Stimm.",
    seal: "/conditionarium-tome.png",
    aside: "Dano e qualidade de vida. Inibidor de aromatase, SERM, cabergolina, hCG, GH e insulina não entram. Receita continua sendo receita.",
  },
};

export function wingCompounds(wing: WingId): WingCompound[] {
  return tables[wing];
}

export function findWingCompound(wing: WingId, id: string): WingCompound | null {
  return tables[wing].find((row) => row.id === id) ?? null;
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
