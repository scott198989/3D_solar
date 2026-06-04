import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const OVERVIEW_POS = new THREE.Vector3(0, 92, 232);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);

function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Camera controller: OrbitControls plus a smooth focus tween and a "follow"
// mode that tracks a moving body while still letting the user orbit/zoom around
// it. Follow re-centres on the body each frame by shifting camera + target
// together, so the user's relative view is preserved even as the planet moves.
export function createCameraRig(camera, domElement, disposer) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.6;
  controls.minDistance = 0.04;
  controls.maxDistance = 9000;
  controls.target.copy(OVERVIEW_TARGET);
  disposer.add(() => controls.dispose());

  let mode = "free"; // free | tween | follow
  let tween = null;
  const tmp = new THREE.Vector3();
  const desiredCam = new THREE.Vector3();

  function startTween(toPos, toTarget, dur = 1.4) {
    tween = {
      fromPos: camera.position.clone(),
      toPos: toPos.clone(),
      fromTarget: controls.target.clone(),
      toTarget: toTarget.clone(),
      t: 0,
      dur,
    };
    mode = "tween";
    controls.enabled = false;
  }

  function distanceFor(radius) {
    return Math.max(radius * 3.4 + 1.4, radius + 0.3);
  }

  return {
    controls,

    get mode() {
      return mode;
    },
    isAnimating() {
      return mode === "tween";
    },

    // Frame and then follow a body at `pos` with display `radius`.
    focus(pos, radius) {
      const dist = distanceFor(radius);
      let dir = tmp.copy(camera.position).sub(controls.target);
      if (dir.lengthSq() < 1e-6) dir.set(0.6, 0.35, 1);
      dir.normalize();
      desiredCam.copy(pos).addScaledVector(dir, dist);
      // A touch of elevation for a more dramatic framing.
      desiredCam.y += radius * 0.8;
      startTween(desiredCam, pos, 1.35);
      this._followRadius = radius;
    },

    viewSystem() {
      startTween(OVERVIEW_POS, OVERVIEW_TARGET, 1.5);
      this._followRadius = 0;
      this._pendingFree = true;
    },

    // Called every frame after body positions update.
    // `focusPos` = current position of the followed body (or null in free/system).
    update(dt, focusPos) {
      if (mode === "tween") {
        tween.t = Math.min(1, tween.t + dt / tween.dur);
        const k = smootherstep(tween.t);
        // If following a moving body, shift BOTH the target and the desired
        // camera end-point by the body's motion, so the framing offset the
        // tween was aimed at is preserved when it lands.
        if (focusPos) {
          tmp.copy(focusPos).sub(tween.toTarget);
          tween.toTarget.add(tmp);
          tween.toPos.add(tmp);
        }
        camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
        controls.update();
        if (tween.t >= 1) {
          tween = null;
          controls.enabled = true;
          mode = focusPos ? "follow" : "free";
          this._pendingFree = false;
        }
        return;
      }

      if (mode === "follow" && focusPos) {
        // Shift camera + target by how far the body moved, preserving the
        // user's orbit offset and zoom, then let OrbitControls apply input.
        const delta = tmp.copy(focusPos).sub(controls.target);
        camera.position.add(delta);
        controls.target.add(delta);
        controls.update();
        return;
      }

      controls.update();
    },

    stopFollow() {
      if (mode === "follow") mode = "free";
    },
  };
}
