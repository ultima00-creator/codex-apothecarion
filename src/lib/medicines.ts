import type { Curve } from "@/lib/kinetics";
import extra from "@/data/remedios.json";

export type Medicine = {
  id: string;
  name: string;
  aliases: string[];
  className: string;
  description: string;
  addendum?: string;
  halfLifeDays: number | null;
};

const source = "Meia-vida da tabela pública do plotter. Sem Cmax e sem Tmax. O gráfico é fração da dose, não concentração.";
export const pkSource = "Meia-vida numérica casada com a tabela curada dhimmel/drugbank (CC BY-NC 4.0). Sem Cmax. O gráfico é fração da dose, não concentração.";

const hand: Medicine[] = [
  { id: "nebivolol", name: "Nebivolol", aliases: ["nebivolol"], className: "beta-bloqueador", description: "Beta-bloqueador com vasodilatação ligada ao óxido nítrico. Em dose baixa, e em metabolizador rápido, tende a ser seletivo para o receptor beta-1. Os metabólitos hidroxilados e os glicuronídeos também participam do bloqueio. Remédio ancilar, fora da linha de ésteres.", addendum: "Nesta tabela a meia-vida é 0,71 dia, cerca de 17 h. O rótulo do isômero d cita cerca de 12 h na maioria e 19 h em metabolizador lento de CYP2D6. Dezessete horas ficam nesse intervalo. A refeição não muda a cinética do rótulo. O atraso de estômago é a regra geral da curva, não um dado deste fármaco.", halfLifeDays: 0.7054166667 },
  { id: "telmisartana", name: "Telmisartana", aliases: ["telmisartan", "telmisartana"], className: "bloqueador do receptor de angiotensina", description: "BRA. Remédio ancilar, fora da linha de ésteres.", halfLifeDays: 0.9708333333 },
  { id: "anastrozol", name: "Anastrozol", aliases: ["anastrozole", "arimidex"], className: "inibidor da aromatase", description: "Inibidor da aromatase. Remédio ancilar.", halfLifeDays: 1.95 },
  { id: "exemestano", name: "Exemestano", aliases: ["exemestane", "aromasin"], className: "inibidor da aromatase", description: "Inibidor da aromatase. Remédio ancilar.", halfLifeDays: 0.945833333 },
  { id: "tamoxifeno", name: "Tamoxifeno", aliases: ["tamoxifen", "nolvadex"], className: "modulador seletivo do receptor de estrogênio", description: "SERM. Remédio ancilar.", halfLifeDays: 1.975 },
  { id: "clomifeno", name: "Clomifeno", aliases: ["clomiphene", "clomid"], className: "modulador seletivo do receptor de estrogênio", description: "SERM. Remédio ancilar.", halfLifeDays: 5 },
  { id: "cabergolina", name: "Cabergolina", aliases: ["cabergoline"], className: "agonista dopaminérgico", description: "Agonista dopaminérgico. Remédio ancilar.", halfLifeDays: 3.583333333 },
  { id: "letrozol", name: "Letrozol", aliases: ["letrozole"], className: "inibidor da aromatase", description: "Inibidor da aromatase. Remédio ancilar.", halfLifeDays: 1.389583333 },
  { id: "tadalafila", name: "Tadalafila", aliases: ["tadalafil"], className: "inibidor da fosfodiesterase 5", description: "Inibidor da PDE5. Remédio ancilar.", halfLifeDays: 0.7083333333 },
];

export const medicines: Medicine[] = [...hand, ...(extra as Medicine[])];

export function findMedicine(id: string): Medicine | null {
  return medicines.find((row) => row.id === id) ?? null;
}

export function medicineCurve(id: string): Curve | null {
  const row = findMedicine(id);
  if (!row?.halfLifeDays) return null;
  return { model: "half_life_only", unit: null, half_life_days: row.halfLifeDays, source: row.addendum ? source : pkSource };
}

export const medicineSource = source;
