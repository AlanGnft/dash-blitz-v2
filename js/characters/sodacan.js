// ================================================================
//  DASH BLITZ — Soda Can character
// ================================================================
import Character from './base.js';

export default class SodaCan extends Character {
  constructor(scene) {
    super(scene);

    const matRed = new BABYLON.PBRMaterial('canRed', scene);
    matRed.albedoColor          = new BABYLON.Color3(0.88, 0.10, 0.06);
    matRed.metallic             = 0.75;
    matRed.roughness            = 0.22;
    matRed.environmentIntensity = 0.35;

    const matSilver = new BABYLON.PBRMaterial('canSilver', scene);
    matSilver.albedoColor          = new BABYLON.Color3(0.78, 0.78, 0.82);
    matSilver.metallic             = 0.88;
    matSilver.roughness            = 0.18;
    matSilver.environmentIntensity = 0.35;

    const matEyeW = new BABYLON.StandardMaterial('canEyeW', scene);
    matEyeW.diffuseColor  = new BABYLON.Color3(0.95, 0.95, 0.95);
    matEyeW.emissiveColor = new BABYLON.Color3(0.18, 0.18, 0.18);

    const matEyeP = new BABYLON.StandardMaterial('canEyeP', scene);
    matEyeP.diffuseColor  = new BABYLON.Color3(0.06, 0.06, 0.06);
    matEyeP.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);

    this._body   = BABYLON.MeshBuilder.CreateCylinder('canBody',   { diameter: 0.90, height: 1.10, tessellation: 20 }, scene);
    this._rimT   = BABYLON.MeshBuilder.CreateCylinder('canRimT',   { diameter: 0.82, height: 0.06, tessellation: 20 }, scene);
    this._rimB   = BABYLON.MeshBuilder.CreateCylinder('canRimB',   { diameter: 0.82, height: 0.06, tessellation: 20 }, scene);
    this._tab    = BABYLON.MeshBuilder.CreateBox('canTab',         { width: 0.18, height: 0.04, depth: 0.08 }, scene);
    this._eyeL   = BABYLON.MeshBuilder.CreateSphere('canEyeL',    { diameter: 0.18, segments: 8 }, scene);
    this._eyeR   = BABYLON.MeshBuilder.CreateSphere('canEyeR',    { diameter: 0.18, segments: 8 }, scene);
    this._pupilL = BABYLON.MeshBuilder.CreateSphere('canPupL',    { diameter: 0.09, segments: 6 }, scene);
    this._pupilR = BABYLON.MeshBuilder.CreateSphere('canPupR',    { diameter: 0.09, segments: 6 }, scene);

    this._body.material   = matRed;
    this._rimT.material   = matSilver;
    this._rimB.material   = matSilver;
    this._tab.material    = matSilver;
    this._eyeL.material   = matEyeW;
    this._eyeR.material   = matEyeW;
    this._pupilL.material = matEyeP;
    this._pupilR.material = matEyeP;

    this._meshes = [this._body, this._rimT, this._rimB, this._tab, this._eyeL, this._eyeR, this._pupilL, this._pupilR];
  }

  _place(pPos, lean, bob) {
    const x = pPos.x, y = pPos.y;
    const lz = lean.z * 0.8; // softer lean for a can

    this._body.position.set(x, y + 0.55 + bob, 0);
    this._body.rotation.set(0, 0, lz);

    this._rimT.position.set(x, y + 1.10 + bob, 0);
    this._rimT.rotation.set(0, 0, lz);

    this._rimB.position.set(x, y + 0.03 + bob, 0);
    this._rimB.rotation.set(0, 0, lz);

    this._tab.position.set(x, y + 1.14 + bob, -0.14);
    this._tab.rotation.set(0, 0, lz);

    this._eyeL.position.set(x - 0.16, y + 0.60 + bob, -0.43);
    this._eyeR.position.set(x + 0.16, y + 0.60 + bob, -0.43);
    this._pupilL.position.set(x - 0.16, y + 0.60 + bob, -0.48);
    this._pupilR.position.set(x + 0.16, y + 0.60 + bob, -0.48);

    for (const m of [this._eyeL, this._eyeR, this._pupilL, this._pupilR])
      m.rotation.set(0, 0, lz);
  }

  update(pPos, lean, ps) {
    const bob = ps.jumping ? 0 : Math.sin(ps.bobT * 10) * 0.018;
    if (ps.squashT > 0) {
      const p = Math.max(0, ps.squashT / 0.20);
      const sy = 1 - p * 0.28, sx = 1 + p * 0.18;
      for (const m of this._meshes) m.scaling.set(sx, sy, sx);
    } else {
      for (const m of this._meshes) m.scaling.setAll(1);
    }
    this._place(pPos, lean, bob);
  }

  reset(pPos) {
    for (const m of this._meshes) { m.scaling.setAll(1); m.isVisible = true; }
    this._place(pPos, { z: 0 }, 0);
  }

  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.60, z: 0 }; }
}
