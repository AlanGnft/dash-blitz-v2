// ================================================================
//  DASH BLITZ — Screen Manager
// ================================================================

const _screens = {};
let _current = null;

export function initScreens() {
  document.querySelectorAll('.screen').forEach(el => {
    _screens[el.id] = el;
  });
}

export function showScreen(name) {
  const id = 'screen-' + name;
  Object.values(_screens).forEach(el => el.classList.remove('active'));
  if (_screens[id]) {
    _screens[id].classList.add('active');
    _current = name;
  }
}

export function hideAllScreens() {
  Object.values(_screens).forEach(el => el.classList.remove('active'));
  _current = null;
}

export function getCurrentScreen() { return _current; }
