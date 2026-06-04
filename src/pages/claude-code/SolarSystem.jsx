import { useEffect, useMemo, useRef, useState } from "react";
import { Orbit, TriangleAlert } from "lucide-react";
import { useEngine } from "./ui/useEngineBridge.js";
import { createAmbient } from "./audio/Ambient.js";
import HUD from "./ui/HUD.jsx";
import "./index.css";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function LoadingOverlay() {
  return (
    <div className="cc-overlay cc-loading">
      <span className="cc-spinner" aria-hidden="true">
        <Orbit size={34} strokeWidth={1.6} />
      </span>
      <strong>Generating worlds…</strong>
      <span className="cc-loading-sub">Baking procedural planets, seeding the sky, solving orbits</span>
    </div>
  );
}

function ErrorOverlay() {
  return (
    <div className="cc-overlay cc-error">
      <TriangleAlert size={30} aria-hidden="true" />
      <strong>WebGL unavailable</strong>
      <span>This experience needs a WebGL2-capable browser with hardware acceleration enabled.</span>
    </div>
  );
}

export default function SolarSystem() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const initialDate = useMemo(() => new Date(), []);
  const { ready, error, bodies, hz, ui, tick, selected, api } = useEngine(stageRef, { initialDate });

  // Fit the root to the space below the shared (variable-height) site header.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const fit = () => {
      const top = root.getBoundingClientRect().top;
      root.style.height = `${Math.max(360, window.innerHeight - top)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", fit);
      ro.disconnect();
    };
  }, []);

  // Ambient audio (gesture-gated, default off).
  const ambientRef = useRef(null);
  const [audioOn, setAudioOn] = useState(false);
  useEffect(() => () => ambientRef.current?.dispose(), []);
  const toggleAudio = () => {
    if (!ambientRef.current) ambientRef.current = createAmbient();
    const next = !audioOn;
    setAudioOn(next);
    Promise.resolve(ambientRef.current.setEnabled(next)).catch((e) =>
      console.error("[solar] audio toggle failed", e),
    );
  };

  // Easter egg.
  const [egg, setEgg] = useState(false);
  useEffect(() => {
    let seq = [];
    let timer = 0;
    const onKey = (e) => {
      seq.push(e.key);
      seq = seq.slice(-KONAMI.length);
      if (seq.length === KONAMI.length && KONAMI.every((k, i) => k === seq[i])) {
        setEgg(true);
        clearTimeout(timer);
        timer = setTimeout(() => setEgg(false), 6000);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="cc-root" ref={rootRef}>
      <div className="cc-stage" ref={stageRef} />
      {ready && !error && (
        <HUD ui={ui} tick={tick} bodies={bodies} hz={hz} selected={selected} api={api} audio={{ on: audioOn, toggle: toggleAudio }} />
      )}
      {!ready && !error && <LoadingOverlay />}
      {error && <ErrorOverlay />}
      {egg && <div className="cc-egg">🛸 Secret unlocked — the cosmos says hello.</div>}
    </div>
  );
}
