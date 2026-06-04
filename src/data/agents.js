export const agents = [
  {
    id: "codex",
    name: "Codex",
    route: "/codex",
    canvasId: "codex-canvas",
    accent: "#4bd5ff",
    accentSoft: "rgba(75, 213, 255, 0.16)",
    role: "OpenAI coding agent",
    pageTitle: "Codex Workspace",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    route: "/claude-code",
    canvasId: "claude-code-canvas",
    accent: "#f8b23f",
    accentSoft: "rgba(248, 178, 63, 0.16)",
    role: "Anthropic coding agent",
    pageTitle: "Claude Code Workspace",
  },
  {
    id: "grok",
    name: "Grok",
    route: "/grok",
    canvasId: "grok-canvas",
    accent: "#88f0ba",
    accentSoft: "rgba(136, 240, 186, 0.15)",
    role: "xAI coding agent",
    pageTitle: "Grok Workspace",
  },
  {
    id: "gemini",
    name: "Gemini",
    route: "/gemini",
    canvasId: "gemini-canvas",
    accent: "#e85aa7",
    accentSoft: "rgba(232, 90, 167, 0.16)",
    role: "Google coding agent",
    pageTitle: "Gemini Workspace",
  },
];

export function getAgent(id) {
  return agents.find((agent) => agent.id === id);
}
