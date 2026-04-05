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
