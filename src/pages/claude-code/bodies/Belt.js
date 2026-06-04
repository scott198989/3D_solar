import * as THREE from "three";
import { makeNoise3D } from "../textures/noise.js";
import { auToScene } from "../sim/scale.js";

// A belt of small bodies rendered as a single InstancedMesh (one draw call).
// Each instance carries its own orbit (semi-major axis, phase, inclination,
// tumble); positions are precomputed for both scale modes and lerped per frame,
// and `count` is reduced for adaptive quality without any reallocation.
export function createBelt(opts) {
  const {
    count = 2400,
    innerAU = 2.1,
    outerAU = 3.3,
    thickness = 0.16,
    sizeRange = [0.02, 0.085],
    color = "#8c7d6a",
    seed = 1234,
    detail = 0,
  } = opts;

  const geo = new THREE.IcosahedronGeometry(1, detail);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const N = makeNoise3D(seed);
  const rng = (i, s) => N.noise(i * 0.137 + s, s * 1.7, i * 0.071) * 0.5 + 0.5;

  const a = new Float32Array(count); // semi-major axis (AU)
  const angle = new Float32Array(count);
  const speed = new Float32Array(count);
  const yPhase = new Float32Array(count);
  const yAmp = new Float32Array(count); // inclination amplitude (AU)
  const tumble = new Float32Array(count);
  const size = new Float32Array(count);
  const compactR = new Float32Array(count);
  const realR = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const au = innerAU + (outerAU - innerAU) * Math.pow(rng(i, 3.1), 0.8);
    a[i] = au;
    angle[i] = rng(i, 7.7) * Math.PI * 2;
    speed[i] = Math.pow(au, -1.5) * 0.45; // Keplerian: inner asteroids faster
    yPhase[i] = rng(i, 11.3) * Math.PI * 2;
    yAmp[i] = (rng(i, 5.9) - 0.5) * 2 * thickness;
    tumble[i] = rng(i, 2.3) * Math.PI * 2;
    size[i] = sizeRange[0] + (sizeRange[1] - sizeRange[0]) * rng(i, 9.4);
    compactR[i] = auToScene(au, 0);
    realR[i] = auToScene(au, 1);
  }

  const dummy = new THREE.Object3D();
  let distBlend = 0;
  let activeCount = count;
  mesh.count = activeCount;

  function writeAll() {
    for (let i = 0; i < count; i++) {
      const R = compactR[i] + (realR[i] - compactR[i]) * distBlend;
      const y = yAmp[i] * R;
      dummy.position.set(Math.cos(angle[i]) * R, y * Math.cos(yPhase[i]), Math.sin(angle[i]) * R);
      dummy.rotation.set(tumble[i], tumble[i] * 1.3, tumble[i] * 0.7);
      dummy.scale.setScalar(size[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  writeAll();

  return {
    mesh,
    setDistanceBlend(b) {
      if (Math.abs(b - distBlend) > 1e-4) {
        distBlend = b;
        writeAll();
      }
    },
    setActiveCount(n) {
      activeCount = THREE.MathUtils.clamp(Math.floor(n), 0, count);
      mesh.count = activeCount;
    },
    setVisible(v) {
      mesh.visible = v;
    },
    update(dJd) {
      if (!mesh.visible || dJd === 0) return;
      const inc = THREE.MathUtils.clamp(dJd * 0.02, -0.12, 0.12);
      for (let i = 0; i < activeCount; i++) {
        angle[i] += speed[i] * inc;
        const R = compactR[i] + (realR[i] - compactR[i]) * distBlend;
        const y = yAmp[i] * R;
        dummy.position.set(Math.cos(angle[i]) * R, y * Math.cos(yPhase[i]), Math.sin(angle[i]) * R);
        dummy.rotation.set(tumble[i] + angle[i], tumble[i] * 1.3, tumble[i] * 0.7);
        dummy.scale.setScalar(size[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
