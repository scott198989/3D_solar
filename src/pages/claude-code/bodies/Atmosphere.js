import * as THREE from "three";

// A thin fresnel shell that glows at the limb — sells terrestrial atmospheres
// and the hazy edge of gas/ice giants. Additive, back-side, depth-write off so
// it reads as a halo around the planet disk. Built at unit radius and scaled.

const vertexShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  void main(){
    float rim = pow(1.0 - abs(dot(vNormalV, vViewDir)), uPower);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

export function createAtmosphere(spec, shellScale = 1.16) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(spec.color) },
      uPower: { value: spec.power ?? 2.6 },
      uIntensity: { value: spec.intensity ?? 1.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(shellScale, 48, 32), material);
  return mesh;
}
