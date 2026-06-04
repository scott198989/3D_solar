import { Home, Orbit, PanelTop } from "lucide-react";
import { NavLink } from "react-router-dom";
import { agents } from "../data/agents.js";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand-link" to="/" aria-label="Solar System Arena home">
          <span className="brand-mark" aria-hidden="true">
            <Orbit size={22} strokeWidth={1.9} />
          </span>
          <span>Solar System Arena</span>
        </NavLink>

        <nav className="main-nav" aria-label="Agent pages">
          <NavLink to="/" end title="Home">
            <Home size={16} aria-hidden="true" />
            <span>Home</span>
          </NavLink>
          {agents.map((agent) => (
            <NavLink key={agent.id} to={agent.route} title={`${agent.name} page`}>
              <PanelTop size={16} aria-hidden="true" />
              <span>{agent.name}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
