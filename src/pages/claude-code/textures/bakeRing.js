import * as THREE from "three";
import { makeNoise3D, hexToRgb } from "./noise.js";

// Ring texture where U maps to radius (0 = inner edge, 1 = outer edge). Band
// opacities (incl. gaps like Saturn's Cassini Division) come from data, with
// fine ringlet detail layered on top. The ring geometry remaps its UVs so this
// strip wraps correctly around the annulus.
export function bakeRingTexture(ring, { anisotropy = 8 } = {}) {
  const w = 1024;
  const h = 8;
  const data = new Uint8ClampedArray(w * h * 4);
  const N = makeNoise3D(20240617);
  const color = hexToRgb(ring.color);
  const bands = ring.bands;

  for (let x = 0; x < w; x++) {
    const fx = x / (w - 1);
    let op = 0;
    for (const [s, e, o] of bands) {
      if (fx >= s && fx < e) {
        op = o;
        break;
      }
    }
    // Concentric ringlet structure + a soft edge falloff.
    const ringlet = 0.62 + 0.38 * (N.noise(fx * 140, 1.7, 4.3) * 0.5 + 0.5);
    const edge = Math.min(1, Math.min(fx, 1 - fx) * 14);
    let alpha = op * ringlet * edge;
    const bright = 0.78 + 0.22 * (N.noise(fx * 60, 5.1, 2.2) * 0.5 + 0.5);
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      data[i] = color.r * bright;
      data[i + 1] = color.g * bright;
      data[i + 2] = color.b * bright;
      data[i + 3] = alpha * 255;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").putImageData(new ImageData(data, w, h), 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}
