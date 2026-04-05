// ================================================================
//  DASH BLITZ — Rice Box character
// ================================================================
import Character from './base.js';

export default class RiceBox extends Character {
  constructor(scene) {
    super(scene);

    const matCream = new BABYLON.PBRMaterial('rbCream', scene);
    matCream.albedoColor = new BABYLON.Color3(0.92, 0.90, 0.80);
    matCream.metallic    = 0.0; matCream.roughness = 0.78;

    const matLid = new BABYLON.PBRMaterial('rbLid', scene);
    matLid.albedoColor = new BABYLON.Color3(0.88, 0.10, 0.06);
    matLid.metallic    = 0.08; matLid.roughness = 0.55;

    const matHandle = new BABYLON.StandardMaterial('rbHandle', scene);
    matHandle.diffuseColor = new BABYLON.Color3(0.80, 0.08, 0.05);

    const matEyeW = new BABYLON.StandardMaterial('rbEyeW', scene);
    matEyeW.diffuseColor  = new BABYLON.Color3(0.95, 0.95, 0.95);
    matEyeW.emissiveColor = new BABYLON.Color3(0.18, 0.18, 0.18);

    const matEyeP = new BABYLON.StandardMaterial('rbEyeP', scene);
    matEyeP.diffuseColor  = new BABYLON.Color3(0.06, 0.06, 0.06);
    matEyeP.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);

    this._body  = BABYLON.MeshBuilder.CreateBox('rbBody',  { width: 0.95, height: 0.80, depth: 0.78 }, scene);
    this._lid   = BABYLON.MeshBuilder.CreateBox('rbLid',   { width: 1.02, height: 0.05, depth: 0.84 }, scene);
    this._hL    = BABYLON.MeshBuilder.CreateBox('rbHL',    { width: 0.06, height: 0.28, depth: 0.06 }, scene);
    this._hR    = BABYLON.MeshBuilder.CreateBox('rbHR',    { width: 0.06, height: 0.28, depth: 0.06 }, scene);
    this._hBar  = BABYLON.MeshBuilder.CreateBox('rbHBar',  { width: 0.38, height: 0.05, depth: 0.06 }, scene);
    this._eyeL  = BABYLON.MeshBuilder.CreateSphere('rbEyeL', { diameter: 0.16, segments: 8 }, scene);
    this._eyeR  = BABYLON.MeshBuilder.CreateSphere('rbEyeR', { diameter: 0.16, segments: 8 }, scene);
    this._pupilL= BABYLON.MeshBuilder.CreateSphere('rbPupL', { diameter: 0.08, segments: 6 }, scene);
    this._pupilR= BABYLON.MeshBuilder.CreateSphere('rbPupR', { diameter: 0.08, segments: 6 }, scene);

    this._body.material   = matCream;
    this._lid.material    = matLid;
    this._hL.material     = matHandle; this._hR.material  = matHandle; this._hBar.material = matHandle;
    this._eyeL.material   = matEyeW;   this._eyeR.material  = matEyeW;
    this._pupilL.material = matEyeP;   this._pupilR.material = matEyeP;

    this._meshes = [this._body, this._lid, this._hL, this._hR, this._hBar, this._eyeL, this._eyeR, this._pupilL, this._pupilR];
  }

  _place(pPos, lean, bob) {
    const x = pPos.x, y = pPos.y + bob;
    const lz = lean.z; // stiff, no softening — box personality

    this._body.position.set(x, y + 0.40, 0);
    this._body.rotation.set(0, 0, lz);

    this._lid.position.set(x, y + 0.825, 0);
    this._lid.rotation.set(0, 0, lz);

    // Handle on front face
    this._hL.position.set(x - 0.15, y + 0.68, -0.40);
    this._hL.rotation.set(0, 0, lz);
    this._hR.position.set(x + 0.15, y + 0.68, -0.40);
    this._hR.rotation.set(0, 0, lz);
    this._hBar.position.set(x, y + 0.82, -0.40);
    this._hBar.rotation.set(0, 0, lz);

    this._eyeL.position.set(x - 0.16, y + 0.42, -0.39);
    this._eyeR.position.set(x + 0.16, y + 0.42, -0.39);
    this._pupilL.position.set(x - 0.16, y + 0.42, -0.45);
    this._pupilR.position.set(x + 0.16, y + 0.42, -0.45);
    for (const m of [this._eyeL, this._eyeR, this._pupilL, this._pupilR])
      m.rotation.set(0, 0, lz);
  }

  update(pPos, lean, ps) {
    for (const m of this._meshes) m.scaling.setAll(1);
    if (ps.squashT > 0) {
      const p = Math.max(0, ps.squashT / 0.20);
      const sy = 1 - p * 0.32, sx = 1 + p * 0.20;
      for (const m of this._meshes) m.scaling.set(sx, sy, sx);
    }
    const bob = ps.jumping ? 0 : Math.sin(ps.bobT * 9) * 0.022;
    this._place(pPos, lean, bob);
  }

  reset(pPos) {
    for (const m of this._meshes) { m.scaling.setAll(1); m.isVisible = true; }
    this._place(pPos, { z: 0 }, 0);
  }

  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.48, z: 0 }; }
}
