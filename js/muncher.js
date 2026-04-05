// ================================================================
//  DASH BLITZ — The Muncher: chaser creature, behavior, animation
// ================================================================
import { CHASER_MAX, CHASER_START, CHASER_RETREAT } from './config.js';
import { setDanger } from './hud.js';
import { startMuncherGrowl } from './audio.js';

export const chaser = { dist: CHASER_START, grazes: 0 };

let _muncherT = 0;
let _muncher, _mBody, _mMouth, _mJawU, _mJawL;
let _mEyeL, _mEyeR, _mPupilL, _mPupilR;
let _matMBody;

export function initMuncher(scene) {
  _matMBody = new BABYLON.StandardMaterial('mBody', scene);
  _matMBody.diffuseColor  = new BABYLON.Color3(0.16, 0.08, 0.28);
  _matMBody.emissiveColor = new BABYLON.Color3(0.05, 0.02, 0.10);

  const matMJaw = new BABYLON.StandardMaterial('mJaw', scene);
  matMJaw.diffuseColor  = new BABYLON.Color3(0.20, 0.10, 0.34);
  matMJaw.emissiveColor = new BABYLON.Color3(0.06, 0.02, 0.12);

  const matMTeeth = new BABYLON.StandardMaterial('mTeeth', scene);
  matMTeeth.diffuseColor  = new BABYLON.Color3(0.96, 0.93, 0.88);
  matMTeeth.emissiveColor = new BABYLON.Color3(0.12, 0.10, 0.08);

  const matMMouth = new BABYLON.StandardMaterial('mMouth', scene);
  matMMouth.diffuseColor  = new BABYLON.Color3(0.55, 0.04, 0.06);
  matMMouth.emissiveColor = new BABYLON.Color3(0.38, 0.02, 0.03);

  const matMEye = new BABYLON.StandardMaterial('mEye', scene);
  matMEye.diffuseColor  = new BABYLON.Color3(1, 1, 1);
  matMEye.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

  const matMPupil = new BABYLON.StandardMaterial('mPupil', scene);
  matMPupil.diffuseColor  = new BABYLON.Color3(0.9, 0.06, 0.02);
  matMPupil.emissiveColor = new BABYLON.Color3(0.65, 0.03, 0.01);

  _muncher = new BABYLON.TransformNode('muncher', scene);

  _mBody = BABYLON.MeshBuilder.CreateSphere('mBody',
    { diameter: 4.2, segments: 12 }, scene);
  _mBody.material = _matMBody;
  _mBody.scaling.set(1.0, 0.55, 0.9);
  _mBody.position.y = 1.2;
  _mBody.parent = _muncher;

  _mMouth = BABYLON.MeshBuilder.CreateBox('mMouth',
    { width: 3.1, height: 0.85, depth: 1.2 }, scene);
  _mMouth.material = matMMouth; _mMouth.position.y = 2.4; _mMouth.parent = _muncher;

  _mJawU = BABYLON.MeshBuilder.CreateBox('mJawU',
    { width: 3.5, height: 0.62, depth: 1.55 }, scene);
  _mJawU.material = matMJaw; _mJawU.position.y = 2.88; _mJawU.parent = _muncher;

  _mJawL = BABYLON.MeshBuilder.CreateBox('mJawL',
    { width: 3.5, height: 0.52, depth: 1.55 }, scene);
  _mJawL.material = matMJaw; _mJawL.position.y = 1.94; _mJawL.parent = _muncher;

  for (let i = 0; i < 4; i++) {
    const t = BABYLON.MeshBuilder.CreateBox('mutT'+i,
      { width: 0.33, height: 0.56, depth: 0.28 }, scene);
    t.material = matMTeeth; t.position.set(-1.35 + i * 0.9, 2.62, -0.62);
    t.parent = _muncher;
  }
  for (let i = 0; i < 4; i++) {
    const t = BABYLON.MeshBuilder.CreateBox('mltT'+i,
      { width: 0.29, height: 0.48, depth: 0.28 }, scene);
    t.material = matMTeeth; t.position.set(-1.35 + i * 0.9, 2.18, -0.62);
    t.parent = _muncher;
  }

  _mEyeL = BABYLON.MeshBuilder.CreateSphere('mEyeL',
    { diameter: 0.98, segments: 10 }, scene);
  _mEyeL.material = matMEye; _mEyeL.position.set(-0.98, 3.90, -0.52); _mEyeL.parent = _muncher;

  _mEyeR = BABYLON.MeshBuilder.CreateSphere('mEyeR',
    { diameter: 0.98, segments: 10 }, scene);
  _mEyeR.material = matMEye; _mEyeR.position.set(0.98, 3.90, -0.52); _mEyeR.parent = _muncher;

  _mPupilL = BABYLON.MeshBuilder.CreateSphere('mPupilL',
    { diameter: 0.54, segments: 8 }, scene);
  _mPupilL.material = matMPupil; _mPupilL.position.set(-0.98, 3.90, -0.95); _mPupilL.parent = _muncher;

  _mPupilR = BABYLON.MeshBuilder.CreateSphere('mPupilR',
    { diameter: 0.54, segments: 8 }, scene);
  _mPupilR.material = matMPupil; _mPupilR.position.set(0.98, 3.90, -0.95); _mPupilR.parent = _muncher;

  _muncher.scaling.setAll(0.55);
  _muncher.position.set(0, 1.0, -14);
}

export function resetChaser() {
  chaser.dist   = CHASER_START;
  chaser.grazes = 0;
  _muncherT     = 0;
}

// Returns dangerT [0-1] so main.js can check game-over condition.
export function updateMuncher(dt, pPosX, cameraX) {
  // Chaser retreats while player runs clean
  chaser.dist = Math.min(CHASER_MAX, chaser.dist + CHASER_RETREAT * dt);

  const dangerT = Math.max(0, 1 - chaser.dist / CHASER_MAX);
  const mZ      = -(1.8 + (chaser.dist / CHASER_MAX) * 4.0);
  _muncher.position.set(cameraX * 0.3, 1.0, mZ);

  // Jaw chomps faster and wider as danger increases
  _muncherT += dt;
  const jawSpeed = 2.8 + dangerT * 9;
  const jawAmp   = 0.10 + dangerT * 0.30;
  const jawAng   = Math.abs(Math.sin(_muncherT * jawSpeed)) * jawAmp;
  _mJawU.position.y  = 2.88 + jawAng * 1.3;
  _mJawL.position.y  = 1.94 - jawAng * 0.9;
  _mMouth.position.y = 2.4  + jawAng * 0.2;

  // Eyes track player X
  const ef = pPosX * 0.09;
  _mEyeL.position.x  = -0.98 + ef; _mEyeR.position.x  =  0.98 + ef;
  _mPupilL.position.x = -0.98 + ef; _mPupilR.position.x =  0.98 + ef;

  // Body emissive pulses purple-red with danger
  _matMBody.emissiveColor.set(0.05 + dangerT * 0.24, 0.02, 0.10 + dangerT * 0.14);

  // Danger vignette overlay
  setDanger(Math.pow(1 - chaser.dist / CHASER_MAX, 1.5) * 0.9);

  // Growl scales with danger
  startMuncherGrowl(dangerT);

  return dangerT;
}
