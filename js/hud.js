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
const goCoinsEl    = document.getElementById('goCoins');
const goBestDistEl = document.getElementById('goBestDist');
const goBestCoinsEl= document.getElementById('goBestCoins');
const newBestEl    = document.getElementById('newBestBanner');

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

export function setGoStats(distance, coins, bestDist, bestCoins, newDistRecord, newCoinRecord) {
  goCoinsEl.textContent     = coins;
  goBestDistEl.textContent  = Math.floor(bestDist);
  goBestCoinsEl.textContent = bestCoins;
  if (newDistRecord || newCoinRecord) {
    newBestEl.classList.remove('hidden');
  } else {
    newBestEl.classList.add('hidden');
  }
}

export function onStartClick(fn) {
  startScr.addEventListener('click', fn);
}
export function onPlayAgainClick(fn) {
  document.getElementById('playAgainBtn').addEventListener('click', fn);
}
