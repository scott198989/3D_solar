import { useState } from "react";
import { MousePointer2 } from "lucide-react";
import TopBar from "./TopBar.jsx";
import BodySelector from "./BodySelector.jsx";
import TimeControls from "./TimeControls.jsx";
import ScaleControls from "./ScaleControls.jsx";
import LayerToggles from "./LayerToggles.jsx";
import TourControls from "./TourControls.jsx";
import InfoPanel from "./InfoPanel.jsx";

// The full overlay. The wrapper is pointer-events:none so the canvas stays
// draggable everywhere; only the panels/buttons opt back in.
export default function HUD({ ui, tick, bodies, hz, selected, api, audio }) {
  const [controlsOpen, setControlsOpen] = useState(true);
  const tour = ui?.tour;

  return (
    <div className="cc-hud">
      <TopBar
        tick={tick}
        ui={ui}
        api={api}
        audio={audio}
        controlsOpen={controlsOpen}
        onToggleControls={() => setControlsOpen((v) => !v)}
      />

      <div className={`cc-dock ${controlsOpen ? "" : "is-collapsed"}`}>
        <BodySelector bodies={bodies} ui={ui} api={api} />
        <TimeControls ui={ui} api={api} />
        <ScaleControls ui={ui} api={api} />
        <LayerToggles ui={ui} api={api} />
        <TourControls ui={ui} api={api} />
      </div>

      <InfoPanel snapshot={selected} api={api} />

      {ui?.layers?.habitableZone && hz && (
        <div className="cc-legend">
          <span className="cc-legend-swatch" aria-hidden="true" />
          <div>
            <strong>Habitable zone</strong>
            <p>
              Where a rocky world could keep liquid water. Conservative limits{" "}
              {hz.conservativeInner.toFixed(2)}–{hz.conservativeOuter.toFixed(2)} AU.
            </p>
          </div>
        </div>
      )}

      {tour?.active ? (
        <div className="cc-caption" role="status">
          <strong>{tour.title}</strong>
          <p>{tour.caption}</p>
        </div>
      ) : (
        !selected && (
          <div className="cc-hint">
            <MousePointer2 size={14} aria-hidden="true" />
            <span>Drag to orbit · scroll to zoom · click any world</span>
          </div>
        )
      )}
    </div>
  );
}
