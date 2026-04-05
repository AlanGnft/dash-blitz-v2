// ================================================================
//  DASH BLITZ — Main: engine, scene, track, game state, loop, input
// ================================================================
import { LANE_X, TRACK_W, TILE_D, TILE_N, WRAP_Q,
         SPAWN_Z, DESPAWN_Z, BASE_SPD, MAX_SPD, ACCEL,
         SPAWN_T0, SPAWN_TMIN, CHASER_SURGE1 } from './config.js';

import * as hud from './hud.js';
import { initEffects, burstDust, triggerCamShake, updateEffects } from './effects.js';
import { initPlayer, resetPlayer, updatePlayer, pPos, ps,
         doLeft, doRight, doJump, doSlam } from './player.js';
import { initObstacles, spawnObs, despawnObs, clearObs,
         obsActive, checkCollisions } from './obstacles.js';
import { initCoins, resetCoins, updateCoins } from './coins.js';
import { initMuncher, resetChaser, updateMuncher, chaser } from './muncher.js';

// ---- Engine & Scene ------------------------------------------------
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: false,
  stencil: false,
  powerPreference: 'high-performance'
});
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.051, 0.051, 0.055, 1);
scene.fogMode    = BABYLON.Scene.FOGMODE_EXP2;
scene.fogColor   = new BABYLON.Color3(0.05, 0.05, 0.055);
scene.fogDensity = 0.022;

// ---- Camera --------------------------------------------------------
const camera = new BABYLON.FreeCamera('cam',
  new BABYLON.Vector3(0, 7, -11), scene);
camera.setTarget(new BABYLON.Vector3(0, 0.8, 20));
camera.fov  = 0.9;
camera.minZ = 0.1;
camera.maxZ = 220;

// ---- Lighting ------------------------------------------------------
const hemi = new BABYLON.HemisphericLight('hemi',
  new BABYLON.Vector3(0, 1, 0), scene);
hemi.intensity   = 0.28;
hemi.diffuse     = new BABYLON.Color3(0.7, 0.7, 0.85);
hemi.groundColor = new BABYLON.Color3(0.04, 0.04, 0.06);

const sun = new BABYLON.DirectionalLight('sun',
  new BABYLON.Vector3(-0.25, -1, 0.6), scene);
sun.intensity = 1.3;
sun.diffuse   = new BABYLON.Color3(1, 0.94, 0.88);

const rimLight = new BABYLON.PointLight('rim',
  new BABYLON.Vector3(0, 2.5, -8), scene);
rimLight.diffuse   = new BABYLON.Color3(0.95, 0.08, 0.04);
rimLight.intensity = 1.8;
rimLight.range     = 22;

// ---- Track ---------------------------------------------------------
const matTrack = new BABYLON.StandardMaterial('track', scene);
matTrack.diffuseColor  = new BABYLON.Color3(0.065, 0.065, 0.075);
matTrack.specularColor = new BABYLON.Color3(0.04, 0.04, 0.06);

const matEdge = new BABYLON.StandardMaterial('edge', scene);
matEdge.diffuseColor  = new BABYLON.Color3(0.9, 0.08, 0.04);
matEdge.emissiveColor = new BABYLON.Color3(0.68, 0.04, 0.02);

const matDiv = new BABYLON.StandardMaterial('div', scene);
matDiv.diffuseColor  = new BABYLON.Color3(0.14, 0.14, 0.18);
matDiv.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);

const gTiles = [], gEdgeL = [], gEdgeR = [], gDivL = [], gDivR = [];

for (let i = 0; i < TILE_N; i++) {
  const z = i * TILE_D;

  const tile = BABYLON.MeshBuilder.CreateBox('gt'+i,
    { width: TRACK_W, height: 0.14, depth: TILE_D }, scene);
  tile.material = matTrack; tile.position.set(0, -0.07, z);
  gTiles.push(tile);

  const el = BABYLON.MeshBuilder.CreateBox('el'+i,
    { width: 0.11, height: 0.13, depth: TILE_D }, scene);
  el.material = matEdge; el.position.set(-(TRACK_W/2-0.06), 0.01, z);
  gEdgeL.push(el);

  const er = BABYLON.MeshBuilder.CreateBox('er'+i,
    { width: 0.11, height: 0.13, depth: TILE_D }, scene);
  er.material = matEdge; er.position.set(TRACK_W/2-0.06, 0.01, z);
  gEdgeR.push(er);

  const dl = BABYLON.MeshBuilder.CreateBox('dl'+i,
    { width: 0.055, height: 0.09, depth: TILE_D }, scene);
  dl.material = matDiv; dl.position.set(-1.1, 0.01, z);
  gDivL.push(dl);

  const dr = BABYLON.MeshBuilder.CreateBox('dr'+i,
    { width: 0.055, height: 0.09, depth: TILE_D }, scene);
  dr.material = matDiv; dr.position.set(1.1, 0.01, z);
  gDivR.push(dr);
}

const allTrack = [...gTiles, ...gEdgeL, ...gEdgeR, ...gDivL, ...gDivR];

function scrollTrack(dt, spd) {
  for (const m of allTrack) {
    m.position.z -= spd * dt;
    if (m.position.z < DESPAWN_Z) m.position.z += WRAP_Q;
  }
}

function resetTrack() {
  for (let i = 0; i < TILE_N; i++) {
    const z = i * TILE_D;
    gTiles[i].position.z = z; gEdgeL[i].position.z = z;
    gEdgeR[i].position.z = z; gDivL[i].position.z  = z;
    gDivR[i].position.z  = z;
  }
}

// ---- Module init ---------------------------------------------------
initEffects(scene);
initPlayer(scene);
initObstacles(scene);
initCoins(scene);
initMuncher(scene);

// ---- Game state ----------------------------------------------------
let gs         = 'START';
let score      = 0;
let grazeInvincibleTimer = 0;
let speed      = BASE_SPD;
let spawnTimer = 0;
let spawnIv    = SPAWN_T0;

function startGame() {
  score      = 0;
  speed      = BASE_SPD;
  spawnTimer = 0;
  spawnIv    = SPAWN_T0;
  grazeInvincibleTimer = 0;

  resetPlayer();
  clearObs();
  resetCoins();   // resets count, streak, clears pool, updates HUD
  resetTrack();
  resetChaser();
  hud.setDanger(0);
  hud.hideStartScreen();
  hud.hideGameOver();
  hud.showHUD();
  hud.showCoinHud();
  hud.updateScore(0);

  gs = 'PLAY';
}

function triggerGameOver() {
  gs = 'DEAD';
  hud.hideHUD();
  hud.hideCoinHud();
  hud.setDanger(0);
  hud.setFinalScore(score);
  hud.showGameOver();
}

// ---- Input ---------------------------------------------------------
let tx0 = 0, ty0 = 0;

window.addEventListener('keydown', e => {
  if (gs === 'START') { startGame(); return; }
  if (gs !== 'PLAY') return;
  switch (e.key) {
    case 'ArrowLeft':  case 'a': case 'A': doLeft();  break;
    case 'ArrowRight': case 'd': case 'D': doRight(); break;
    case 'ArrowUp':    case 'w': case 'W': case ' ':  doJump(); break;
    case 'ArrowDown':  case 's': case 'S':
      doSlam(burstDust); break;
  }
});

canvas.addEventListener('touchstart', e => {
  tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
  if (gs === 'START') startGame();
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (gs !== 'PLAY') return;
  const dx = e.changedTouches[0].clientX - tx0;
  const dy = e.changedTouches[0].clientY - ty0;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 28) dx > 0 ? doRight() : doLeft();
  } else {
    if      (dy < -28) doJump();
    else if (dy >  28) doSlam(burstDust);
  }
}, { passive: true });

hud.onStartClick(startGame);
hud.onPlayAgainClick(startGame);

// ---- Game loop -----------------------------------------------------
engine.runRenderLoop(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);

  if (gs === 'PLAY') {
    // Speed ramp
    speed = Math.min(speed + ACCEL * dt, MAX_SPD);
    score += speed * dt * 0.5;
    hud.updateScore(score);

    // Obstacle spawn interval tightens with speed
    const speedT = (speed - BASE_SPD) / (MAX_SPD - BASE_SPD);
    spawnIv = SPAWN_T0 - speedT * (SPAWN_T0 - SPAWN_TMIN);
    spawnTimer += dt;
    if (spawnTimer >= spawnIv) { spawnObs(); spawnTimer = 0; }

    // Track scroll
    scrollTrack(dt, speed);

    // Move & cull obstacles
    for (let i = obsActive.length - 1; i >= 0; i--) {
      const m = obsActive[i];
      m.position.z -= speed * dt;
      if (m.position.z < DESPAWN_Z) despawnObs(m);
    }

    // Coins (spawn, move, collect, trail)
    updateCoins(dt, speed, pPos);

    // Player physics + animations
    updatePlayer(dt, burstDust, triggerCamShake);

    // Camera follows player X
    camera.position.x += (pPos.x - camera.position.x) * Math.min(1, 7 * dt);

    // Camera shake (sets camera.position.y)
    updateEffects(dt, camera);

    camera.setTarget(new BABYLON.Vector3(camera.position.x * 0.25, 0.8, 20));

    // Muncher position + animation + danger vignette
    updateMuncher(dt, pPos.x, camera.position.x);

    // Collision resolution
    if (grazeInvincibleTimer > 0) grazeInvincibleTimer -= dt;
    const hit = checkCollisions(pPos);
    if (hit === 'HIT' && grazeInvincibleTimer <= 0) {
      triggerGameOver();
    } else if (hit === 'GRAZE') {
      if (chaser.grazes >= 1) {
        triggerGameOver();
      } else {
        chaser.grazes++;
        chaser.dist = Math.max(2, chaser.dist - CHASER_SURGE1);
        hud.triggerGrazeFlash();
        grazeInvincibleTimer = 0.35;
      }
    }

    if (chaser.dist <= 0) triggerGameOver();
  }

  scene.render();
});

window.addEventListener('resize', () => engine.resize());
