import * as THREE from "three";
import { heliocentric, orbitPoints } from "./kepler.js";
import { orbitFactor } from "./scale.js";

// Map a heliocentric ecliptic vector (x→equinox, z→north) into the three.js
// scene frame (Y-up). Orbits then lie in the X-Z plane with inclinations
// lifting bodies gently in Y.
export function eclipticToScene(x, y, z, out) {
  out.set(x, z, -y);
  return out;
}

// Per-body orbit: turns elements + a Julian Date into a scaled scene position,
// and generates the orbit-line geometry on demand.
export class Orbit {
  constructor(body) {
    this.el = body.el;
    this.a0 = body.el.a[0];
    this._helio = {};
  }

  // Write the body's current scene position into `out` (THREE.Vector3).
  positionScene(jd, distBlend, out) {
    const h = heliocentric(this.el, jd, this._helio);
    const f = orbitFactor(this.a0, distBlend);
    return eclipticToScene(h.x * f, h.y * f, h.z * f, out);
  }

  // Array of THREE.Vector3 tracing the full orbit at the current scale.
  linePoints(jd, distBlend, segments = 256) {
    const raw = orbitPoints(this.el, jd, segments);
    const f = orbitFactor(this.a0, distBlend);
    const v = new THREE.Vector3();
    return raw.map((p) => eclipticToScene(p.x * f, p.y * f, p.z * f, v.clone()));
  }
}
