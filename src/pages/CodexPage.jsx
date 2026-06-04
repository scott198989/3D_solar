import { lazy, Suspense, useEffect } from "react";
import "./codex/CodexObservatory.css";

const CodexObservatory = lazy(() => import("./codex/CodexObservatory.jsx"));
const THREE_CLOCK_DEPRECATION = "THREE.Clock: This module has been deprecated";

function installThreeClockWarningFilter() {
  if (typeof window === "undefined" || window.__codexThreeClockWarningFilter) return;

  const originalWarn = console.warn;
  const filteredWarn = (...args) => {
    if (args.some((arg) => String(arg).includes(THREE_CLOCK_DEPRECATION))) return;
    originalWarn(...args);
  };

  console.warn = filteredWarn;
  window.__codexThreeClockWarningFilter = {
    filteredWarn,
    originalWarn,
  };
}

export default function CodexPage() {
  installThreeClockWarningFilter();

  useEffect(() => {
    return () => {
      const filter = window.__codexThreeClockWarningFilter;
      if (filter && console.warn === filter.filteredWarn) {
        console.warn = filter.originalWarn;
      }
      delete window.__codexThreeClockWarningFilter;
    };
  }, []);

  return (
    <Suspense
      fallback={
        <section className="codex-observatory codex-loading" aria-label="Loading Codex Observatory">
          <div className="codex-loading-core">
            <span />
            <strong>Codex Observatory</strong>
          </div>
        </section>
      }
    >
      <CodexObservatory />
    </Suspense>
  );
}
