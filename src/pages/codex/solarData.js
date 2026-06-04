export const AU_TO_SCENE_UNITS = 7;
export const BASE_JULIAN_DAY = 2451545;
export const TIMELINE_DAYS = 3652.5;
export const SOLAR_LUMINOSITY_WATTS = 3.828e26;
export const EARTH_SOLAR_CONSTANT = 1361;

export const speedPresets = [
  { label: "-30 d/s", value: -30 },
  { label: "-7 d/s", value: -7 },
  { label: "1 d/s", value: 1 },
  { label: "7 d/s", value: 7 },
  { label: "30 d/s", value: 30 },
  { label: "1 y/s", value: 365.25 },
];

export const layerDefaults = {
  labels: true,
  orbits: true,
  grid: true,
  belt: true,
  habitable: true,
  atmospheres: true,
};

export const layerLabels = {
  labels: "Labels",
  orbits: "Orbits",
  grid: "Ecliptic",
  belt: "Asteroids",
  habitable: "Habitable zone",
  atmospheres: "Atmospheres",
};

export const solarBodies = [
  {
    id: "sun",
    name: "Sun",
    type: "G-type main-sequence star",
    color: "#ffd27a",
    radiusKm: 695700,
    visualRadius: 3.4,
    mass: "1.989 x 10^30 kg",
    gravity: "274 m/s²",
    rotationDays: 25.38,
    moons: 0,
    description: "The solar system barycentric anchor and source of nearly all incident energy.",
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "Terrestrial planet",
    color: "#b9ada0",
    radiusKm: 2439.7,
    visualRadius: 0.42,
    mass: "3.301 x 10^23 kg",
    gravity: "3.70 m/s²",
    rotationDays: 58.646,
    moons: 0,
    orbit: {
      semiMajorAxisAu: 0.387098,
      eccentricity: 0.20563,
      inclinationDeg: 7.005,
      longitudeNodeDeg: 48.331,
      argumentPeriapsisDeg: 29.124,
      meanAnomalyDeg: 174.796,
      periodDays: 87.969,
    },
    texture: ["#6f675e", "#c0b5a7", "#91887d"],
    description: "A high-eccentricity inner planet with extreme solar heating and a slow spin.",
  },
  {
    id: "venus",
    name: "Venus",
    type: "Terrestrial planet",
    color: "#d9b46f",
    radiusKm: 6051.8,
    visualRadius: 0.66,
    mass: "4.867 x 10^24 kg",
    gravity: "8.87 m/s²",
    rotationDays: -243.025,
    moons: 0,
    orbit: {
      semiMajorAxisAu: 0.723332,
      eccentricity: 0.00677,
      inclinationDeg: 3.3947,
      longitudeNodeDeg: 76.68,
      argumentPeriapsisDeg: 54.884,
      meanAnomalyDeg: 50.115,
      periodDays: 224.701,
    },
    texture: ["#8f6f35", "#e0bd78", "#f3dfad"],
    atmosphere: "#f4d290",
    description: "A nearly circular orbit hides a dense greenhouse atmosphere and retrograde rotation.",
  },
  {
    id: "earth",
    name: "Earth",
    type: "Terrestrial planet",
    color: "#5bb4ff",
    radiusKm: 6371,
    visualRadius: 0.7,
    mass: "5.972 x 10^24 kg",
    gravity: "9.81 m/s²",
    rotationDays: 0.9973,
    moons: 1,
    orbit: {
      semiMajorAxisAu: 1.000001,
      eccentricity: 0.016711,
      inclinationDeg: 0.00005,
      longitudeNodeDeg: -11.26064,
      argumentPeriapsisDeg: 102.947,
      meanAnomalyDeg: 358.617,
      periodDays: 365.256,
    },
    texture: ["#163f7a", "#2a83c8", "#9fd36f", "#f0f2e7"],
    atmosphere: "#78c7ff",
    moonSystem: [
      { name: "Moon", radius: 0.19, distance: 1.65, periodDays: 27.321, color: "#c8c7be" },
    ],
    description: "The reference world for the scale, irradiance, and habitable-zone calculations.",
  },
  {
    id: "mars",
    name: "Mars",
    type: "Terrestrial planet",
    color: "#d46b45",
    radiusKm: 3389.5,
    visualRadius: 0.5,
    mass: "6.417 x 10^23 kg",
    gravity: "3.71 m/s²",
    rotationDays: 1.026,
    moons: 2,
    orbit: {
      semiMajorAxisAu: 1.523679,
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      longitudeNodeDeg: 49.558,
      argumentPeriapsisDeg: 286.502,
      meanAnomalyDeg: 19.412,
      periodDays: 686.98,
    },
    texture: ["#6a3024", "#b24f34", "#e1a071"],
    atmosphere: "#d99878",
    moonSystem: [
      { name: "Phobos", radius: 0.08, distance: 1.05, periodDays: 0.319, color: "#b6aaa0" },
      { name: "Deimos", radius: 0.06, distance: 1.34, periodDays: 1.263, color: "#9e9287" },
    ],
    description: "Its eccentric orbit drives a noticeably variable solar flux across a Martian year.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gas giant",
    color: "#d4a46f",
    radiusKm: 69911,
    visualRadius: 1.95,
    mass: "1.898 x 10^27 kg",
    gravity: "24.79 m/s²",
    rotationDays: 0.414,
    moons: 95,
    orbit: {
      semiMajorAxisAu: 5.2044,
      eccentricity: 0.0489,
      inclinationDeg: 1.303,
      longitudeNodeDeg: 100.464,
      argumentPeriapsisDeg: 273.867,
      meanAnomalyDeg: 20.02,
      periodDays: 4332.59,
    },
    texture: ["#6d4a35", "#d9b083", "#f1d7b5", "#a95f3d"],
    moonSystem: [
      { name: "Io", radius: 0.14, distance: 2.65, periodDays: 1.769, color: "#e7c16a" },
      { name: "Europa", radius: 0.13, distance: 3.25, periodDays: 3.551, color: "#d8d8cf" },
      { name: "Ganymede", radius: 0.18, distance: 4.05, periodDays: 7.155, color: "#9d8c7a" },
      { name: "Callisto", radius: 0.17, distance: 4.8, periodDays: 16.689, color: "#786f67" },
    ],
    description: "The dominant planetary mass, shown with Galilean moons and fast differential rotation.",
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gas giant",
    color: "#e2c27a",
    radiusKm: 58232,
    visualRadius: 1.7,
    mass: "5.683 x 10^26 kg",
    gravity: "10.44 m/s²",
    rotationDays: 0.444,
    moons: 146,
    ring: { inner: 2.05, outer: 3.25, color: "#e9d5a0" },
    orbit: {
      semiMajorAxisAu: 9.5826,
      eccentricity: 0.0565,
      inclinationDeg: 2.485,
      longitudeNodeDeg: 113.665,
      argumentPeriapsisDeg: 339.392,
      meanAnomalyDeg: 317.02,
      periodDays: 10759.22,
    },
    texture: ["#8b724a", "#d6b873", "#f2e2b4"],
    description: "A low-density giant with a ring plane rendered as a resolved disk system.",
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Ice giant",
    color: "#8de2e8",
    radiusKm: 25362,
    visualRadius: 1.18,
    mass: "8.681 x 10^25 kg",
    gravity: "8.69 m/s²",
    rotationDays: -0.718,
    moons: 28,
    ring: { inner: 1.45, outer: 1.9, color: "#b7eef2" },
    orbit: {
      semiMajorAxisAu: 19.2184,
      eccentricity: 0.0463,
      inclinationDeg: 0.773,
      longitudeNodeDeg: 74.006,
      argumentPeriapsisDeg: 96.998,
      meanAnomalyDeg: 142.239,
      periodDays: 30688.5,
    },
    texture: ["#5dbdc7", "#a8eef2", "#d7fbff"],
    atmosphere: "#a9f3f8",
    description: "An ice giant with an extreme axial tilt and faint ring system.",
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Ice giant",
    color: "#4978ff",
    radiusKm: 24622,
    visualRadius: 1.16,
    mass: "1.024 x 10^26 kg",
    gravity: "11.15 m/s²",
    rotationDays: 0.671,
    moons: 16,
    orbit: {
      semiMajorAxisAu: 30.1104,
      eccentricity: 0.009456,
      inclinationDeg: 1.77,
      longitudeNodeDeg: 131.784,
      argumentPeriapsisDeg: 273.187,
      meanAnomalyDeg: 256.228,
      periodDays: 60182,
    },
    texture: ["#1f3a9f", "#386dff", "#78a6ff"],
    atmosphere: "#6b91ff",
    description: "A distant ice giant whose orbital motion reveals the advantage of time acceleration.",
  },
];

export const selectableBodies = solarBodies;

export function getBodyById(id) {
  return solarBodies.find((body) => body.id === id) ?? solarBodies[0];
}

export function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function dateFromSimulationDay(day) {
  const date = new Date(Date.UTC(2000, 0, 1, 12));
  date.setUTCDate(date.getUTCDate() + Math.floor(day));
  return date;
}

export function formatSimulationDate(day) {
  return dateFromSimulationDay(day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
