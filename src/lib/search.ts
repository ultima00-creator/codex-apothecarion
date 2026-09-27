import { medicines } from "@/lib/medicines";
import catalog from "@/data/catalog.json";

export type Hit =
  | { kind: "hormone"; id: string; title: string; detail: string }
  | { kind: "peptide"; id: string; title: string; detail: string }
  | { kind: "wiki"; id: string; title: string; detail: string }
  | { kind: "medicine"; id: string; title: string; detail: string };

const ester: [string, string][] = [
  ["enantato", "enanthate"],
  ["cipionato", "cypionate"],
  ["propionato", "propionate"],
  ["undecanoato", "undecanoate"],
  ["decanoato", "decanoate"],
  ["acetato", "acetate"],
  ["fenilpropionato", "phenylpropionate"],
  ["isocaproato", "isocaproate"],
  ["testosterona", "testosterone"],
  ["nandrolona", "nandrolone"],
  ["trembolona", "trenbolone"],
  ["semaglutida", "semaglutide"],
  ["tirzepatida", "tirzepatide"],
];

function queries(value: string): string[] {
  const found = new Set<string>([value]);
  for (const [from, to] of ester) {
    if (value.includes(from)) found.add(value.replaceAll(from, to));
  }
  return [...found];
}
function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function search(query: string): Hit[] {
  const forms = queries(norm(query));
  if (forms.every((item) => item.length < 2)) return [];
  const hits: Hit[] = [];
  const hit = (hay: string) => forms.some((item) => hay.includes(item));
  for (const row of medicines) {
    const hay = norm([row.name, row.className, ...row.aliases].join(" "));
    if (hit(hay)) hits.push({ kind: "medicine", id: row.id, title: row.name, detail: "remédio · meia-vida" });
  }
  for (const row of catalog.wiki) {
    const hay = norm([row.name, ...row.commonNames].join(" "));
    if (hit(hay)) {
      hits.push({ kind: "wiki", id: row.slug, title: row.name, detail: "wiki" });
    }
  }
  return hits.slice(0, 40);
}

export function findHormone(id: string) {
  return catalog.hormones.find((row) => row.id === id) ?? null;
}

export function findPeptide(id: string) {
  return catalog.peptides.find((row) => row.id === id) ?? null;
}

export function findWiki(slug: string) {
  return catalog.wiki.find((row) => row.slug === slug) ?? null;
}

export function plotCompounds() {
  const hormones = catalog.hormones.map((row) => ({
    kind: "hormone" as const,
    id: row.id,
    compound: row.compound,
    label: `${row.compound} ${row.form ?? ""}`.trim(),
    curve: row.curve,
  }));
  const peptides = catalog.peptides.map((row) => ({
    kind: "peptide" as const,
    id: row.id,
    compound: row.compound,
    label: `${row.compound} ${row.form ?? ""}`.trim(),
    curve: row.curve,
  }));
  return [...hormones, ...peptides];
}

export function wikiByCompound(name: string) {
  const key = norm(name);
  return catalog.wiki.find((row) => norm(row.name) === key || row.commonNames.some((item) => norm(item) === key)) ?? null;
}
