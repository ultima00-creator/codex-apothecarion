import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { loadFavs, toggleFav, type Fav } from "@/lib/favorites";
import { hitById, search, type Hit } from "@/lib/search";

export const Route = createFileRoute("/codex")({ component: CodexPage });

function CodexPage() {
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<Fav[]>([]);
  useEffect(() => setFavs(loadFavs()), []);
  const hits = search(query);
  const marked = favs.map((item) => hitById(item.kind, item.id)).filter((item): item is Hit => item != null);
  const showFavs = query.trim().length < 2;

  function flip(hit: Hit) {
    setFavs(toggleFav({ kind: hit.kind, id: hit.id }));
  }

  return (
    <main className="space-y-4">
      <header className="flex items-center gap-3">
        <img src="/codex-mix.png" alt="" className="size-16 object-cover" />
        <div>
          <p className="text-xs tracking-[0.28em] text-bronze uppercase">Database</p>
          <h1 className="font-display text-5xl leading-none">Codex</h1>
        </div>
      </header>
      <p className="text-sm text-muted">Leia a ficha, marque o que deve ficar à mão, ou registre o uso, Frater.</p>
      <label className="block text-sm">
        Busca na database
        <input className="field mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nomeie o composto" />
      </label>
      {showFavs ? (
        <section className="space-y-2">
          <p className="text-sm text-muted">Marcados pelo Frater.</p>
          {marked.length === 0 ? <p className="text-sm">A database ainda não tem marcas. Nomeie um composto.</p> : null}
          <ul>{marked.map((hit) => <CodexRow key={`${hit.kind}-${hit.id}`} hit={hit} favs={favs} onToggle={flip} />)}</ul>
        </section>
      ) : (
        <ul>{hits.map((hit) => <CodexRow key={`${hit.kind}-${hit.id}`} hit={hit} favs={favs} onToggle={flip} />)}</ul>
      )}
    </main>
  );
}

function CodexRow({ hit, favs, onToggle }: { hit: Hit; favs: Fav[]; onToggle: (hit: Hit) => void }) {
  const on = favs.some((item) => item.kind === hit.kind && item.id === hit.id);
  return (
    <li className="border-b border-rule py-3">
      <p className="font-display text-2xl leading-tight">{hit.title}</p>
      <p className="text-sm text-muted">{hit.detail}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to="/abrir/$kind/$id" params={{ kind: hit.kind, id: hit.id }} className="chip">Ler</Link>
        <button type="button" className={on ? "chip chip-on" : "chip"} onClick={() => onToggle(hit)}>{on ? "Marcado" : "Favorito"}</button>
        <Link to="/tomar" search={{ kind: hit.kind, id: hit.id }} className="chip chip-on">Usar</Link>
      </div>
    </li>
  );
}
