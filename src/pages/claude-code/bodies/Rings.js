import * as THREE from "three";

// Planetary ring system. Geometry is built in units of planet radius (so it
// scales with the planet), with UVs remapped so the ring texture's U axis runs
// radially — that places the Cassini-style gaps at the right radii. Lit by the
// Sun, with a faint emissive floor so the night side stays readable.
export function createRings(ringData, ringTexture) {
  const inner = ringData.innerR;
  const outer = ringData.outerR;
  const geo = new THREE.RingGeometry(inner, outer, 180, 4);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector2();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i));
    const r = v.length();
    const radial = (r - inner) / (outer - inner);
    const ang = Math.atan2(v.y, v.x) / (Math.PI * 2) + 0.5;
    uv.setXY(i, radial, ang);
  }
  uv.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: ringTexture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0.0,
    emissive: new THREE.Color(ringData.color),
    emissiveIntensity: ringData.faint ? 0.05 : 0.08,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.x = -Math.PI / 2; // lay flat into the equatorial plane
  return mesh;
}
