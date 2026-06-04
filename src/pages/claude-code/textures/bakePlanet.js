import * as THREE from "three";
import { makeNoise3D, hexToRgb, mix, smoothstep, clamp01, hashId } from "./noise.js";

// Bakes seam-free equirectangular surface (and matching bump) maps for a body
// by sampling 3D noise along the sphere direction for every texel. One-time
// cost at init; the result is a plain texture sampled by a standard material.

function makeCanvasTexture(data, w, h, { srgb = true, anisotropy = 8 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = new ImageData(data, w, h);
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function sizeFor(type) {
  if (type === "gas") return [1024, 512];
  if (type === "earth") return [768, 384];
  if (type === "ice") return [640, 320];
  return [512, 256];
}

// Continuous colour ramp across a band palette, indexed by a wavy coordinate.
function bandColor(bands, coord) {
  const n = bands.length;
  let u = (coord * 0.5 + 0.5) * n;
  u = ((u % n) + n) % n;
  const i = Math.floor(u);
  const f = smoothstep(0, 1, u - i);
  return mix(bands[i % n], bands[(i + 1) % n], f);
}

export function bakePlanetTextures(body, opts = {}) {
  const { anisotropy = 8 } = opts;
  const type = body.texture;
  const [w, h] = sizeFor(type);
  const N = makeNoise3D(hashId(body.id));
  const pal = body.palette;

  const map = new Uint8ClampedArray(w * h * 4);
  const bump = new Uint8ClampedArray(w * h * 4);

  // Pre-parse palette hexes per archetype.
  let P = {};
  if (type === "earth") {
    P = {
      ocean: hexToRgb(pal.ocean), shallow: hexToRgb(pal.shallow),
      land: hexToRgb(pal.land), sand: hexToRgb(pal.sand), ice: hexToRgb(pal.ice),
    };
  } else if (type === "gas") {
    P = { bands: pal.bands.map(hexToRgb), spot: pal.spot ? hexToRgb(pal.spot) : null };
  } else {
    P = {
      base: hexToRgb(pal.base), low: hexToRgb(pal.low || pal.base),
      high: hexToRgb(pal.high || pal.base), accent: hexToRgb(pal.accent || pal.base),
      ice: pal.ice ? hexToRgb(pal.ice) : null,
    };
  }
  const venusSmooth = body.id === "venus";
  const hasSpot = type === "gas" && P.spot && body.id === "jupiter";
  const spotLon = 2.2, spotLat = -0.34;
  const bandFreq = body.id === "jupiter" ? 9 : body.id === "saturn" ? 7 : 5;

  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI;
    const clat = Math.cos(lat), slat = Math.sin(lat);
    const latN = lat / (Math.PI / 2); // -1..1
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * Math.PI * 2;
      const dx = clat * Math.cos(lon), dy = slat, dz = clat * Math.sin(lon);
      let col, height;

      if (type === "earth") {
        const cont = N.fbm(dx * 1.6, dy * 1.6, dz * 1.6, 6);
        const isLand = cont > 0.05;
        if (!isLand) {
          const depth = smoothstep(0.05, -0.45, cont);
          col = mix(P.shallow, P.ocean, depth);
          height = 0.18;
        } else {
          const detail = N.fbm(dx * 5, dy * 5, dz * 5, 5) * 0.5 + 0.5;
          const arid = smoothstep(0.45, 0.85, detail) * (1 - smoothstep(0.55, 0.9, Math.abs(latN)));
          col = mix(P.land, P.sand, arid);
          height = 0.35 + detail * 0.45;
        }
        const cap = smoothstep(0.74, 0.94, Math.abs(latN) + N.fbm(dx * 8, dy * 8, dz * 8, 3) * 0.06);
        col = mix(col, P.ice, cap);
        if (cap > 0.2) height = Math.max(height, 0.5);
      } else if (type === "gas") {
        const warp = N.fbm(dx * 2.4, dy * 2.4, dz * 2.4, 4) * 0.85;
        const coord = latN * bandFreq + warp;
        col = bandColor(P.bands, coord);
        const streak = N.fbm(dx * 9, dy * 3, dz * 9, 3);
        col = mix(col, streak > 0 ? P.bands[0] : P.bands[P.bands.length - 1], Math.abs(streak) * 0.12);
        if (hasSpot) {
          const dlon = Math.atan2(dz, dx) - spotLon;
          const wlon = Math.atan2(Math.sin(dlon), Math.cos(dlon));
          const dl = lat - spotLat;
          const dist = Math.sqrt((wlon * 0.55) ** 2 + dl ** 2);
          const m = smoothstep(0.18, 0.04, dist);
          col = mix(col, P.spot, m);
          col = mix(col, { r: 90, g: 30, b: 20 }, smoothstep(0.05, 0.0, Math.abs(dist - 0.16)) * 0.3);
        }
        height = 0.4;
      } else if (type === "ice") {
        const mott = N.fbm(dx * 3, dy * 3, dz * 3, 5);
        const band = Math.sin(lat * 5 + N.fbm(dx * 2, dy * 2, dz * 2, 3) * 1.6) * 0.5 + 0.5;
        col = mix(P.low, P.high, band * 0.45 + (mott * 0.5 + 0.5) * 0.3);
        col = mix(col, P.base, 0.45);
        if (body.id === "neptune") {
          const dlon = Math.atan2(dz, dx) - 1.1;
          const wlon = Math.atan2(Math.sin(dlon), Math.cos(dlon));
          const dist = Math.sqrt((wlon * 0.6) ** 2 + (lat + 0.5) ** 2);
          col = mix(col, P.low, smoothstep(0.16, 0.03, dist) * 0.7);
        }
        height = 0.3 + mott * 0.1;
      } else {
        // rocky / icy moons / dwarf
        const oct = venusSmooth ? 4 : 5;
        const elev = N.fbm(dx * 2.2, dy * 2.2, dz * 2.2, oct);
        const hgt = elev * 0.5 + 0.5;
        col = mix(P.low, P.high, smoothstep(0.32, 0.72, hgt));
        col = mix(col, P.base, 0.4);
        const patches = N.ridged(dx * 1.6, dy * 1.6, dz * 1.6, 3);
        col = mix(col, P.accent, smoothstep(0.55, 0.9, patches) * (venusSmooth ? 0.5 : 0.8));
        let crater = 0;
        if (!venusSmooth) {
          crater = N.ridged(dx * 5, dy * 5, dz * 5, 4);
          const cf = 1 - 0.4 * Math.pow(crater, 3);
          col = { r: col.r * cf, g: col.g * cf, b: col.b * cf };
        }
        if (P.ice) {
          const cap = smoothstep(0.78, 0.96, Math.abs(latN) + N.fbm(dx * 6, dy * 6, dz * 6, 3) * 0.05);
          col = mix(col, P.ice, cap);
        }
        height = clamp01(hgt * 0.7 + crater * 0.3);
      }

      const i = (y * w + x) * 4;
      map[i] = col.r;
      map[i + 1] = col.g;
      map[i + 2] = col.b;
      map[i + 3] = 255;
      const bval = clamp01(height) * 255;
      bump[i] = bval;
      bump[i + 1] = bval;
      bump[i + 2] = bval;
      bump[i + 3] = 255;
    }
  }

  const result = {
    map: makeCanvasTexture(map, w, h, { srgb: true, anisotropy }),
    bump: makeCanvasTexture(bump, w, h, { srgb: false, anisotropy }),
  };

  if (body.clouds) {
    result.clouds = bakeClouds(body, w, h, anisotropy);
  }
  return result;
}

function bakeClouds(body, w, h, anisotropy) {
  const N = makeNoise3D(hashId(body.id + "-clouds"));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI;
    const clat = Math.cos(lat), slat = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * Math.PI * 2;
      const dx = clat * Math.cos(lon), dy = slat, dz = clat * Math.sin(lon);
      const c = N.fbm(dx * 2.1, dy * 2.1, dz * 2.1, 5) * 0.5 + 0.5;
      const swirl = N.fbm(dx * 5, dy * 5, dz * 5, 4) * 0.5 + 0.5;
      const a = smoothstep(0.5, 0.82, c * 0.7 + swirl * 0.3);
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = a * 255;
    }
  }
  return makeCanvasTexture(data, w, h, { srgb: true, anisotropy });
}
