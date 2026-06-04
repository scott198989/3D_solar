import * as THREE from "three";
import { createRenderCore } from "./Renderer.js";
import { createCameraRig } from "./CameraRig.js";
import { createPicker } from "./Picker.js";
import { createLoop } from "./Loop.js";
import { buildSceneGraph } from "./SceneGraph.js";
import { LabelLayer } from "../labels/Labels.js";
import { Emitter } from "./Emitter.js";
import { Disposer } from "./Disposer.js";
import { createClock } from "../sim/time.js";
import { createScaleState } from "../sim/scale.js";
import { TOUR } from "../data/tour.js";

// The engine: owns the render loop, scene, camera, post-processing and the
// orchestration of every subsystem. Exposes an imperative API and emits events
// to React. Hot-path data (fps/date) is throttled before crossing the boundary.
export function createEngine(container, options = {}) {
  const emitter = new Emitter();
  const disposer = new Disposer();

  const renderCore = createRenderCore(container, disposer);
  const { scene, camera } = renderCore;

  const clock = createClock(options.initialDate || new Date());
  const scaleState = createScaleState();

  const labelLayer = new LabelLayer({
    onPick: (id) => focus(id),
    onHover: (id) => setHover(id),
  });
  disposer.add(() => labelLayer.dispose());

  const graph = buildSceneGraph({ scene, renderer: renderCore.renderer, disposer, labelLayer, initialJd: clock.jd });

  const cameraRig = createCameraRig(camera, renderCore.renderer.domElement, disposer);

  const picker = createPicker(camera, renderCore.renderer.domElement, {
    onPick: (id) => focus(id),
    onHover: (id) => setHover(id),
  }, disposer);
  picker.setPickables(graph.pickables);

  // ---- state ----
  let alive = true;
  let focusedId = null;
  let hoveredId = null;
  let elapsed = 0;
  let qualityLevel = 0;
  let qualityDpr = 2;
  const focusVec = new THREE.Vector3();
  const tour = { active: false, index: 0, timer: 0 };

  function uiState() {
    const step = tour.active ? TOUR[tour.index] : null;
    return {
      paused: clock.paused,
      speed: clock.daysPerSecond,
      direction: clock.direction,
      distanceMode: scaleState.distanceMode,
      sizeMode: scaleState.sizeMode,
      layers: graph.getLayers(),
      focusedId,
      focusedName: focusedId ? graph.getSnapshot(focusedId)?.name : null,
      tour: { active: tour.active, index: tour.index, total: TOUR.length, title: step?.title, caption: step?.caption },
    };
  }
  const emitState = () => emitter.emit("state", uiState());

  function setHover(id) {
    if (id === hoveredId) return;
    if (hoveredId) labelLayer.setHovered(hoveredId, false);
    hoveredId = id;
    if (id) labelLayer.setHovered(id, true);
    emitter.emit("hover", { id });
  }

  function focus(id, opts = {}) {
    if (!graph.hasBody(id)) return;
    if (focusedId) labelLayer.setSelected(focusedId, false);
    focusedId = id;
    labelLayer.setSelected(id, true);
    graph.positionOf(id, focusVec);
    cameraRig.focus(focusVec, graph.radiusOf(id));
    if (!opts.fromTour && tour.active) stopTour(true);
    emitter.emit("select", { id });
    emitState();
  }

  function clearFocus() {
    if (focusedId) labelLayer.setSelected(focusedId, false);
    focusedId = null;
    cameraRig.stopFollow();
    emitter.emit("select", { id: null });
    emitState();
  }

  function viewSystem() {
    if (focusedId) labelLayer.setSelected(focusedId, false);
    focusedId = null;
    cameraRig.viewSystem();
    emitter.emit("select", { id: null });
    emitState();
  }

  // ---- tour ----
  function applyTourStep() {
    const step = TOUR[tour.index];
    tour.timer = 0;
    if (step.id === "__system__") {
      if (focusedId) labelLayer.setSelected(focusedId, false);
      focusedId = null;
      cameraRig.viewSystem();
      emitter.emit("select", { id: null });
    } else {
      focus(step.id, { fromTour: true });
    }
    emitState();
  }
  function startTour() {
    tour.active = true;
    tour.index = 0;
    applyTourStep();
  }
  function stopTour(silent) {
    if (!tour.active) return;
    tour.active = false;
    if (!silent) emitState();
    else emitState();
  }
  function tourStep(dir) {
    if (!tour.active) return;
    tour.index = (tour.index + dir + TOUR.length) % TOUR.length;
    applyTourStep();
  }
  function updateTour(dt) {
    tour.timer += dt;
    const step = TOUR[tour.index];
    if (tour.timer >= step.dwell) {
      if (tour.index >= TOUR.length - 1) {
        stopTour();
      } else {
        tour.index += 1;
        applyTourStep();
      }
    }
  }

  // ---- adaptive quality ----
  let smoothedFps = 60;
  let sinceQuality = 0;
  function applyQuality() {
    if (qualityLevel === 0) { qualityDpr = 2; renderCore.bloomPass.strength = 0.85; graph.setBeltDensity(1); }
    else if (qualityLevel === 1) { qualityDpr = 1.5; renderCore.bloomPass.strength = 0.72; graph.setBeltDensity(0.6); }
    else { qualityDpr = 1.0; renderCore.bloomPass.strength = 0.55; graph.setBeltDensity(0.35); }
    resize();
  }
  function adapt(fps, dt) {
    smoothedFps += (fps - smoothedFps) * 0.05;
    sinceQuality += dt;
    if (sinceQuality < 3) return;
    if (smoothedFps < 42 && qualityLevel < 2) { qualityLevel++; applyQuality(); sinceQuality = 0; }
    else if (smoothedFps > 57 && qualityLevel > 0) { qualityLevel--; applyQuality(); sinceQuality = 0; }
  }

  // ---- resize ----
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, qualityDpr);
    renderCore.setSize(w, h, dpr);
  }
  const ro = new ResizeObserver(() => resize());
  ro.observe(container);
  disposer.add(() => ro.disconnect());
  resize();

  // ---- main loop ----
  let tickAccum = 0;
  const loop = createLoop((dt, fps) => {
    const jdBefore = clock.jd;
    clock.advance(dt);
    const dJd = clock.jd - jdBefore;
    elapsed += dt;
    scaleState.update(dt);
    if (tour.active) updateTour(dt);

    graph.update({ dJd, dt, elapsed, jd: clock.jd, scaleState, camera, focusedId });

    const focusPos = focusedId ? graph.positionOf(focusedId, focusVec) : null;
    cameraRig.update(dt, focusPos);

    renderCore.renderFrame();
    adapt(fps, dt);

    tickAccum += dt;
    if (tickAccum >= 0.12) {
      tickAccum = 0;
      const f = clock.format();
      emitter.emit("tick", { fps: Math.round(fps), date: f.date, time: f.time, year: f.year });
    }
  });
  disposer.add(() => loop.stop());
  loop.start();

  // Defer "ready" by one microtask: the React bridge calls createEngine()
  // synchronously and attaches its "ready" listener immediately AFTER we
  // return, so a synchronous emit here would be missed (overlay stuck). The
  // `alive` guard skips the emit if the engine was disposed in between.
  queueMicrotask(() => {
    if (!alive) return;
    emitter.emit("ready", { bodies: graph.listBodies(), hz: graph.habitableZoneInfo(), state: uiState() });
  });

  // ---- public API ----
  return {
    on: (e, cb) => emitter.on(e, cb),
    off: (e, cb) => emitter.off(e, cb),
    dispose() {
      alive = false;
      disposer.dispose();
      emitter.clear();
    },

    focus,
    clearFocus,
    viewSystem,

    togglePaused() { clock.setPaused(!clock.paused); emitState(); },
    setPaused(p) { clock.setPaused(p); emitState(); },
    setSpeed(daysPerSecond) { clock.setSpeed(daysPerSecond); emitState(); },
    setDirection(dir) { clock.setDirection(dir); emitState(); },

    setDistanceMode(mode) { scaleState.setDistanceMode(mode); emitState(); },
    setSizeMode(mode) { scaleState.setSizeMode(mode); emitState(); },

    setLayer(name, on) { graph.setLayer(name, on); emitState(); },

    setDate(date) { clock.setDate(date); emitState(); },
    resetToNow() { clock.resetToNow(); emitState(); },

    startTour, stopTour: () => stopTour(), tourNext: () => tourStep(1), tourPrev: () => tourStep(-1),

    getSnapshot: (id) => graph.getSnapshot(id),
    listBodies: () => graph.listBodies(),
    habitableZoneInfo: () => graph.habitableZoneInfo(),
    getState: uiState,
  };
}
