// Thermal model — the scientifically-grounded educational layer.
//
// The circumstellar habitable zone (the "Goldilocks zone") is the shell around
// a star where a rocky planet could sustain liquid surface water. Its bounds
// scale with the square root of stellar luminosity. We use the widely-cited
// conservative limits (runaway greenhouse → maximum greenhouse) plus an
// optimistic extension (recent Venus → early Mars).
//
// Equilibrium temperature is the blackbody temperature a body would have from
// absorbed sunlight alone:  T_eq = 278.5 K · ((1−A)·L)^¼ / √a   (a in AU).
// Comparing T_eq with a planet's true mean temperature reveals the greenhouse
// effect at a glance — most dramatically on Venus.

export function habitableZone(L = 1) {
  const s = Math.sqrt(L);
  return {
    optimisticInner: 0.84 * s, // recent Venus
    conservativeInner: 0.95 * s, // runaway greenhouse
    conservativeOuter: 1.37 * s, // maximum greenhouse
    optimisticOuter: 1.7 * s, // early Mars
  };
}

export function equilibriumTempK(aAU, albedo, L = 1) {
  return 278.5 * Math.pow(Math.max(0, (1 - albedo) * L), 0.25) / Math.sqrt(aAU);
}

export function kToC(k) {
  return k - 273.15;
}

export function habitabilityOf(aAU, L = 1) {
  const z = habitableZone(L);
  if (aAU >= z.conservativeInner && aAU <= z.conservativeOuter) return "inside";
  if (aAU >= z.optimisticInner && aAU <= z.optimisticOuter) return "edge";
  return aAU < z.conservativeInner ? "too hot" : "too cold";
}
