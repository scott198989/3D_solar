import * as THREE from "three";

// Pointer picking: hover (emitted only when the hovered body changes) and click
// (distinguished from an orbit drag by movement threshold). Raycasts only the
// solid body meshes, so transparent atmospheres/clouds never block selection.
export function createPicker(camera, dom, handlers, disposer) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pickables = [];
  let hoveredId = null;
  let lastHoverTime = 0;
  let down = null;

  function toNdc(e) {
    const rect = dom.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.bodyId : null;
  }

  function onMove(e) {
    const now = performance.now();
    if (now - lastHoverTime < 24) return;
    lastHoverTime = now;
    toNdc(e);
    const id = pick();
    if (id !== hoveredId) {
      hoveredId = id;
      dom.style.cursor = id ? "pointer" : "";
      handlers.onHover?.(id);
    }
  }

  function onDown(e) {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  function onUp(e) {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const dt = performance.now() - down.t;
    down = null;
    if (moved > 6 || dt > 500) return; // it was a drag, not a click
    toNdc(e);
    const id = pick();
    if (id) handlers.onPick?.(id);
  }

  dom.addEventListener("pointermove", onMove);
  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointerup", onUp);
  disposer.add(() => {
    dom.removeEventListener("pointermove", onMove);
    dom.removeEventListener("pointerdown", onDown);
    dom.removeEventListener("pointerup", onUp);
  });

  return {
    setPickables(list) {
      pickables = list;
    },
    get hovered() {
      return hoveredId;
    },
  };
}
