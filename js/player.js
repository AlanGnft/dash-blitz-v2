// ================================================================
//  DASH BLITZ — Player: physics controller + character delegation
// ================================================================
import { LANE_X, GROUND_Y, LANE_DUR, SQUASH_DUR,
         JUMP_V, GRAV_RISE, GRAV_FALL } from './config.js';
import { playJump, playSlam } from './audio.js';
import Apple from './characters/apple.js';

const LEAN_LANE_ANG = 15 * Math.PI / 180;
const LEAN_JUMP_UP  =  8 * Math.PI / 180;
const LEAN_JUMP_DOWN= -6 * Math.PI / 180;
const LEAN_RETURN   = 8.0;

// Physics state — exported so other modules can read position
export const pPos      = { x: LANE_X[1], y: GROUND_Y };
export const lane      = { cur: 1, tgt: 1 };
export const laneTween = { fromX: LANE_X[1], toX: LANE_X[1], p: 1.0 };
export const lean      = { z: 0, x: 0 };
export const ps        = { jumping: false, velY: 0, squashT: 0, bobT: 0 };

export const easeInOut = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

let _char = null;

export function initPlayer(scene) {
  _char = new Apple(scene);
}

export function setCharacter(charInstance) {
  if (_char) _char.hide();
  _char = charInstance;
  _char.show();
  _char.reset(pPos);
}

export function getCharacter() { return _char; }

export function resetPlayer() {
  lane.cur = 1; lane.tgt = 1;
  pPos.x   = LANE_X[1]; pPos.y = GROUND_Y;
  ps.velY  = 0; ps.jumping = false; ps.squashT = 0; ps.bobT = 0;
  laneTween.fromX = LANE_X[1]; laneTween.toX = LANE_X[1]; laneTween.p = 1;
  lean.z = 0; lean.x = 0;
  if (_char) _char.reset(pPos);
}

export function updatePlayer(dt, burstDust, triggerCamShake) {
  // Lane switch tween
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

  // Jump physics
  if (ps.jumping) {
    const g = ps.velY > 0 ? GRAV_RISE : GRAV_FALL;
    ps.velY += g * dt;
    pPos.y  += ps.velY * dt;
    if (pPos.y <= GROUND_Y) {
      pPos.y     = GROUND_Y;
      ps.velY    = 0;
      ps.jumping = false;
      ps.squashT = SQUASH_DUR * 0.55;
      burstDust(pPos.x);
      triggerCamShake();
    }
  }

  // Squash timer
  if (ps.squashT > 0) ps.squashT -= dt;
  ps.bobT += dt;

  // Delegate all mesh animation to the active character
  if (_char) _char.update(pPos, lean, ps);
}

export function killPlayerPop(progress) {
  if (_char) _char.killPop(progress);
}

export function hidePlayer() {
  if (_char) _char.hide();
}

export function showPlayer() {
  if (_char) _char.show();
}

// Input actions
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
  ps.squashT = SQUASH_DUR;
  burstDust(pPos.x);
  playSlam();
}
