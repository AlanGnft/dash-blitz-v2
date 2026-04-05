// ================================================================
//  DASH BLITZ — Effects: dust particles, camera shake
// ================================================================
import { GROUND_Y } from './config.js';

const CAM_SHAKE_DUR = 0.15;
const CAM_SHAKE_AMP = 0.08;

let _dustPS;
let _camShakeT = 0;

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
}

export function burstDust(x) {
  _dustPS.emitter.x       = x;
  _dustPS.manualEmitCount = 22;
  _dustPS.start();
}

export function triggerCamShake() { _camShakeT = CAM_SHAKE_DUR; }

// Called each frame during PLAY. Mutates camera.position.y for shake.
export function updateEffects(dt, camera) {
  let shakeY = 0;
  if (_camShakeT > 0) {
    _camShakeT -= dt;
    shakeY = Math.sin((_camShakeT / CAM_SHAKE_DUR) * Math.PI) * CAM_SHAKE_AMP;
  }
  camera.position.y = 7 + shakeY;
}
