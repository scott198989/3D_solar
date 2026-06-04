import { Play, Pause, Rewind, FastForward, RotateCcw } from "lucide-react";
import { SPEED_PRESETS } from "../sim/time.js";

// Playback transport: pause/resume, time direction, speed presets, reset-to-now.
export default function TimeControls({ ui, api }) {
  if (!ui) return null;
  const reverse = ui.direction < 0;
  return (
    <section className="cc-panel">
      <header className="cc-panel-h">
        <FastForward size={14} aria-hidden="true" />
        <span>Time</span>
      </header>

      <div className="cc-row cc-transport">
        <button
          className={`cc-btn cc-iconbtn ${reverse ? "is-on" : ""}`}
          onClick={() => api.setDirection(reverse ? 1 : -1)}
          title="Reverse time"
          aria-pressed={reverse}
        >
          <Rewind size={16} aria-hidden="true" />
        </button>
        <button
          className="cc-btn cc-playbtn"
          onClick={() => api.togglePaused()}
          title={ui.paused ? "Play" : "Pause"}
        >
          {ui.paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
          <span>{ui.paused ? "Play" : "Pause"}</span>
        </button>
        <button className="cc-btn cc-iconbtn" onClick={() => api.resetToNow()} title="Reset to today">
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="cc-chips" role="group" aria-label="Simulation speed">
        {SPEED_PRESETS.map((p) => {
          const active = Math.abs(p.days - ui.speed) < 1e-6;
          return (
            <button
              key={p.label}
              className={`cc-chip ${active ? "is-on" : ""}`}
              onClick={() => api.setSpeed(p.days)}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
