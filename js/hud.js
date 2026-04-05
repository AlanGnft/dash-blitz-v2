// ================================================================
//  DASH BLITZ — HUD / UI helpers  (DOM only, no scene deps)
// ================================================================

// ---- Gameplay HUD --------------------------------------------------
const hudEl        = document.getElementById('hud');
const scoreEl      = document.getElementById('scoreDisplay');
const coinHudEl    = document.getElementById('coinHud');
const coinCountEl  = document.getElementById('coinCount');
const pauseBtnEl   = document.getElementById('pauseBtn');
const dangerEl     = document.getElementById('dangerOverlay');
const grazeFlashEl = document.getElementById('grazeFlash');
const milestoneEl  = document.getElementById('milestoneText');
const goldBurstEl  = document.getElementById('goldBurst');
const deathFlashEl = document.getElementById('deathFlash');
const fadeBlackEl  = document.getElementById('fadeBlack');

// ---- Screen-specific elements -------------------------------------
const finalScEl     = document.getElementById('finalScore');
const goCoinsEl     = document.getElementById('goCoins');
const goBestDistEl  = document.getElementById('goBestDist');
const goBestCoinsEl = document.getElementById('goBestCoins');
const newBestEl     = document.getElementById('newBestBanner');
const titleBestDistEl  = document.getElementById('titleBestDist');
const titleBestCoinsEl = document.getElementById('titleBestCoins');

// ---- Gameplay HUD exports ------------------------------------------
export const showHUD       = () => { hudEl.style.display = 'flex'; };
export const hideHUD       = () => { hudEl.style.display = 'none'; };
export const updateScore   = s  => { scoreEl.textContent = Math.floor(s); };
export const showCoinHud   = () => { coinHudEl.style.display = 'flex'; };
export const hideCoinHud   = () => { coinHudEl.style.display = 'none'; };
export const updateCoinHud = n  => { coinCountEl.textContent = n; };
export const showPauseBtn  = () => { pauseBtnEl.classList.remove('hidden'); };
export const hidePauseBtn  = () => { pauseBtnEl.classList.add('hidden'); };
export const setDanger     = v  => { dangerEl.style.opacity = v; };
export const setFinalScore = s  => { finalScEl.textContent = Math.floor(s); };
export const setFadeBlack  = v  => { fadeBlackEl.style.opacity = v; };

export function triggerGrazeFlash() {
  grazeFlashEl.classList.remove('active');
  void grazeFlashEl.offsetWidth;
  grazeFlashEl.classList.add('active');
}

export function triggerDeathFlash() {
  deathFlashEl.classList.remove('active');
  void deathFlashEl.offsetWidth;
  deathFlashEl.classList.add('active');
}

export function showGameOver() {
  const el = document.getElementById('screen-game-over');
  el.classList.add('active');
  el.style.transform = 'translateY(60px)';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  void el.offsetWidth;
  el.style.transition = 'opacity 0.35s ease-out, transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
  el.style.transform = 'translateY(0)';
  el.style.opacity = '1';
  el.style.pointerEvents = 'auto';
}

export function hideGameOver() {
  const el = document.getElementById('screen-game-over');
  el.style.transition = 'none';
  el.style.transform = '';
  el.style.opacity = '';
  el.style.pointerEvents = '';
  el.classList.remove('active');
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

export function updateTitleBest(dist, coins) {
  titleBestDistEl.textContent  = Math.floor(dist);
  titleBestCoinsEl.textContent = coins;
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

export function onPauseBtnClick(fn) {
  pauseBtnEl.addEventListener('click', e => { e.stopPropagation(); fn(); });
}
