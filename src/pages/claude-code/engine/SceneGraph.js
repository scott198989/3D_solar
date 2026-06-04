import * as THREE from "three";
import { SUN, PLANETS, DWARF } from "../data/bodies.js";
import { moonsOf } from "../data/moons.js";
import { Orbit } from "../sim/Orbit.js";
import { bodyRadius } from "../sim/scale.js";
import { equilibriumTempK, kToC, habitabilityOf, habitableZone } from "../sim/thermal.js";
import { createSun } from "../bodies/SunMaterial.js";
import { createPlanet } from "../bodies/PlanetFactory.js";
import { createBelt } from "../bodies/Belt.js";
import { createComet } from "../bodies/Comet.js";
import { createStarfield } from "../bodies/Starfield.js";
import { createHabitableZone } from "../bodies/HabitableZone.js";
import { bakePlanetTextures } from "../textures/bakePlanet.js";
import { bakeRingTexture } from "../textures/bakeRing.js";
import { bakeGlowSprite } from "../textures/bakeStarSprite.js";

// Assembles the entire scene and exposes the per-frame update + query API the
// Engine drives. All GPU resources are tracked on the disposer.
export function buildSceneGraph({ scene, renderer, disposer, labelLayer, initialJd }) {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sphereGeo = new THREE.SphereGeometry(1, 64, 48);
  disposer.add(() => sphereGeo.dispose());
  const glow = bakeGlowSprite({ size: 128, falloff: 1.0, hardness: 2.4 });
  const softGlow = bakeGlowSprite({ size: 256, falloff: 1.0, hardness: 1.3 });
  disposer.add(() => { glow.dispose(); softGlow.dispose(); });

  scene.add(new THREE.AmbientLight(0x2a3450, 0.16));

  const bodies = new Map();
  const order = [];
  const pickables = [];
  const planets = [];
  const lineEntries = [];
  const tmp = new THREE.Vector3();

  // ---- Sun ----
  const sun = createSun(SUN, glow);
  scene.add(sun.group);
  disposer.track(sun.group);
  let sunRadius = SUN.artR;
  bodies.set("sun", { id: "sun", type: "star", data: SUN, getWorldPos: (o) => o.set(0, 0, 0), getRadius: () => sunRadius });
  order.push("sun");
  pickables.push(sun.pickable);
  labelLayer.add("sun", sun.group, { kind: "sun", name: "Sun", color: SUN.label });

  // ---- Orbit lines group ----
  const orbitLinesGroup = new THREE.Group();
  scene.add(orbitLinesGroup);

  // ---- Planets + dwarf + their moons ----
  for (const body of [...PLANETS, ...DWARF]) {
    const textures = bakePlanetTextures(body, { anisotropy });
    let ringTexture = null;
    if (body.rings) {
      ringTexture = bakeRingTexture(body.rings, { anisotropy });
      disposer.add(() => ringTexture.dispose());
    }
    const moonAssets = moonsOf(body.id).map((m) => ({
      data: m,
      textures: bakePlanetTextures({ id: m.id, texture: m.texture, palette: m.palette }, { anisotropy }),
    }));

    const planet = createPlanet(body, { textures, ringTexture, moons: moonAssets, sphereGeo });
    scene.add(planet.group);
    disposer.track(planet.group);

    const orbit = new Orbit(body);
    const line = makeOrbitLine(orbit, initialJd, 0, body.label);
    orbitLinesGroup.add(line);
    lineEntries.push({ id: body.id, orbit, line });
    planets.push({ body, planet, orbit });

    bodies.set(body.id, {
      id: body.id, type: body.type, data: body,
      getWorldPos: (o) => o.copy(planet.group.position),
      getRadius: () => planet.radius,
    });
    order.push(body.id);
    pickables.push(planet.pickable);
    labelLayer.add(body.id, planet.group, {
      kind: body.type === "dwarf" ? "dwarf" : "planet", name: body.name, color: body.label,
    });

    for (const m of planet.moons) {
      bodies.set(m.id, {
        id: m.id, type: "moon", data: m.data, parentId: body.id,
        getWorldPos: (o) => m.group.getWorldPosition(o),
        getRadius: () => m.data.radius * (planet.radius / body.artR),
      });
      pickables.push(m.pickable);
      labelLayer.add(m.id, m.group, { kind: "moon", parentId: body.id, name: m.data.name, color: m.data.label });
    }
  }

  // ---- Belts ----
  const belt = createBelt({ count: 2600, innerAU: 2.06, outerAU: 3.28, thickness: 0.16, sizeRange: [0.02, 0.08], color: "#8c7d6a", seed: 1234 });
  scene.add(belt.mesh);
  disposer.track(belt.mesh);
  const kuiper = createBelt({ count: 1500, innerAU: 30, outerAU: 49, thickness: 0.42, sizeRange: [0.03, 0.085], color: "#6c7280", seed: 5678 });
  scene.add(kuiper.mesh);
  disposer.track(kuiper.mesh);
  const belts = [belt, kuiper];

  // ---- Comet ----
  const comet = createComet(glow, sphereGeo);
  scene.add(comet.group);
  disposer.track(comet.group);
  bodies.set("comet", {
    id: "comet", type: "comet", data: { id: "comet", name: "Comet Ourania", kind: "Periodic comet" },
    getWorldPos: (o) => o.copy(comet.group.position), getRadius: () => 0.5,
  });
  pickables.push(comet.pickable);
  labelLayer.add("comet", comet.group, { kind: "comet", name: "Comet", color: "#bfe0ff" });

  // ---- Starfield + Habitable zone ----
  const stars = createStarfield(softGlow, { count: 6500, radius: 9000 });
  scene.add(stars.group);
  disposer.track(stars.group);
  const hz = createHabitableZone(1);
  scene.add(hz.mesh);
  disposer.track(hz.mesh);

  // ---- layer state ----
  const layers = {
    orbits: true, labels: true, belt: true, atmospheres: true,
    starfield: true, moons: true, habitableZone: false,
  };

  let lastLineBlend = -1;
  let lastHZBlend = -1;

  function rebuildLines(jd, blend) {
    for (const e of lineEntries) {
      const pts = e.orbit.linePoints(jd, blend, 320);
      e.line.geometry.dispose();
      e.line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }
  }

  return {
    pickables,
    listBodies() {
      return order
        .map((id) => bodies.get(id))
        .map((b) => ({ id: b.id, name: b.data.name, type: b.type }));
    },
    positionOf(id, out) {
      const b = bodies.get(id);
      return b ? b.getWorldPos(out) : null;
    },
    radiusOf(id) {
      return bodies.get(id)?.getRadius() ?? 1;
    },
    parentOf(id) {
      return bodies.get(id)?.parentId ?? null;
    },
    hasBody(id) {
      return bodies.has(id);
    },

    getSnapshot(id) {
      const b = bodies.get(id);
      if (!b) return null;
      const d = b.data;
      const snap = { id, name: d.name, type: b.type, kind: d.kind, blurb: d.blurb, facts: d.facts, discovered: d.discovered };
      if ((b.type === "planet" || b.type === "dwarf") && d.el) {
        const a = d.el.a[0];
        const eqK = equilibriumTempK(a, d.albedo);
        snap.thermal = {
          aAU: a,
          eqTempC: Math.round(kToC(eqK)),
          meanTempC: d.meanTempC,
          habit: habitabilityOf(a),
          albedo: d.albedo,
        };
      }
      if (b.type === "moon") {
        const parent = bodies.get(b.parentId);
        snap.kind = `Moon of ${parent?.data.name ?? ""}`;
      }
      return snap;
    },

    habitableZoneInfo() {
      return habitableZone(1);
    },

    setLayer(name, on) {
      if (!(name in layers)) return;
      layers[name] = on;
      if (name === "orbits") orbitLinesGroup.visible = on;
      else if (name === "belt") belts.forEach((b) => b.setVisible(on));
      else if (name === "starfield") stars.setVisible(on);
      else if (name === "habitableZone") hz.setVisible(on);
      else if (name === "atmospheres") planets.forEach((p) => p.planet.setAtmosphereVisible(on));
      else if (name === "moons") planets.forEach((p) => p.planet.setMoonsVisible(on));
    },
    getLayers() {
      return { ...layers };
    },

    setBeltDensity(frac) {
      belt.setActiveCount(2600 * frac);
      kuiper.setActiveCount(1500 * frac);
    },

    update({ dJd, dt, elapsed, jd, scaleState, camera, focusedId }) {
      const distBlend = scaleState.dist;
      const sizeBlend = scaleState.size;

      sunRadius = bodyRadius(SUN, sizeBlend);
      sun.setRadius(sunRadius);
      sun.update(elapsed);
      labelLayer.setOffset("sun", sunRadius * 1.2 + 0.6);

      for (const e of planets) {
        const r = bodyRadius(e.body, sizeBlend);
        e.planet.setDisplayRadius(r);
        e.orbit.positionScene(jd, distBlend, tmp);
        e.planet.group.position.copy(tmp);
        e.planet.update(dJd);
        labelLayer.setOffset(e.body.id, r * 1.5 + 0.35);
        const ratio = r / e.body.artR;
        for (const m of e.planet.moons) labelLayer.setOffset(m.id, m.data.radius * ratio * 1.8 + 0.12);
      }

      if (Math.abs(distBlend - lastLineBlend) > 0.0015) {
        rebuildLines(jd, distBlend);
        lastLineBlend = distBlend;
      }
      if (Math.abs(distBlend - lastHZBlend) > 0.0015) {
        hz.setBlend(distBlend);
        lastHZBlend = distBlend;
      }

      for (const b of belts) {
        b.setDistanceBlend(distBlend);
        b.update(dJd);
      }
      comet.update(jd, distBlend);
      stars.update(dt);

      const focusedParentId = focusedId ? bodies.get(focusedId)?.parentId ?? null : null;
      labelLayer.update(camera, { focusedId, focusedParentId, sunRadius, labelsOn: layers.labels });
    },
  };
}

function makeOrbitLine(orbit, jd, blend, colorHex) {
  const pts = orbit.linePoints(jd, blend, 320);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.28,
  });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  return line;
}
