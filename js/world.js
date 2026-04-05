// ================================================================
//  DASH BLITZ — World: Market Rush environment
// ================================================================
import { TILE_D, TILE_N, WRAP_Q, DESPAWN_Z, TRACK_W } from './config.js';

// ---- Floor tile constants ------------------------------------
const FLOOR_COLS = 8;
const COL_W      = TRACK_W / FLOOR_COLS;   // 0.9

// ---- Stall constants -----------------------------------------
const STALL_N   = 3;                        // per side
const STALL_GAP = WRAP_Q / STALL_N;        // ~42.7
const STALL_X   = TRACK_W / 2 + 2.6;      // 6.2 — stall table center X
const SHELF_X   = TRACK_W / 2 + 4.2;      // 7.8 — shelf center X

// ---- Light/bulb constants ------------------------------------
const LAMP_N   = 4;
const LAMP_GAP = WRAP_Q / LAMP_N;          // 32
const BULB_N   = 8;
const BULB_GAP = WRAP_Q / BULB_N;         // 16

const CANOPY_TYPES = [
  ['#cc2200', '#f4f4f4'],
  ['#1144cc', '#f4f4f4'],
  ['#cc8800', '#f4f4f4'],
];
const PRODUCE_COLS = ['#e87520', '#2d7a1a', '#cc1100', '#f0d020'];
const PRODUCT_COLS = ['#cc2200', '#1a55cc', '#22aa22', '#cc8800', '#9933cc', '#ee9900'];

export class World {
  constructor(scene) {
    console.log('[World] init start');
    this._scene  = scene;
    this._floor  = [];
    this._stallsL = [];
    this._stallsR = [];
    this._lamps  = [];
    this._bulbs  = [];
    this._mc     = {};

    this._initFog();
    console.log('[World] fog set');
    this._initMarketLights();
    console.log('[World] lights added');
    this._initFloor();
    console.log('[World] floor created');
    this._initEdgeStripes();
    this._initCeiling();
    this._initBulbs();
    console.log('[World] ceiling + bulbs created');
    this._initStalls();
    console.log('[World] stalls created — L:', this._stallsL.length, 'R:', this._stallsR.length);
    this._initShelves();
    console.log('[World] shelves created');
    this._initDust();
    console.log('[World] init complete');
  }

  // ---- Public API ------------------------------------------

  update(dt, gameSpeed) {
    const dz = gameSpeed * dt;

    // Floor rows scroll
    for (const node of this._floor) {
      node.position.z -= dz;
      if (node.position.z < DESPAWN_Z) node.position.z += WRAP_Q;
    }

    // Stalls scroll
    for (const s of this._stallsL) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += WRAP_Q;
    }
    for (const s of this._stallsR) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += WRAP_Q;
    }

    // Market lamps scroll
    for (const l of this._lamps) {
      l.position.z -= dz;
      if (l.position.z < DESPAWN_Z) l.position.z += WRAP_Q;
    }

    // Visual bulbs scroll
    for (const b of this._bulbs) {
      b.bulb.position.z -= dz;
      b.cord.position.z -= dz;
      if (b.bulb.position.z < DESPAWN_Z) {
        b.bulb.position.z += WRAP_Q;
        b.cord.position.z += WRAP_Q;
      }
    }
  }

  reset() {
    for (let i = 0; i < this._floor.length; i++) {
      this._floor[i].position.z = i * TILE_D;
    }
    for (let i = 0; i < STALL_N; i++) {
      this._stallsL[i].position.z = i * STALL_GAP + 4;
      this._stallsR[i].position.z = i * STALL_GAP + STALL_GAP * 0.5 + 4;
    }
    for (let i = 0; i < LAMP_N; i++) {
      this._lamps[i].position.z = i * LAMP_GAP + 4;
    }
    for (let i = 0; i < BULB_N; i++) {
      const z = i * BULB_GAP + 4;
      this._bulbs[i].bulb.position.z = z;
      this._bulbs[i].cord.position.z = z;
    }
  }

  dispose() {
    for (const node of this._floor) node.dispose();
    for (const s of [...this._stallsL, ...this._stallsR]) s.dispose();
    for (const l of this._lamps) l.dispose();
    for (const b of this._bulbs) { b.bulb.dispose(); b.cord.dispose(); }
  }

  // ---- Private setup ---------------------------------------

  _initFog() {
    const s = this._scene;
    // Match fog color to clear color so there's no seam at draw distance
    s.fogMode    = BABYLON.Scene.FOGMODE_EXP2;
    s.fogColor   = new BABYLON.Color3(0.08, 0.06, 0.04);   // warm dark brown
    s.fogDensity = 0.01;                                    // was 0.04 — too dense
    s.clearColor = new BABYLON.Color4(0.08, 0.06, 0.04, 1);
  }

  _initMarketLights() {
    // Only ADD warm market lights — do NOT touch existing hemi/sun/rim
    for (let i = 0; i < LAMP_N; i++) {
      const pl = new BABYLON.PointLight('mkLamp' + i,
        new BABYLON.Vector3(0, 4.2, i * LAMP_GAP + 4), this._scene);
      pl.diffuse   = new BABYLON.Color3(1.0, 0.80, 0.47);
      pl.specular  = new BABYLON.Color3(0.3, 0.2, 0.0);
      pl.intensity = 1.4;
      pl.range     = 18;
      this._lamps.push(pl);
    }
  }

  _initFloor() {
    // Use StandardMaterial (not PBR) for mobile WebGL1 compatibility
    const matA = new BABYLON.StandardMaterial('floorA', this._scene);
    matA.diffuseColor  = new BABYLON.Color3(0.831, 0.722, 0.588); // #d4b896
    matA.specularColor = new BABYLON.Color3(0.04, 0.04, 0.02);

    const matB = new BABYLON.StandardMaterial('floorB', this._scene);
    matB.diffuseColor  = new BABYLON.Color3(0.769, 0.659, 0.510); // #c4a882
    matB.specularColor = new BABYLON.Color3(0.04, 0.04, 0.02);

    for (let row = 0; row < TILE_N; row++) {
      const node = new BABYLON.TransformNode('fRow' + row, this._scene);
      node.position.z = row * TILE_D;

      for (let col = 0; col < FLOOR_COLS; col++) {
        const x    = -TRACK_W / 2 + COL_W * (col + 0.5);
        const tile = this._box('ft' + row + '_' + col, COL_W - 0.03, 0.06, TILE_D - 0.03);
        tile.material = ((col + row) % 2 === 0) ? matA : matB;
        // Y=0.10 — sits clearly above existing dark track tiles (top surface at Y=0.0)
        tile.position.set(x, 0.10, 0);
        tile.parent = node;
      }
      this._floor.push(node);
    }
  }

  _initEdgeStripes() {
    const mat = new BABYLON.StandardMaterial('edgeStripe', this._scene);
    mat.diffuseColor  = new BABYLON.Color3(0.83, 0.72, 0.0);
    mat.emissiveColor = new BABYLON.Color3(0.28, 0.22, 0.0);

    const halfW = TRACK_W / 2;
    const len   = WRAP_Q + 60;
    const zc    = WRAP_Q / 2 - 5;

    const sL = this._box('edgeYL', 0.14, 0.06, len);
    sL.material = mat; sL.position.set(-halfW + 0.10, 0.18, zc);

    const sR = this._box('edgeYR', 0.14, 0.06, len);
    sR.material = mat; sR.position.set(halfW - 0.10, 0.18, zc);
  }

  _initCeiling() {
    const len = WRAP_Q + 80;
    const zc  = WRAP_Q / 2 - 5;

    const matCeil = new BABYLON.StandardMaterial('ceil', this._scene);
    matCeil.diffuseColor  = new BABYLON.Color3(0.08, 0.065, 0.05);
    matCeil.emissiveColor = new BABYLON.Color3(0.04, 0.03, 0.02);

    const ceil = this._box('ceiling', 28, 0.24, len);
    ceil.material = matCeil;
    ceil.position.set(0, 5.62, zc);

    const matBeam = new BABYLON.StandardMaterial('beam', this._scene);
    matBeam.diffuseColor = new BABYLON.Color3(0.07, 0.055, 0.04);
    for (let b = 0; b < 4; b++) {
      const bm = this._box('cBeam' + b, 0.18, 0.16, len);
      bm.material = matBeam;
      bm.position.set(-5.4 + b * 3.6, 5.5, zc);
    }
  }

  _initBulbs() {
    const matBulb = new BABYLON.StandardMaterial('bulbMat', this._scene);
    matBulb.diffuseColor  = new BABYLON.Color3(1.0, 0.97, 0.88);
    matBulb.emissiveColor = new BABYLON.Color3(0.7, 0.55, 0.2);

    const matCord = new BABYLON.StandardMaterial('cordMat', this._scene);
    matCord.diffuseColor = new BABYLON.Color3(0.14, 0.14, 0.14);

    for (let i = 0; i < BULB_N; i++) {
      const z = i * BULB_GAP + 4;

      const bulb = this._sph('bulb' + i, 0.24);
      bulb.material = matBulb;
      bulb.position.set(0, 4.8, z);

      const cord = this._cyl('cord' + i, 0.022, 0.8);
      cord.material = matCord;
      cord.position.set(0, 5.2, z);

      this._bulbs.push({ bulb, cord });
    }
  }

  _makeStall(id, side) {
    const typeIdx = id % CANOPY_TYPES.length;
    const colors  = CANOPY_TYPES[typeIdx];
    const xSign   = side === 'L' ? -1 : 1;
    const xBase   = STALL_X * xSign;

    const node = new BABYLON.TransformNode('stall' + side + id, this._scene);

    // Table (wood)
    const matWood = new BABYLON.StandardMaterial('wood' + id, this._scene);
    matWood.diffuseColor = new BABYLON.Color3(0.545, 0.412, 0.078);
    const tbl = this._box('tbl' + side + id, 2.5, 0.7, 2.0);
    tbl.material = matWood;
    tbl.position.set(xBase, 0.1, 0);
    tbl.parent = node;

    // Support poles
    const matPole = new BABYLON.StandardMaterial('pole' + id, this._scene);
    matPole.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.18);
    for (let p = 0; p < 2; p++) {
      const px   = xBase + (p === 0 ? -1.1 : 1.1) * xSign;
      const pole = this._cyl('pole' + side + id + p, 0.08, 2.2);
      pole.material = matPole;
      pole.position.set(px, 1.1, 0);
      pole.parent = node;
    }

    // Canopy — 4 alternating stripes
    for (let st = 0; st < 4; st++) {
      const hex = colors[st % 2];
      const mat = new BABYLON.StandardMaterial('cst' + id + st, this._scene);
      const c   = BABYLON.Color3.FromHexString(hex);
      mat.diffuseColor  = c;
      mat.emissiveColor = c.scale(0.35);
      const stripe = this._box('cSt' + side + id + st, 0.625, 0.07, 1.35);
      stripe.material = mat;
      stripe.position.set(xBase + (-0.9375 + st * 0.625) * xSign, 2.0, 0);
      stripe.parent = node;
    }

    // Produce on table
    const produceXs = [-0.75 * xSign, 0, 0.75 * xSign];
    for (let p = 0; p < 3; p++) {
      const ci  = (id * 3 + p) % PRODUCE_COLS.length;
      const r   = 0.17 + (p % 2) * 0.04;
      const mat = new BABYLON.StandardMaterial('prd' + id + p, this._scene);
      mat.diffuseColor  = BABYLON.Color3.FromHexString(PRODUCE_COLS[ci]);
      const prod = this._sph('prod' + side + id + p, r * 2);
      prod.material = mat;
      prod.position.set(xBase + produceXs[p], 0.7 + r, 0.2);
      prod.parent = node;
    }

    return node;
  }

  _initStalls() {
    for (let i = 0; i < STALL_N; i++) {
      const sL = this._makeStall(i, 'L');
      sL.position.z = i * STALL_GAP + 4;
      this._stallsL.push(sL);

      const sR = this._makeStall(i + STALL_N, 'R');
      sR.position.z = i * STALL_GAP + STALL_GAP * 0.5 + 4;
      this._stallsR.push(sR);
    }
  }

  _initShelves() {
    const LEN = WRAP_Q + 80;
    const ZC  = WRAP_Q / 2 - 5;   // centered at z=59, extends -45 to 163

    const matSh = new BABYLON.StandardMaterial('shelfBack', this._scene);
    matSh.diffuseColor = new BABYLON.Color3(0.84, 0.80, 0.71);

    const matPlk = new BABYLON.StandardMaterial('shelfPlank', this._scene);
    matPlk.diffuseColor = new BABYLON.Color3(0.72, 0.66, 0.55);

    for (let side = 0; side < 2; side++) {
      const sx    = side === 0 ? -SHELF_X : SHELF_X;
      const faceX = sx + (side === 0 ? 0.22 : -0.22);

      // Back panel
      const panel = this._box('sh' + side, 0.44, 3.6, LEN);
      panel.material = matSh;
      panel.position.set(sx, 1.8, ZC);

      // 3 shelf planks
      for (let sp = 0; sp < 3; sp++) {
        const plk = this._box('shPlk' + side + sp, 0.46, 0.07, LEN);
        plk.material = matPlk;
        plk.position.set(sx, 0.7 + sp * 0.95, ZC);
      }

      // Product boxes
      for (let k = 0; k < 80; k++) {
        const z   = (k / 80) * LEN - LEN / 2 + ZC;
        const row = k % 3;
        const y   = 0.82 + row * 0.95;
        const ci  = (k * 7 + side * 3) % PRODUCT_COLS.length;

        const mat = new BABYLON.StandardMaterial('pr' + side + k, this._scene);
        mat.diffuseColor  = BABYLON.Color3.FromHexString(PRODUCT_COLS[ci]);
        mat.emissiveColor = BABYLON.Color3.FromHexString(PRODUCT_COLS[ci]).scale(0.15);

        const prod = this._box('prb' + side + '_' + k, 0.20, 0.30, 0.18);
        prod.material = mat;
        prod.position.set(faceX, y, z);
      }
    }
  }

  _initDust() {
    const s   = this._scene;
    const tex = new BABYLON.DynamicTexture('dustTex', { width: 32, height: 32 }, s, false);
    const ctx = tex.getContext();
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    grd.addColorStop(0, 'rgba(240,225,200,0.55)');
    grd.addColorStop(1, 'rgba(240,225,200,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 32, 32);
    tex.update();

    const ps = new BABYLON.ParticleSystem('dust', 25, s);
    ps.particleTexture = tex;
    ps.emitter         = new BABYLON.Vector3(0, 0.4, 14);
    ps.createBoxEmitter(
      new BABYLON.Vector3(-0.02, 0.02, 0),
      new BABYLON.Vector3(0.02, 0.05, 0),
      new BABYLON.Vector3(-3.2, 0, -12),
      new BABYLON.Vector3(3.2, 0.4, 18)
    );
    ps.minSize      = 0.06; ps.maxSize      = 0.12;
    ps.minLifeTime  = 9;    ps.maxLifeTime  = 15;
    ps.emitRate     = 3;
    ps.minEmitPower = 0.01; ps.maxEmitPower = 0.03;
    ps.updateSpeed  = 0.01;
    ps.color1    = new BABYLON.Color4(0.94, 0.88, 0.78, 0.06);
    ps.color2    = new BABYLON.Color4(0.94, 0.88, 0.78, 0.03);
    ps.colorDead = new BABYLON.Color4(0.94, 0.88, 0.78, 0);
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    ps.gravity   = new BABYLON.Vector3(0, 0.007, 0);
    ps.start();
  }

  // ---- Mesh factory helpers ----------------------------------

  _box(n, w, h, d) {
    const m = BABYLON.MeshBuilder.CreateBox(n,
      { width: w, height: h, depth: d }, this._scene);
    m.isPickable = false;
    return m;
  }

  _sph(n, dia) {
    const m = BABYLON.MeshBuilder.CreateSphere(n,
      { diameter: dia, segments: 6 }, this._scene);
    m.isPickable = false;
    return m;
  }

  _cyl(n, dia, h) {
    const m = BABYLON.MeshBuilder.CreateCylinder(n,
      { diameter: dia, height: h, tessellation: 8 }, this._scene);
    m.isPickable = false;
    return m;
  }
}
