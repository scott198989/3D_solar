import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// Label layer built on CSS2DRenderer. Each label tracks its body imperatively
// (never via React state). CSS2D has no depth test, so we hide labels that fall
// behind the Sun and thin out moon labels unless their planet is in focus.
export class LabelLayer {
  constructor({ onPick, onHover }) {
    this.entries = new Map();
    this.onPick = onPick;
    this.onHover = onHover;
    this._cam = new THREE.Vector3();
    this._body = new THREE.Vector3();
    this._toBody = new THREE.Vector3();
    this._toSun = new THREE.Vector3();
  }

  add(id, group, { kind, parentId = null, name, color }) {
    const el = document.createElement("div");
    el.className = `cc-label cc-label-${kind}`;
    el.innerHTML = `<span class="cc-label-dot" style="--dot:${color}"></span><span class="cc-label-name">${name}</span>`;
    el.style.pointerEvents = "auto";
    el.addEventListener("pointerdown", (e) => e.stopPropagation());
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onPick?.(id);
    });
    el.addEventListener("pointerenter", () => this.onHover?.(id));
    el.addEventListener("pointerleave", () => this.onHover?.(null));

    const object = new CSS2DObject(el);
    object.center.set(0.5, 1.1);
    group.add(object);
    this.entries.set(id, { id, kind, parentId, group, el, object, offset: 1 });
  }

  setOffset(id, yOffset) {
    const e = this.entries.get(id);
    if (e) e.object.position.set(0, yOffset, 0);
  }

  setSelected(id, selected) {
    const e = this.entries.get(id);
    if (e) e.el.classList.toggle("is-selected", selected);
  }
  setHovered(id, hovered) {
    const e = this.entries.get(id);
    if (e) e.el.classList.toggle("is-hovered", hovered);
  }

  // Per-frame visibility: occlude behind the Sun; gate moon labels on focus.
  update(camera, { focusedId, focusedParentId, sunRadius, labelsOn }) {
    camera.getWorldPosition(this._cam);
    this._toSun.set(0, 0, 0).sub(this._cam);
    const sunDist = this._toSun.length();
    this._toSun.normalize();
    const sunAngular = Math.atan2(sunRadius, Math.max(0.001, sunDist)) * 1.25;

    for (const e of this.entries.values()) {
      if (!labelsOn) {
        e.object.visible = false;
        continue;
      }
      // Moon labels only when their planet (or the moon) is in focus.
      if (e.kind === "moon") {
        const show = focusedId === e.id || focusedId === e.parentId || focusedParentId === e.parentId;
        if (!show) {
          e.object.visible = false;
          continue;
        }
      }
      e.group.getWorldPosition(this._body);
      this._toBody.copy(this._body).sub(this._cam);
      const bodyDist = this._toBody.length();
      this._toBody.normalize();
      // Behind the Sun?
      let visible = true;
      if (bodyDist > sunDist) {
        const ang = this._toBody.angleTo(this._toSun);
        if (ang < sunAngular) visible = false;
      }
      e.object.visible = visible;
    }
  }

  dispose() {
    for (const e of this.entries.values()) {
      e.object.parent?.remove(e.object);
      e.el.remove();
    }
    this.entries.clear();
  }
}
