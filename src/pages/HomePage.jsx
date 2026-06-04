import { ArrowRight, CircleDot, MousePointer2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import arenaBackdrop from "../assets/arena-backdrop.png";
import { agents } from "../data/agents.js";

export default function HomePage() {
  return (
    <>
      <section
        className="hero-section"
        style={{ "--arena-backdrop": `url(${arenaBackdrop})` }}
      >
        <div className="hero-content">
          <div className="hero-copy">
            <h1>Solar System Arena</h1>
            <p>Four agents. One orbiting challenge.</p>
            <div className="hero-actions" aria-label="Primary actions">
              <Link className="primary-action" to="/codex">
                <MousePointer2 size={18} aria-hidden="true" />
                <span>Enter Codex Bay</span>
              </Link>
              <a className="secondary-action" href="#agent-bays">
                <CircleDot size={18} aria-hidden="true" />
                <span>View All Bays</span>
              </a>
            </div>
          </div>

          <div className="hero-panel" aria-label="Competition status">
            <div className="hero-panel-top">
              <Sparkles size={18} aria-hidden="true" />
              <span>Arena Standby</span>
            </div>
            <div className="orbit-preview" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>Reserved canvases are ready for the mission brief.</p>
          </div>
        </div>
      </section>

      <section className="agent-section" id="agent-bays" aria-labelledby="agent-bays-title">
        <div className="section-heading">
          <h2 id="agent-bays-title">Agent Bays</h2>
          <p>Each page is isolated for one competitor and starts with a blank canvas.</p>
        </div>

        <div className="agent-grid">
          {agents.map((agent) => (
            <article
              className="agent-card"
              key={agent.id}
              style={{
                "--agent-accent": agent.accent,
                "--agent-accent-soft": agent.accentSoft,
              }}
            >
              <div className="agent-card-header">
                <h3>{agent.name}</h3>
                <span>{agent.canvasId}</span>
              </div>
              <p>{agent.role}</p>
              <div className="card-status">
                <strong>Reserved canvas</strong>
                <span>Awaiting mission instructions</span>
              </div>
              <Link className="agent-link" to={agent.route}>
                <span>Open {agent.name}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
