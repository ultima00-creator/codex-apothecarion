import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { loadNotes, type JournalNote } from "@/lib/store";

export const Route = createFileRoute("/journal")({ component: Journal });

function Journal() {
  const [rows, setRows] = useState<JournalNote[]>([]);
  useEffect(() => setRows(loadNotes()), []);
  return (
    <main className="space-y-4">
      <h2 className="screen-title font-display">Journal</h2>
      <p className="text-sm text-muted">Só depois que a busca falha. Não é curva e não é medição.</p>
      {rows.length === 0 ? <p>Nenhuma nota.</p> : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="border-t border-rule pt-3">
            <p className="datum">{row.name}</p>
            <p>{row.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
