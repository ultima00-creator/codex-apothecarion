const extra: [string, string[]][] = [
  ["alprazolam", ["Frontal", "Xanax", "Apraz", "Ksalol"]],
  ["clonidina", ["Atensina", "Catapres", "Kapvay"]],
  ["clonidine", ["Atensina", "Catapres", "Kapvay"]],
  ["metilfenidato", ["Ritalina", "Concerta", "Ritalina LA"]],
  ["methylphenidate", ["Ritalina", "Concerta"]],
  ["propranolol", ["Inderal"]],
  ["baclofeno", ["Lioresal"]],
  ["baclofen", ["Lioresal"]],
  ["sertralina", ["Zoloft", "Tolrest"]],
  ["fluoxetina", ["Prozac", "Daforin"]],
  ["diazepam", ["Valium"]],
  ["clonazepam", ["Rivotril"]],
  ["venlafaxina", ["Efexor"]],
  ["quetiapina", ["Seroquel"]],
  ["risperidona", ["Risperdal"]],
  ["sildenafila", ["Viagra"]],
  ["tadalafila", ["Cialis"]],
  ["levotiroxina", ["Puran T4", "Euthyrox"]],
  ["metformina", ["Glifage"]],
  ["losartana", ["Cozaar"]],
  ["atenolol", ["Atenol"]],
  ["butanodiol", ["BDO", "1,4-B"]],
  ["butanediol", ["BDO", "1,4-B"]],
];

function fold(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function tradeNames(title: string, ...groups: (string[] | undefined)[]): string[] {
  const own = fold(title);
  const seen = new Set<string>([own]);
  const out: string[] = [];
  const push = (name: string) => {
    const key = fold(name);
    if (!key || seen.has(key) || key === own) return;
    seen.add(key);
    out.push(name);
  };
  for (const group of groups) for (const name of group ?? []) push(name);
  for (const [key, names] of extra) {
    if (own.includes(key) || key.includes(own)) for (const name of names) push(name);
  }
  return out;
}

export function tradeLine(title: string, ...groups: (string[] | undefined)[]): string {
  return tradeNames(title, ...groups).join(", ");
}
