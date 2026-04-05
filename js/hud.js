// ================================================================
//  DASH BLITZ — HUD / UI helpers  (DOM only, no scene deps)
// ================================================================

const hudEl        = document.getElementById('hud');
const scoreEl      = document.getElementById('scoreDisplay');
const finalScEl    = document.getElementById('finalScore');
const startScr     = document.getElementById('startScreen');
const gameOverScr  = document.getElementById('gameOverScreen');
const dangerEl     = document.getElementById('dangerOverlay');
const grazeFlashEl = document.getElementById('grazeFlash');
const coinHudEl    = document.getElementById('coinHud');
const coinCountEl  = document.getElementById('coinCount');

export const showHUD       = () => { hudEl.style.display = 'flex'; };
export const hideHUD       = () => { hudEl.style.display = 'none'; };
export const updateScore   = s  => { scoreEl.textContent = Math.floor(s); };
export const showCoinHud   = () => { coinHudEl.style.display = 'flex'; };
export const hideCoinHud   = () => { coinHudEl.style.display = 'none'; };
export const updateCoinHud = n  => { coinCountEl.textContent = n; };
export const setDanger     = v  => { dangerEl.style.opacity = v; };
export const setFinalScore = s  => { finalScEl.textContent = Math.floor(s); };

export function triggerGrazeFlash() {
  grazeFlashEl.classList.remove('active');
  void grazeFlashEl.offsetWidth; // force reflow to restart animation
  grazeFlashEl.classList.add('active');
}

export const hideStartScreen = () => startScr.classList.add('hidden');
export const showGameOver    = () => gameOverScr.classList.remove('hidden');
export const hideGameOver    = () => gameOverScr.classList.add('hidden');

export function onStartClick(fn) {
  startScr.addEventListener('click', fn);
}
export function onPlayAgainClick(fn) {
  document.getElementById('playAgainBtn').addEventListener('click', fn);
}
