import { Atom, Compass, Volume2, VolumeX, SlidersHorizontal, Gauge } from "lucide-react";
import { SPEED_PRESETS } from "../sim/time.js";

function speedLabel(ui) {
  if (!ui) return "";
  if (ui.paused) return "Paused";
  const p = SPEED_PRESETS.find((s) => Math.abs(s.days - ui.speed) < 1e-6);
  const base = p ? p.label : `${ui.speed} d/s`;
  return ui.direction < 0 ? `◀ ${base}` : base;
}

// Persistent top bar: identity, the simulated date/time, performance, and the
// global view/audio/controls actions.
export default function TopBar({ tick, ui, api, audio, controlsOpen, onToggleControls }) {
  return (
    <header className="cc-topbar">
      <div className="cc-brand">
        <span className="cc-brand-mark" aria-hidden="true">
          <Atom size={20} strokeWidth={1.8} />
        </span>
        <span className="cc-brand-text">
          <strong>Solar System</strong>
          <em>Claude Code · live orrery</em>
        </span>
      </div>

      <div className="cc-clock" aria-label="Simulated date">
        <span className="cc-clock-label">Simulated date</span>
        <span className="cc-clock-date">{tick.date || "—"}</span>
        <span className="cc-clock-sub">
          {tick.time} · <Gauge size={12} aria-hidden="true" /> {speedLabel(ui)}
        </span>
      </div>

      <div className="cc-topbar-actions">
        <span className="cc-fps" title="Frames per second">
          {tick.fps || 0} fps
        </span>
        <button className="cc-btn cc-iconbtn" onClick={() => api.viewSystem()} title="Overview">
          <Compass size={16} aria-hidden="true" />
        </button>
        <button
          className={`cc-btn cc-iconbtn ${audio.on ? "is-on" : ""}`}
          onClick={audio.toggle}
          title={audio.on ? "Mute ambience" : "Play ambience"}
        >
          {audio.on ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
        </button>
        <button
          className={`cc-btn cc-iconbtn cc-controls-toggle ${controlsOpen ? "is-on" : ""}`}
          onClick={onToggleControls}
          title="Toggle controls"
          aria-pressed={controlsOpen}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
