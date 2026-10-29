// The app's way in: the parts of the game (js/game/NN-name.js) are read in order and run together, as one script,
// exactly as in the one-file web version. Everything is local: the app needs no internet.
(function () {
  'use strict';
  var PARTS = /*PARTS*/[];
  function fail(e) { var t = document.getElementById('loadText'); if (t) t.textContent = 'לא הצלחנו לטעון את המשחק (' + (e && e.message || e) + ')'; }
  if (typeof THREE === 'undefined') return;   // three.js did not load: its own message is on the screen
  Promise.all(PARTS.map(function (n) {
    return fetch('js/game/' + n).then(function (r) { if (!r.ok) throw new Error(n); return r.text(); });
  })).then(function (texts) {
    var s = document.createElement('script');
    s.textContent = texts.map(function (t, i) { return '// ---- part ' + PARTS[i] + ' ----\n' + t; }).join('\n') + '\n//# sourceURL=amazonia-game.js';
    document.body.appendChild(s);
  }).catch(fail);
})();
