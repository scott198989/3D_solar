// Minimal typed event emitter — the boundary between the imperative engine and
// the React HUD. Listeners are stored per event; emit is allocation-free.
export class Emitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, cb) {
    let set = this._listeners.get(event);
    if (!set) {
      set = new Set();
      this._listeners.set(event, set);
    }
    set.add(cb);
    return () => this.off(event, cb);
  }

  off(event, cb) {
    this._listeners.get(event)?.delete(cb);
  }

  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(payload);
      } catch (err) {
        // A listener throwing must never break the render loop.
        console.error(`[solar] listener error for "${event}"`, err);
      }
    }
  }

  clear() {
    this._listeners.clear();
  }
}
