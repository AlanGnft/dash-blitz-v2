// ================================================================
//  DASH BLITZ — World: Market Rush (simplified mobile-safe rewrite)
// ================================================================
import { TRACK_W, DESPAWN_Z } from './config.js';

const TRACK_HALF_W = TRACK_W / 2;       // 3.6
const STALL_X      = TRACK_HALF_W + 1.8; // 5.4
const STALL_N      = 3;                  // per side
const STALL_GAP    = 18;                 // Z units between stalls
const STALL_WRAP   = STALL_N * STALL_GAP; // 54 — wrap cycle

export class World {
  constructor(scene) {
    this._scene   = scene;
    this._stallsL = [];
    this._stallsR = [];

    this._restyle();
    this._initFog();
    this._initLight();
    this._initStalls();
  }

  // ---- Public API --------------------------------------------------

  update(dt, speed) {
    const dz = speed * dt;
    for (const s of this._stallsL) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += STALL_WRAP;
    }
    for (const s of this._stallsR) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += STALL_WRAP;
    }
  }

  reset() {
    for (let i = 0; i < STALL_N; i++) {
      this._stallsL[i].position.z = i * STALL_GAP + 4;
      this._stallsR[i].position.z = i * STALL_GAP + STALL_GAP * 0.5 + 4;
    }
  }

  dispose() {
    for (const s of [...this._stallsL, ...this._stallsR]) s.dispose();
  }

  // ---- Private setup -----------------------------------------------

  _restyle() {
    // Change existing track tiles (gt0–gt15) to warm cream
    const mat = new BABYLON.StandardMaterial('floorCream', this._scene);
    mat.diffuseColor  = new BABYLON.Color3(0.910, 0.835, 0.690); // #e8d5b0
    mat.specularColor = new BABYLON.Color3(0.03, 0.02, 0.01);

    for (let i = 0; i < 16; i++) {
      const tile = this._scene.getMeshByName('gt' + i);
      if (tile) tile.material = mat;
    }
  }

  _initFog() {
    const s = this._scene;
    s.fogMode  = BABYLON.Scene.FOGMODE_LINEAR;
    s.fogStart = 18;
    s.fogEnd   = 35;
    s.fogColor = new BABYLON.Color3(0.08, 0.05, 0.02);
  }

  _initLight() {
    const h = new BABYLON.HemisphericLight('mktAmb',
      new BABYLON.Vector3(0, 1, 0), this._scene);
    h.intensity   = 0.3;
    h.diffuse     = new BABYLON.Color3(1.0, 0.85, 0.60);
    h.groundColor = new BABYLON.Color3(0.25, 0.18, 0.05);
  }

  _initStalls() {
    const matTable = new BABYLON.StandardMaterial('stallTable', this._scene);
    matTable.diffuseColor = new BABYLON.Color3(0.545, 0.369, 0.235); // #8B5E3C

    for (let i = 0; i < STALL_N; i++) {
      const canopyL = i % 2 === 0 ? '#cc2222' : '#2244cc';
      const canopyR = i % 2 === 0 ? '#2244cc' : '#cc2222';

      const nodeL = new BABYLON.TransformNode('stallL' + i, this._scene);
      nodeL.position.set(-STALL_X, 0, i * STALL_GAP + 4);
      this._buildStall(nodeL, matTable, canopyL);
      this._stallsL.push(nodeL);

      const nodeR = new BABYLON.TransformNode('stallR' + i, this._scene);
      nodeR.position.set(STALL_X, 0, i * STALL_GAP + STALL_GAP * 0.5 + 4);
      this._buildStall(nodeR, matTable, canopyR);
      this._stallsR.push(nodeR);
    }
  }

  _buildStall(node, matTable, canopyHex) {
    // Table top
    const tbl = BABYLON.MeshBuilder.CreateBox(node.name + '_tbl',
      { width: 2.5, height: 0.15, depth: 1.2 }, this._scene);
    tbl.material  = matTable;
    tbl.position.set(0, 0.4, 0);
    tbl.parent    = node;
    tbl.isPickable = false;

    // Canopy
    const cc = BABYLON.Color3.FromHexString(canopyHex);
    const matCan = new BABYLON.StandardMaterial(node.name + '_can', this._scene);
    matCan.diffuseColor  = cc;
    matCan.emissiveColor = cc.scale(0.5);

    const can = BABYLON.MeshBuilder.CreateBox(node.name + '_can_m',
      { width: 3.0, height: 0.1, depth: 1.5 }, this._scene);
    can.material  = matCan;
    can.position.set(0, 2.2, 0);
    can.parent    = node;
    can.isPickable = false;
  }
}
