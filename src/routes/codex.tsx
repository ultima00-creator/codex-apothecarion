import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { loadFavs, toggleFav, type Fav } from "@/lib/favorites";
import { findMedicine } from "@/lib/medicines";
import { findHormone, findWiki, hitById, listCompounds, search, type Hit } from "@/lib/search";
import { faceFor } from "@/lib/substance-face";
import { classePt } from "@/lib/pt";

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
      <header className="codex-mast">
        <img src="/relics/sword-i.png" alt="" className="ornament-sword" />
        <div>
          <p className="kicker">Database</p>
          <h1 className="screen-title font-display">Compound Codex</h1>
        </div>
      </header>
      <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nomeie o composto" aria-label="Busca na database" />
      {showFavs && marked.length > 0 ? (
        <section>
          <p className="kicker">Marcados</p>
          <ul className="codex-list">{marked.map((hit) => <CodexRow key={`fav-${hit.kind}-${hit.id}`} hit={hit} favs={favs} onToggle={flip} />)}</ul>
        </section>
      ) : null}
      <ul className="codex-list">{(showFavs ? listCompounds() : hits).map((hit) => <CodexRow key={`${hit.kind}-${hit.id}`} hit={hit} favs={favs} onToggle={flip} />)}</ul>
    </main>
  );
}

function classKey(hit: Hit): string {
  if (hit.kind === "hormone") return "hormone";
  if (hit.kind === "peptide") return "peptide";
  const raw = hit.kind === "medicine"
    ? findMedicine(hit.id)?.className ?? ""
    : hit.kind === "wiki"
      ? findWiki(hit.id)?.classes[0] ?? ""
      : "";
  return raw.toLowerCase();
}

function bottleFor(key: string, kind: Hit["kind"]): string {
  if (kind === "hormone" || key.includes("habit")) return "/relics/bottle-gold.png";
  if (kind === "peptide" || key.includes("cannabin") || key.includes("nootrop") || !key) return "/relics/bottle-green.png";
  if (key.includes("beta") || key.includes("angiotensina")) return "/relics/bottle-blue.png";
  if (key.includes("stimul")) return "/relics/bottle-red.png";
  if (key.includes("aromatase") || key.includes("eugero") || key.includes("gabapentin")) return "/relics/bottle-orange.png";
  if (key.includes("estrog") || key.includes("modulador") || key.includes("psyche") || key.includes("entact") || key.includes("hallucin")) return "/relics/bottle-magenta.png";
  if (key.includes("dopamin") || key.includes("opioid") || key.includes("antipsych")) return "/relics/bottle-violet.png";
  if (key.includes("benzo") || key.includes("depress") || key.includes("dissoci") || key.includes("deliri") || key.includes("fosfodiesterase") || key.includes("ssri") || key.includes("antidepress")) return "/relics/bottle-teal.png";
  const files = ["bottle-blue", "bottle-gold", "bottle-red", "bottle-orange", "bottle-magenta", "bottle-violet", "bottle-teal", "bottle-green"];
  let hash = 0;
  for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `/relics/${files[hash % files.length]}.png`;
}

function iconFor(hit: Hit): string {
  if (hit.kind === "hormone") {
    const row = findHormone(hit.id);
    const face = row ? faceFor(row.compound, row.form) : null;
    if (face) return face.src;
  }
  return bottleFor(classKey(hit), hit.kind);
}

function CodexRow({ hit, favs, onToggle }: { hit: Hit; favs: Fav[]; onToggle: (hit: Hit) => void }) {
  const on = favs.some((item) => item.kind === hit.kind && item.id === hit.id);
  const key = classKey(hit);
  return (
    <li className="disp-tile">
      <Link to="/abrir/$kind/$id" params={{ kind: hit.kind, id: hit.id }} className="disp-hit">
        <img src={iconFor(hit)} alt="" className="substance-mark" />
        <span className="min-w-0">
          <span className="datum block">{hit.title}</span>
          <span className="tile-meta block">{classLine(key, hit.kind)}</span>
        </span>
      </Link>
      <button type="button" className={on ? "disp-mark on" : "disp-mark"} aria-label={on ? "Desmarcar" : "Favorito"} onClick={() => onToggle(hit)} />
    </li>
  );
}

function classLine(key: string, kind: Hit["kind"]): string {
  if (kind === "hormone") return "hormônio";
  if (kind === "peptide") return "peptídeo";
  return key ? classePt(key) : "composto";
}
