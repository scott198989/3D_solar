import { useEffect, useMemo, useRef, useState } from "react";
import { createEngine } from "../engine/Engine.js";

// Owns the engine lifecycle and mirrors its events into React state. Engine
// creation is deferred to the next frame so the loading overlay paints before
// the (synchronous) texture bake runs. A `cancelled` guard + total dispose make
// it StrictMode- and route-navigation-safe.
export function useEngine(containerRef, options = {}) {
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [bodies, setBodies] = useState([]);
  const [hz, setHz] = useState(null);
  const [ui, setUi] = useState(null);
  const [tick, setTick] = useState({ fps: 0, date: "", time: "", year: 0 });
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let engine = null;
    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        engine = createEngine(container, options);
        engineRef.current = engine;
        engine.on("ready", (p) => {
          setBodies(p.bodies);
          setHz(p.hz);
          setUi(p.state);
          setReady(true);
        });
        engine.on("state", (s) => setUi(s));
        engine.on("tick", (t) => setTick(t));
        engine.on("select", ({ id }) => setSelected(id ? engine.getSnapshot(id) : null));
        engine.on("hover", ({ id }) => setHovered(id));
      } catch (e) {
        console.error("[solar] engine init failed", e);
        setError(e);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (engine) engine.dispose();
      engineRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo(
    () => ({
      focus: (id) => engineRef.current?.focus(id),
      clearFocus: () => engineRef.current?.clearFocus(),
      viewSystem: () => engineRef.current?.viewSystem(),
      togglePaused: () => engineRef.current?.togglePaused(),
      setPaused: (p) => engineRef.current?.setPaused(p),
      setSpeed: (d) => engineRef.current?.setSpeed(d),
      setDirection: (d) => engineRef.current?.setDirection(d),
      setDistanceMode: (m) => engineRef.current?.setDistanceMode(m),
      setSizeMode: (m) => engineRef.current?.setSizeMode(m),
      setLayer: (n, o) => engineRef.current?.setLayer(n, o),
      setDate: (d) => engineRef.current?.setDate(d),
      resetToNow: () => engineRef.current?.resetToNow(),
      startTour: () => engineRef.current?.startTour(),
      stopTour: () => engineRef.current?.stopTour(),
      tourNext: () => engineRef.current?.tourNext(),
      tourPrev: () => engineRef.current?.tourPrev(),
      getSnapshot: (id) => engineRef.current?.getSnapshot(id),
    }),
    [],
  );

  return { ready, error, bodies, hz, ui, tick, selected, hovered, api };
}
