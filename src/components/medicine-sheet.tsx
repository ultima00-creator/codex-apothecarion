import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AxisChart } from "@/components/axis-chart";
import { fractionSeries, remainingFraction } from "@/lib/kinetics";
import { mark } from "@/lib/mark";
import { findMedicine, medicineSource, pkSource } from "@/lib/medicines";

export function MedicineSheet({ id }: { id: string }) {
  const row = findMedicine(id);
  const [hours, setHours] = useState(0);
  const [quarters, setQuarters] = useState(0);
  const points = useMemo(
    () => (row?.halfLifeDays ? fractionSeries(row.halfLifeDays, "oral", quarters) : []),
    [row, quarters],
  );
  if (!row) return <p>Remédio fora do índice.</p>;
  const now = row.halfLifeDays ? remainingFraction(hours, row.halfLifeDays * 24, "oral", quarters) : null;
  return (
    <article className="space-y-4">
      <header>
        <p className="text-xs tracking-[0.2em] text-bronze uppercase">Remédio</p>
        <h2 className="subject">{row.name}</h2>
        <p className="text-muted">{row.className}</p>
      </header>
      <p>{row.description}</p>
      {row.halfLifeDays ? (
        <p className="text-sm">Meia-vida: {Math.round(row.halfLifeDays * 100) / 100} dias ({Math.round(row.halfLifeDays * 24)} h) nesta tabela.</p>
      ) : (
        <p className="text-sm">Sem meia-vida medida nesta ficha. Dá para registrar. Não há curva.</p>
      )}
      {row.addendum ? <p className="text-sm text-muted">Adendo. {row.addendum}</p> : null}
      {row.halfLifeDays && row.addendum ? <p className="text-sm text-muted">{medicineSource}</p> : null}
      {row.halfLifeDays && !row.addendum ? <p className="text-sm text-muted">Adendo. {pkSource}</p> : null}
      {row.halfLifeDays ? (
        <>
          <label className="block text-sm">
            Horas desde a tomada
            <input className="field mt-1" type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>
          <label className="block text-sm">
            Estômago cheio
            <select className="field mt-1" value={quarters} onChange={(e) => setQuarters(Number(e.target.value))}>
              <option value={0}>vazio</option>
              <option value={1}>1/4 · +0,5 h</option>
              <option value={2}>2/4 · +1 h</option>
              <option value={3}>3/4 · +1,5 h</option>
              <option value={4}>4/4 · +2 h</option>
            </select>
          </label>
          <AxisChart unit="fração da dose" xLabel="horas" points={points} tone={mark(`medicine:${row.id}`)} dash />
          <p className="text-sm">Nesta hora: {now == null ? "—" : now}</p>
        </>
      ) : null}
      <Link to="/tomar" search={{ kind: "medicine", id: row.id }} className="inline-flex min-h-11 items-center text-sm underline">Usar este composto</Link>
    </article>
  );
}
