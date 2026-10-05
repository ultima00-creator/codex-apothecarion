import { findMedicine } from "@/lib/medicines";
import { findHormone, findWiki } from "@/lib/search";

export type Face = { src: string; color: string };

const RED = "#c4473a";
const YELLOW = "#e0b33a";
const BLUE = "#3aa0d8";

const ORALS = ["anavar", "anadrol", "dianabol", "halotestin", "superdrol", "turinabol", "mesterolone", "proviron"];

function oral(compound: string, form?: string | null): boolean {
  if (form && /oral/i.test(form)) return true;
  const name = compound.toLowerCase();
  return ORALS.some((item) => name.includes(item));
}

function lineage(compound: string): "dht" | "test" | "nor" | null {
  const name = compound.toLowerCase();
  if (name.includes("dihydroboldenone") || name.includes("dhb")) return "dht";
  if (/masteron|primobolan|winstrol|anavar|anadrol|superdrol|mesterolone|proviron|drostanolone|methenolone|oxandrolone|stanozolol|oxymetholone|methasterone/.test(name)) return "dht";
  if (/nandrolone|trenbolone|trestolone/.test(name)) return "nor";
  if (/testosterone|boldenone|dianabol|turinabol|halotestin|equipoise/.test(name)) return "test";
  return null;
}

export function faceFor(compound: string, form?: string | null): Face | null {
  const name = compound.toLowerCase();
  if (name.includes("halotestin")) return { src: "/relics/syringe-yellow.png", color: YELLOW };
  const line = lineage(compound);
  if (!line) return null;
  if (oral(compound, form)) {
    if (line === "dht") return { src: "/relics/oral-red.png", color: RED };
    if (name.includes("dianabol")) return { src: "/relics/oral-yellow.png", color: YELLOW };
    return null;
  }
  if (line === "dht") return { src: "/relics/syringe-red.png", color: RED };
  if (line === "test") return { src: "/relics/syringe-yellow.png", color: YELLOW };
  if (line === "nor") return { src: "/relics/syringe-blue.png", color: BLUE };
  return null;
}

export function shade(hex: string, slot: number): string {
  if (slot % 5 === 0) return hex;
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const step = slot % 5;
  const toward = step % 2 === 1 ? 255 : 40;
  const t = step < 3 ? 0.32 : 0.52;
  r = Math.round(r + (toward - r) * t);
  g = Math.round(g + (toward - g) * t);
  b = Math.round(b + (toward - b) * t);
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

export function codexAccent(key: string, kind: "hormone" | "peptide" | "medicine" | "wiki"): string {
  if (kind === "hormone") return "#c6a15a";
  if (kind === "peptide") return "#6aaa78";
  if (key.includes("beta") || key.includes("angiotensina")) return "#3d7eab";
  if (key.includes("stimul")) return "#c45a3a";
  if (key.includes("aromatase") || key.includes("eugero") || key.includes("gabapentin")) return "#c47a4a";
  if (key.includes("estrog") || key.includes("modulador") || key.includes("psyche") || key.includes("entact") || key.includes("hallucin")) return "#c45a78";
  if (key.includes("dopamin") || key.includes("opioid") || key.includes("antipsych")) return "#7a6ab0";
  if (key.includes("benzo") || key.includes("depress") || key.includes("dissoci") || key.includes("cannabin") || key.includes("nootrop")) return "#4aa88a";
  if (!key) return "#b4967e";
  const palette = ["#3d7eab", "#c47a4a", "#c45a78", "#7a6ab0", "#4aa88a", "#c45a3a", "#8a6a9a", "#6a8a4a"];
  let hash = 0;
  for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

export function inkFor(kind: "hormone" | "peptide" | "medicine" | "wiki", id: string): string {
  if (kind === "hormone") {
    const row = findHormone(id);
    return faceFor(row?.compound ?? "", row?.form)?.color ?? "#c6a15a";
  }
  if (kind === "peptide") return "#6aaa78";
  if (kind === "medicine") return codexAccent((findMedicine(id)?.className ?? "").toLowerCase(), "medicine");
  const wiki = findWiki(id);
  return faceFor(wiki?.name ?? "", null)?.color ?? codexAccent((wiki?.classes[0] ?? "").toLowerCase(), "wiki");
}
