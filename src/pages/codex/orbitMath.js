import {
  AU_TO_SCENE_UNITS,
  EARTH_SOLAR_CONSTANT,
  solarBodies,
} from "./solarData.js";

const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

function normalizeRadians(value) {
  return ((value % TAU) + TAU) % TAU;
}

export function solveKepler(meanAnomaly, eccentricity) {
  let eccentricAnomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI;

  for (let index = 0; index < 8; index += 1) {
    const delta =
      (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }

  return eccentricAnomaly;
}

export function positionAtDay(body, day, scale = AU_TO_SCENE_UNITS) {
  if (!body.orbit) {
    return [0, 0, 0];
  }

  const orbit = body.orbit;
  const meanAnomaly = normalizeRadians(
    orbit.meanAnomalyDeg * DEG_TO_RAD + (TAU * day) / orbit.periodDays,
  );
  const eccentricAnomaly = solveKepler(meanAnomaly, orbit.eccentricity);
  const a = orbit.semiMajorAxisAu;
  const e = orbit.eccentricity;
  const orbitalX = a * (Math.cos(eccentricAnomaly) - e);
  const orbitalY = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);

  const node = orbit.longitudeNodeDeg * DEG_TO_RAD;
  const periapsis = orbit.argumentPeriapsisDeg * DEG_TO_RAD;
  const inclination = orbit.inclinationDeg * DEG_TO_RAD;
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosPeriapsis = Math.cos(periapsis);
  const sinPeriapsis = Math.sin(periapsis);
  const cosInclination = Math.cos(inclination);
  const sinInclination = Math.sin(inclination);

  const x =
    (cosNode * cosPeriapsis - sinNode * sinPeriapsis * cosInclination) * orbitalX +
    (-cosNode * sinPeriapsis - sinNode * cosPeriapsis * cosInclination) * orbitalY;
  const y = sinPeriapsis * sinInclination * orbitalX + cosPeriapsis * sinInclination * orbitalY;
  const z =
    (sinNode * cosPeriapsis + cosNode * sinPeriapsis * cosInclination) * orbitalX +
    (-sinNode * sinPeriapsis + cosNode * cosPeriapsis * cosInclination) * orbitalY;

  return [x * scale, y * scale, z * scale];
}

export function orbitPathPoints(body, samples = 256, scale = AU_TO_SCENE_UNITS) {
  if (!body.orbit) return [];

  return Array.from({ length: samples + 1 }, (_, index) => {
    const day = (body.orbit.periodDays * index) / samples;
    return positionAtDay(
      {
        ...body,
        orbit: {
          ...body.orbit,
          meanAnomalyDeg: 0,
        },
      },
      day,
      scale,
    );
  });
}

export function sceneDistanceToAu(position) {
  const [x, y, z] = position;
  return Math.sqrt(x * x + y * y + z * z) / AU_TO_SCENE_UNITS;
}

export function solarFluxAtAu(au) {
  if (!au) return null;
  return 1 / (au * au);
}

export function irradianceAtAu(au) {
  const flux = solarFluxAtAu(au);
  return flux ? flux * EARTH_SOLAR_CONSTANT : null;
}

export function equilibriumTemperatureKelvin(au, albedo = 0.3) {
  if (!au) return null;
  return 278.5 * Math.pow(1 - albedo, 0.25) / Math.sqrt(au);
}

export function selectedBodyMetrics(body, day) {
  const position = positionAtDay(body, day);
  const distanceAu = body.id === "sun" ? 0 : sceneDistanceToAu(position);
  const flux = body.id === "sun" ? null : solarFluxAtAu(distanceAu);
  const irradiance = body.id === "sun" ? null : irradianceAtAu(distanceAu);
  const temp = body.id === "sun" ? null : equilibriumTemperatureKelvin(distanceAu);

  return {
    position,
    distanceAu,
    flux,
    irradiance,
    equilibriumTempK: temp,
    equilibriumTempC: temp === null ? null : temp - 273.15,
  };
}

export function allBodyPositions(day) {
  return Object.fromEntries(solarBodies.map((body) => [body.id, positionAtDay(body, day)]));
}
