import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Eye,
  Gauge,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Search,
  SunMedium,
  Telescope,
} from "lucide-react";
import CodexScene from "./CodexScene.jsx";
import { selectedBodyMetrics } from "./orbitMath.js";
import {
  BASE_JULIAN_DAY,
  TIMELINE_DAYS,
  formatNumber,
  formatSimulationDate,
  getBodyById,
  layerDefaults,
  layerLabels,
  selectableBodies,
  solarBodies,
  speedPresets,
} from "./solarData.js";

const metricRows = [
  ["Radius", "radiusKm", " km"],
  ["Mass", "mass", ""],
  ["Gravity", "gravity", ""],
  ["Rotation", "rotationDays", " Earth days"],
  ["Moons", "moons", ""],
];

export default function CodexObservatory() {
  const [selectedId, setSelectedId] = useState("earth");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(7);
  const [simulationDay, setSimulationDay] = useState(0);
  const [layers, setLayers] = useState(layerDefaults);

  const selectedBody = useMemo(() => getBodyById(selectedId), [selectedId]);
  const selectedMetrics = useMemo(
    () => selectedBodyMetrics(selectedBody, simulationDay),
    [selectedBody, simulationDay],
  );

  useEffect(() => {
    if (!isPlaying || speed === 0) return undefined;

    let frameId;
    let lastTimestamp = performance.now();

    const tick = (timestamp) => {
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.08);
      lastTimestamp = timestamp;
      setSimulationDay((day) => {
        const next = day + deltaSeconds * speed;
        return ((next % TIMELINE_DAYS) + TIMELINE_DAYS) % TIMELINE_DAYS;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, speed]);

  function toggleLayer(layerId) {
    setLayers((current) => ({
      ...current,
      [layerId]: !current[layerId],
    }));
  }

  return (
    <section className="codex-observatory" aria-label="Codex Observatory solar system simulation">
      <div className="codex-canvas-layer">
        <CodexScene
          simulationDay={simulationDay}
          selectedId={selectedId}
          selectedPosition={selectedMetrics.position}
          layers={layers}
          isPlaying={isPlaying}
          onSelectBody={setSelectedId}
        />
      </div>

      <div className="codex-vignette" aria-hidden="true" />

      <div className="codex-topbar">
        <div className="codex-title">
          <span className="codex-title-icon" aria-hidden="true">
            <Telescope size={22} />
          </span>
          <div>
            <h1>Codex Observatory</h1>
            <p>Real distances / enhanced bodies</p>
          </div>
        </div>
        <div className="codex-status-strip" aria-label="Current simulation status">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            JD {formatNumber(BASE_JULIAN_DAY + simulationDay, 1)}
          </span>
          <span>
            <Gauge size={15} aria-hidden="true" />
            {speed} days / sec
          </span>
        </div>
      </div>

      <aside className="codex-control-panel" aria-label="Simulation controls">
        <section className="codex-panel-section">
          <div className="codex-panel-heading">
            <Activity size={16} aria-hidden="true" />
            <h2>Time Engine</h2>
          </div>
          <div className="codex-play-row">
            <button
              className="codex-icon-button codex-primary-button"
              type="button"
              onClick={() => setIsPlaying((value) => !value)}
              aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              className="codex-icon-button"
              type="button"
              onClick={() => {
                setSimulationDay(0);
                setSelectedId("earth");
              }}
            >
              <RotateCcw size={17} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
          <div className="codex-speed-grid" aria-label="Speed presets">
            {speedPresets.map((preset) => (
              <button
                key={preset.label}
                className={speed === preset.value ? "is-active" : ""}
                type="button"
                onClick={() => setSpeed(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="codex-panel-section">
          <div className="codex-panel-heading">
            <Layers size={16} aria-hidden="true" />
            <h2>Reference Layers</h2>
          </div>
          <div className="codex-layer-grid">
            {Object.entries(layerLabels).map(([layerId, label]) => (
              <button
                key={layerId}
                type="button"
                className={layers[layerId] ? "is-active" : ""}
                aria-pressed={layers[layerId]}
                onClick={() => toggleLayer(layerId)}
              >
                <Eye size={14} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="codex-panel-section codex-body-selector">
          <div className="codex-panel-heading">
            <Search size={16} aria-hidden="true" />
            <h2>Select Body</h2>
          </div>
          <div className="codex-body-list">
            {selectableBodies.map((body) => (
              <button
                key={body.id}
                type="button"
                className={selectedId === body.id ? "is-selected" : ""}
                onClick={() => setSelectedId(body.id)}
              >
                <span className="codex-body-swatch" style={{ "--body-color": body.color }} />
                <span>{body.name}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <aside className="codex-inspector" aria-label={`${selectedBody.name} data inspector`}>
        <div className="codex-inspector-header">
          <span className="codex-inspector-orb" style={{ "--body-color": selectedBody.color }}>
            {selectedBody.id === "sun" && <SunMedium size={20} aria-hidden="true" />}
          </span>
          <div>
            <p>{selectedBody.type}</p>
            <h2>{selectedBody.name}</h2>
          </div>
        </div>

        <p className="codex-description">{selectedBody.description}</p>

        <div className="codex-data-grid">
          {metricRows.map(([label, key, suffix]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {typeof selectedBody[key] === "number"
                  ? `${formatNumber(selectedBody[key], key === "radiusKm" ? 0 : 3)}${suffix}`
                  : selectedBody[key]}
              </dd>
            </div>
          ))}
          {selectedBody.orbit && (
            <>
              <div>
                <dt>Semi-major axis</dt>
                <dd>{formatNumber(selectedBody.orbit.semiMajorAxisAu, 3)} AU</dd>
              </div>
              <div>
                <dt>Eccentricity</dt>
                <dd>{formatNumber(selectedBody.orbit.eccentricity, 4)}</dd>
              </div>
              <div>
                <dt>Inclination</dt>
                <dd>{formatNumber(selectedBody.orbit.inclinationDeg, 3)}°</dd>
              </div>
              <div>
                <dt>Orbital period</dt>
                <dd>{formatNumber(selectedBody.orbit.periodDays, 1)} days</dd>
              </div>
            </>
          )}
        </div>

        <div className="codex-science-callout">
          <strong>Solar energy model</strong>
          {selectedBody.id === "sun" ? (
            <p>Habitable-zone bands are calculated from solar luminosity around this star.</p>
          ) : (
            <dl>
              <div>
                <dt>Current distance</dt>
                <dd>{formatNumber(selectedMetrics.distanceAu, 3)} AU</dd>
              </div>
              <div>
                <dt>Irradiance</dt>
                <dd>
                  {formatNumber(selectedMetrics.flux, 3)} Earth flux ·{" "}
                  {formatNumber(selectedMetrics.irradiance, 0)} W/m²
                </dd>
              </div>
              <div>
                <dt>Equilibrium temp.</dt>
                <dd>
                  {formatNumber(selectedMetrics.equilibriumTempK, 1)} K /{" "}
                  {formatNumber(selectedMetrics.equilibriumTempC, 1)}°C
                </dd>
              </div>
            </dl>
          )}
        </div>
      </aside>

      <div className="codex-timeline" aria-label="Julian date timeline">
        <div className="codex-timeline-meta">
          <span>{formatSimulationDate(simulationDay)}</span>
          <span>{Math.round((simulationDay / TIMELINE_DAYS) * 100)}% of 10-year window</span>
        </div>
        <input
          type="range"
          min="0"
          max={TIMELINE_DAYS}
          value={simulationDay}
          step="0.5"
          onChange={(event) => setSimulationDay(Number(event.target.value))}
          aria-label="Simulation day"
        />
        <div className="codex-timeline-bodies">
          {solarBodies.filter((body) => body.id !== "sun").map((body) => (
            <button
              key={body.id}
              type="button"
              className={selectedId === body.id ? "is-selected" : ""}
              onClick={() => setSelectedId(body.id)}
            >
              {body.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
