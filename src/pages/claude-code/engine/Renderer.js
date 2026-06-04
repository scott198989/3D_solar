import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

// Builds the renderer, camera, HDR bloom composer and the CSS2D label layer.
// Selective bloom is achieved purely by the HDR threshold: emissive bodies push
// past 1.0 and bloom; lit planets stay below it and stay crisp. OutputPass is
// last and performs tone mapping + sRGB once.
export function createRenderCore(container, disposer) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    logarithmicDepthBuffer: true, // huge dynamic range: moons ~0.05 → Pluto ~1600 units
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.classList.add("cc-gl");
  container.appendChild(renderer.domElement);
  disposer.add(() => {
    renderer.domElement.remove();
    renderer.dispose();
    renderer.forceContextLoss();
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 30000);
  camera.position.set(0, 92, 232);

  // HDR, multisampled composer target so emissive values survive for bloom and
  // edges stay antialiased through post-processing.
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.5, 0.9);
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);
  disposer.add(() => {
    // EffectComposer.dispose() frees its own targets/copy pass but not the
    // passes we added — dispose those explicitly to avoid GPU leaks.
    composer.dispose();
    renderPass.dispose();
    bloomPass.dispose();
    outputPass.dispose();
    target.dispose();
  });

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "cc-labels";
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.inset = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  labelRenderer.domElement.style.overflow = "hidden";
  container.appendChild(labelRenderer.domElement);
  disposer.add(() => labelRenderer.domElement.remove());

  function setSize(w, h, dpr) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloomPass.setSize(w * dpr, h * dpr);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return {
    renderer,
    scene,
    camera,
    composer,
    bloomPass,
    labelRenderer,
    setSize,
    renderFrame() {
      composer.render();
      labelRenderer.render(scene, camera);
    },
  };
}
