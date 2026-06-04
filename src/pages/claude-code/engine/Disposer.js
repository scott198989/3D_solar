// Central disposal registry. Every GPU resource and listener registers here so
// teardown is total and idempotent — the key to surviving StrictMode double
// mounts and repeated route navigation without leaking WebGL contexts.
export class Disposer {
  constructor() {
    this._fns = [];
    this._done = false;
  }

  // Register an arbitrary teardown function.
  add(fn) {
    if (typeof fn === "function") this._fns.push(fn);
  }

  // Register a three.js object graph for geometry/material/texture disposal.
  track(object3d) {
    this.add(() => disposeObject(object3d));
  }

  dispose() {
    if (this._done) return;
    this._done = true;
    // Tear down in reverse registration order.
    for (let i = this._fns.length - 1; i >= 0; i--) {
      try {
        this._fns[i]();
      } catch (err) {
        console.error("[solar] dispose error", err);
      }
    }
    this._fns.length = 0;
  }
}

function disposeMaterial(material) {
  if (!material) return;
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && value.isTexture) value.dispose();
  }
  material.dispose();
}

export function disposeObject(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.isInstancedMesh && typeof obj.dispose === "function") obj.dispose();
    if (obj.geometry) obj.geometry.dispose();
    const m = obj.material;
    if (Array.isArray(m)) m.forEach(disposeMaterial);
    else if (m) disposeMaterial(m);
  });
  root.parent?.remove(root);
}
