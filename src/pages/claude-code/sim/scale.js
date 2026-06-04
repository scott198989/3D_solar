// Scale transforms — map physical units (AU, km) into scene units, with two
// independently toggleable modes that blend smoothly:
//
//   distance:  "compact" (artistic, readable spacing)  ↔  "realistic" (true AU)
//   size:      "artistic" (readable radii)              ↔  "true" relative sizes
//
// Distances are scaled per-orbit by a single factor, so elliptical orbit SHAPES
// (eccentricity, inclination) are always preserved — only the overall spacing
// changes. Blends are eased frame-rate-independently for buttery mode morphs.

export const AU_TO_SCENE = 40; // realistic: 1 AU → 40 scene units
const COMPACT_BASE = 22;
const COMPACT_EXP = 0.6;

// Earth's true radius → 0.5 scene units in "true size" mode (sets the ratio for
// every other body). Sun is handled specially so it never engulfs the scene.
export const KM_TO_SCENE_TRUE = 0.5 / 6371;

export function compactRadius(aAU) {
  return COMPACT_BASE * Math.pow(aAU, COMPACT_EXP);
}

// AU distance → scene distance for the current distance blend (0 compact, 1 real).
export function auToScene(aAU, distBlend) {
  const compact = compactRadius(aAU);
  const real = aAU * AU_TO_SCENE;
  return compact + (real - compact) * distBlend;
}

// Uniform multiplier applied to a heliocentric AU vector (preserves orbit shape).
export function orbitFactor(aAU, distBlend) {
  return auToScene(aAU, distBlend) / aAU;
}

// Body display radius for the current size blend.
export function bodyRadius(body, sizeBlend) {
  if (body.type === "star") {
    // The Sun stays readable; it only grows modestly in "true" mode.
    return body.artR * (1 + 0.45 * sizeBlend);
  }
  const trueR = body.radiusKm * KM_TO_SCENE_TRUE;
  return body.artR + (trueR - body.artR) * sizeBlend;
}

// A small, frame-rate-independent eased blend manager for the two scale modes.
export function createScaleState() {
  return {
    dist: 0, // current distance blend
    size: 0, // current size blend
    distTarget: 0,
    sizeTarget: 0,
    tau: 0.16, // ~0.8s settle

    setDistanceMode(mode) {
      this.distTarget = mode === "realistic" ? 1 : 0;
    },
    setSizeMode(mode) {
      this.sizeTarget = mode === "true" ? 1 : 0;
    },
    update(dt) {
      const k = 1 - Math.exp(-dt / this.tau);
      this.dist += (this.distTarget - this.dist) * k;
      this.size += (this.sizeTarget - this.size) * k;
      // Snap when essentially settled to avoid endless tiny updates.
      if (Math.abs(this.distTarget - this.dist) < 1e-4) this.dist = this.distTarget;
      if (Math.abs(this.sizeTarget - this.size) < 1e-4) this.size = this.sizeTarget;
    },
    get distanceMode() {
      return this.distTarget === 1 ? "realistic" : "compact";
    },
    get sizeMode() {
      return this.sizeTarget === 1 ? "true" : "artistic";
    },
  };
}
