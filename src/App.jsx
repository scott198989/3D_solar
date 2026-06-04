import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ClaudeCodePage from "./pages/ClaudeCodePage.jsx";
import CodexPage from "./pages/CodexPage.jsx";
import GeminiPage from "./pages/GeminiPage.jsx";
import GrokPage from "./pages/GrokPage.jsx";
import HomePage from "./pages/HomePage.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/codex" element={<CodexPage />} />
        <Route path="/claude-code" element={<ClaudeCodePage />} />
        <Route path="/grok" element={<GrokPage />} />
        <Route path="/gemini" element={<GeminiPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
