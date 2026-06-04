// Keplerian orbital mechanics.
//
// Given JPL approximate elements (value + per-century rate) we compute a body's
// heliocentric position in the J2000 ecliptic frame for any Julian Date. This
// yields physically real positions (date-accurate) with correct relative
// periods and the perihelion speed-up you can actually see in the animation.

const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
export const J2000 = 2451545.0;

function norm360(d) {
  return ((d % 360) + 360) % 360;
}

// Solve Kepler's equation  M = E - e·sin E  for the eccentric anomaly E.
// Seeded and Newton-iterated; converges in a handful of steps for e < 0.25.
export function solveEccentricAnomaly(M, e) {
  // M in radians, wrapped to [-π, π] for fast, stable convergence.
  let m = ((M % TWO_PI) + TWO_PI) % TWO_PI;
  if (m > Math.PI) m -= TWO_PI;
  let E = m + e * Math.sin(m);
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// Resolve elements at a given Julian Date from their J2000 value + rate.
export function elementsAt(el, jd) {
  const T = (jd - J2000) / 36525; // Julian centuries past J2000
  return {
    a: el.a[0] + el.a[1] * T,
    e: el.e[0] + el.e[1] * T,
    I: el.I[0] + el.I[1] * T,
    L: el.L[0] + el.L[1] * T,
    peri: el.peri[0] + el.peri[1] * T,
    node: el.node[0] + el.node[1] * T,
  };
}

// Heliocentric ecliptic position (AU) for elements `el` at Julian Date `jd`.
// Writes {x, y, z, r} into `out`. x → vernal equinox, z → ecliptic north.
export function heliocentric(el, jd, out = {}) {
  const c = elementsAt(el, jd);
  const e = c.e;
  const M = norm360(c.L - c.peri) * DEG2RAD;
  const E = solveEccentricAnomaly(M, e);

  // Position in the orbital plane (x toward perihelion).
  const a = c.a;
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const w = (c.peri - c.node) * DEG2RAD; // argument of perihelion ω
  const node = c.node * DEG2RAD; // Ω
  const I = c.I * DEG2RAD;

  const cw = Math.cos(w), sw = Math.sin(w);
  const cn = Math.cos(node), sn = Math.sin(node);
  const ci = Math.cos(I), si = Math.sin(I);

  out.x = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp;
  out.y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp;
  out.z = (sw * si) * xp + (cw * si) * yp;
  out.r = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z);
  return out;
}

// Sample the full orbit as ecliptic AU points (for drawing the orbit line),
// using the elements frozen at `jd`. Sweeps eccentric anomaly for an even,
// gap-free ellipse regardless of eccentricity.
export function orbitPoints(el, jd, segments = 256) {
  const c = elementsAt(el, jd);
  const e = c.e, a = c.a;
  const w = (c.peri - c.node) * DEG2RAD;
  const node = c.node * DEG2RAD;
  const I = c.I * DEG2RAD;
  const cw = Math.cos(w), sw = Math.sin(w);
  const cn = Math.cos(node), sn = Math.sin(node);
  const ci = Math.cos(I), si = Math.sin(I);
  const b = Math.sqrt(1 - e * e);

  const pts = [];
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * TWO_PI;
    const xp = a * (Math.cos(E) - e);
    const yp = a * b * Math.sin(E);
    pts.push({
      x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
      z: (sw * si) * xp + (cw * si) * yp,
    });
  }
  return pts;
}
