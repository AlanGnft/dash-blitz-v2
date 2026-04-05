// ================================================================
//  DASH BLITZ — Main: engine, scene, track, game state, loop, input
// ================================================================
import { LANE_X, TRACK_W, TILE_D, TILE_N, WRAP_Q,
         SPAWN_Z, DESPAWN_Z, BASE_SPD, MAX_SPD, ACCEL,
         SPAWN_T0, SPAWN_TMIN, CHASER_SURGE1, GROUND_Y } from './config.js';

import * as hud from './hud.js';
import { initEffects, burstDust, triggerCamShake, updateEffects } from './effects.js';
import { initPlayer, resetPlayer, updatePlayer, pPos, ps,
         doLeft, doRight, doJump, doSlam,
         killPlayerPop, hidePlayer, showPlayer,
         setCharacter, getCharacter } from './player.js';
import { initObstacles, spawnObs, spawnDouble, spawnBarrier,
         despawnObs, clearObs, obsActive, checkCollisions } from './obstacles.js';
import { initCoins, resetCoins, updateCoins, coinCount, burstCoinsAt } from './coins.js';
import { initMuncher, resetChaser, updateMuncher, chaser,
         startMuncherSurge, updateMuncherSurge, snapMuncherJawShut,
         muncherIdleAnim } from './muncher.js';
import { initAudio, startMusic, stopMusic, playGraze, playDeath,
         playMuncherRoar, playMilestone } from './audio.js';
import { saveHighScore, getHighScore, addRunStats, getTotalStats,
         getSavedCharacter, getUnlockedCharacters } from './highscore.js';
import { CHARACTERS } from './characters/index.js';
import { initScreens, showScreen, hideAllScreens, getCurrentScreen } from './ui/screens.js';
import { initMenu, showPauseScreen } from './ui/menu.js';

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
  new BABYLON.Vector3(0, 9, -17), scene);
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

// Restore saved character
(function() {
  const savedId  = getSavedCharacter();
  const unlocked = getUnlockedCharacters();
  if (savedId !== 'apple' && unlocked.includes(savedId)) {
    const entry = CHARACTERS.find(c => c.id === savedId);
    if (entry) setCharacter(new entry.Class(scene));
  }
})();

// Seed starter coins
(function() {
  const params = new URLSearchParams(window.location.search);
  const KEY = 'dashblitz_total';
  let s = getTotalStats();
  if (params.get('dev') === '1') {
    s.totalCoins = 9999;
    localStorage.setItem(KEY, JSON.stringify(s));
  } else if (s.gamesPlayed === 0 && s.totalCoins === 0) {
    s.totalCoins = 300;
    localStorage.setItem(KEY, JSON.stringify(s));
  }
})();

// ---- Screen / Menu init -------------------------------------------
document.body.classList.add('in-menu');
initScreens();
initMenu({
  onStartGame:  startGame,    // hoisted — defined below
  onCharChange: _previewChar,
  stopMusic,
  startMusic,
});

// Update title best score
const _initHs = getHighScore();
hud.updateTitleBest(_initHs.distance, _initHs.coins);

// ---- Game state ----------------------------------------------------
let gs         = 'MENU';
let score      = 0;
let grazeInvincibleTimer = 0;
let speed      = BASE_SPD;
let spawnTimer = 0;
let spawnIv    = SPAWN_T0;

// ---- Title / start transition --------------------------------
let _startingT = 0;
const CAM_TITLE = { y: 9,  z: -17 };
const CAM_PLAY  = { y: 7,  z: -11 };

// ---- Death sequence state ------------------------------------
let _deathT       = 0;
let _deathGoShown = false;
let _applePopped  = false;
let _roarPlayed   = false;

// ---- Progression milestones ----------------------------------
const MILESTONES = [
  { score: 100,  text: 'PICKING UP SPEED',       spawnMult: 0.80 },
  { score: 250,  text: "IT'S GETTING DANGEROUS", spawnMult: 0.72 },
  { score: 500,  text: 'FULL SPEED',             spawnMult: 0.65 },
  { score: 1000, text: 'UNSTOPPABLE',            spawnMult: 0.55 },
];
let _milestoneHit  = [false, false, false, false];
let _progressPhase = 0;
let _spawnMult     = 1.0;

// ---- Character preview (carousel) ----------------------------
function _previewChar(charEntry) {
  // During MENU state, swap the active character in the 3D scene
  if (gs === 'MENU') {
    const instance = new charEntry.Class(scene);
    setCharacter(instance);
  }
}

// ---- startGame (called from menu) ---------------------------------
function startGame() {
  if (gs === 'DYING') return;
  initAudio();

  score      = 0;
  speed      = BASE_SPD;
  spawnTimer = 0;
  spawnIv    = SPAWN_T0;
  grazeInvincibleTimer  = 0;
  _milestoneHit  = [false, false, false, false];
  _progressPhase = 0;
  _spawnMult     = 1.0;

  resetPlayer();
  clearObs();
  resetCoins();
  resetTrack();
  resetChaser();
  hud.setDanger(0);
  hud.setFadeBlack(0);
  showPlayer();
  hud.showHUD();
  hud.showCoinHud();
  hud.showPauseBtn();
  hud.updateScore(0);

  document.body.classList.remove('in-menu');
  _startingT = 0;
  gs = 'STARTING';
}

// ---- Death sequence -----------------------------------------------
function triggerDeathSequence() {
  if (gs !== 'PLAY') return;
  gs = 'DYING';
  _deathT       = 0;
  _deathGoShown = false;
  _applePopped  = false;
  _roarPlayed   = false;
  stopMusic();
  playDeath();
  hud.hideHUD();
  hud.hideCoinHud();
  hud.hidePauseBtn();
  hud.setDanger(0);
  hud.triggerDeathFlash();
  startMuncherSurge(pPos.x);
}

function _finalizeGameOver() {
  hud.setFinalScore(score);
  const { newDistanceRecord, newCoinRecord } = saveHighScore(score, coinCount);
  addRunStats(score, coinCount);
  const hs = getHighScore();
  hud.setGoStats(score, coinCount, hs.distance, hs.coins, newDistanceRecord, newCoinRecord);
  hud.showGameOver();
  hidePlayer();
  // Update title best for next time
  hud.updateTitleBest(hs.distance, hs.coins);
}

// ---- Pause --------------------------------------------------------
function pauseGame() {
  if (gs !== 'PLAY') return;
  gs = 'PAUSED';
  stopMusic();
  showPauseScreen();
}

function resumeGame() {
  if (gs !== 'PAUSED') return;
  gs = 'PLAY';
  startMusic();
}

function goToMainMenu() {
  stopMusic();
  hud.hideHUD();
  hud.hideCoinHud();
  hud.hidePauseBtn();
  hud.setDanger(0);
  hud.setFadeBlack(0);
  hud.hideGameOver();
  clearObs();
  resetCoins();
  resetTrack();
  resetChaser();
  resetPlayer();
  showPlayer();
  document.body.classList.add('in-menu');
  gs = 'MENU';
  showScreen('main-menu');
}

// ---- Custom events from menu.js -----------------------------------
window.addEventListener('dashblitz:resume',   () => resumeGame());
window.addEventListener('dashblitz:restart',  () => { hideAllScreens(); startGame(); });
window.addEventListener('dashblitz:mainmenu', () => goToMainMenu());

// ---- Input ---------------------------------------------------------
let tx0 = 0, ty0 = 0;

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (gs === 'PLAY')   { pauseGame();  return; }
    if (gs === 'PAUSED') { resumeGame(); hideAllScreens(); return; }
  }
  if (gs !== 'PLAY') return;
  switch (e.key) {
    case 'ArrowLeft':  case 'a': case 'A': doLeft();  break;
    case 'ArrowRight': case 'd': case 'D': doRight(); break;
    case 'ArrowUp':    case 'w': case 'W': case ' ':  doJump(); break;
    case 'ArrowDown':  case 's': case 'S': doSlam(burstDust); break;
  }
});

canvas.addEventListener('touchstart', e => {
  tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
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

hud.onPauseBtnClick(pauseGame);

// ---- Game loop -----------------------------------------------------
engine.runRenderLoop(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);

  // ---- PLAY state ------------------------------------------------
  if (gs === 'PLAY') {
    // Speed ramp
    speed = Math.min(speed + ACCEL * dt, MAX_SPD);
    score += speed * dt * 0.5;
    hud.updateScore(score);

    // Milestone checks
    for (let _mi = 0; _mi < MILESTONES.length; _mi++) {
      if (!_milestoneHit[_mi] && score >= MILESTONES[_mi].score) {
        _milestoneHit[_mi] = true;
        _progressPhase = _mi + 1;
        _spawnMult = MILESTONES[_mi].spawnMult;
        hud.showMilestoneText(MILESTONES[_mi].text);
        playMilestone();
        if (_mi === 1) {
          // 250m: muncher closer
          chaser.dist = Math.max(chaser.dist - 4, 8);
        }
        if (_mi === 2) {
          // 500m: instant max speed + shake
          speed = MAX_SPD;
          triggerCamShake();
        }
        if (_mi === 3) {
          // 1000m: gold burst
          hud.triggerGoldBurst();
          burstCoinsAt(LANE_X[0], GROUND_Y + 0.5, 5);
          burstCoinsAt(LANE_X[1], GROUND_Y + 0.5, 5);
          burstCoinsAt(LANE_X[2], GROUND_Y + 0.5, 5);
        }
      }
    }

    // Obstacle spawn interval tightens with speed and milestone
    const speedT = (speed - BASE_SPD) / (MAX_SPD - BASE_SPD);
    spawnIv = (SPAWN_T0 - speedT * (SPAWN_T0 - SPAWN_TMIN)) * _spawnMult;
    spawnTimer += dt;
    if (spawnTimer >= spawnIv) {
      if (_progressPhase >= 4 && Math.random() < 0.45) {
        spawnDouble();
      } else if (_progressPhase >= 3 && Math.random() < 0.25) {
        spawnBarrier();
      } else if (_progressPhase >= 2 && Math.random() < 0.35) {
        spawnDouble();
      } else {
        spawnObs();
      }
      spawnTimer = 0;
    }

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
      triggerDeathSequence();
    } else if (hit === 'GRAZE') {
      if (chaser.grazes >= 1) {
        triggerDeathSequence();
      } else {
        chaser.grazes++;
        chaser.dist = Math.max(2, chaser.dist - CHASER_SURGE1);
        hud.triggerGrazeFlash();
        playGraze();
        grazeInvincibleTimer = 0.35;
      }
    }

    if (chaser.dist <= 0) triggerDeathSequence();
  }

  // ---- DYING state -----------------------------------------------
  if (gs === 'DYING') {
    _deathT += dt;

    // t=0-100ms: slow-mo idle — muncher jaw moves lazily
    if (_deathT < 0.1) {
      muncherIdleAnim(dt * 0.15);
    }

    // t=100-400ms: muncher surges forward hard
    if (_deathT >= 0.1 && _deathT < 0.4) {
      updateMuncherSurge((_deathT - 0.1) / 0.3);
    }

    // t=400-450ms: apple pops (scale 1 → 0)
    if (_deathT >= 0.4 && _deathT < 0.45) {
      killPlayerPop((_deathT - 0.4) / 0.05);
    }

    // t=450ms: particle burst, freeze apple at scale 0
    if (_deathT >= 0.45 && !_applePopped) {
      _applePopped = true;
      killPlayerPop(1);
      burstCoinsAt(pPos.x, pPos.y + 0.5, 0);
    }

    // t=400-500ms: hard camera shake (3 oscillations)
    if (_deathT >= 0.4 && _deathT < 0.5) {
      camera.position.y = 7 + Math.sin((_deathT - 0.4) / 0.1 * Math.PI * 6) * 0.25;
    } else if (_deathT >= 0.5) {
      camera.position.y = 7;
    }

    // t=500ms: jaw snaps shut + roar
    if (_deathT >= 0.5 && !_roarPlayed) {
      _roarPlayed = true;
      snapMuncherJawShut();
      playMuncherRoar();
    }

    // t=700-1000ms: fade to black
    if (_deathT >= 0.7) {
      hud.setFadeBlack(Math.min(1, (_deathT - 0.7) / 0.3));
    }

    // t=1000ms: show game over screen
    if (_deathT >= 1.0 && !_deathGoShown) {
      _deathGoShown = true;
      _finalizeGameOver();
    }

    // t=1000-1500ms: fade black back out to reveal game over screen
    if (_deathGoShown && _deathT >= 1.0 && _deathT < 1.5) {
      hud.setFadeBlack(1 - (_deathT - 1.0) / 0.5);
    }

    // t=1500ms: game fully interactive
    if (_deathT >= 1.5 && _deathGoShown) {
      hud.setFadeBlack(0);
      document.body.classList.add('in-menu');
      gs = 'DEAD';
    }
  }

  // ---- STARTING state (camera transition) ------------------------
  if (gs === 'STARTING') {
    _startingT += dt;
    const p  = Math.min(1, _startingT / 0.4);
    const ep = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    camera.position.y = CAM_TITLE.y + (CAM_PLAY.y - CAM_TITLE.y) * ep;
    camera.position.z = CAM_TITLE.z + (CAM_PLAY.z - CAM_TITLE.z) * ep;
    camera.setTarget(new BABYLON.Vector3(camera.position.x * 0.25, 0.8, 20));
    updatePlayer(dt, () => {}, () => {});
    muncherIdleAnim(dt);
    if (p >= 1) {
      gs = 'PLAY';
      startMusic();
    }
  }

  // ---- MENU state (title + all menu screens) ---------------------
  if (gs === 'MENU') {
    camera.position.y = CAM_TITLE.y;
    camera.position.z = CAM_TITLE.z;
    camera.setTarget(new BABYLON.Vector3(0, 0.8, 20));
    updatePlayer(dt, () => {}, () => {});
    muncherIdleAnim(dt);
  }

  // ---- PAUSED state ----------------------------------------------
  // Nothing advances — scene still renders but game frozen.

  scene.render();
});

window.addEventListener('resize', () => engine.resize());
