// ================================================================
//  DASH BLITZ — World: Market Rush environment
// ================================================================
import { TILE_D, TILE_N, WRAP_Q, DESPAWN_Z, TRACK_W } from './config.js';

// ---- Floor tile constants ------------------------------------
const FLOOR_COLS  = 8;
const COL_W       = TRACK_W / FLOOR_COLS;   // 0.9

// ---- Stall constants -----------------------------------------
const STALL_N     = 3;                       // per side
const STALL_GAP   = WRAP_Q / STALL_N;        // ~42.7

// ---- Bulb / light constants ----------------------------------
const BULB_N      = 8;
const BULB_GAP    = WRAP_Q / BULB_N;         // 16

const STALL_X     = TRACK_W / 2 + 1.85;     // 5.45 — stall table center
const SHELF_X     = TRACK_W / 2 + 4.5;      // 8.1  — shelf center

const CANOPY_TYPES = [
  { a: '#cc2200', b: '#f4f4f4' },  // red + white
  { b: '#f4f4f4', a: '#1144cc' },  // blue + white
  { a: '#cc8800', b: '#f4f4f4' },  // amber + white
];

const PRODUCE_COLS = ['#e87520', '#2d7a1a', '#cc1100', '#f0d020'];
const PRODUCT_COLS = ['#cc2200', '#1a55cc', '#22aa22', '#cc8800', '#9933cc', '#ee9900'];

export class World {
  constructor(scene) {
    this._scene   = scene;
    this._floor   = [];    // TILE_N TransformNodes
    this._stallsL = [];
    this._stallsR = [];
    this._lights  = [];    // 3 scrolling PointLights
    this._bulbs   = [];    // { bulb, cord } pairs
    this._mc      = {};    // material cache

    this._initFog();
    this._initLighting();
    this._initFloor();
    this._initEdgeStripes();
    this._initCeiling();
    this._initStalls();
    this._initShelves();
    this._initBulbs();
    this._initDust();
  }

  // ---- Public API ------------------------------------------

  update(dt, gameSpeed) {
    const dz = gameSpeed * dt;

    // Floor rows
    for (const node of this._floor) {
      node.position.z -= dz;
      if (node.position.z < DESPAWN_Z) node.position.z += WRAP_Q;
    }

    // Stalls
    for (const s of this._stallsL) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += WRAP_Q;
    }
    for (const s of this._stallsR) {
      s.position.z -= dz;
      if (s.position.z < DESPAWN_Z) s.position.z += WRAP_Q;
    }

    // Scrolling point lights + bulbs
    for (let i = 0; i < this._bulbs.length; i++) {
      const b = this._bulbs[i];
      b.bulb.position.z -= dz;
      b.cord.position.z -= dz;
      if (b.bulb.position.z < DESPAWN_Z) {
        b.bulb.position.z += WRAP_Q;
        b.cord.position.z += WRAP_Q;
      }
      // Paired light follows bulb
      if (this._lights[i]) {
        this._lights[i].position.z = b.bulb.position.z;
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
    for (let i = 0; i < this._bulbs.length; i++) {
      const z = i * BULB_GAP;
      this._bulbs[i].bulb.position.z = z;
      this._bulbs[i].cord.position.z = z;
      if (this._lights[i]) this._lights[i].position.z = z;
    }
  }

  dispose() {
    for (const node of this._floor) node.dispose();
    for (const s of [...this._stallsL, ...this._stallsR]) s.dispose();
    for (const b of this._bulbs) { b.bulb.dispose(); b.cord.dispose(); }
    for (const l of this._lights) l.dispose();
  }

  // ---- Private setup ---------------------------------------

  _initFog() {
    const s = this._scene;
    s.fogMode    = BABYLON.Scene.FOGMODE_EXP2;
    s.fogColor   = new BABYLON.Color3(0.165, 0.122, 0.063);
    s.fogDensity = 0.04;
  }

  _initLighting() {
    const s = this._scene;

    // Warm hemispherical — replaces cold ambient
    const hemi = s.getLightByName('hemi');
    if (hemi) {
      hemi.diffuse     = BABYLON.Color3.FromHexString('#ffe4b0');
      hemi.groundColor = new BABYLON.Color3(0.545, 0.420, 0.078);
      hemi.intensity   = 0.6;
    }

    // Warmer directional
    const sun = s.getLightByName('sun');
    if (sun) {
      sun.diffuse   = new BABYLON.Color3(1.0, 0.941, 0.816);
      sun.intensity = 0.9;
    }

    // Dim rim light — was too industrial-bright
    const rim = s.getLightByName('rim');
    if (rim) rim.intensity = 0.5;

    // 3 scrolling warm market lamps (paired with hanging bulbs below)
    const lightZ = [0, -10, -20];
    for (let i = 0; i < 3; i++) {
      const pl = new BABYLON.PointLight('mkLamp' + i,
        new BABYLON.Vector3(0, 4.5, lightZ[i]), s);
      pl.diffuse   = BABYLON.Color3.FromHexString('#ffcc77');
      pl.intensity = 1.2;
      pl.range     = 12;
      this._lights.push(pl);
    }
  }

  _initFloor() {
    const s    = this._scene;
    const matA = this._pbr('#f5e8d0', 0.8, 0);
    const matB = this._pbr('#e8d4b8', 0.8, 0);

    for (let row = 0; row < TILE_N; row++) {
      const node = new BABYLON.TransformNode('fRow' + row, s);
      node.position.z = row * TILE_D;

      for (let col = 0; col < FLOOR_COLS; col++) {
        const x    = -TRACK_W / 2 + COL_W * (col + 0.5);
        const tile = this._box('ft' + row + '_' + col, COL_W - 0.02, 0.04, TILE_D - 0.02);
        tile.material = ((col + row) % 2 === 0) ? matA : matB;
        tile.position.set(x, 0.001, 0);
        tile.parent = node;
      }
      this._floor.push(node);
    }
  }

  _initEdgeStripes() {
    const matY  = this._std('#d4b800', '#887700');
    const halfW = TRACK_W / 2;
    const len   = WRAP_Q + 60;
    const zc    = WRAP_Q / 2 - 5;

    const sL = this._box('edgeYL', 0.14, 0.07, len);
    sL.material = matY; sL.position.set(-halfW + 0.10, 0.045, zc);

    const sR = this._box('edgeYR', 0.14, 0.07, len);
    sR.material = matY; sR.position.set(halfW - 0.10, 0.045, zc);
  }

  _initCeiling() {
    const len = WRAP_Q + 80;
    const zc  = WRAP_Q / 2 - 5;

    const ceil = this._box('ceiling', 28, 0.22, len);
    ceil.material = this._std('#1a1208', '#0d0a06');
    ceil.position.set(0, 5.62, zc);

    // Longitudinal beams
    const beamMat = this._std('#110f08');
    for (let b = 0; b < 4; b++) {
      const bm = this._box('cBeam' + b, 0.18, 0.14, len);
      bm.material = beamMat;
      bm.position.set(-5.4 + b * 3.6, 5.5, zc);
    }
  }

  _initBulbs() {
    const matBulb = this._std('#fff8e8', '#ddbb66');
    const matCord = this._std('#222222');

    // Only 3 bulbs match the 3 scrolling lights; add 5 more visual-only bulbs
    for (let i = 0; i < BULB_N; i++) {
      const z = i * BULB_GAP;

      const bulb = this._sph('bulb' + i, 0.24);
      bulb.material = matBulb;
      bulb.position.set(0, 4.8, z);

      const cord = this._cyl('cord' + i, 0.022, 0.8);
      cord.material = matCord;
      cord.position.set(0, 5.2, z);

      this._bulbs.push({ bulb, cord });

      // Extend lights array to cover all 8 bulbs (reuse first 3 lights cyclically)
      if (i >= 3) this._lights.push(null);  // visual-only bulbs have no paired light
    }
  }

  _makeStall(id, side) {
    const s       = this._scene;
    const typeIdx = id % CANOPY_TYPES.length;
    const ctype   = CANOPY_TYPES[typeIdx];
    const xSign   = side === 'L' ? -1 : 1;
    const xBase   = STALL_X * xSign;

    const node = new BABYLON.TransformNode('stall' + side + id, s);

    // Table
    const tbl = this._box('tbl' + side + id, 2.5, 0.7, 2.0);
    tbl.material = this._pbr('#8B6914', 0.8, 0.04);
    tbl.position.set(xBase, 0.35, 0);
    tbl.parent = node;

    // Support poles
    for (let p = 0; p < 2; p++) {
      const px   = xBase + (p === 0 ? -1.1 : 1.1) * xSign;
      const pole = this._cyl('pole' + side + id + p, 0.08, 2.2);
      pole.material = this._std('#2e2e2e');
      pole.position.set(px, 1.1, 0);
      pole.parent = node;
    }

    // Canopy — 4 alternating stripes
    const sc = [ctype.a, ctype.b, ctype.a, ctype.b];
    for (let st = 0; st < 4; st++) {
      const stripe = this._box('cSt' + side + id + st, 0.625, 0.07, 1.35);
      stripe.material = this._std(sc[st], sc[st]);   // emissive = diffuse for glow
      stripe.position.set(xBase + (-0.9375 + st * 0.625) * xSign, 2.4, 0);
      stripe.parent = node;
    }

    // Produce (3 items on table)
    const produceXs = [xBase - 0.75 * xSign, xBase, xBase + 0.75 * xSign];
    for (let p = 0; p < 3; p++) {
      const ci   = (id * 3 + p) % PRODUCE_COLS.length;
      const r    = 0.16 + (p % 2) * 0.04;
      const prod = this._sph('prod' + side + id + p, r * 2);
      prod.material = this._std(PRODUCE_COLS[ci]);
      prod.position.set(produceXs[p], 0.7 + r, 0.2);
      prod.parent = node;
    }

    return node;
  }

  _initStalls() {
    for (let i = 0; i < STALL_N; i++) {
      const zL = i * STALL_GAP + 4;
      const zR = i * STALL_GAP + STALL_GAP * 0.5 + 4;   // stagger L/R

      const sL = this._makeStall(i, 'L');
      sL.position.z = zL;
      this._stallsL.push(sL);

      const sR = this._makeStall(i + STALL_N, 'R');
      sR.position.z = zR;
      this._stallsR.push(sR);
    }
  }

  _initShelves() {
    const LEN    = WRAP_Q + 80;
    const ZC     = WRAP_Q / 2 - 5;
    const matSh  = this._std('#d6cdb5');
    const matDiv = this._std('#b8a888');

    for (let side = 0; side < 2; side++) {
      const sx = side === 0 ? -SHELF_X : SHELF_X;
      const fx = sx + (side === 0 ? 0.24 : -0.24);  // product face X

      // Shelf back panel
      const sh = this._box('sh' + side, 0.45, 3.6, LEN);
      sh.material = matSh;
      sh.position.set(sx, 1.8, ZC);

      // 3 horizontal shelf planks
      for (let sp = 0; sp < 3; sp++) {
        const div = this._box('shP' + side + sp, 0.47, 0.07, LEN);
        div.material = matDiv;
        div.position.set(sx, 0.7 + sp * 0.95, ZC);
      }

      // Product boxes along shelves (~80 per side)
      for (let k = 0; k < 80; k++) {
        const z   = (k / 80) * LEN - LEN / 2 + ZC;
        const row = k % 3;
        const y   = 0.82 + row * 0.95;
        const ci  = (k * 7 + side * 3) % PRODUCT_COLS.length;

        const prod = this._box('pr' + side + '_' + k, 0.20, 0.30, 0.18);
        prod.material = this._std(PRODUCT_COLS[ci]);
        prod.position.set(fx, y, z);
      }
    }
  }

  _initDust() {
    const s   = this._scene;
    const tex = new BABYLON.DynamicTexture('dustTex', { width: 32, height: 32 }, s, false);
    const ctx = tex.getContext();
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    grd.addColorStop(0, 'rgba(240,225,200,0.6)');
    grd.addColorStop(1, 'rgba(240,225,200,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    tex.update();

    const ps = new BABYLON.ParticleSystem('dust', 30, s);
    ps.particleTexture = tex;
    ps.emitter         = new BABYLON.Vector3(0, 0.3, 15);

    ps.createBoxEmitter(
      new BABYLON.Vector3(-0.02, 0.02, 0),
      new BABYLON.Vector3(0.02, 0.06, 0),
      new BABYLON.Vector3(-3.5, 0, -15),
      new BABYLON.Vector3(3.5, 0.5, 20)
    );

    ps.minSize      = 0.05; ps.maxSize      = 0.10;
    ps.minLifeTime  = 8;    ps.maxLifeTime  = 14;
    ps.emitRate     = 3;
    ps.minEmitPower = 0.01; ps.maxEmitPower = 0.04;
    ps.updateSpeed  = 0.01;
    ps.color1       = new BABYLON.Color4(0.94, 0.88, 0.78, 0.07);
    ps.color2       = new BABYLON.Color4(0.94, 0.88, 0.78, 0.04);
    ps.colorDead    = new BABYLON.Color4(0.94, 0.88, 0.78, 0);
    ps.blendMode    = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    ps.gravity      = new BABYLON.Vector3(0, 0.008, 0);
    ps.start();
  }

  // ---- Material cache helpers ------------------------------------

  _std(hex, emHex) {
    const k = hex + (emHex || '');
    if (this._mc[k]) return this._mc[k];
    const m = new BABYLON.StandardMaterial('sm_' + k, this._scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(hex);
    if (emHex) m.emissiveColor = BABYLON.Color3.FromHexString(emHex);
    return (this._mc[k] = m);
  }

  _pbr(hex, roughness, metallic) {
    const k = 'p' + hex + roughness + metallic;
    if (this._mc[k]) return this._mc[k];
    const m = new BABYLON.PBRMetallicRoughnessMaterial('pbr_' + k, this._scene);
    m.baseColor = BABYLON.Color3.FromHexString(hex);
    m.roughness = roughness;
    m.metallic  = metallic;
    return (this._mc[k] = m);
  }

  // ---- Mesh factory helpers ---------------------------------------

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
