import { findWiki, wikiTitle } from "@/lib/search";
import { classePt, nomePt, tempoPt, viaPt } from "@/lib/pt";

const levelLabel: Record<string, string> = {
  dangerous: "perigosa",
  unsafe: "insegura",
  uncertain: "incerta",
};

function bucket(classes: string[], name: string, level: string): "negativa" | "sinergica" | "incerta" {
  const partner = name.toLowerCase();
  const same = classes.some((item) => {
    const own = item.toLowerCase();
    return partner === own || partner.includes(own) || own.includes(partner);
  });
  if (level === "dangerous" || level === "unsafe") return "negativa";
  if (same) return "sinergica";
  return "incerta";
}

function doseText(value: string | number | null | undefined, unit: string | null): string {
  if (value == null || value === "") return "—";
  const text = String(value).replace(/\.0+(?=(\D|$))/g, "");
  if (unit && !/[a-zA-Zµ]/.test(text)) return `${text} ${unit}`;
  return text;
}

export function WikiSheet({ slug }: { slug: string }) {
  const row = findWiki(slug);
  if (!row) return <p>Não está no catálogo da wiki.</p>;
  return (
    <article className="space-y-5">
      <header>
        <p className="text-xs tracking-[0.2em] text-bronze uppercase">Wiki</p>
        <h2 className="font-display text-3xl">{wikiTitle(row.slug, row.name)}</h2>
        {row.classes.length > 0 ? <p className="text-muted">{row.classes.map(classePt).join(" · ")}</p> : null}
        {row.commonNames.length > 0 ? <p className="text-sm">Também: {row.commonNames.join(", ")}</p> : null}
      </header>
      {row.lead_pt ? <p>{row.lead_pt}</p> : <p className="text-muted">A página não trouxe um parágrafo de abertura.</p>}
      <p className="text-sm">Meia-vida de eliminação: não está na ficha salva. A duração abaixo não substitui.</p>
      <section>
        <h3 className="font-display text-2xl">Dose e duração</h3>
        <p className="mb-2 text-sm text-muted">Tabela citada, não é prescrição. A linha do tempo do Diarium usa início, subida, pico e descida. Não é meia-vida de eliminação.</p>
        {row.roas.length === 0 ? <p className="text-sm">Sem via na ficha.</p> : null}
        <ul className="space-y-4">
          {row.roas.map((roa) => (
            <li key={roa.name} className="border border-rule p-3 text-sm">
              <p className="font-display text-2xl">{viaPt(roa.name)}</p>
              <p className="mt-2">
                Limiar {doseText(roa.threshold, roa.dose_units)} · leve {doseText(roa.light, roa.dose_units)} · comum {doseText(roa.common, roa.dose_units)} · forte {doseText(roa.strong, roa.dose_units)} · pesada {doseText(roa.heavy, roa.dose_units)}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                <li className="chip">início {tempoPt(roa.onset)}</li>
                <li className="chip">subida {tempoPt(roa.comeup)}</li>
                <li className="chip">pico {tempoPt(roa.peak)}</li>
                <li className="chip">descida {tempoPt(roa.offset)}</li>
              </ul>
              <p className="mt-2 text-muted">Total {tempoPt(roa.total)} · resíduo {tempoPt(roa.afterglow)}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="font-display text-2xl">Interações</h3>
        <p className="mb-2 text-sm text-muted">
          {row.interaction_quality === "analogy" ? "Analogia de classe. Não é interação citada nesta ficha." : row.interaction_quality === "cited" ? "Citada na ficha." : "Sem interação nesta ficha."}
          {" "}Negativa é perigosa ou insegura. Sinérgica é a mesma classe, sem esse aviso. O resto fica incerto.
        </p>
        {(["negativa", "sinergica", "incerta"] as const).map((key) => {
          const items = row.interactions.filter((item) => bucket(row.classes, item.name, item.level) === key);
          const title = key === "negativa" ? "Negativas" : key === "sinergica" ? "Sinérgicas" : "Incertas";
          return (
            <div key={key} className="mb-3">
              <h4 className="text-sm text-bronze">{title}</h4>
              {items.length === 0 ? <p className="text-sm text-muted">Nenhuma.</p> : null}
              <ul className="space-y-1 text-sm">
                {items.map((item) => (
                  <li key={`${item.quality}-${item.level}-${item.name}`}>
                    {levelLabel[item.level] ?? item.level}: {nomePt(item.name)}
                    {item.quality === "analogy" ? " · analogia" : ""}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
      <footer className="border-t border-rule pt-3 text-sm text-muted">
        <a className="underline" href={row.url}>{row.url}</a>
        <p className="mt-2">Colaboradores da PsychonautWiki, psychonautwiki.org, CC BY-SA 4.0.</p>
      </footer>
    </article>
  );
}
