// ================================================================
//  DASH BLITZ — Apple character
// ================================================================
import Character from './base.js';

const LEAN_LANE_ANG  = 15 * Math.PI / 180;
const LEAN_JUMP_UP   =  8 * Math.PI / 180;
const LEAN_JUMP_DOWN = -6 * Math.PI / 180;

export default class Apple extends Character {
  constructor(scene) {
    super(scene);

    const matApple = new BABYLON.PBRMaterial('apple', scene);
    matApple.albedoColor          = new BABYLON.Color3(0.92, 0.11, 0.07);
    matApple.metallic             = 0.05;
    matApple.roughness            = 0.12;
    matApple.environmentIntensity = 0.35;

    const matLeaf = new BABYLON.PBRMaterial('leaf', scene);
    matLeaf.albedoColor = new BABYLON.Color3(0.08, 0.78, 0.14);
    matLeaf.metallic    = 0.0;
    matLeaf.roughness   = 0.18;

    const matStem = new BABYLON.StandardMaterial('stem', scene);
    matStem.diffuseColor = new BABYLON.Color3(0.22, 0.48, 0.08);

    const matEyeWhite = new BABYLON.StandardMaterial('eyeWhite', scene);
    matEyeWhite.diffuseColor  = new BABYLON.Color3(0.95, 0.95, 0.95);
    matEyeWhite.emissiveColor = new BABYLON.Color3(0.18, 0.18, 0.18);

    const matEyePupil = new BABYLON.StandardMaterial('eyePupil', scene);
    matEyePupil.diffuseColor  = new BABYLON.Color3(0.06, 0.06, 0.06);
    matEyePupil.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);

    this._body   = BABYLON.MeshBuilder.CreateSphere('appleBody',   { diameter: 1.1, segments: 20 }, scene);
    this._leaf   = BABYLON.MeshBuilder.CreateSphere('appleLeaf',   { diameter: 0.52, segments: 10 }, scene);
    this._stem   = BABYLON.MeshBuilder.CreateCylinder('appleStem', { diameter: 0.065, height: 0.28, tessellation: 6 }, scene);
    this._eyeL   = BABYLON.MeshBuilder.CreateSphere('appleEyeL',  { diameter: 0.19, segments: 8 }, scene);
    this._eyeR   = BABYLON.MeshBuilder.CreateSphere('appleEyeR',  { diameter: 0.19, segments: 8 }, scene);
    this._pupilL = BABYLON.MeshBuilder.CreateSphere('applePupL',  { diameter: 0.10, segments: 6 }, scene);
    this._pupilR = BABYLON.MeshBuilder.CreateSphere('applePupR',  { diameter: 0.10, segments: 6 }, scene);

    this._body.material   = matApple;
    this._leaf.material   = matLeaf;   this._leaf.scaling.set(0.72, 0.32, 0.9);
    this._stem.material   = matStem;
    this._eyeL.material   = matEyeWhite;
    this._eyeR.material   = matEyeWhite;
    this._pupilL.material = matEyePupil;
    this._pupilR.material = matEyePupil;

    this._meshes = [this._body, this._leaf, this._stem, this._eyeL, this._eyeR, this._pupilL, this._pupilR];
  }

  update(pPos, lean, ps) {
    const squashing = ps.squashT > 0;
    let sy = 1, sx = 1;
    if (squashing) {
      const p = Math.max(0, ps.squashT / 0.20);
      sy = 1 - p * 0.42; sx = 1 + p * 0.24;
    }
    const bob = (ps.jumping || squashing) ? 0 : Math.sin(ps.bobT * 10) * 0.034;

    this._body.scaling.set(sx, sy, sx);
    this._leaf.scaling.set(0.72 * sx, 0.32 * sy, 0.9 * sx);
    this._stem.scaling.set(sx, sy, sx);

    this._body.position.set(pPos.x, pPos.y + bob, 0);
    this._body.rotation.set(lean.x, 0, lean.z);

    this._leaf.position.set(pPos.x, pPos.y + 0.60 + bob, 0.04);
    this._leaf.rotation.set(lean.x, 0, lean.z);

    this._stem.position.set(pPos.x, pPos.y + 0.82 + bob, 0.04);
    this._stem.rotation.set(lean.x, 0, lean.z);

    this._eyeL.position.set(pPos.x - 0.14, pPos.y + 0.10 + bob, -0.42);
    this._eyeR.position.set(pPos.x + 0.14, pPos.y + 0.10 + bob, -0.42);
    this._pupilL.position.set(pPos.x - 0.14, pPos.y + 0.10 + bob, -0.48);
    this._pupilR.position.set(pPos.x + 0.14, pPos.y + 0.10 + bob, -0.48);

    for (const m of [this._eyeL, this._eyeR, this._pupilL, this._pupilR])
      m.rotation.set(lean.x, 0, lean.z);
  }

  killPop(progress) {
    const s = Math.max(0, 1 - progress);
    this._body.scaling.setAll(s);
    this._leaf.scaling.set(0.72 * s, 0.32 * s, 0.9 * s);
    this._stem.scaling.setAll(s);
    this._eyeL.scaling.setAll(s);
    this._eyeR.scaling.setAll(s);
    this._pupilL.scaling.setAll(s);
    this._pupilR.scaling.setAll(s);
  }

  reset(pPos) {
    this._body.scaling.set(1, 1, 1);
    this._leaf.scaling.set(0.72, 0.32, 0.9);
    this._stem.scaling.set(1, 1, 1);
    this._eyeL.scaling.setAll(1); this._eyeR.scaling.setAll(1);
    this._pupilL.scaling.setAll(1); this._pupilR.scaling.setAll(1);
    for (const m of this._meshes) m.isVisible = true;
    this.update(pPos, { x: 0, z: 0 }, { bobT: 0, squashT: 0, jumping: false, velY: 0 });
  }

  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.55, z: 0 }; }
}
