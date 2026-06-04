import * as THREE from "three";

// Procedural celestial sphere: thousands of varied stars (with a denser Milky
// Way band) plus a few faint nebula clouds for depth. Stars are drawn as soft
// analytic discs via a point shader; the brightest carry HDR colour so they
// twinkle through the bloom.
export function createStarfield(glowTexture, { count = 6500, radius = 9000 } = {}) {
  const group = new THREE.Group();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const palette = [
    new THREE.Color("#ffffff"),
    new THREE.Color("#cfe0ff"),
    new THREE.Color("#aac4ff"),
    new THREE.Color("#ffe8c4"),
    new THREE.Color("#ffd2a1"),
  ];

  // Deterministic PRNG so the sky is identical every run.
  let s = 99173;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  for (let i = 0; i < count; i++) {
    // Bias ~38% of stars toward a galactic-plane band (Milky Way).
    const band = rand() < 0.38;
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    let y = u;
    if (band) y = (rand() - 0.5) * 0.22 + Math.sin(theta * 1.3) * 0.04;
    const rxz = Math.sqrt(Math.max(0, 1 - y * y));
    const x = Math.cos(theta) * rxz;
    const z = Math.sin(theta) * rxz;
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;

    const c = palette[(rand() * palette.length) | 0].clone();
    const bright = rand();
    const mul = band ? 0.5 + bright * 0.8 : 0.4 + bright * 1.4;
    const hdr = bright > 0.985 ? 2.6 : 1; // a few hot stars bloom
    c.multiplyScalar(mul * hdr);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    sizes[i] = (band ? 1.0 : 1.4) + bright * (bright > 0.985 ? 3.2 : 1.6);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixel: { value: dpr } },
    vertexShader: /* glsl */ `
      attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uPixel;
      void main(){
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixel;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geo, mat);
  stars.frustumCulled = false;
  group.add(stars);

  // Faint nebula clouds.
  const nebulae = [
    { c: "#3a2a6a", x: 0.5, y: 0.3, z: -0.8, s: 5200, o: 0.16 },
    { c: "#1f4a5a", x: -0.7, y: -0.2, z: -0.6, s: 4200, o: 0.13 },
    { c: "#5a2a3a", x: 0.2, y: -0.5, z: 0.8, s: 4600, o: 0.1 },
  ];
  for (const n of nebulae) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(n.c),
        transparent: true,
        opacity: n.o,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const v = new THREE.Vector3(n.x, n.y, n.z).normalize().multiplyScalar(radius * 0.92);
    sprite.position.copy(v);
    sprite.scale.setScalar(n.s);
    group.add(sprite);
  }

  return {
    group,
    setVisible(v) {
      group.visible = v;
    },
    update(dt) {
      group.rotation.y += dt * 0.0008;
    },
  };
}
