// ================================================================
//  DASH BLITZ — Effects: dust particles, speed lines, camera shake
// ================================================================
import { GROUND_Y, BASE_SPD, MAX_SPD } from './config.js';

const SPEEDLINE_COUNT  = 12;
const SPEEDLINE_THRESH = 0.60;
const CAM_SHAKE_DUR    = 0.15;
const CAM_SHAKE_AMP    = 0.08;

let _dustPS;
let _matSpeedLine;
let _speedLines = [];
let _camShakeT  = 0;

export function initEffects(scene) {
  // ---- Dust particle texture (soft warm gradient)
  const ptc   = document.createElement('canvas');
  ptc.width   = ptc.height = 32;
  const pctx  = ptc.getContext('2d');
  const pgr   = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  pgr.addColorStop(0,   'rgba(255,235,180,1)');
  pgr.addColorStop(0.5, 'rgba(220,195,150,0.6)');
  pgr.addColorStop(1,   'rgba(200,170,120,0)');
  pctx.fillStyle = pgr;
  pctx.beginPath(); pctx.arc(16, 16, 16, 0, Math.PI * 2); pctx.fill();

  _dustPS = new BABYLON.ParticleSystem('dust', 40, scene);
  _dustPS.particleTexture = new BABYLON.Texture(ptc.toDataURL(), scene);
  _dustPS.emitter         = new BABYLON.Vector3(0, GROUND_Y, 0);
  _dustPS.minEmitBox      = new BABYLON.Vector3(-0.4, 0, -0.3);
  _dustPS.maxEmitBox      = new BABYLON.Vector3(0.4,  0,  0.3);
  _dustPS.direction1      = new BABYLON.Vector3(-3, 1, -2);
  _dustPS.direction2      = new BABYLON.Vector3(3,  4,  2);
  _dustPS.minSize         = 0.06; _dustPS.maxSize     = 0.22;
  _dustPS.minLifeTime     = 0.12; _dustPS.maxLifeTime = 0.30;
  _dustPS.minEmitPower    = 1.5;  _dustPS.maxEmitPower = 4.5;
  _dustPS.emitRate        = 0;
  _dustPS.gravity         = new BABYLON.Vector3(0, -9, 0);
  _dustPS.color1          = new BABYLON.Color4(0.92, 0.82, 0.68, 1);
  _dustPS.color2          = new BABYLON.Color4(0.78, 0.68, 0.52, 0.7);
  _dustPS.colorDead       = new BABYLON.Color4(0.60, 0.52, 0.38, 0);
  _dustPS.blendMode       = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

  // ---- Speed lines: billboard planes radiating from screen center
  _matSpeedLine = new BABYLON.StandardMaterial('speedLine', scene);
  _matSpeedLine.diffuseColor    = new BABYLON.Color3(1, 1, 1);
  _matSpeedLine.emissiveColor   = new BABYLON.Color3(0.85, 0.85, 0.88);
  _matSpeedLine.backFaceCulling = false;
  _matSpeedLine.alpha           = 0;

  for (let i = 0; i < SPEEDLINE_COUNT; i++) {
    const sl = BABYLON.MeshBuilder.CreatePlane('sl_' + i,
      { width: 0.045, height: 0.9 + Math.random() * 0.8 }, scene);
    sl.material      = _matSpeedLine;
    sl.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    sl.isPickable    = false;
    sl._angle = (i / SPEEDLINE_COUNT) * Math.PI * 2;
    sl._dist  = 1.8 + Math.random() * 1.4;
    _speedLines.push(sl);
  }
}

export function burstDust(x) {
  _dustPS.emitter.x       = x;
  _dustPS.manualEmitCount = 22;
  _dustPS.start();
}

export function triggerCamShake() { _camShakeT = CAM_SHAKE_DUR; }

// Called each frame during PLAY. Mutates camera.position.y for shake.
export function updateEffects(dt, speed, camera) {
  // Camera micro-shake (Y bounce, 150ms)
  let shakeY = 0;
  if (_camShakeT > 0) {
    _camShakeT -= dt;
    shakeY = Math.sin((_camShakeT / CAM_SHAKE_DUR) * Math.PI) * CAM_SHAKE_AMP;
  }
  camera.position.y = 7 + shakeY;

  // Speed lines — fade in above 60% max speed
  const speedT = (speed - BASE_SPD) / (MAX_SPD - BASE_SPD);
  const t      = Math.max(0, (speedT - SPEEDLINE_THRESH) / (1 - SPEEDLINE_THRESH));
  _matSpeedLine.alpha = t * 0.38;

  if (t > 0.01) {
    const anchorX = camera.position.x * 0.3;
    for (const sl of _speedLines) {
      sl._angle += dt * (0.18 + t * 0.55);
      sl.position.set(
        anchorX + Math.cos(sl._angle) * sl._dist,
        2.2     + Math.sin(sl._angle) * sl._dist * 0.55,
        4.0
      );
      sl.scaling.y = 0.6 + t * 1.2;
    }
  }
}
