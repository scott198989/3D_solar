// requestAnimationFrame driver with clamped delta time and a smoothed FPS
// estimate. A `running` flag gates the callback so a cancelled loop can never
// touch disposed GPU resources (the classic StrictMode/route-nav crash).
export function createLoop(onFrame) {
  let rafId = 0;
  let running = false;
  let last = 0;
  let fps = 60;

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05; // guard against tab-switch / breakpoint jumps
    fps += (1 / dt - fps) * 0.08;
    onFrame(dt, fps);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    get fps() {
      return fps;
    },
  };
}
