import { tradeLine, tradeNames } from "@/lib/brands";
import { findMedicine, medicines } from "@/lib/medicines";
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
function fold(value: string): string {
  let text = norm(value).replace(
    /^(dicloridrato|cloridrato|bromidrato|hemifumarato|hemitartarato|sulfato|maleato|fosfato|nitrato|acetato|citrato|mesilato|besilato|tartarato|succinato|fumarato|hidrobrometo|hidrocloreto|benzoato|valerato) de /,
    "",
  );
  text = text.replace(/ /g, "").replaceAll("ph", "f").replaceAll("y", "i").replaceAll("th", "t").replaceAll("k", "c");
  const endings: [string, string][] = [
    ["ato", "at"],
    ["ate", "at"],
    ["ina", "in"],
    ["ine", "in"],
    ["ona", "on"],
    ["one", "on"],
    ["ido", "id"],
    ["ide", "id"],
  ];
  for (const [from, to] of endings) {
    if (text.endsWith(from) && text.length > from.length + 3) {
      text = text.slice(0, -from.length) + to;
      break;
    }
  }
  if (text.length > 4 && (text.endsWith("o") || text.endsWith("e"))) text = text.slice(0, -1);
  return text;
}

function plainName(name: string): string {
  return name.replace(
    /^(Dicloridrato|Cloridrato|Bromidrato|Hemifumarato|Hemitartarato|Sulfato|Maleato|Fosfato|Nitrato|Acetato|Citrato|Mesilato|Besilato|Tartarato|Succinato|Fumarato|Hidrobrometo|Hidrocloreto|Benzoato|Valerato) de /,
    "",
  );
}

const wikiByFold = new Map<string, (typeof catalog.wiki)[number]>();
for (const row of catalog.wiki) {
  for (const name of [row.name, ...row.commonNames]) {
    const key = fold(name);
    if (key.length < 6 || wikiByFold.has(key)) continue;
    wikiByFold.set(key, row);
  }
}

const hiddenMedicine = new Set<string>();
const titleBySlug = new Map<string, string>();
for (const row of medicines) {
  const wiki = wikiByFold.get(fold(row.name));
  if (!wiki || row.name.includes(";")) continue;
  hiddenMedicine.add(row.id);
  const title = plainName(row.name);
  const current = titleBySlug.get(wiki.slug);
  if (!current || title.length < current.length) titleBySlug.set(wiki.slug, title);
}

export function wikiTitle(slug: string, fallback: string): string {
  return titleBySlug.get(slug) ?? fallback;
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
    if (hiddenMedicine.has(row.id)) continue;
    const names = tradeNames(row.name, row.aliases);
    const hay = norm([row.name, row.className, ...row.aliases, ...names].join(" "));
    if (hit(hay)) hits.push({ kind: "medicine", id: row.id, title: row.name, detail: tradeLine(row.name, row.aliases) || "compound" });
  }
  for (const row of catalog.wiki) {
    const title = wikiTitle(row.slug, row.name);
    const hay = norm([title, row.name, ...row.commonNames, ...tradeNames(title, row.commonNames)].join(" "));
    if (hit(hay)) {
      hits.push({ kind: "wiki", id: row.slug, title, detail: tradeLine(title, row.commonNames) || "compound" });
    }
  }
  return hits.slice(0, 40);
}

let compoundList: Hit[] | null = null;

export function listCompounds(): Hit[] {
  if (compoundList) return compoundList;
  const hits: Hit[] = [];
  for (const row of medicines) {
    if (hiddenMedicine.has(row.id)) continue;
    hits.push({ kind: "medicine", id: row.id, title: row.name, detail: tradeLine(row.name, row.aliases) || "compound" });
  }
  for (const row of catalog.wiki) {
    const title = wikiTitle(row.slug, row.name);
    hits.push({ kind: "wiki", id: row.slug, title, detail: tradeLine(title, row.commonNames) || "compound" });
  }
  hits.sort((a, b) => a.title.localeCompare(b.title, "pt"));
  compoundList = hits;
  return hits;
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

function medicineRoutes(id: string): string[] {
  const row = findMedicine(id);
  const blob = norm(`${row?.name ?? ""} ${row?.className ?? ""}`);
  if (/injetav|parenteral|intraven/.test(blob)) return ["intravenous"];
  if (/intramusc/.test(blob)) return ["intramuscular"];
  if (/subcutan/.test(blob)) return ["subcutaneous"];
  if (/oftalm|otolog|topic|dermat|colir/.test(blob)) return ["topical"];
  if (/inalat|aerossol|nasal/.test(blob)) return ["inhaled"];
  if (/retal|suposit/.test(blob)) return ["rectal"];
  if (/transderm|adesiv/.test(blob)) return ["transdermal"];
  return ["oral"];
}

export function routesFor(hit: Hit): string[] {
  if (hit.kind === "wiki") {
    const names = findWiki(hit.id)?.roas.map((roa) => (roa.name ?? "").toLowerCase()).filter(Boolean) ?? [];
    return [...new Set(names)].sort((a, b) => Number(b === "oral") - Number(a === "oral"));
  }
  if (hit.kind === "hormone") {
    const route = findHormone(hit.id)?.route_default;
    return route ? [route] : [];
  }
  if (hit.kind === "peptide") {
    const route = findPeptide(hit.id)?.route_default;
    return route ? [route] : [];
  }
  if (hit.kind === "medicine") return medicineRoutes(hit.id);
  return [];
}

export function plotCompounds() {
  const hormones = catalog.hormones.filter((row) => row.id !== "progesterone-vaginal").map((row) => ({
    kind: "hormone" as const,
    id: row.id,
    compound: row.compound === "Estradiol" && (row.route_default === "intramuscular" || /intramuscular|cypionate|valerate|benzoate|enanthate/i.test(row.form ?? ""))
      ? "Estradiol Injetável"
      : row.compound,
    label: `${row.compound} ${row.form ?? ""}`.trim(),
    curve: row.curve,
  }));
  const prop = catalog.hormones.find((row) => row.id === "testosterone-propionate");
  if (prop) {
    hormones.push({
      kind: "hormone" as const,
      id: "testosterone-durateston",
      compound: "Durateston",
      label: "Durateston",
      curve: prop.curve,
    });
  }
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

export function hitById(kind: string, id: string): Hit | null {
  if (kind === "wiki") {
    const row = findWiki(id);
    return row ? { kind: "wiki", id: row.slug, title: wikiTitle(row.slug, row.name), detail: "compound" } : null;
  }
  if (kind === "medicine") {
    const row = findMedicine(id);
    return row ? { kind: "medicine", id: row.id, title: row.name, detail: "compound" } : null;
  }
  if (kind === "hormone") {
    const row = findHormone(id);
    return row ? { kind: "hormone", id: row.id, title: `${row.compound} ${row.form ?? ""}`.trim(), detail: "implante" } : null;
  }
  if (kind === "peptide") {
    const row = findPeptide(id);
    return row ? { kind: "peptide", id: row.id, title: `${row.compound} ${row.form ?? ""}`.trim(), detail: "peptídeo" } : null;
  }
  return null;
}
