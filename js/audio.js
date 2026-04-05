// ================================================================
//  DASH BLITZ — Audio: Web Audio API synthesized sounds + music
// ================================================================

let _ctx = null;

// ---- Persistent nodes for growl and music ----------------------
let _growlOsc = null, _growlGain = null;
let _musicInterval = null;
let _padOsc = null, _padGain = null, _lfoOsc = null;
let _musicBeat = 0;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

export function initAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume();
}

// ---- One-shot helpers ------------------------------------------

function oneShot(fn) {
  try { fn(ctx()); } catch (e) { /* audio not critical */ }
}

function ramp(param, from, to, dur, c) {
  const t = c.currentTime;
  param.setValueAtTime(from, t);
  param.linearRampToValueAtTime(to, t + dur);
}

// ---- Sound effects ---------------------------------------------

export function playJump() {
  oneShot(c => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    ramp(osc.frequency, 150, 400, 0.12, c);
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.12);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.13);
  });
}

export function playCoin() {
  oneShot(c => {
    const t = c.currentTime;
    [880, 1100].forEach((freq, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.03);
      gain.gain.linearRampToValueAtTime(0.14, t + i * 0.03 + 0.01);
      gain.gain.linearRampToValueAtTime(0, t + i * 0.03 + 0.14);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t + i * 0.03); osc.stop(t + i * 0.03 + 0.15);
    });
  });
}

export function playSlam() {
  oneShot(c => {
    const t = c.currentTime;
    // sawtooth sweep down
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    ramp(osc.frequency, 80, 40, 0.18, c);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.18);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.19);

    // noise burst
    const bufLen = Math.floor(c.sampleRate * 0.1);
    const buf    = c.createBuffer(1, bufLen, c.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src    = c.createBufferSource();
    const nGain  = c.createGain();
    const filt   = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 320;
    src.buffer = buf;
    nGain.gain.setValueAtTime(0.18, t);
    nGain.gain.linearRampToValueAtTime(0, t + 0.1);
    src.connect(filt); filt.connect(nGain); nGain.connect(c.destination);
    src.start(t);
  });
}

export function playGraze() {
  oneShot(c => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = 320;
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.1);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.11);
  });
}

export function playDeath() {
  oneShot(c => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    ramp(osc.frequency, 400, 80, 0.6, c);
    gain.gain.setValueAtTime(0.22, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.62);
  });
}

export function playMuncherRoar() {
  oneShot(c => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 90;
    gain.gain.setValueAtTime(0.38, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.32);
  });
}

// ---- Muncher growl (continuous, per-frame) ---------------------

export function startMuncherGrowl(ratio) {
  try {
    const c = ctx();
    if (!_growlOsc) {
      _growlOsc  = c.createOscillator();
      _growlGain = c.createGain();
      _growlOsc.type = 'sawtooth';
      _growlOsc.frequency.value = 55;
      _growlGain.gain.value = 0;
      _growlOsc.connect(_growlGain); _growlGain.connect(c.destination);
      _growlOsc.start();
    }
    _growlOsc.frequency.value  = 55 + ratio * 55;
    _growlGain.gain.value      = ratio * 0.08;
  } catch (e) { /* non-critical */ }
}

export function stopMuncherGrowl() {
  if (_growlGain) _growlGain.gain.value = 0;
}

// ---- Background music (120 BPM scheduler) ----------------------

export function startMusic() {
  try {
    const c = ctx();
    _musicBeat = 0;

    // Tension pad: LFO-modulated sine at 110Hz
    _padOsc  = c.createOscillator();
    _padGain = c.createGain();
    _lfoOsc  = c.createOscillator();
    const lfoGain = c.createGain();
    _padOsc.type = 'sine'; _padOsc.frequency.value = 110;
    _lfoOsc.type = 'sine'; _lfoOsc.frequency.value = 0.25;
    lfoGain.gain.value = 12;
    _padGain.gain.value = 0.06;
    _lfoOsc.connect(lfoGain); lfoGain.connect(_padOsc.frequency);
    _padOsc.connect(_padGain); _padGain.connect(c.destination);
    _padOsc.start(); _lfoOsc.start();

    const beatInterval = 60 / 120; // 0.5s per beat

    _musicInterval = setInterval(() => {
      try {
        const beat = _musicBeat % 4;
        const t    = c.currentTime;

        // Bass on beats 0 and 2
        if (beat === 0 || beat === 2) {
          const bass     = c.createOscillator();
          const bassGain = c.createGain();
          bass.type = 'sine'; bass.frequency.value = 80;
          bassGain.gain.setValueAtTime(0.18, t);
          bassGain.gain.linearRampToValueAtTime(0, t + 0.35);
          bass.connect(bassGain); bassGain.connect(c.destination);
          bass.start(t); bass.stop(t + 0.36);
        }

        // Hi-hat (filtered noise) every beat
        const bufLen = Math.floor(c.sampleRate * 0.06);
        const buf    = c.createBuffer(1, bufLen, c.sampleRate);
        const data   = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const src    = c.createBufferSource();
        const filt   = c.createBiquadFilter();
        const hGain  = c.createGain();
        filt.type = 'highpass'; filt.frequency.value = 7000;
        hGain.gain.setValueAtTime(beat === 0 ? 0.10 : 0.05, t);
        hGain.gain.linearRampToValueAtTime(0, t + 0.06);
        src.buffer = buf;
        src.connect(filt); filt.connect(hGain); hGain.connect(c.destination);
        src.start(t);

        _musicBeat++;
      } catch (e) { /* non-critical */ }
    }, beatInterval * 1000);
  } catch (e) { /* non-critical */ }
}

export function stopMusic() {
  if (_musicInterval) { clearInterval(_musicInterval); _musicInterval = null; }
  try {
    if (_padOsc)  { _padOsc.stop();  _padOsc  = null; }
    if (_lfoOsc)  { _lfoOsc.stop();  _lfoOsc  = null; }
    if (_padGain) { _padGain = null; }
  } catch (e) { /* already stopped */ }
  stopMuncherGrowl();
}
