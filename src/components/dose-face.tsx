import { bandIndex, bandPhrase, bandWord, dotsOn, scaleMarks, type DoseScale } from "@/lib/dose";

export function DoseDots({ n, mute = false }: { n: number; mute?: boolean }) {
  const cells = n > 5 ? 10 : 5;
  return (
    <span className={mute ? "dose-dots mute" : "dose-dots"} aria-label={n ? `${n} de ${cells}` : "sem faixa"}>
      {Array.from({ length: cells }, (_, index) => <i key={index} className={index < n ? "on" : ""} />)}
    </span>
  );
}

export function DoseScaleView({ scale, dose }: { scale: DoseScale; dose: number | null }) {
  const marks = scaleMarks(scale);
  const phrase = dose == null ? null : bandPhrase(scale, dose);
  const dots = dose == null ? 0 : dotsOn(scale, dose);
  return (
    <div className="dose-scale">
      <div className="dose-scale-row">
        {marks.map((mark) => (
          <span key={mark.key} className="dose-slot">
            <b className={`num band-${mark.key}`}>{mark.show ?? "—"}</b>
            <b className={`name band-${mark.key}`}>{mark.name}</b>
          </span>
        ))}
      </div>
      <b className="unit">{scale.unit}</b>
      {phrase ? (
        <p className="dose-phrase">
          <b className={dose == null ? "" : `band-${bandWord[bandIndex(scale, dose)]}`}>{phrase}</b>
          <DoseDots n={dots} />
        </p>
      ) : null}
    </div>
  );
}
