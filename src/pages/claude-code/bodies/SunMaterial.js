import * as THREE from "three";

// The Sun: a live emissive shader (granulation + bright filaments + limb
// brightening) rendered HDR so it — and only it — drives the bloom. Layered
// additive corona sprites and a point light complete it.

const vertexShader = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vObjPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform float uIntensity;

  float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.02; a*=0.5; } return s; }

  void main(){
    vec3 p = normalize(vObjPos) * 3.2;
    float t = uTime * 0.05;
    float n = fbm(p + vec3(t, t*0.6, -t*0.8));
    float veins = fbm(p*2.1 - vec3(t*1.3, 0.0, t));
    float granule = pow(clamp(n, 0.0, 1.0), 1.35);
    vec3 col = mix(uCool, uHot, granule);
    col += uHot * pow(clamp(veins,0.0,1.0), 3.0) * 0.7;
    float fres = pow(1.0 - max(dot(vNormalV, vViewDir), 0.0), 2.0);
    col += uHot * fres * 0.9;
    col *= uIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSun(body, glowTexture) {
  const group = new THREE.Group();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      // THREE.Color(hex) already stores linear working-space values under
      // ColorManagement — feed them straight to the shader (no extra convert).
      uHot: { value: new THREE.Color(body.color) },
      uCool: { value: new THREE.Color(body.glow) },
      uIntensity: { value: 2.6 },
    },
    vertexShader,
    fragmentShader,
    toneMapped: true,
  });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), material);
  surface.userData.bodyId = body.id;
  group.add(surface);

  const mkCorona = (color, opacity) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(sprite);
    return sprite;
  };
  const coronaInner = mkCorona("#ffd9a0", 0.9);
  const coronaOuter = mkCorona("#ff9233", 0.55);

  const light = new THREE.PointLight(0xfff2dc, 2.2, 0, 0);
  group.add(light);

  let radius = body.artR;
  function setRadius(r) {
    radius = r;
    surface.scale.setScalar(r);
    coronaInner.scale.set(r * 4.4, r * 4.4, 1);
    coronaOuter.scale.set(r * 8.5, r * 8.5, 1);
  }
  setRadius(radius);

  return {
    group,
    pickable: surface,
    light,
    setRadius,
    update(elapsed) {
      material.uniforms.uTime.value = elapsed;
    },
  };
}
