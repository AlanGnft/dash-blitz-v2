// ================================================================
//  DASH BLITZ — Sushi character
// ================================================================
import Character from './base.js';

export default class Sushi extends Character {
  constructor(scene) {
    super(scene);

    const matRice = new BABYLON.PBRMaterial('sushiRice', scene);
    matRice.albedoColor = new BABYLON.Color3(0.92, 0.90, 0.82);
    matRice.metallic    = 0.0; matRice.roughness = 0.82;

    const matNori = new BABYLON.PBRMaterial('sushiNori', scene);
    matNori.albedoColor = new BABYLON.Color3(0.08, 0.10, 0.06);
    matNori.metallic    = 0.0; matNori.roughness = 0.90;

    const matSalmon = new BABYLON.PBRMaterial('sushiSalmon', scene);
    matSalmon.albedoColor = new BABYLON.Color3(0.95, 0.55, 0.45);
    matSalmon.metallic    = 0.05; matSalmon.roughness = 0.62;

    const matEyeW = new BABYLON.StandardMaterial('suEyeW', scene);
    matEyeW.diffuseColor  = new BABYLON.Color3(0.95, 0.95, 0.95);
    matEyeW.emissiveColor = new BABYLON.Color3(0.18, 0.18, 0.18);

    const matEyeP = new BABYLON.StandardMaterial('suEyeP', scene);
    matEyeP.diffuseColor  = new BABYLON.Color3(0.06, 0.06, 0.06);
    matEyeP.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);

    this._base    = BABYLON.MeshBuilder.CreateCylinder('suBase',    { diameter: 0.80, height: 0.35, tessellation: 20 }, scene);
    this._nori    = BABYLON.MeshBuilder.CreateCylinder('suNori',    { diameter: 0.84, height: 0.22, tessellation: 20 }, scene);
    this._topping = BABYLON.MeshBuilder.CreateSphere('suTopping',   { diameter: 0.55, segments: 10 }, scene);
    this._eyeL    = BABYLON.MeshBuilder.CreateSphere('suEyeL',      { diameter: 0.14, segments: 8 }, scene);
    this._eyeR    = BABYLON.MeshBuilder.CreateSphere('suEyeR',      { diameter: 0.14, segments: 8 }, scene);
    this._pupilL  = BABYLON.MeshBuilder.CreateSphere('suPupL',      { diameter: 0.07, segments: 6 }, scene);
    this._pupilR  = BABYLON.MeshBuilder.CreateSphere('suPupR',      { diameter: 0.07, segments: 6 }, scene);

    this._base.material    = matRice;
    this._nori.material    = matNori;
    this._topping.material = matSalmon; this._topping.scaling.set(1, 0.25, 1);
    this._eyeL.material    = matEyeW;   this._eyeR.material  = matEyeW;
    this._pupilL.material  = matEyeP;   this._pupilR.material = matEyeP;

    this._meshes = [this._base, this._nori, this._topping, this._eyeL, this._eyeR, this._pupilL, this._pupilR];
  }

  _place(pPos, lean, bob) {
    const x = pPos.x, y = pPos.y + bob;
    const lz = lean.z * 0.9;

    this._base.position.set(x, y + 0.175, 0);
    this._base.rotation.set(0, 0, lz);

    this._nori.position.set(x, y + 0.175, 0);
    this._nori.rotation.set(0, 0, lz);

    this._topping.position.set(x, y + 0.36, 0);
    this._topping.rotation.set(0, 0, lz);

    this._eyeL.position.set(x - 0.14, y + 0.18, -0.42);
    this._eyeR.position.set(x + 0.14, y + 0.18, -0.42);
    this._pupilL.position.set(x - 0.14, y + 0.18, -0.47);
    this._pupilR.position.set(x + 0.14, y + 0.18, -0.47);
    for (const m of [this._eyeL, this._eyeR, this._pupilL, this._pupilR])
      m.rotation.set(0, 0, lz);
  }

  update(pPos, lean, ps) {
    for (const m of this._meshes) m.scaling.setAll(1);
    const bob = ps.jumping ? 0 : Math.sin(ps.bobT * 9) * 0.015;
    this._place(pPos, lean, bob);
  }

  reset(pPos) {
    for (const m of this._meshes) { m.scaling.setAll(1); m.isVisible = true; }
    this._place(pPos, { z: 0 }, 0);
  }

  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.30, z: 0 }; }
}
