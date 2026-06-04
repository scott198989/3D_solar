import * as THREE from "three";
import { habitableZone } from "../sim/thermal.js";
import { auToScene } from "../sim/scale.js";

// The circumstellar habitable zone — the educational centrepiece. An emerald
// band on the ecliptic between the conservative inner/outer limits, fading out
// across the optimistic margins. Radii follow the same AU→scene transform as
// the orbits, so it tracks the planets through both scale modes.
export function createHabitableZone(L = 1) {
  const z = habitableZone(L);
  const M = 44; // radial divisions  (optimistic-inner → optimistic-outer)
  const K = 200; // angular divisions

  const au = new Float32Array(M + 1);
  for (let i = 0; i <= M; i++) au[i] = z.optimisticInner + (z.optimisticOuter - z.optimisticInner) * (i / M);

  const intensity = (a) => {
    if (a < z.conservativeInner) return smooth(z.optimisticInner, z.conservativeInner, a);
    if (a > z.conservativeOuter) return 1 - smooth(z.conservativeOuter, z.optimisticOuter, a);
    return 1;
  };

  const vertCount = (M + 1) * (K + 1);
  const positions = new Float32Array(vertCount * 3);
  const inten = new Float32Array(vertCount);
  const phi = new Float32Array(K + 1);
  for (let j = 0; j <= K; j++) phi[j] = (j / K) * Math.PI * 2;

  for (let i = 0; i <= M; i++) {
    const it = intensity(au[i]);
    for (let j = 0; j <= K; j++) {
      const idx = i * (K + 1) + j;
      inten[idx] = it;
    }
  }

  const indices = [];
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < K; j++) {
      const a = i * (K + 1) + j;
      const b = a + 1;
      const c = a + (K + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aInten", new THREE.BufferAttribute(inten, 1));
  geo.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#46e39a") },
      uOpacity: { value: 0.16 },
    },
    vertexShader: /* glsl */ `
      attribute float aInten; varying float vInten;
      void main(){ vInten = aInten; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying float vInten; uniform vec3 uColor; uniform float uOpacity;
      void main(){ float i = vInten; gl_FragColor = vec4(uColor * (0.5 + i), i * uOpacity); }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.visible = false;

  function setBlend(blend) {
    const posAttr = geo.attributes.position;
    for (let i = 0; i <= M; i++) {
      const R = auToScene(au[i], blend);
      for (let j = 0; j <= K; j++) {
        const idx = i * (K + 1) + j;
        posAttr.array[idx * 3] = Math.cos(phi[j]) * R;
        posAttr.array[idx * 3 + 1] = 0;
        posAttr.array[idx * 3 + 2] = Math.sin(phi[j]) * R;
      }
    }
    posAttr.needsUpdate = true;
    geo.computeBoundingSphere();
  }
  setBlend(0);

  return {
    mesh,
    setBlend,
    setVisible(v) {
      mesh.visible = v;
    },
    zone: z,
  };
}

function smooth(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
