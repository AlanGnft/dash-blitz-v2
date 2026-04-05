// ================================================================
//  DASH BLITZ — Character base class
// ================================================================

export default class Character {
  constructor(scene) {
    this.scene = scene;
    this._meshes = []; // all meshes, for hide/show
  }

  // Positions/animates all meshes based on current physics state each frame.
  // pPos: {x, y}, lean: {x, z}, ps: {bobT, squashT, jumping, velY}
  update(pPos, lean, ps) {}

  // Scale all parts toward 0 for death pop. progress 0→1.
  killPop(progress) {
    const s = Math.max(0, 1 - progress);
    for (const m of this._meshes) m.scaling.setAll(s);
  }

  // Reset all transforms to neutral, make visible.
  reset(pPos) {
    for (const m of this._meshes) {
      m.scaling.setAll(1);
      m.isVisible = true;
    }
  }

  hide() { for (const m of this._meshes) m.isVisible = false; }
  show() { for (const m of this._meshes) m.isVisible = true; }

  // Returns the world position for particle effects, collision center.
  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.55, z: 0 }; }

  // Clean up all meshes.
  dispose() {
    for (const m of this._meshes) m.dispose();
    this._meshes = [];
  }
}
