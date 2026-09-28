import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addAdjunct, loadCycles, type Cycle } from "@/lib/store";
import { loadWingFavs, toggleWingFav, wingCompounds, wingCopy, type WingId } from "@/lib/wings";

export function WingCodex({ wing }: { wing: WingId }) {
  const copy = wingCopy[wing];
  const [saved, setSaved] = useState<Cycle[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [days, setDays] = useState("1");
  const [kept, setKept] = useState("");
  useEffect(() => {
    const cycles = loadCycles();
    setSaved(cycles);
    setTarget(cycles[0]?.id ?? "");
    setDays(String(Math.max(1, (cycles[0]?.weeks ?? 1) * 7)));
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

  const listed = wingCompounds(wing);
  const limit = Math.max(1, (saved.find((row) => row.id === target)?.weeks ?? 1) * 7);

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
      <p className="text-sm text-muted">O composto entra numa Implantation já guardada. A duração, em dias, não passa da dela.</p>
      {wingCompounds(wing).length === 0 ? <p className="text-sm">A database deste selo ainda aguarda os compostos. A organização já está pronta.</p> : null}
      <ul>
        {listed.map((row) => {
          const on = favs.includes(row.id);
          return (
            <li key={row.id} className="border-b border-rule py-3">
              <p className="datum">{row.name}</p>
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
                  <dt className="warn">Aviso</dt>
                  <dd className="warn">{row.warning}</dd>
                </dl>
                <label className="mt-2 block">
                    Implantation
                    <select
                      className="field mt-1"
                      value={target}
                      onChange={(e) => {
                        const id = e.target.value;
                        const cap = Math.max(1, (saved.find((cycle) => cycle.id === id)?.weeks ?? 1) * 7);
                        setTarget(id);
                        setDays((current) => {
                          const parsed = Number(current);
                          if (!Number.isFinite(parsed) || parsed < 1) return String(cap);
                          return String(Math.min(cap, Math.round(parsed)));
                        });
                      }}
                    >
                      {saved.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                    </select>
                  </label>
                  <label className="mt-2 block">
                    Duração em dias
                    <input
                      className="field mt-1"
                      inputMode="numeric"
                      value={days}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "");
                        setDays(next);
                      }}
                      onBlur={() => {
                        const parsed = Number(days);
                        const next = !Number.isFinite(parsed) || days.trim() === "" ? limit : Math.min(limit, Math.max(1, Math.round(parsed)));
                        setDays(String(next));
                      }}
                    />
                  </label>
                  <p className="text-sm text-muted">No máximo {limit} dias. Não passa desta Implantation.</p>
                  <button
                    type="button"
                    className="chip chip-on"
                    onClick={() => {
                      const parsed = Number(days);
                      const next = !Number.isFinite(parsed) || days.trim() === "" ? limit : Math.min(limit, Math.max(1, Math.round(parsed)));
                      setDays(String(next));
                      addAdjunct(target, { wing, substanceId: row.id, name: row.name, days: next });
                      setKept(`${row.id}:${next}`);
                    }}
                  >
                    Selar nesta Implantation
                  </button>
                  {kept === `${row.id}:${days}` ? <p className="text-muted">Selado por {days} dias, Frater.</p> : null}
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
