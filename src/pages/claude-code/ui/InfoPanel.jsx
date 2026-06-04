import { X, Thermometer } from "lucide-react";

const HABIT = {
  inside: { label: "In the habitable zone", cls: "is-good" },
  edge: { label: "On the habitable-zone edge", cls: "is-warn" },
  "too hot": { label: "Too hot for liquid water", cls: "is-hot" },
  "too cold": { label: "Too cold for liquid water", cls: "is-cold" },
};

// Selected-body dossier: facts, the educational thermal/habitability readout,
// and a one-line story. Pulled on selection (engine.getSnapshot), not per frame.
export default function InfoPanel({ snapshot, api }) {
  if (!snapshot) return null;
  const { name, kind, blurb, facts, discovered, thermal } = snapshot;
  const habit = thermal ? HABIT[thermal.habit] : null;
  const greenhouse = thermal ? thermal.meanTempC - thermal.eqTempC : 0;

  return (
    <aside className="cc-info" aria-label={`${name} information`}>
      <div className="cc-info-head">
        <div>
          <h2>{name}</h2>
          <p className="cc-info-kind">{kind}</p>
        </div>
        <button className="cc-btn cc-iconbtn" onClick={() => api.clearFocus()} title="Close">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {thermal && (
        <div className={`cc-habit ${habit.cls}`}>
          <Thermometer size={15} aria-hidden="true" />
          <span>{habit.label}</span>
        </div>
      )}

      {blurb && <p className="cc-info-blurb">{blurb}</p>}

      {thermal && (
        <div className="cc-thermal">
          <div className="cc-thermal-cell">
            <span className="cc-thermal-k">Equilibrium</span>
            <strong>{thermal.eqTempC}°C</strong>
            <span className="cc-thermal-sub">sunlight only</span>
          </div>
          <div className="cc-thermal-cell">
            <span className="cc-thermal-k">Measured mean</span>
            <strong>{thermal.meanTempC}°C</strong>
            <span className="cc-thermal-sub">actual surface</span>
          </div>
          {greenhouse > 25 && (
            <div className="cc-thermal-note">
              Greenhouse warming of ≈ {Math.round(greenhouse)}°C from its atmosphere.
            </div>
          )}
        </div>
      )}

      {facts && (
        <dl className="cc-facts">
          {Object.entries(facts).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {discovered && <p className="cc-info-disc">Discovery — {discovered}</p>}
    </aside>
  );
}
