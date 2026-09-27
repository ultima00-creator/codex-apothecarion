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
            <p className="text-xs tracking-[0.28em] text-bronze uppercase">Selo fechado</p>
            <h1 className="font-display text-5xl leading-none">{copy.title}</h1>
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
          <p className="text-xs tracking-[0.28em] text-bronze uppercase">Database</p>
          <h1 className="font-display text-5xl leading-none">{copy.title}</h1>
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
              <p className="text-sm text-muted">{row.className || "sem classe"}</p>
              {open === row.id ? (
                <div className="mt-2 space-y-2 text-sm">
                  <p>{row.description || "Sem descrição depositada."}</p>
                  <p><span className="text-muted">Meia-vida. </span>{row.halfLife}</p>
                  <p><span className="text-muted">Mínima efetiva. </span>{row.minDose}</p>
                  <p><span className="text-muted">Máxima efetiva. </span>{row.maxDose}</p>
                  <p><span className="text-muted">Aviso. </span>{row.warning}</p>
                  <p className="text-muted">{row.halfLifeDays ? `Traçado visual: ${row.halfLifeDays} dias. Não é medição.` : "Sem meia-vida numérica. Não entra no traçado."}</p>
                  <label className="block">
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
                </div>
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
