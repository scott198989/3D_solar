import { Ruler } from "lucide-react";

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="cc-seg-group">
      <span className="cc-seg-label">{label}</span>
      <div className="cc-seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            className={`cc-seg-btn ${value === o.value ? "is-on" : ""}`}
            onClick={() => onChange(o.value)}
            title={o.hint}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Distance + size scale modes. Switching morphs the scene smoothly.
export default function ScaleControls({ ui, api }) {
  if (!ui) return null;
  return (
    <section className="cc-panel">
      <header className="cc-panel-h">
        <Ruler size={14} aria-hidden="true" />
        <span>Scale</span>
      </header>
      <Segmented
        label="Distance"
        value={ui.distanceMode}
        onChange={api.setDistanceMode}
        options={[
          { value: "compact", label: "Compact", hint: "Readable spacing" },
          { value: "realistic", label: "Realistic", hint: "True AU distances" },
        ]}
      />
      <Segmented
        label="Planet size"
        value={ui.sizeMode}
        onChange={api.setSizeMode}
        options={[
          { value: "artistic", label: "Artistic", hint: "Readable sizes" },
          { value: "true", label: "True", hint: "True relative sizes" },
        ]}
      />
    </section>
  );
}
