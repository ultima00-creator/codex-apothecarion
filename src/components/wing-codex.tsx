import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addAdjunct, loadCycles, type Cycle } from "@/lib/store";
import { loadWingFavs, searchWing, toggleWingFav, wingCompounds, wingCopy, type WingCompound, type WingId } from "@/lib/wings";

export function WingCodex({ wing }: { wing: WingId }) {
  const copy = wingCopy[wing];
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Cycle[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [kept, setKept] = useState("");
  useEffect(() => {
    const cycles = loadCycles();
    setSaved(cycles);
    setTarget(cycles[0]?.id ?? "");
    setFavs(loadWingFavs(wing));
  }, [wing]);

  if (saved.length === 0) {
    return (
      <main className="space-y-4">
        <header className="flex items-center gap-3">
          <img src={copy.seal} alt="" className="size-16 object-cover" />
          <div>
            <p className="kicker">Selo fechado</p>
            <h1 className="screen-title font-display">{copy.title}</h1>
          </div>
        </header>
        <p>{copy.line}</p>
      <p className="text-sm text-muted">{copy.aside}</p>
        <p className="text-sm text-muted">O selo não abre sem uma Implantation guardada, Frater.</p>
        <Link to="/protocolos" className="text-sm text-bronze">Voltar ao Gene-Seed</Link>
      </main>
    );
  }

  const hits = searchWing(wing, query);
  const listed = query.trim().length < 2 ? wingCompounds(wing) : hits;

  return (
    <main className="space-y-4">
      <header className="flex items-center gap-3">
        <img src={copy.seal} alt="" className="size-16 object-cover" />
        <div>
          <p className="kicker">Database</p>
          <h1 className="screen-title font-display">{copy.title}</h1>
        </div>
      </header>
      <p>{copy.line}</p>
      <p className="text-sm text-muted">{copy.aside}</p>
      <p className="text-sm text-muted">O composto entra numa Implantation já guardada. Sem meia-vida, fica só a ficha.</p>
      <label className="block text-sm">
        Busca na database
        <input className="field mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nomeie o composto, Frater" />
      </label>
      {wingCompounds(wing).length === 0 ? <p className="text-sm">A database deste selo ainda aguarda os compostos. A organização já está pronta.</p> : null}
      <ul>
        {listed.map((row) => {
          const on = favs.includes(row.id);
          return (
            <li key={row.id} className="border-b border-rule py-3">
              <p className="font-display text-2xl leading-tight">{row.name}</p>
              <p className="lede line-clamp-2">{row.className || "sem classe"}</p>
              {open === row.id ? (
                <>
                <dl className="sheet mt-2 text-sm">
                  <dt>Descrição</dt>
                  <dd>{row.description || "Sem descrição depositada."}</dd>
                  <dt>Meia-vida</dt>
                  <dd>{row.halfLife}</dd>
                  <dt>Mínima efetiva</dt>
                  <dd>{row.minDose}</dd>
                  <dt>Máxima efetiva</dt>
                  <dd>{row.maxDose}</dd>
                  <dt>Aviso</dt>
                  <dd>{row.warning}</dd>
                  <dd className="lede">{row.halfLifeDays ? `Traçado visual: ${row.halfLifeDays} dias. Não é medição.` : "Sem meia-vida numérica. Não entra no traçado."}</dd>
                </dl>
                <label className="mt-2 block">
                    Implantation
                    <select className="field mt-1" value={target} onChange={(e) => setTarget(e.target.value)}>
                      {saved.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="chip chip-on"
                    onClick={() => {
                      addAdjunct(target, { wing, substanceId: row.id, name: row.name });
                      setKept(row.name);
                    }}
                  >
                    Selar nesta Implantation
                  </button>
                  {kept === row.name ? <p className="text-muted">Selado, Frater.</p> : null}
                </>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="chip" onClick={() => setOpen(open === row.id ? null : row.id)}>Ler</button>
                <button type="button" className={on ? "chip chip-on" : "chip"} onClick={() => setFavs(toggleWingFav(wing, row.id))}>{on ? "Marcado" : "Favorito"}</button>
                <button type="button" className="chip chip-on" onClick={() => setOpen(row.id)}>Incluir</button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
