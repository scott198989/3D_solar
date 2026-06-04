import * as THREE from "three";

// Soft radial-gradient sprite used for stars, the Sun's corona/glow, and comet
// particles. Tinting is done per-material via the sprite colour, so one white
// gradient serves every glow.
export function bakeGlowSprite({ size = 128, core = 0.0, falloff = 1.0, hardness = 2.2 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const c = size / 2;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / c;
      const dy = (y - c) / c;
      const d = Math.sqrt(dx * dx + dy * dy);
      let a;
      if (d <= core) a = 1;
      else {
        const t = Math.max(0, 1 - (d - core) / Math.max(1e-3, falloff - core));
        a = Math.pow(t, hardness);
      }
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.max(0, Math.min(1, a)) * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
