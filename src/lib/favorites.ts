export type Fav = { kind: "hormone" | "peptide" | "wiki" | "medicine"; id: string };

const KEY = "apothecarion-fav";

export function loadFavs(): Fav[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Fav[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFav(item: Fav): Fav[] {
  const current = loadFavs();
  const next = current.some((row) => row.kind === item.kind && row.id === item.id)
    ? current.filter((row) => !(row.kind === item.kind && row.id === item.id))
    : [item, ...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
