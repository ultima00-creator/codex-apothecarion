const routes: Record<string, string> = {
  oral: "oral",
  sublingual: "sublingual",
  buccal: "bucal",
  insufflated: "insuflada",
  smoked: "fumada",
  inhaled: "inalada",
  intravenous: "intravenosa",
  intramuscular: "intramuscular",
  subcutaneous: "subcutânea",
  rectal: "retal",
  transdermal: "transdérmica",
  topical: "tópica",
  vaginal: "vaginal",
};

const classes: Record<string, string> = {
  psychedelic: "psicodélico",
  stimulant: "estimulante",
  stimulants: "estimulante",
  depressant: "depressor",
  dissociative: "dissociativo",
  opioid: "opioide",
  opioids: "opioide",
  deliriant: "delirante",
  entactogen: "entactógeno",
  nootropic: "nootrópico",
  oneirogen: "onirógeno",
  eugeroics: "eugeroico",
  eugeroic: "eugeroico",
  antipsychotic: "antipsicótico",
  antipsychotics: "antipsicótico",
  antidepressant: "antidepressivo",
  antidepressants: "antidepressivo",
  cannabinoid: "canabinoide",
  cannabinoids: "canabinoide",
  benzodiazepine: "benzodiazepínico",
  benzodiazepines: "benzodiazepínico",
  gabapentinoid: "gabapentinoide",
  habit: "hábito",
  "ssri": "inibidor seletivo da recaptação de serotonina",
};

export function viaPt(name: string | null | undefined): string {
  if (!name) return "via não informada";
  return routes[name.toLowerCase()] ?? name;
}

export function classePt(name: string): string {
  return classes[name.toLowerCase()] ?? name;
}

export function nomePt(name: string): string {
  return classePt(name);
}

export function tempoPt(text: string | null | undefined): string {
  if (!text) return "—";
  return text
    .replace(/\.0+(?=(\D|$))/g, "")
    .replace(/minutes/gi, "min")
    .replace(/minute/gi, "min")
    .replace(/hours/gi, "h")
    .replace(/hour/gi, "h")
    .replace(/seconds/gi, "s")
    .replace(/second/gi, "s")
    .replace(/days/gi, "dias")
    .replace(/day/gi, "dia");
}
