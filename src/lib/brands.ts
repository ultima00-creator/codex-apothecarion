const extra: [string, string[]][] = [
  ["alprazolam", ["Frontal", "Xanax", "Apraz", "Ksalol"]],
  ["clonidina", ["Atensina", "Catapres", "Kapvay"]],
  ["clonidine", ["Atensina", "Catapres", "Kapvay"]],
  ["metilfenidato", ["Ritalina", "Concerta", "Ritalina LA"]],
  ["methylphenidate", ["Ritalina", "Concerta"]],
  ["propranolol", ["Inderal"]],
  ["baclofeno", ["Lioresal"]],
  ["baclofen", ["Lioresal"]],
  ["fluoxetina", ["Prozac", "Daforin"]],
  ["diazepam", ["Valium", "Dienpax"]],
  ["lorazepam", ["Lorax"]],
  ["bromazepam", ["Lexotan"]],
  ["midazolam", ["Dormonid"]],
  ["escitalopram", ["Lexapro", "Reconter"]],
  ["paroxetina", ["Paxil", "Pondera", "Aropax"]],
  ["paroxetine", ["Paxil", "Pondera", "Aropax"]],
  ["sertralina", ["Zoloft", "Tolrest", "Assert"]],
  ["duloxetina", ["Cymbalta"]],
  ["duloxetine", ["Cymbalta"]],
  ["bupropiona", ["Wellbutrin", "Zyban"]],
  ["bupropion", ["Wellbutrin", "Zyban"]],
  ["mirtazapina", ["Remeron"]],
  ["mirtazapine", ["Remeron"]],
  ["olanzapina", ["Zyprexa"]],
  ["olanzapine", ["Zyprexa"]],
  ["aripiprazol", ["Abilify"]],
  ["aripiprazole", ["Abilify"]],
  ["pregabalina", ["Lyrica"]],
  ["pregabalin", ["Lyrica"]],
  ["gabapentina", ["Neurontin"]],
  ["gabapentin", ["Neurontin"]],
  ["zolpidem", ["Stilnox"]],
  ["zopiclona", ["Imovane"]],
  ["zopiclone", ["Imovane"]],
  ["nebivolol", ["Nebilet"]],
  ["telmisartana", ["Micardis"]],
  ["telmisartan", ["Micardis"]],
  ["metoprolol", ["Selozok", "Seloken"]],
  ["lisdexanfetamina", ["Venvanse"]],
  ["lisdexamfetamine", ["Venvanse"]],
  ["atomoxetina", ["Strattera"]],
  ["atomoxetine", ["Strattera"]],
  ["modafinila", ["Stavigile"]],
  ["modafinil", ["Stavigile"]],
  ["tamoxifeno", ["Nolvadex"]],
  ["tamoxifen", ["Nolvadex"]],
  ["anastrozol", ["Arimidex"]],
  ["anastrozole", ["Arimidex"]],
  ["letrozol", ["Femara"]],
  ["letrozole", ["Femara"]],
  ["clomifeno", ["Clomid"]],
  ["clomiphene", ["Clomid"]],
  ["oxandrolona", ["Anavar"]],
  ["nandrolona", ["Deca-Durabolin"]],
  ["nandrolone", ["Deca-Durabolin"]],
  ["estanozolol", ["Winstrol"]],
  ["stanozolol", ["Winstrol"]],
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

function named(own: string, key: string): boolean {
  if (own === key) return true;
  const at = own.lastIndexOf(key);
  if (at <= 0) return false;
  return !/[a-z]/.test(own[at - 1] ?? "");
}

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
    if (named(own, key)) for (const name of names) push(name);
  }
  return out;
}

export function tradeLine(title: string, ...groups: (string[] | undefined)[]): string {
  return tradeNames(title, ...groups).join(", ");
}
