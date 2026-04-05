// ================================================================
//  DASH BLITZ — Obstacles: 3 themed types + pool + collision
// ================================================================
import { LANE_X, SPAWN_Z, DESPAWN_Z } from './config.js';

const OBS_PER_TYPE = 5;

let _matCan, _matCanCap, _matCrate, _matCart;

export const obsActive = [];
const _pool = [];

export function initObstacles(scene) {
  _matCan = new BABYLON.PBRMaterial('can', scene);
  _matCan.albedoColor          = new BABYLON.Color3(0.82, 0.08, 0.06);
  _matCan.metallic             = 0.72;
  _matCan.roughness            = 0.28;
  _matCan.environmentIntensity = 0.3;

  _matCanCap = new BABYLON.PBRMaterial('canCap', scene);
  _matCanCap.albedoColor          = new BABYLON.Color3(0.72, 0.72, 0.76);
  _matCanCap.metallic             = 0.85;
  _matCanCap.roughness            = 0.22;
  _matCanCap.environmentIntensity = 0.3;

  _matCrate = new BABYLON.PBRMaterial('crate', scene);
  _matCrate.albedoColor          = new BABYLON.Color3(0.44, 0.28, 0.12);
  _matCrate.metallic             = 0.0;
  _matCrate.roughness            = 0.88;
  _matCrate.environmentIntensity = 0.15;

  _matCart = new BABYLON.PBRMaterial('cart', scene);
  _matCart.albedoColor          = new BABYLON.Color3(0.40, 0.40, 0.44);
  _matCart.metallic             = 0.70;
  _matCart.roughness            = 0.40;
  _matCart.environmentIntensity = 0.25;

  for (let i = 0; i < OBS_PER_TYPE; i++) {
    for (const root of [_makeCan(i, scene), _makeCrate(i, scene), _makeCart(i, scene)]) {
      root._active = false;
      root._grazed = false;
      root.position.set(0, 0, SPAWN_Z + 200);
      for (const m of root._meshes) m.isVisible = false;
      _pool.push(root);
    }
  }

  for (let i = 0; i < 3; i++) {
    const root = _makeBarrier(i, scene);
    root._active = false; root._grazed = false;
    root.position.set(0, 0, SPAWN_Z + 200);
    for (const m of root._meshes) m.isVisible = false;
    _pool.push(root);
  }
}

function _makeCan(idx, scene) {
  const root = new BABYLON.TransformNode('obs_can_' + idx, scene);
  const body = BABYLON.MeshBuilder.CreateCylinder('canBody_' + idx,
    { diameter: 0.70, height: 1.20, tessellation: 16 }, scene);
  body.material = _matCan; body.position.y = 0.60; body.parent = root;
  const cap = BABYLON.MeshBuilder.CreateCylinder('canCap_' + idx,
    { diameter: 0.62, height: 0.10, tessellation: 16 }, scene);
  cap.material = _matCanCap; cap.position.y = 1.25; cap.parent = root;
  root._meshes = [body, cap]; root._halfW = 0.38; root._type = 'can';
  return root;
}

function _makeCrate(idx, scene) {
  const root = new BABYLON.TransformNode('obs_crate_' + idx, scene);
  const bot = BABYLON.MeshBuilder.CreateBox('crateBot_' + idx,
    { width: 1.0, height: 0.80, depth: 1.0 }, scene);
  bot.material = _matCrate; bot.position.y = 0.40; bot.parent = root;
  const top = BABYLON.MeshBuilder.CreateBox('crateTop_' + idx,
    { width: 0.80, height: 0.80, depth: 0.80 }, scene);
  top.material = _matCrate; top.position.set(0.06, 1.20, -0.05); top.parent = root;
  root._meshes = [bot, top]; root._halfW = 0.52; root._type = 'crate';
  return root;
}

function _makeBarrier(idx, scene) {
  const root = new BABYLON.TransformNode('obs_barrier_' + idx, scene);
  const bar  = BABYLON.MeshBuilder.CreateBox('barrierBox_' + idx,
    { width: 3.3, height: 0.55, depth: 0.75 }, scene);
  bar.material = _matCrate;
  bar.position.y = 0.275;
  bar.parent = root;
  root._meshes = [bar];
  root._halfW  = 1.65;
  root._type   = 'barrier';
  return root;
}

function _makeCart(idx, scene) {
  const root = new BABYLON.TransformNode('obs_cart_' + idx, scene);
  const parts = [
    { w:1.20, h:0.70, d:0.06, x:0,     y:0.65, z: 0.46 }, // back
    { w:1.20, h:0.70, d:0.06, x:0,     y:0.65, z:-0.46 }, // front
    { w:0.06, h:0.70, d:0.92, x:-0.57, y:0.65, z:0     }, // left
    { w:0.06, h:0.70, d:0.92, x: 0.57, y:0.65, z:0     }, // right
    { w:1.20, h:0.06, d:0.92, x:0,     y:0.32, z:0     }, // base
    { w:1.20, h:0.07, d:0.07, x:0,     y:1.08, z:0.40  }, // handle bar
  ];
  const meshes = [];
  for (let k = 0; k < parts.length; k++) {
    const p  = parts[k];
    const bx = BABYLON.MeshBuilder.CreateBox('cartP_' + idx + '_' + k,
      { width: p.w, height: p.h, depth: p.d }, scene);
    bx.material = _matCart; bx.position.set(p.x, p.y, p.z); bx.parent = root;
    meshes.push(bx);
  }
  root._meshes = meshes; root._halfW = 0.62; root._type = 'cart';
  return root;
}

export function spawnObs() {
  const avail = _pool.filter(o => !o._active);
  if (!avail.length) return;
  const m = avail[Math.floor(Math.random() * avail.length)];
  const l = Math.floor(Math.random() * 3);
  m.position.set(LANE_X[l], 0, SPAWN_Z);
  if (m._type !== 'cart') m.rotation.y = (Math.random() - 0.5) * 0.8;
  for (const mesh of m._meshes) mesh.isVisible = true;
  m._active = true; m._grazed = false;
  obsActive.push(m);
}

export function despawnObs(m) {
  for (const mesh of m._meshes) mesh.isVisible = false;
  m._active = false; m.position.z = SPAWN_Z + 200;
  const i = obsActive.indexOf(m);
  if (i >= 0) obsActive.splice(i, 1);
}

export function clearObs() {
  while (obsActive.length) despawnObs(obsActive[0]);
}

export function spawnDouble() {
  const avail = _pool.filter(o => !o._active && o._type !== 'barrier');
  if (avail.length < 2) { spawnObs(); return; }
  const l1 = Math.floor(Math.random() * 3);
  const l2 = (l1 + 1 + Math.floor(Math.random() * 2)) % 3;
  [avail[0], avail[1]].forEach((m, k) => {
    const lane = k === 0 ? l1 : l2;
    m.position.set(LANE_X[lane], 0, SPAWN_Z);
    if (m._type !== 'cart') m.rotation.y = (Math.random() - 0.5) * 0.8;
    for (const mesh of m._meshes) mesh.isVisible = true;
    m._active = true; m._grazed = false;
    obsActive.push(m);
  });
}

export function spawnBarrier() {
  const avail = _pool.filter(o => !o._active && o._type === 'barrier');
  if (!avail.length) return;
  const m = avail[0];
  // Place at ±1.1 — blocks two lanes, leaves one lane and jump as escape
  m.position.set(Math.random() < 0.5 ? -1.1 : 1.1, 0, SPAWN_Z);
  m.rotation.y = 0;
  for (const mesh of m._meshes) mesh.isVisible = true;
  m._active = true; m._grazed = false;
  obsActive.push(m);
}

export function checkCollisions(pPos) {
  for (const m of obsActive) {
    const dz = Math.abs(m.position.z);    if (dz > 0.75) continue;
    const dy = Math.abs(pPos.y - 0.55);  if (dy > 0.82) continue;
    const dx = Math.abs(pPos.x - m.position.x);
    const hw = m._halfW || 0.52;
    if (dx < hw - 0.10) return 'HIT';
    if (dx < hw + 0.28 && !m._grazed) { m._grazed = true; return 'GRAZE'; }
  }
  return null;
}
