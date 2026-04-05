// ================================================================
//  DASH BLITZ — Donut character
// ================================================================
import Character from './base.js';

const SPRINKLE_COLORS = [
  [0.9, 0.1, 0.2], [0.1, 0.6, 0.9], [0.1, 0.85, 0.3],
  [0.95, 0.75, 0.1], [0.7, 0.1, 0.9], [0.95, 0.5, 0.1], [0.1, 0.9, 0.8],
];
const SPRINKLE_POS = [
  [-0.18, 0.08, -0.06], [0.16, 0.10, -0.10], [0.0, 0.04, -0.18],
  [-0.12, 0.12, 0.08], [0.20, 0.08, 0.04], [-0.06, 0.06, 0.16], [0.10, 0.12, -0.02],
];

export default class Donut extends Character {
  constructor(scene) {
    super(scene);

    const matDough = new BABYLON.PBRMaterial('donutDough', scene);
    matDough.albedoColor = new BABYLON.Color3(0.72, 0.44, 0.12);
    matDough.metallic    = 0.05; matDough.roughness = 0.75;

    const matFrost = new BABYLON.PBRMaterial('donutFrost', scene);
    matFrost.albedoColor = new BABYLON.Color3(0.95, 0.55, 0.65);
    matFrost.metallic    = 0.10; matFrost.roughness = 0.45;

    const matEyeW = new BABYLON.StandardMaterial('doEyeW', scene);
    matEyeW.diffuseColor  = new BABYLON.Color3(0.95, 0.95, 0.95);
    matEyeW.emissiveColor = new BABYLON.Color3(0.18, 0.18, 0.18);

    const matEyeP = new BABYLON.StandardMaterial('doEyeP', scene);
    matEyeP.diffuseColor  = new BABYLON.Color3(0.06, 0.06, 0.06);
    matEyeP.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);

    this._body   = BABYLON.MeshBuilder.CreateTorus('donutBody',   { diameter: 0.92, thickness: 0.30, tessellation: 32 }, scene);
    this._frost  = BABYLON.MeshBuilder.CreateSphere('donutFrost', { diameter: 0.62, segments: 12 }, scene);
    this._eyeL   = BABYLON.MeshBuilder.CreateSphere('doEyeL',    { diameter: 0.16, segments: 8 }, scene);
    this._eyeR   = BABYLON.MeshBuilder.CreateSphere('doEyeR',    { diameter: 0.16, segments: 8 }, scene);
    this._pupilL = BABYLON.MeshBuilder.CreateSphere('doPupL',    { diameter: 0.08, segments: 6 }, scene);
    this._pupilR = BABYLON.MeshBuilder.CreateSphere('doPupR',    { diameter: 0.08, segments: 6 }, scene);

    this._body.material  = matDough;
    this._frost.material = matFrost;
    this._frost.scaling.set(1, 0.22, 1);
    this._eyeL.material  = matEyeW; this._eyeR.material  = matEyeW;
    this._pupilL.material= matEyeP; this._pupilR.material= matEyeP;

    this._sprinkles = SPRINKLE_POS.map((pos, i) => {
      const mat = new BABYLON.StandardMaterial('spr' + i, scene);
      const c = SPRINKLE_COLORS[i];
      mat.diffuseColor  = new BABYLON.Color3(c[0], c[1], c[2]);
      mat.emissiveColor = new BABYLON.Color3(c[0]*0.4, c[1]*0.4, c[2]*0.4);
      const s = BABYLON.MeshBuilder.CreateBox('spr' + i, { width: 0.06, height: 0.04, depth: 0.04 }, scene);
      s.material = mat;
      s.rotation.z = (Math.random() - 0.5) * 1.2;
      return s;
    });

    this._meshes = [this._body, this._frost, this._eyeL, this._eyeR, this._pupilL, this._pupilR, ...this._sprinkles];
  }

  _place(pPos, lean, bob) {
    const x = pPos.x, y = pPos.y + 0.50 + bob;
    const lz = lean.z;

    this._body.position.set(x, y, 0);
    this._body.rotation.set(0, 0, lz);

    this._frost.position.set(x, y + 0.10, 0);
    this._frost.rotation.set(0, 0, lz);

    this._eyeL.position.set(x - 0.20, y - 0.04, -0.38);
    this._eyeR.position.set(x + 0.20, y - 0.04, -0.38);
    this._pupilL.position.set(x - 0.20, y - 0.04, -0.44);
    this._pupilR.position.set(x + 0.20, y - 0.04, -0.44);
    for (const m of [this._eyeL, this._eyeR, this._pupilL, this._pupilR])
      m.rotation.set(0, 0, lz);

    SPRINKLE_POS.forEach((sp, i) => {
      this._sprinkles[i].position.set(x + sp[0], y + sp[1] + 0.10, sp[2]);
    });
  }

  update(pPos, lean, ps) {
    const bob = ps.jumping ? 0 : Math.sin(ps.bobT * 8) * 0.028;
    for (const m of this._meshes) m.scaling.setAll(1);
    this._place(pPos, lean, bob);
  }

  reset(pPos) {
    for (const m of this._meshes) { m.scaling.setAll(1); m.isVisible = true; }
    this._place(pPos, { z: 0 }, 0);
  }

  getWorldPos(pPos) { return { x: pPos.x, y: pPos.y + 0.50, z: 0 }; }
}
