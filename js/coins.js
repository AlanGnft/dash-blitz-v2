// ================================================================
//  DASH BLITZ — Coins: pool, spawn, collect, trail
//
//  Coin geometry: upright disc cylinder (r=0.35, h=0.08) with a
//  smaller contrasting stamp disc on each flat face (emboss effect).
//  Root spins on Y axis → face → edge → face visible while approaching.
// ================================================================
import { LANE_X, GROUND_Y, SPAWN_Z, DESPAWN_Z } from './config.js';
import { obsActive } from './obstacles.js';
import { updateCoinHud } from './hud.js';
import { playCoin } from './audio.js';

const COIN_POOL_SZ = 20;
const COIN_RADIUS  = 0.8;   // collect radius — generous / magnetic

let _matCoin, _matStamp;
let _coinPS, _coinTrailPS;
let _coinTexUrl;

const _pool      = [];
export const coinActive = [];
export let coinCount    = 0;

let _spawnTimer  = 0;
let _streak      = 0;
let _streakTimer = 0;

export function initCoins(scene) {
  // ---- Gold particle canvas texture (shared by burst + trail)
  const ctc  = document.createElement('canvas');
  ctc.width  = ctc.height = 32;
  const cctx = ctc.getContext('2d');
  const cgr  = cctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  cgr.addColorStop(0,   'rgba(255,235,100,1)');
  cgr.addColorStop(0.5, 'rgba(245,184,0,0.7)');
  cgr.addColorStop(1,   'rgba(200,140,0,0)');
  cctx.fillStyle = cgr;
  cctx.beginPath(); cctx.arc(16, 16, 16, 0, Math.PI * 2); cctx.fill();
  _coinTexUrl = ctc.toDataURL();

  // ---- Coin face material — bright gold PBR
  _matCoin = new BABYLON.PBRMaterial('coin', scene);
  _matCoin.albedoColor          = new BABYLON.Color3(1.0, 0.82, 0.10);
  _matCoin.metallic             = 0.85;
  _matCoin.roughness            = 0.18;
  _matCoin.emissiveColor        = new BABYLON.Color3(0.55, 0.38, 0.0);
  _matCoin.environmentIntensity = 0.4;

  // ---- Coin stamp material — darker antique gold for the emboss
  _matStamp = new BABYLON.PBRMaterial('coinStamp', scene);
  _matStamp.albedoColor          = new BABYLON.Color3(0.68, 0.46, 0.0);
  _matStamp.metallic             = 0.9;
  _matStamp.roughness            = 0.12;
  _matStamp.emissiveColor        = new BABYLON.Color3(0.22, 0.14, 0.0);
  _matStamp.environmentIntensity = 0.4;

  // ---- Build pool
  for (let i = 0; i < COIN_POOL_SZ; i++) {
    const root = _buildCoin(i, scene);
    root._active = false;
    root._popT   = 0;
    root._rotY   = Math.random() * Math.PI * 2;
    for (const m of root._meshes) m.isVisible = false;
    _pool.push(root);
  }

  // ---- Burst particle system
  _coinPS = new BABYLON.ParticleSystem('coinPS', 24, scene);
  _coinPS.particleTexture = new BABYLON.Texture(_coinTexUrl, scene);
  _coinPS.emitter         = new BABYLON.Vector3(0, GROUND_Y + 0.5, 0);
  _coinPS.minEmitBox      = new BABYLON.Vector3(-0.1, 0, -0.1);
  _coinPS.maxEmitBox      = new BABYLON.Vector3(0.1,  0,  0.1);
  _coinPS.direction1      = new BABYLON.Vector3(-2, 3, -2);
  _coinPS.direction2      = new BABYLON.Vector3(2,  6,  2);
  _coinPS.minSize         = 0.05; _coinPS.maxSize     = 0.16;
  _coinPS.minLifeTime     = 0.15; _coinPS.maxLifeTime = 0.35;
  _coinPS.minEmitPower    = 2.0;  _coinPS.maxEmitPower = 5.0;
  _coinPS.emitRate        = 0;
  _coinPS.gravity         = new BABYLON.Vector3(0, -12, 0);
  _coinPS.color1          = new BABYLON.Color4(1.0, 0.92, 0.2, 1);
  _coinPS.color2          = new BABYLON.Color4(0.95, 0.72, 0.0, 0.8);
  _coinPS.colorDead       = new BABYLON.Color4(0.8, 0.55, 0.0, 0);
  _coinPS.blendMode       = BABYLON.ParticleSystem.BLENDMODE_ADD;

  // ---- Trail particle system (active when streak >= 3)
  _coinTrailPS = new BABYLON.ParticleSystem('coinTrail', 32, scene);
  _coinTrailPS.particleTexture = new BABYLON.Texture(_coinTexUrl, scene);
  _coinTrailPS.emitter         = new BABYLON.Vector3(0, GROUND_Y, 0);
  _coinTrailPS.minEmitBox      = new BABYLON.Vector3(-0.15, -0.15, -0.15);
  _coinTrailPS.maxEmitBox      = new BABYLON.Vector3(0.15,  0.15,  0.15);
  _coinTrailPS.direction1      = new BABYLON.Vector3(-0.5, 0.2, 1.5);
  _coinTrailPS.direction2      = new BABYLON.Vector3(0.5,  0.8, 3.0);
  _coinTrailPS.minSize         = 0.04; _coinTrailPS.maxSize     = 0.12;
  _coinTrailPS.minLifeTime     = 0.10; _coinTrailPS.maxLifeTime = 0.22;
  _coinTrailPS.minEmitPower    = 0.5;  _coinTrailPS.maxEmitPower = 1.5;
  _coinTrailPS.emitRate        = 0;
  _coinTrailPS.gravity         = new BABYLON.Vector3(0, 1.5, 0);
  _coinTrailPS.color1          = new BABYLON.Color4(1.0, 0.90, 0.2, 0.7);
  _coinTrailPS.color2          = new BABYLON.Color4(0.95, 0.72, 0.0, 0.4);
  _coinTrailPS.colorDead       = new BABYLON.Color4(0.8, 0.55, 0.0, 0);
  _coinTrailPS.blendMode       = BABYLON.ParticleSystem.BLENDMODE_ADD;
  _coinTrailPS.start(); // always running; emitRate controlled each frame
}

// Build one coin: upright disc + stamp emboss on both flat faces.
// The disc cylinder has its axis along Y by default. Rotating the
// root 90° on X makes the axis point along Z, so flat faces face ±Z.
// Spinning the root on Y then produces the face→edge→face animation
// visible to the camera approaching from -Z.
function _buildCoin(idx, scene) {
  const root = new BABYLON.TransformNode('coin_' + idx, scene);

  // Main disc — r=0.35 (diameter=0.70), very thin (h=0.08)
  const disc = BABYLON.MeshBuilder.CreateCylinder('cd_' + idx,
    { diameter: 0.70, height: 0.08, tessellation: 24 }, scene);
  disc.material = _matCoin;
  disc.parent   = root;
  // Rotate the disc 90° on X inside the root so it stands upright.
  // Root Y spin then produces face/edge/face visible from camera (-Z).
  disc.rotation.x = Math.PI / 2;

  // Stamp on front face (z = -0.05 in root space, just proud of disc)
  const sfF = BABYLON.MeshBuilder.CreateCylinder('csf_' + idx,
    { diameter: 0.36, height: 0.03, tessellation: 16 }, scene);
  sfF.material  = _matStamp;
  sfF.rotation.x = Math.PI / 2;
  sfF.position.z = -0.055;
  sfF.parent    = root;

  // Stamp on back face
  const sfB = BABYLON.MeshBuilder.CreateCylinder('csb_' + idx,
    { diameter: 0.36, height: 0.03, tessellation: 16 }, scene);
  sfB.material  = _matStamp;
  sfB.rotation.x = Math.PI / 2;
  sfB.position.z = 0.055;
  sfB.parent    = root;

  root._meshes = [disc, sfF, sfB];
  return root;
}

export function resetCoins() {
  coinCount    = 0;
  _spawnTimer  = 0;
  _streak      = 0;
  _streakTimer = 0;
  _coinTrailPS.emitRate = 0;
  clearCoins();
  updateCoinHud(0);
}

export function clearCoins() {
  while (coinActive.length) _despawn(coinActive[0]);
}

function _spawnOne(laneIdx, zPos) {
  const cx = LANE_X[laneIdx];
  const blocked = obsActive.some(
    o => Math.abs(o.position.x - cx) < 1.0 && Math.abs(o.position.z - zPos) < 1.2
  );
  if (blocked) return;
  const m = _pool.find(c => !c._active);
  if (!m) return;
  m.position.set(cx, GROUND_Y + 0.52, zPos);
  for (const mesh of m._meshes) mesh.isVisible = true;
  m._active = true; m._popT = 0;
  coinActive.push(m);
}

function _spawnGroup() {
  const r = Math.random();
  if (r < 0.4) {
    // 3 in a row in one lane
    const l = Math.floor(Math.random() * 3);
    _spawnOne(l, SPAWN_Z);
    _spawnOne(l, SPAWN_Z - 2.2);
    _spawnOne(l, SPAWN_Z - 4.4);
  } else if (r < 0.75) {
    // 2 scattered across different lanes
    const l1 = Math.floor(Math.random() * 3);
    const l2 = (l1 + 1 + Math.floor(Math.random() * 2)) % 3;
    _spawnOne(l1, SPAWN_Z);
    _spawnOne(l2, SPAWN_Z - 1.8);
  } else {
    // Single coin
    _spawnOne(Math.floor(Math.random() * 3), SPAWN_Z);
  }
}

function _despawn(m) {
  for (const mesh of m._meshes) mesh.isVisible = false;
  m._active = false; m.scaling.setAll(1);
  m.position.z = SPAWN_Z + 200;
  const i = coinActive.indexOf(m);
  if (i >= 0) coinActive.splice(i, 1);
}

function _burst(x, z) {
  _coinPS.emitter.set(x, GROUND_Y + 0.5, z);
  _coinPS.manualEmitCount = 14;
  _coinPS.start();
}

export function updateCoins(dt, speed, pPos) {
  // Spawn timer
  _spawnTimer += dt;
  if (_spawnTimer >= 2.2) { _spawnGroup(); _spawnTimer = 0; }

  // Move / spin / collect / pop-animate each active coin
  for (let i = coinActive.length - 1; i >= 0; i--) {
    const c = coinActive[i];
    c.position.z -= speed * dt;

    // Spin on Y — shows face → edge → face to approaching camera
    c._rotY = (c._rotY || 0) + dt * 3.2;
    c.rotation.y = c._rotY;

    // Cull past camera
    if (c.position.z < DESPAWN_Z) { _despawn(c); continue; }

    // Pop-scale animation after collect
    if (c._popT > 0) {
      c._popT -= dt;
      c.scaling.setAll(1 + (1 - c._popT / 0.12) * 1.4);
      if (c._popT <= 0) { _burst(c.position.x, c.position.z); _despawn(c); }
      continue;
    }

    // Collect check (generous radius on both X and Z)
    if (Math.abs(pPos.x - c.position.x) < COIN_RADIUS &&
        Math.abs(c.position.z)           < COIN_RADIUS) {
      coinCount++;
      _streak++;
      _streakTimer = 0.55;
      updateCoinHud(coinCount);
      playCoin();
      c._popT = 0.12;
    }
  }

  // Streak gap timer — break streak after 550ms with no collect
  if (_streakTimer > 0) {
    _streakTimer -= dt;
    if (_streakTimer <= 0) _streak = 0;
  }

  // Coin trail — emit while streak >= 3
  _coinTrailPS.emitter.set(pPos.x, pPos.y + 0.1, 0);
  _coinTrailPS.emitRate = _streak >= 3 ? 28 : 0;
}
