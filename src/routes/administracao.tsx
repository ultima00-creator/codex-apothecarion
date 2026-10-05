import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { plotCompounds } from "@/lib/search";
import { duplicateCycle, EDIT_CYCLE, loadCycles, removeAdjunct, removeCycle, renameCycle, type Cycle } from "@/lib/store";

export const Route = createFileRoute("/administracao")({ component: AdminPage });

const compounds = plotCompounds();

function lineText(line: Cycle["lines"][number]) {
  const found = compounds.find((item) => item.kind === line.kind && item.id === line.substanceId);
  const name = found?.compound ?? line.substanceId;
  return `${name} · ${line.dose} mg · a cada ${line.every} d · dia ${line.start}–${line.end}`;
}

function AdminPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Cycle[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const loaded = loadCycles();
    setRows(loaded);
    setNames(Object.fromEntries(loaded.map((row) => [row.id, row.name])));
  }, []);

  function refresh(next = loadCycles()) {
    setRows(next);
    setNames(Object.fromEntries(next.map((row) => [row.id, row.name])));
  }

  return (
    <main className="space-y-4">
      <header className="gene-head">
        <img src="/relics/sword-ii.png" alt="" className="ornament-sword" />
        <p className="kicker">Gene-Seed</p>
        <h1 className="screen-title font-display">Administração</h1>
      </header>
      <p className="lede">As Implantation guardadas. O traçado continua na oficina. Aqui se renomeia, abre, duplica e apaga.</p>
      <div className="command-bar">
        <Link to="/protocolos" className="command-key">Oficina</Link>
      </div>
      {rows.length === 0 ? <p className="text-sm">Nenhuma Implantation guardada.</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="crystal-line space-y-2 p-3">
            <label className="block text-sm">
              Nome
              <input
                className="field mt-1"
                value={names[row.id] ?? row.name}
                onChange={(event) => setNames((current) => ({ ...current, [row.id]: event.target.value }))}
                onBlur={() => refresh(renameCycle(row.id, names[row.id] ?? row.name))}
              />
            </label>
            <p className="text-sm text-muted">{row.weeks} semanas · {row.lines.length} {row.lines.length === 1 ? "linha" : "linhas"}</p>
            <ul>
              {row.lines.map((line, index) => (
                <li key={`${line.substanceId}-${index}`} className="text-sm">{lineText(line)}</li>
              ))}
            </ul>
            {(row.adjuncts ?? []).length > 0 ? (
              <ul className="space-y-1">
                {(row.adjuncts ?? []).map((item) => (
                  <li key={`${item.wing}-${item.substanceId}`} className="flex items-center justify-between gap-2 text-sm">
                    <span>{item.wing === "agumentarium" ? "Combat-Stimm" : "Med-Stimm"} · {item.name} · {item.days} d</span>
                    <button type="button" className="command-key" onClick={() => refresh(removeAdjunct(row.id, item.wing, item.substanceId))}>Tirar</button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Sem Combat-Stimm nem Med-Stimm selados.</p>}
            <div className="admin-actions">
              <button
                type="button"
                className="command-key"
                onClick={() => {
                  sessionStorage.setItem(EDIT_CYCLE, row.id);
                  void navigate({ to: "/protocolos" });
                }}
              >
                Abrir
              </button>
              <button type="button" className="command-key" onClick={() => { duplicateCycle(row.id); refresh(); }}>Duplicar</button>
              <button type="button" className="command-key" onClick={() => { removeCycle(row.id); refresh(); }}>Apagar</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
