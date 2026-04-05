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
const deathFlashEl = document.getElementById('deathFlash');
const fadeBlackEl  = document.getElementById('fadeBlack');
const startBestDistEl  = document.getElementById('startBestDist');
const startBestCoinsEl = document.getElementById('startBestCoins');
const milestoneEl = document.getElementById('milestoneText');
const goldBurstEl = document.getElementById('goldBurst');

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

export function triggerDeathFlash() {
  deathFlashEl.classList.remove('active');
  void deathFlashEl.offsetWidth;
  deathFlashEl.classList.add('active');
}

export const setFadeBlack = v => { fadeBlackEl.style.opacity = v; };

export function showGameOver() {
  gameOverScr.classList.remove('hidden');
  gameOverScr.style.transform = 'translateY(60px)';
  gameOverScr.style.opacity = '0';
  gameOverScr.style.pointerEvents = 'none';
  void gameOverScr.offsetWidth;
  gameOverScr.style.transition = 'opacity 0.35s ease-out, transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
  gameOverScr.style.transform = 'translateY(0)';
  gameOverScr.style.opacity = '1';
  gameOverScr.style.pointerEvents = 'auto';
}

export function hideGameOver() {
  gameOverScr.style.transition = 'none';
  gameOverScr.style.transform = '';
  gameOverScr.style.opacity = '';
  gameOverScr.style.pointerEvents = '';
  gameOverScr.classList.add('hidden');
}

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

export function showMilestoneText(text) {
  milestoneEl.textContent = text;
  milestoneEl.classList.remove('slide-in', 'slide-out');
  void milestoneEl.offsetWidth;
  milestoneEl.classList.add('slide-in');
  clearTimeout(milestoneEl._hideTimer);
  milestoneEl._hideTimer = setTimeout(() => {
    milestoneEl.classList.remove('slide-in');
    milestoneEl.classList.add('slide-out');
  }, 1800);
}

export function triggerGoldBurst() {
  goldBurstEl.classList.remove('active');
  void goldBurstEl.offsetWidth;
  goldBurstEl.classList.add('active');
}

export function updateStartBest(dist, coins) {
  startBestDistEl.textContent  = Math.floor(dist);
  startBestCoinsEl.textContent = coins;
}

export function onStartClick(fn) {
  startScr.addEventListener('click', fn);
}
export function onPlayAgainClick(fn) {
  document.getElementById('playAgainBtn').addEventListener('click', fn);
}
