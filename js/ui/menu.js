// ================================================================
//  DASH BLITZ — Menu navigation and screen population
// ================================================================
import { showScreen, hideAllScreens } from './screens.js';
import { CHARACTERS } from '../characters/index.js';
import { getHighScore, getTotalStats, spendCoins, unlockCharacter,
         getUnlockedCharacters, saveCharacter, getSavedCharacter } from '../highscore.js';

let _onStartGame  = null; // callback: () => void
let _onCharChange = null; // callback: (CharEntry) => void — for 3D preview
let _sfxEnabled   = true;
let _musicEnabled = true;
let _stopMusic    = null;
let _startMusic   = null;

// ---- Carousel state -----------------------------------------------
let _charIdx = 0; // index into CHARACTERS

export function initMenu(opts) {
  _onStartGame  = opts.onStartGame;
  _onCharChange = opts.onCharChange;
  _stopMusic    = opts.stopMusic;
  _startMusic   = opts.startMusic;

  _charIdx = Math.max(0, CHARACTERS.findIndex(c => c.id === getSavedCharacter()));

  _wireTitle();
  _wireMainMenu();
  _wireCharSelect();
  _wireWorldSelect();
  _wirePause();
  _wireGameOver();
  _wireShop();
  _wireOptions();
  _wireLeaderboard();

  // First screen
  showScreen('title');
  _refreshTitleBest();
}

function _refreshTitleBest() {
  const hs = getHighScore();
  document.getElementById('titleBestDist').textContent  = Math.floor(hs.distance);
  document.getElementById('titleBestCoins').textContent = hs.coins;
}

// ---- TITLE --------------------------------------------------------
function _wireTitle() {
  document.getElementById('screen-title').addEventListener('click', () => {
    showScreen('main-menu');
    _refreshMainMenu();
  });
}

// ---- MAIN MENU ----------------------------------------------------
function _refreshMainMenu() {
  const s = getTotalStats();
  document.getElementById('profileCoins').textContent = s.totalCoins;
  document.getElementById('profileGames').textContent = s.gamesPlayed;
}

function _wireMainMenu() {
  document.getElementById('btnPlay').addEventListener('click', () => {
    showScreen('world-select');
  });
  document.getElementById('btnCharacters').addEventListener('click', () => {
    showScreen('character-select');
    _refreshCharSelect();
  });
  document.getElementById('btnWorlds').addEventListener('click', () => {
    showScreen('world-select');
  });
  document.getElementById('btnShop').addEventListener('click', () => {
    showScreen('shop');
    _refreshShop();
  });
  document.getElementById('btnLeaderboard').addEventListener('click', () => {
    showScreen('leaderboard');
    _refreshLeaderboard();
  });
  document.getElementById('btnOptions').addEventListener('click', () => {
    showScreen('options');
  });
}

// ---- CHARACTER SELECT ---------------------------------------------
function _refreshCharSelect() {
  const c        = CHARACTERS[_charIdx];
  const unlocked = getUnlockedCharacters();
  const owned    = unlocked.includes(c.id);
  const stats    = getTotalStats();

  document.getElementById('charName').textContent = c.name.toUpperCase();
  document.getElementById('charLock').textContent = owned ? '' : '🔒';
  document.getElementById('charCost').textContent = owned ? 'OWNED' : `★ ${c.cost} coins`;
  document.getElementById('charCoinBalance').querySelector('span').textContent = stats.totalCoins;

  const selectBtn = document.getElementById('charSelectBtn');
  const unlockBtn = document.getElementById('charUnlockBtn');

  if (owned) {
    selectBtn.style.display = '';
    unlockBtn.style.display = 'none';
  } else {
    selectBtn.style.display = 'none';
    unlockBtn.style.display = '';
    unlockBtn.disabled      = stats.totalCoins < c.cost;
    unlockBtn.textContent   = `UNLOCK (${c.cost} ★)`;
  }

  if (_onCharChange) _onCharChange(c);
}

function _wireCharSelect() {
  document.getElementById('charPrev').addEventListener('click', () => {
    _charIdx = (_charIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
    _refreshCharSelect();
  });
  document.getElementById('charNext').addEventListener('click', () => {
    _charIdx = (_charIdx + 1) % CHARACTERS.length;
    _refreshCharSelect();
  });
  document.getElementById('charSelectBtn').addEventListener('click', () => {
    const c = CHARACTERS[_charIdx];
    saveCharacter(c.id);
    if (_onCharChange) _onCharChange(c);
    showScreen('main-menu');
    _refreshMainMenu();
  });
  document.getElementById('charUnlockBtn').addEventListener('click', () => {
    const c = CHARACTERS[_charIdx];
    if (spendCoins(c.cost)) {
      unlockCharacter(c.id);
      _refreshCharSelect();
    }
  });
  document.getElementById('charBack').addEventListener('click', () => {
    showScreen('main-menu');
  });
}

// ---- WORLD SELECT --------------------------------------------------
function _wireWorldSelect() {
  // Only "market" world is unlocked — clicking it selects it
  const marketCard = document.getElementById('worldMarket');
  marketCard.classList.add('selected');

  document.getElementById('worldDash').addEventListener('click', () => {
    hideAllScreens();
    if (_onStartGame) _onStartGame();
  });
  document.getElementById('worldBack').addEventListener('click', () => {
    showScreen('main-menu');
  });
}

// ---- PAUSE ---------------------------------------------------------
export function showPauseScreen() { showScreen('pause'); }
export function hidePauseScreen() { hideAllScreens(); }

function _wirePause() {
  document.getElementById('pauseResume').addEventListener('click', () => {
    hideAllScreens();
    window.dispatchEvent(new CustomEvent('dashblitz:resume'));
  });
  document.getElementById('pauseRestart').addEventListener('click', () => {
    hideAllScreens();
    window.dispatchEvent(new CustomEvent('dashblitz:restart'));
  });
  document.getElementById('pauseOptions').addEventListener('click', () => {
    showScreen('options');
  });
  document.getElementById('pauseMainMenu').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('dashblitz:mainmenu'));
  });
}

// ---- GAME OVER -----------------------------------------------------
function _wireGameOver() {
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    hideAllScreens();
    window.dispatchEvent(new CustomEvent('dashblitz:restart'));
  });
  document.getElementById('goMainMenuBtn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('dashblitz:mainmenu'));
  });
}

export function showGameOverScreen() { showScreen('game-over'); }

// ---- SHOP ----------------------------------------------------------
function _refreshShop() {
  const grid     = document.getElementById('shopGrid');
  const unlocked = getUnlockedCharacters();
  const stats    = getTotalStats();
  document.getElementById('shopBalance').textContent = stats.totalCoins;

  grid.innerHTML = '';
  CHARACTERS.forEach(c => {
    if (c.cost === 0) return; // skip apple (starter)
    const owned = unlocked.includes(c.id);
    const card  = document.createElement('div');
    card.className = 'shop-card' + (owned ? ' shop-card--owned' : '');
    card.innerHTML = `
      <div class="shop-card-name">${c.name}</div>
      <div class="shop-card-cost">${owned ? '' : '★ ' + c.cost}</div>
      <div class="shop-card-status">${owned ? 'OWNED' : (stats.totalCoins >= c.cost ? 'UNLOCK' : '🔒')}</div>
    `;
    if (!owned) {
      card.addEventListener('click', () => {
        if (stats.totalCoins < c.cost) return;
        if (!confirm(`Unlock ${c.name} for ${c.cost} coins?`)) return;
        if (spendCoins(c.cost)) {
          unlockCharacter(c.id);
          _refreshShop();
        }
      });
    }
    grid.appendChild(card);
  });
}

function _wireShop() {
  document.getElementById('shopBack').addEventListener('click', () => {
    showScreen('main-menu');
    _refreshMainMenu();
  });
}

// ---- OPTIONS -------------------------------------------------------
function _wireOptions() {
  const musicBtn = document.getElementById('toggleMusic');
  const sfxBtn   = document.getElementById('toggleSfx');

  musicBtn.addEventListener('click', () => {
    _musicEnabled = !_musicEnabled;
    musicBtn.textContent  = _musicEnabled ? 'ON' : 'OFF';
    musicBtn.dataset.on   = _musicEnabled;
    if (_musicEnabled && _startMusic) _startMusic();
    else if (!_musicEnabled && _stopMusic) _stopMusic();
  });

  sfxBtn.addEventListener('click', () => {
    _sfxEnabled = !_sfxEnabled;
    sfxBtn.textContent  = _sfxEnabled ? 'ON' : 'OFF';
    sfxBtn.dataset.on   = _sfxEnabled;
    window._dashSfxMuted = !_sfxEnabled;
  });

  document.getElementById('optionsBack').addEventListener('click', () => {
    showScreen('main-menu');
  });
}

export function isSfxEnabled() { return _sfxEnabled; }

// ---- LEADERBOARD ---------------------------------------------------
function _refreshLeaderboard() {
  const hs = getHighScore();
  const s  = getTotalStats();
  document.getElementById('lbBestDist').textContent   = Math.floor(hs.distance);
  document.getElementById('lbBestCoins').textContent  = hs.coins;
  document.getElementById('lbTotalDist').textContent  = Math.floor(s.totalDistance);
  document.getElementById('lbTotalCoins').textContent = s.totalCoins;
  document.getElementById('lbGames').textContent      = s.gamesPlayed;
}

function _wireLeaderboard() {
  document.getElementById('lbBack').addEventListener('click', () => {
    showScreen('main-menu');
  });
}
