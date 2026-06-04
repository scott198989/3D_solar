import * as THREE from "three";
import { Orbit } from "../sim/Orbit.js";

// A comet on a steep, eccentric orbit with a glowing tail that always points
// away from the Sun and grows as it nears perihelion. Tail + coma are additive
// HDR, so they bloom for free. The orbit period is shortened from reality so it
// sweeps through the inner system within a reasonable viewing time.
const COMET_ELEMENTS = {
  // ~3.4 AU semi-major, e=0.82 → dives to 0.6 AU then out past 6 AU.
  a: [3.4, 0],
  e: [0.82, 0],
  I: [62.4, 0],
  L: [40, 360 * 36525 / (365.25 * Math.pow(3.4, 1.5))], // mean motion as L rate/century
  peri: [111, 0],
  node: [88, 0],
};

const UP = new THREE.Vector3(0, 1, 0);

export function createComet(glowTexture, sphereGeo) {
  const group = new THREE.Group();
  const orbit = new Orbit({ el: COMET_ELEMENTS });

  const nucleus = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshStandardMaterial({
      color: "#cfe6ff",
      emissive: new THREE.Color("#9fd0ff"),
      emissiveIntensity: 0.7,
      roughness: 0.6,
      metalness: 0,
    }),
  );
  nucleus.scale.setScalar(0.12);
  nucleus.userData.bodyId = "comet";
  group.add(nucleus);

  const coma = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color("#bfe0ff"),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  coma.scale.setScalar(0.9);
  group.add(coma);

  const tailMat = new THREE.ShaderMaterial({
    uniforms: {
      uNear: { value: new THREE.Color("#dff0ff") },
      uFar: { value: new THREE.Color("#5aa0ff") },
      uIntensity: { value: 1.1 },
    },
    vertexShader: /* glsl */ `
      varying float vH;
      void main(){ vH = position.y + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying float vH; uniform vec3 uNear; uniform vec3 uFar; uniform float uIntensity;
      void main(){ float a = pow(1.0 - vH, 1.6) * uIntensity; gl_FragColor = vec4(mix(uNear, uFar, vH), a); }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const tailPivot = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1, 18, 1, true), tailMat);
  tail.position.y = 0.5; // base at pivot, extends +Y
  tailPivot.add(tail);
  group.add(tailPivot);

  const pos = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const q = new THREE.Quaternion();

  return {
    group,
    pickable: nucleus,
    setVisible(v) {
      group.visible = v;
    },
    update(jd, distBlend) {
      orbit.positionScene(jd, distBlend, pos);
      group.position.copy(pos);
      const sceneDist = pos.length();
      // Proximity proxy: closer → brighter, longer tail.
      const prox = THREE.MathUtils.clamp(60 / (sceneDist + 8), 0.2, 2.4);
      const len = 3 + prox * 9;
      dir.copy(pos).normalize(); // anti-sun (Sun at origin)
      q.setFromUnitVectors(UP, dir);
      tailPivot.quaternion.copy(q);
      tail.scale.set(0.6 + prox * 0.5, len, 0.6 + prox * 0.5);
      tail.position.y = len * 0.5;
      tailMat.uniforms.uIntensity.value = 0.7 + prox * 0.9;
      coma.scale.setScalar(0.6 + prox * 0.7);
    },
  };
}
