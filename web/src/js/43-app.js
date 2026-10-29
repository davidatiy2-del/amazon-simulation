// ================= THE APP: the Android back button, and saving when the app leaves the screen =================
// The Android app (a WebView around this page) asks the game what "back" means: the open window closes first (its own
// back or close button if it has one), then the map, the guide or the help; in the middle of a game, back pauses it
// (and back again resumes). At the main menu there is nothing to close, and the app goes to the background.
window.appBack = function () {
  const open = [...document.querySelectorAll('section.ov')].filter(e => !e.hidden && e.id !== 'death' && e.offsetParent !== null);
  if (open.length) {
    const el = open[open.length - 1];
    if (el.id === 'help' || el.id === 'guide' || el.id === 'mapov') { UI.close(); return true; }
    const b = el.querySelector('[data-a="back"], [data-a="close"], [data-a="no"], #helpClose, #guideClose, #mapClose');
    if (b) { b.click(); return true; }
    closeCard(el.id); return true;
  }
  if (G.mode === 'play') {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', key: 'Escape' }));
    return true;
  }
  return false;
};
// the app goes to the background (a call, the home button): save, and pause
window.appPause = function () {
  if (G.mode !== 'play') return;
  try { saveGame(); } catch (e) { reportErr(e); }
  if (!G.paused) UI.pause(true);
};
