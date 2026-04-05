// ================================================================
//  DASH BLITZ — High Score: localStorage persistence
// ================================================================

const KEY = 'dashblitz_hs';

export function getHighScore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { distance: 0, coins: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { distance: 0, coins: 0 };
  }
}

export function saveHighScore(distance, coins) {
  const hs = getHighScore();
  const newDistanceRecord = distance > hs.distance;
  const newCoinRecord     = coins    > hs.coins;
  if (newDistanceRecord || newCoinRecord) {
    localStorage.setItem(KEY, JSON.stringify({
      distance: newDistanceRecord ? distance : hs.distance,
      coins:    newCoinRecord     ? coins    : hs.coins
    }));
  }
  return { newDistanceRecord, newCoinRecord };
}

export function resetHighScore() {
  localStorage.removeItem(KEY);
}

// ---- Lifetime stats ------------------------------------------------
const KEY_TOTAL = 'dashblitz_total';

export function getTotalStats() {
  try {
    const raw = localStorage.getItem(KEY_TOTAL);
    if (!raw) return { totalCoins: 0, gamesPlayed: 0, totalDistance: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { totalCoins: 0, gamesPlayed: 0, totalDistance: 0 };
  }
}

export function addRunStats(distance, coins) {
  const s = getTotalStats();
  s.totalCoins    += coins;
  s.gamesPlayed   += 1;
  s.totalDistance += distance;
  localStorage.setItem(KEY_TOTAL, JSON.stringify(s));
  return s;
}

export function spendCoins(amount) {
  const s = getTotalStats();
  if (s.totalCoins < amount) return false;
  s.totalCoins -= amount;
  localStorage.setItem(KEY_TOTAL, JSON.stringify(s));
  return true;
}

// ---- Character persistence -----------------------------------------
const KEY_CHAR = 'dashblitz_char';

export function getSavedCharacter() {
  return localStorage.getItem(KEY_CHAR) || 'apple';
}

export function saveCharacter(id) {
  localStorage.setItem(KEY_CHAR, id);
}

export function getUnlockedCharacters() {
  try {
    const raw = localStorage.getItem('dashblitz_unlocked');
    if (!raw) return ['apple'];
    return JSON.parse(raw);
  } catch (e) { return ['apple']; }
}

export function unlockCharacter(id) {
  const list = getUnlockedCharacters();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem('dashblitz_unlocked', JSON.stringify(list));
  }
}
