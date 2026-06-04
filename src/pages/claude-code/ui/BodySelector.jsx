import { Telescope, Compass } from "lucide-react";

const GROUPS = [
  { type: "star", label: "Star" },
  { type: "planet", label: "Planets" },
  { type: "dwarf", label: "Dwarf planet" },
  { type: "moon", label: "Moons" },
  { type: "comet", label: "Other" },
];

// Jump-to selector for every body, plus a return-to-overview action.
export default function BodySelector({ bodies, ui, api }) {
  const focusedId = ui?.focusedId || "";
  return (
    <section className="cc-panel">
      <header className="cc-panel-h">
        <Telescope size={14} aria-hidden="true" />
        <span>Navigate</span>
      </header>
      <div className="cc-row cc-nav-row">
        <select
          className="cc-select"
          value={focusedId}
          onChange={(e) => e.target.value && api.focus(e.target.value)}
          aria-label="Jump to a body"
        >
          <option value="">Jump to…</option>
          {GROUPS.map((g) => {
            const items = bodies.filter((b) => b.type === g.type);
            if (!items.length) return null;
            return (
              <optgroup key={g.type} label={g.label}>
                {items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <button className="cc-btn cc-iconbtn" onClick={() => api.viewSystem()} title="Overview">
          <Compass size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
