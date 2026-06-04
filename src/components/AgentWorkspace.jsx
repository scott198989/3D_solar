import { ArrowLeft, FileTerminal, Monitor, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import arenaBackdrop from "../assets/arena-backdrop.png";

export default function AgentWorkspace({ agent }) {
  return (
    <section
      className="workspace-page"
      style={{
        "--agent-accent": agent.accent,
        "--agent-accent-soft": agent.accentSoft,
        "--arena-backdrop": `url(${arenaBackdrop})`,
      }}
    >
      <div className="workspace-inner">
        <div className="workspace-heading">
          <div className="workspace-title-group">
            <Link className="back-link" to="/">
              <ArrowLeft size={17} aria-hidden="true" />
              <span>Back to arena</span>
            </Link>
            <h1>{agent.pageTitle}</h1>
            <p>{agent.name} has a dedicated blank canvas for the competition build.</p>
          </div>

          <div className="assignment-strip" aria-label={`${agent.name} assignment summary`}>
            <span>
              <Sparkles size={16} aria-hidden="true" />
              {agent.name}
            </span>
            <span>
              <Target size={16} aria-hidden="true" />
              Reserved canvas
            </span>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="canvas-stage" aria-labelledby={`${agent.id}-canvas-heading`}>
            <div className="stage-toolbar">
              <h2 id={`${agent.id}-canvas-heading`}>{agent.name} canvas</h2>
              <code>#{agent.canvasId}</code>
            </div>
            <div className="canvas-frame">
              <canvas
                id={agent.canvasId}
                className="agent-canvas"
                width="1600"
                height="900"
                aria-label={`${agent.name} reserved simulation canvas`}
              />
              <div className="canvas-empty-state" aria-hidden="true">
                <Monitor size={34} strokeWidth={1.7} />
                <strong>Reserved canvas</strong>
                <span>Awaiting mission instructions</span>
              </div>
            </div>
          </section>

          <aside className="mission-panel" aria-label={`${agent.name} mission details`}>
            <div className="mission-panel-header">
              <FileTerminal size={20} aria-hidden="true" />
              <h2>Mission Bay</h2>
            </div>

            <dl className="mission-list">
              <div>
                <dt>Owner</dt>
                <dd>{agent.name}</dd>
              </div>
              <div>
                <dt>Agent</dt>
                <dd>{agent.role}</dd>
              </div>
              <div>
                <dt>Canvas</dt>
                <dd>{agent.canvasId}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Awaiting prompt</dd>
              </div>
            </dl>

            <div className="prompt-slot">
              <strong>Project Instructions</strong>
              <p>3D interactive simulation of the solar system.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
