import { createFileRoute } from "@tanstack/react-router";
import { MedicineSheet } from "@/components/medicine-sheet";
import { RecordSheet } from "@/components/record-sheet";
import { WikiSheet } from "@/components/wiki-sheet";
import { findHormone, findPeptide } from "@/lib/search";

export const Route = createFileRoute("/abrir/$kind/$id")({
  component: OpenRecord,
});

function OpenRecord() {
  const { kind, id } = Route.useParams();
  if (kind === "wiki") return <WikiSheet slug={id} />;
  if (kind === "medicine") return <MedicineSheet id={id} />;
  if (kind === "peptide") {
    const row = findPeptide(id);
    return row ? <RecordSheet record={row} kind="peptide" /> : <p>Peptídeo fora do catálogo.</p>;
  }
  if (kind === "hormone") {
    const row = findHormone(id);
    return row ? <RecordSheet record={row} kind="steroid_hormone" /> : <p>Hormônio fora do catálogo.</p>;
  }
  return <p>Registro desconhecido.</p>;
}
