import * as THREE from "three";
import { createAtmosphere } from "./Atmosphere.js";
import { createRings } from "./Rings.js";

const DEG = Math.PI / 180;
const MAX_SPIN_STEP = 0.3; // rad/frame — keeps fast time-warp from strobing
const SPIN_SCALE = 0.06; // visual tuning: sim-rate → pleasant on-screen spin

function roughnessFor(type) {
  if (type === "gas" || type === "ice") return 0.62;
  if (type === "earth") return 0.74;
  return 0.95;
}
function bumpFor(type) {
  if (type === "gas" || type === "ice") return 0.004;
  if (type === "earth") return 0.02;
  return 0.03;
}

// Builds a planet (or dwarf): tilted, spinning surface with optional clouds,
// atmosphere, rings, and orbiting moons. `group` is repositioned each frame by
// the scene; everything else scales from the current display radius so the two
// size modes morph cleanly.
export function createPlanet(body, assets) {
  const { textures, ringTexture, moons = [], sphereGeo } = assets;
  const group = new THREE.Group();
  group.userData.bodyId = body.id;

  const tilt = new THREE.Group();
  tilt.rotation.z = (body.axialTilt || 0) * DEG;
  group.add(tilt);

  const spin = new THREE.Group();
  tilt.add(spin);

  const surfaceMat = new THREE.MeshStandardMaterial({
    map: textures.map,
    bumpMap: textures.bump,
    bumpScale: bumpFor(body.texture),
    roughness: roughnessFor(body.texture),
    metalness: 0,
  });
  const surface = new THREE.Mesh(sphereGeo, surfaceMat);
  surface.userData.bodyId = body.id;
  spin.add(surface);

  let clouds = null;
  if (textures.clouds) {
    clouds = new THREE.Mesh(
      sphereGeo,
      new THREE.MeshStandardMaterial({
        map: textures.clouds,
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      }),
    );
    tilt.add(clouds);
  }

  let atmosphere = null;
  if (body.atmosphere) {
    atmosphere = createAtmosphere(body.atmosphere);
    tilt.add(atmosphere);
  }

  let rings = null;
  if (body.rings) {
    rings = createRings(body.rings, ringTexture);
    tilt.add(rings);
  }

  // ---- moons ----
  const spinSign = (body.rotationHours || 1) < 0 ? -1 : 1;
  const spinRate = (Math.PI * 2) / ((Math.abs(body.rotationHours) || 24) / 24);

  const moonObjs = moons.map(({ data, textures: mt }) => {
    const mGroup = new THREE.Group();
    const mSpin = new THREE.Group();
    const mesh = new THREE.Mesh(
      sphereGeo,
      new THREE.MeshStandardMaterial({
        map: mt.map,
        bumpMap: mt.bump,
        bumpScale: 0.03,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    mesh.userData.bodyId = data.id;
    mSpin.add(mesh);
    mGroup.add(mSpin);
    group.add(mGroup);
    return {
      id: data.id,
      data,
      group: mGroup,
      spin: mSpin,
      pickable: mesh,
      angle: (data.phase || 0) * DEG,
      dir: data.retrograde ? -1 : 1,
      incl: (data.inclination || 0) * DEG,
      rate: (Math.PI * 2) / (data.periodDays || 1),
    };
  });

  let currentRadius = body.artR;
  let moonsVisible = true;

  function applyScale(displayR) {
    currentRadius = displayR;
    surface.scale.setScalar(displayR);
    if (clouds) clouds.scale.setScalar(displayR * 1.012);
    if (atmosphere) atmosphere.scale.setScalar(displayR);
    if (rings) rings.scale.setScalar(displayR);
  }
  applyScale(currentRadius);

  return {
    id: body.id,
    body,
    group,
    pickable: surface,
    moons: moonObjs,
    hasMoons: moonObjs.length > 0,

    setDisplayRadius: applyScale,
    get radius() {
      return currentRadius;
    },

    setMoonsVisible(v) {
      moonsVisible = v;
      for (const m of moonObjs) m.group.visible = v;
    },
    setAtmosphereVisible(v) {
      if (atmosphere) atmosphere.visible = v;
      if (clouds) clouds.visible = v;
    },

    // dJd = simulated days elapsed this frame (0 when paused → motion freezes).
    update(dJd) {
      const step = THREE.MathUtils.clamp(spinRate * dJd * spinSign * SPIN_SCALE, -MAX_SPIN_STEP, MAX_SPIN_STEP);
      spin.rotation.y += step;
      if (clouds) clouds.rotation.y += step * 1.15;

      if (moonsVisible) {
        const ratio = currentRadius / body.artR;
        for (const m of moonObjs) {
          const inc = THREE.MathUtils.clamp(m.rate * dJd * m.dir * 0.5, -MAX_SPIN_STEP, MAX_SPIN_STEP);
          m.angle += inc;
          const rr = m.data.orbitR * currentRadius;
          const ca = Math.cos(m.angle), sa = Math.sin(m.angle);
          m.group.position.set(ca * rr, sa * rr * Math.sin(m.incl), sa * rr * Math.cos(m.incl));
          m.spin.rotation.y += step * 0.5;
          m.spin.scale.setScalar(m.data.radius * ratio);
        }
      }
    },
  };
}
