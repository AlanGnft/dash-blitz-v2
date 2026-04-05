// ================================================================
//  DASH BLITZ — Player: Apple character, physics, animations
// ================================================================
import { LANE_X, GROUND_Y, LANE_DUR, SQUASH_DUR,
         JUMP_V, GRAV_RISE, GRAV_FALL } from './config.js';
import { playJump, playSlam } from './audio.js';

const LEAN_LANE_ANG = 15 * Math.PI / 180;
const LEAN_JUMP_UP  =  8 * Math.PI / 180;
const LEAN_JUMP_DOWN= -6 * Math.PI / 180;
const LEAN_RETURN   = 8.0;

// Exported state objects — other modules read these by reference
export const pPos      = { x: LANE_X[1], y: GROUND_Y };
export const lane      = { cur: 1, tgt: 1 };
export const laneTween = { fromX: LANE_X[1], toX: LANE_X[1], p: 1.0 };
export const lean      = { z: 0, x: 0 };
export const ps        = { jumping: false, velY: 0, squashT: 0, bobT: 0 };

export const easeInOut = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

// Private mesh references — set by initPlayer
let _body, _leaf, _stem, _eyeL, _eyeR, _pupilL, _pupilR;

export function initPlayer(scene) {
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

  _body = BABYLON.MeshBuilder.CreateSphere('apple',
    { diameter: 1.1, segments: 20 }, scene);
  _body.material = matApple;

  _leaf = BABYLON.MeshBuilder.CreateSphere('leaf',
    { diameter: 0.52, segments: 10 }, scene);
  _leaf.material = matLeaf;
  _leaf.scaling.set(0.72, 0.32, 0.9);

  _stem = BABYLON.MeshBuilder.CreateCylinder('stem',
    { diameter: 0.065, height: 0.28, tessellation: 6 }, scene);
  _stem.material = matStem;

  _eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL',
    { diameter: 0.19, segments: 8 }, scene);
  _eyeL.material = matEyeWhite;

  _eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR',
    { diameter: 0.19, segments: 8 }, scene);
  _eyeR.material = matEyeWhite;

  _pupilL = BABYLON.MeshBuilder.CreateSphere('pupilL',
    { diameter: 0.10, segments: 6 }, scene);
  _pupilL.material = matEyePupil;

  _pupilR = BABYLON.MeshBuilder.CreateSphere('pupilR',
    { diameter: 0.10, segments: 6 }, scene);
  _pupilR.material = matEyePupil;
}

function _place() {
  _body.position.set(pPos.x, pPos.y, 0);
  _leaf.position.set(pPos.x, pPos.y + 0.60, 0.04);
  _stem.position.set(pPos.x, pPos.y + 0.82, 0.04);
  _eyeL.position.set(pPos.x - 0.14, pPos.y + 0.10, -0.42);
  _eyeR.position.set(pPos.x + 0.14, pPos.y + 0.10, -0.42);
  _pupilL.position.set(pPos.x - 0.14, pPos.y + 0.10, -0.48);
  _pupilR.position.set(pPos.x + 0.14, pPos.y + 0.10, -0.48);
}

export function resetPlayer() {
  lane.cur = 1; lane.tgt = 1;
  pPos.x   = LANE_X[1]; pPos.y = GROUND_Y;
  ps.velY  = 0; ps.jumping = false; ps.squashT = 0; ps.bobT = 0;
  laneTween.fromX = LANE_X[1]; laneTween.toX = LANE_X[1]; laneTween.p = 1;
  _body.scaling.set(1, 1, 1);
  _leaf.scaling.set(0.72, 0.32, 0.9);
  _stem.scaling.set(1, 1, 1);
  lean.z = 0; lean.x = 0;
  _body.rotation.set(0, 0, 0);
  _place();
}

// burstDust and triggerCamShake are passed as callbacks to avoid
// a direct dependency from player.js → effects.js
export function updatePlayer(dt, burstDust, triggerCamShake) {
  // Lane switch tween (ease-in-out cubic)
  if (laneTween.p < 1) {
    laneTween.p = Math.min(1, laneTween.p + dt / LANE_DUR);
    pPos.x = laneTween.fromX + (laneTween.toX - laneTween.fromX) * easeInOut(laneTween.p);
    if (laneTween.p === 1) lane.cur = lane.tgt;
    lean.z = (laneTween.toX > laneTween.fromX ? -1 : 1) * LEAN_LANE_ANG;
  } else {
    lean.z += (0 - lean.z) * Math.min(1, LEAN_RETURN * dt);
  }

  // Jump pitch lean
  if (ps.jumping) {
    const tx = ps.velY > 0 ? LEAN_JUMP_UP : LEAN_JUMP_DOWN;
    lean.x  += (tx - lean.x) * Math.min(1, 12 * dt);
  } else {
    lean.x += (0 - lean.x) * Math.min(1, 10 * dt);
  }

  // Jump physics (split gravity: lighter rise, heavier fall)
  if (ps.jumping) {
    const g = ps.velY > 0 ? GRAV_RISE : GRAV_FALL;
    ps.velY += g * dt;
    pPos.y  += ps.velY * dt;
    if (pPos.y <= GROUND_Y) {
      pPos.y     = GROUND_Y;
      ps.velY    = 0;
      ps.jumping = false;
      ps.squashT = SQUASH_DUR * 0.55; // lighter squash on natural landing
      burstDust(pPos.x);
      triggerCamShake();
    }
  }

  // Squash / stretch animation
  ps.bobT += dt;
  if (ps.squashT > 0) {
    ps.squashT -= dt;
    const p  = Math.max(0, ps.squashT / SQUASH_DUR);
    const sy = 1 - p * 0.42;
    const sx = 1 + p * 0.24;
    _body.scaling.set(sx, sy, sx);
    _leaf.scaling.set(0.72*sx, 0.32*sy, 0.9*sx);
    _stem.scaling.set(sx, sy, sx);
  } else {
    _body.scaling.set(1, 1, 1);
    _leaf.scaling.set(0.72, 0.32, 0.9);
    _stem.scaling.set(1, 1, 1);
  }

  // Running bob + world positions + lean rotation
  const bob = (ps.jumping || ps.squashT > 0) ? 0 : Math.sin(ps.bobT * 10) * 0.034;

  _body.position.set(pPos.x, pPos.y + bob, 0);
  _body.rotation.set(lean.x, 0, lean.z);
  _leaf.position.set(pPos.x, pPos.y + 0.60 + bob, 0.04);
  _leaf.rotation.set(lean.x, 0, lean.z);
  _stem.position.set(pPos.x, pPos.y + 0.82 + bob, 0.04);
  _stem.rotation.set(lean.x, 0, lean.z);

  // Eyes — embedded on front face (-Z), bob with body
  _eyeL.position.set(pPos.x - 0.14, pPos.y + 0.10 + bob, -0.42);
  _eyeR.position.set(pPos.x + 0.14, pPos.y + 0.10 + bob, -0.42);
  _pupilL.position.set(pPos.x - 0.14, pPos.y + 0.10 + bob, -0.48);
  _pupilR.position.set(pPos.x + 0.14, pPos.y + 0.10 + bob, -0.48);
  _eyeL.rotation.set(lean.x, 0, lean.z);
  _eyeR.rotation.set(lean.x, 0, lean.z);
  _pupilL.rotation.set(lean.x, 0, lean.z);
  _pupilR.rotation.set(lean.x, 0, lean.z);
}

// Input actions — main.js calls these after its own gs check
export function doLeft() {
  if (lane.tgt <= 0) return;
  lane.tgt--;
  laneTween.fromX = pPos.x;
  laneTween.toX   = LANE_X[lane.tgt];
  laneTween.p     = 0;
}
export function doRight() {
  if (lane.tgt >= 2) return;
  lane.tgt++;
  laneTween.fromX = pPos.x;
  laneTween.toX   = LANE_X[lane.tgt];
  laneTween.p     = 0;
}
export function doJump() {
  if (!ps.jumping) { ps.velY = JUMP_V; ps.jumping = true; playJump(); }
}
export function doSlam(burstDust) {
  if (!ps.jumping) return;
  pPos.y     = GROUND_Y;
  ps.velY    = 0;
  ps.jumping = false;
  ps.squashT = SQUASH_DUR; // full squash on slam
  burstDust(pPos.x);
  playSlam();
}
