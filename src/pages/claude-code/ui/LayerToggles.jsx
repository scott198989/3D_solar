import { Orbit, Tag, Moon, CircleDashed, Globe, Sparkles, Telescope, Eye } from "lucide-react";

const LAYERS = [
  { key: "orbits", label: "Orbits", Icon: Orbit },
  { key: "labels", label: "Labels", Icon: Tag },
  { key: "moons", label: "Moons", Icon: Moon },
  { key: "belt", label: "Belts", Icon: CircleDashed },
  { key: "atmospheres", label: "Air glow", Icon: Globe },
  { key: "starfield", label: "Stars", Icon: Sparkles },
  { key: "habitableZone", label: "Habitable zone", Icon: Telescope, feature: true },
];

// Toggle scene layers on/off.
export default function LayerToggles({ ui, api }) {
  if (!ui) return null;
  const layers = ui.layers || {};
  return (
    <section className="cc-panel">
      <header className="cc-panel-h">
        <Eye size={14} aria-hidden="true" />
        <span>Layers</span>
      </header>
      <div className="cc-toggle-grid">
        {LAYERS.map(({ key, label, Icon, feature }) => {
          const on = !!layers[key];
          return (
            <button
              key={key}
              className={`cc-toggle ${on ? "is-on" : ""} ${feature ? "cc-toggle-feature" : ""}`}
              onClick={() => api.setLayer(key, !on)}
              aria-pressed={on}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
