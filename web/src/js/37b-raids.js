// ================= RAIDS OF THE OLD WORLD: Viking longships from the sea, Mongol riders, bandits in the night =================
// Raids do not wait for a war. Every few days the Vikings sail out in a longship to raid a town on a coast: the ship comes
// in from the open sea, the raiders jump off on the beach, fight, take food and animals, run back to the ship and row
// away. The khans of the steppe send riders, every one on a horse, to drive off the herds of the towns around them. The
// bandits come out of the forest at night for food and animals. Near you, it happens before your eyes; far away, you hear
// about it a little later. Help a town beat off its raiders and it thanks you with gold. Your village is a target too.
const RAID2 = { t: 45, gT: 240, cd: {}, ships: [], pend: [], shore: {}, geo: null };
const RAID2_K = {
  viking: { ic: '⛵', who: 'ויקינגים', n: [5, 8], every: [900, 1500], range: 1700 },
  horde: { ic: '🐎', who: 'רוכבים', n: [4, 7], every: [900, 1400], range: 950 },
  bandit: { ic: '🗡️', who: 'שודדים', n: [3, 5], every: [700, 1100], range: 650 }
};
const RAID2_NEAR = 420;
const raid2Kind = c => !c || c.gone || c.own ? null : c.bandit ? 'bandit' : c.civ === 'vikings' ? 'viking' : c.civ === 'mongols' ? 'horde' : null;
function raid2Reset() { for (const S of RAID2.ships) raid2ShipGone(S); Object.assign(RAID2, { t: 45, gT: 240, cd: {}, ships: [], pend: [] }); }
// the camps of bandits are not in the tribes' books: they get a page when they first ride out
function raid2Books(i) {
  if (i === 'own') return;
  const c = HUNT.camps[i];
  if (WAR.men[i] == null) WAR.men[i] = c && c.bandit ? 3 : 6; if (WAR.food[i] == null) WAR.food[i] = 12; if (WAR.terr[i] == null) WAR.terr[i] = 90;
  if (!WAR.stolen[i]) WAR.stolen[i] = { food: 0, back: 0 };
}
// ---------- where a ship can land: a beach by the place, open water straight out from it ----------
function raid2Shore(t, key) {
  if (key != null && RAID2.shore[key] !== undefined) return RAID2.shore[key];
  const R = t.own ? villageR() : (SET_R[t.kind] || 22);
  let best = null, bs = 1e9;
  for (let k = 0; k < 28; k++) {
    const a = k / 28 * TAU, ux = Math.sin(a), uz = Math.cos(a);
    let last = null;
    for (let r = R + 4; r < R + 140; r += 3) {
      const x = t.x + ux * r, z = t.z + uz * r;
      if (waterDepth(x, z) <= 0) { last = { x, z, r }; continue; }
      if (!last || last.r < R + 6) break;
      let ok = true;
      for (let q = 4; q <= 100; q += 6) { if (waterDepth(x + ux * q, z + uz * q) < (q < 10 ? 0.5 : 1.5)) { ok = false; break; } }
      if (ok) { const s = last.r + (getNY(last.x, last.z) < 0.78 ? 60 : 0) + (WALLED.some(W => Math.hypot(W.x - last.x, W.z - last.z) < W.half + 3) ? 200 : 0); if (s < bs) { bs = s; best = { x: last.x, z: last.z, wx: x, wz: z, ux, uz }; } }
      break;
    }
  }
  if (key != null) RAID2.shore[key] = best;
  return best;
}
// ---------- who raids whom ----------
function raid2Targets(i, kind) {
  const c = HUNT.camps[i], K = RAID2_K[kind], out = [], v = ownCamp(), me = P.a ? P.a.pos : null;
  const add = (j, t) => {
    const d = Math.hypot(t.x - c.x, t.z - c.z); if (d > K.range || d < 50) return;
    let land = null; if (kind === 'viking') { land = raid2Shore(t, j === 'own' ? `own${t.x | 0},${t.z | 0}` : j); if (!land) return; }
    const dp = me ? Math.hypot(t.x - me.x, t.z - me.z) : 9999;
    out.push({ j, t, land, w: (1 + 300 / (120 + dp)) * (j === 'own' ? 1.4 : 1) * (kind === 'horde' && t.civ === 'china' ? 1.4 : 1) });
  };
  for (let j = 0; j < HUNT.camps.length; j++) {
    const t = HUNT.camps[j];
    if (j === i || !t || t.gone || t.own || t.bandit || !isOld(t.x)) continue;
    if (!c.bandit && t.civ === c.civ) continue;
    if (polAllied(i, j) || isVassal(j, i) || isVassal(i, j)) continue;
    if (WAR.parties.some(p => !p.done && p.to === j)) continue;
    add(j, t);
  }
  // your village: unless you are friends (the bandits are nobody's friends)
  if (v && P.human && isOld(v.x) && !WAR.parties.some(p => !p.done && p.to === 'own') && (c.bandit || (campTrust(i) < 35 && !polAllied('own', i) && !isVassal(i, 'own')))) add('own', v);
  return out;
}
function raid2Pick(L) { let s = rng() * L.reduce((q, o) => q + o.w, 0); for (const o of L) { s -= o.w; if (s <= 0) return o; } return L[L.length - 1]; }
// ---------- the clock ----------
function raids2Update(dt) {
  if (!P.human || G.mode !== 'play' || !P.a) return;
  raid2Ships(dt);
  if ((RAID2.t -= dt) > 0) return;
  const step = 5 - RAID2.t; RAID2.t = 5;
  raid2Pending(step);
  if (!isOld(P.a.pos.x) && !(ownCamp() && isOld(ownCamp().x))) return;
  if ((RAID2.gT -= step * (isNight() ? 1.4 : 1)) > 0) return;
  if (RAID2.pend.length || WAR.parties.some(p => !p.done && p.kind2)) return;
  // which raiders are ready to ride out
  const ready = [];
  for (let i = 0; i < HUNT.camps.length; i++) {
    const c = HUNT.camps[i], kind = raid2Kind(c); if (!kind || c.dormant || !isOld(c.x)) continue;
    if ((RAID2.cd[i] || 0) > G.t) continue;
    if (kind === 'bandit' && !isNight() && rng() < 0.7) continue;
    if (c.hunters && !c.hunters.some(h => h.alive && !h.young) && !c.dormant) continue;
    const L = raid2Targets(i, kind); if (L.length) ready.push({ i, kind, L });
  }
  RAID2.gT = rr(360, 600);
  if (!ready.length) return;
  const R = pick(ready), T = raid2Pick(R.L);
  RAID2.cd[R.i] = G.t + rr(...RAID2_K[R.kind].every);
  raid2Start(R.i, T.j, R.kind, T.land);
}
// a raid is born: it waits a little (on the way), and runs before your eyes if you come near
function raid2Start(from, to, kind, land) {
  raid2Books(from); raid2Books(to);
  const K = RAID2_K[kind], tc = to === 'own' ? ownCamp() : HUNT.camps[to]; if (!tc) return null;
  const p = { id: ++WAR.seq, from, to, men: [], phase: 'pend', t: 0, n0: Math.round(rr(K.n[0], K.n[1] + 0.99)), got: { food: 0, caps: [], beasts: 0 }, lost: 0, done: false, mine: false, site: null, kind2: kind, land: land || null, pendT: to === 'own' ? 0 : rr(70, 110), helpK: 0 };
  const dp = Math.hypot(P.a.pos.x - tc.x, P.a.pos.z - tc.z);
  // near you it happens before your eyes; your village far from you: decided at once (the one in charge leads the defence)
  if (dp < RAID2_NEAR) { raid2Go(p); return p; }
  if (to === 'own') { WAR.parties.push(p); UI.notify(`${K.ic} ${raid2Who(p)} תקפו את הכפר בזמן שלא היית שם!`, 'bad'); raid2Abstract(p); return p; }
  RAID2.pend.push(p);
  if (dp < 900 && (VX.known.has(to) || VX.known.has(from))) { UI.notify(`${K.ic} ${raid2Who(p)} יוצאים לפשוט על ${campName(to)}! אם ${you('תגיע', 'תגיעי')} מהר, ${you('תוכל', 'תוכלי')} לעזור להם להדוף`, 'bad'); P.pings.push({ x: tc.x, z: tc.z, t: 20 }); }
  return p;
}
const raid2Who = p => p.kind2 === 'bandit' ? campName(p.from) : p.kind2 === 'viking' ? `ויקינגים מ${campName(p.from)}` : `${RAID2_K.horde.who} של ${campName(p.from)}`;
function raid2Pending(step) {
  for (const p of RAID2.pend.slice()) {
    const tc = raidTarget(p); if (!tc || tc.gone) { RAID2.pend.splice(RAID2.pend.indexOf(p), 1); continue; }
    p.pendT -= step;
    if (Math.hypot(P.a.pos.x - tc.x, P.a.pos.z - tc.z) < RAID2_NEAR) { RAID2.pend.splice(RAID2.pend.indexOf(p), 1); raid2Go(p); continue; }
    if (p.pendT <= 0) { RAID2.pend.splice(RAID2.pend.indexOf(p), 1); WAR.parties.push(p); raid2Abstract(p); }
  }
}
// ---------- before your eyes ----------
function raid2Go(p) {
  WAR.parties.push(p);
  if (p.kind2 === 'viking') raid2ShipIn(p); else raid2Land(p);
}
// one raider, in the look of his people
function raid2Man(p, x, z, k) {
  const c = HUNT.camps[p.from], tk = tribeKeyOf(c), role = k % 3 === 1 ? 'hunter' : 'warrior', sd = lookSeed();
  const h = new Animal('hunter', x, z, { sex: 'm', tpl: ensureTribal(role, tk, 'm', role === 'hunter' || k % 2 === 0, sd % 3), scale: rr(0.97, 1.06) }); h.ground(1, true);
  Object.assign(h, { hunter: true, camp: c, raider: p, cls: role, name: npcName(c, 'm'), pets: [], brain: 'raider', socialExtra: true, state: 'idle', spearCD: rr(0, 2), netCD: 99, vd: 260, rtask: 'fight', rwpn: role === 'hunter' ? 'bow' : k % 2 === 0 ? 'sword' : 'spear' });
  h.maxHp *= p.kind2 === 'bandit' ? 1 : 1.12; h.hp = h.maxHp; h.home.set(c.x, 0, c.z); civLook(h, c, sd);
  p.men.push(h); return h;
}
// what each one goes for: some drive off the animals, at your village some go for the store and the houses
function raid2Tasks(p) {
  const own = p.to === 'own', herd = raid2Herd(p).length, L = p.kind2 === 'horde' ? ['rustle', 'fight', 'rustle', 'fight', 'loot', 'rustle', 'fight'] : p.kind2 === 'bandit' ? ['loot', 'rustle', 'fight', 'loot', 'fight'] : ['fight', 'rustle', 'loot', 'fight', 'burn', 'fight', 'rustle', 'fight'];
  p.men.forEach((h, k) => { let t = L[k % L.length]; if (t === 'rustle' && !herd) t = 'fight'; if ((t === 'loot' || t === 'burn') && !own) t = 'fight'; h.rtask = t; });
}
// on foot or on horseback: they gather out of sight, then attack (the war party's usual way)
function raid2Land(p) {
  const c = HUNT.camps[p.from], tc = raidTarget(p); if (!c || !tc) { p.done = true; return; }
  const R = p.to === 'own' ? villageR() : (SET_R[tc.kind] || 14), base = Math.atan2(c.x - tc.x, c.z - tc.z);
  let sx = tc.x, sz = tc.z;
  for (let k = 0; k < 18; k++) { const ang = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.22, d = R + 60; sx = tc.x + Math.sin(ang) * d; sz = tc.z + Math.cos(ang) * d; if (inBounds(sx, sz) && waterDepth(sx, sz) === 0 && getNY(sx, sz) > 0.8) break; }
  p.sx = sx; p.sz = sz; p.ax = tc.x; p.az = tc.z; p.phase = 'gather'; p.t = 0;
  for (let k = 0; k < p.n0; k++) {
    const ang = Math.atan2(sx - tc.x, sz - tc.z) + rr(-0.5, 0.5), d = 24 + rr(0, 12);
    let x = sx + Math.sin(ang) * d, z = sz + Math.cos(ang) * d; if (!inBounds(x, z) || waterDepth(x, z) > 0) { x = sx + rr(-3, 3); z = sz + rr(-3, 3); }
    raid2Man(p, x, z, k);
  }
  // the riders of the steppe: every one on a horse
  if (p.kind2 === 'horde') for (const r of p.men) { const m = mountAnimal(mountOf(c) || 'horse', r.pos.x, r.pos.z, { scale: rr(0.98, 1.04) }); m.ground(1, true); Object.assign(m, { socialExtra: true, raidHorse: p, campHorse: null }); if (!mountUp(r, m)) m.remove(); }
  raid2Tasks(p);
  raid2Warn(p);
}
function raid2Warn(p) {
  const K = RAID2_K[p.kind2], at = p.land || { x: p.sx, z: p.sz };
  P.pings.push({ x: at.x, z: at.z, t: 20 });
  if (p.to === 'own') {
    AUD.play('horn', 0.8);
    UI.big(p.ship ? 'ספינת ויקינגים!' : p.kind2 === 'viking' ? 'ויקינגים!' : p.kind2 === 'horde' ? 'רוכבים!' : 'שודדים!', p.ship ? `ספינה של ${campName(p.from)} מתקרבת לחוף ליד הכפר, ועליה ${p.men.length} לוחמים` : p.kind2 === 'horde' ? `${p.men.length} רוכבים של ${campName(p.from)} דוהרים אל הכפר. הם באים לקחת את הבהמות` : `${p.men.length} ${p.kind2 === 'viking' ? 'ויקינגים' : 'שודדים'} מ${campName(p.from)} מתגנבים אל הכפר`);
    if (DEP.away && depWho()) depDeed(`${heb(depWho(), 'קרא', 'קראה')} לכולם להתכונן: ${raid2Who(p)} באים`);
  } else UI.notify(`${K.ic} ${raid2Who(p)} ${p.ship ? 'מפליגים אל החוף של' : 'תוקפים את'} ${campName(p.to)}! אפשר לעזור להם להדוף את הפושטים, והם יודו לך`, 'bad');
}
// ---------- the longship ----------
function raid2ShipMesh() {
  if (!RAID2.geo) { const B = new SB({ x: 0, y: 0, z: 0 }); longship(B, 0, 0, 0, 0); const m = B.mesh(); RAID2.geo = m.geometry; RAID2.mat = m.material; }
  const m = new THREE.Mesh(RAID2.geo, RAID2.mat); m.castShadow = true; m.receiveShadow = true; m.rotation.order = 'YXZ'; return m;
}
function raid2ShipIn(p) {
  const L = p.land, tc = raidTarget(p); if (!L || !tc) { p.land = null; raid2Land(p); return; }
  const stop = { x: L.wx + L.ux * 7.5, z: L.wz + L.uz * 7.5 }, sea = { x: L.wx + L.ux * 110, z: L.wz + L.uz * 110 };
  const S = { p, mesh: raid2ShipMesh(), x: sea.x, z: sea.z, y: 0.28, yaw: Math.atan2(-L.ux, -L.uz), ph: 'in', t: 0, stop, sea, land: { x: L.x, z: L.z }, crew: [] };
  scene.add(S.mesh); RAID2.ships.push(S); p.ship = S; p.phase = 'sail'; p.t = 0; p.sx = L.x; p.sz = L.z; p.ax = tc.x; p.az = tc.z;
  for (let k = 0; k < Math.min(8, p.n0); k++) { const h = raid2Man(p, sea.x, sea.z, k); h.aboard = S; h.deck = k; h.ownY = true; raid2Deck(h, S); }
  raid2Tasks(p);
  raid2Warn(p);
  raid2ShipPlace(S);
}
// a place on the deck: two rows of rowers along the ship
function raid2Deck(h, S) {
  const k = h.deck || 0, lx = k % 2 ? 0.6 : -0.6, lz = -3.7 + Math.floor(k / 2) * 1.6, cs = Math.cos(S.yaw), sn = Math.sin(S.yaw);
  h.pos.set(S.x + lx * cs + lz * sn, S.y + 0.48 + Math.sin(S.t * 1.3) * 0.06, S.z - lx * sn + lz * cs);
  h.yaw = S.yaw; h.speed = 0; if (h.vel) h.vel.set(0, 0, 0); h.pose = S.ph === 'wait' ? 'idle' : 'paddle';
}
function raid2Aboard(h, dt) {
  const S = h.aboard; if (!S || S.gone) { h.aboard = null; h.ownY = false; h.ground(1, true); return; }
  raid2Deck(h, S); h.spearCD -= dt;
}
// the crew who came back: they sit on the deck while the ship rows away
BRAIN.shipCrew = function (h) { const S = h.crewShip; if (!S || S.gone) { h.remove(); return; } raid2Deck(h, S); h.pose = 'paddle'; };
function raid2ShipPlace(S) {
  S.mesh.position.set(S.x, S.y + Math.sin(S.t * 1.3) * 0.06, S.z);
  S.mesh.rotation.set(Math.sin(S.t * 0.9) * 0.02, S.yaw, Math.sin(S.t * 1.1) * 0.035);
}
function raid2Ships(dt) {
  for (let k = RAID2.ships.length - 1; k >= 0; k--) {
    const S = RAID2.ships[k], p = S.p; S.t += dt;
    if (S.ph === 'in') {
      const dx = S.stop.x - S.x, dz = S.stop.z - S.z, d = Math.hypot(dx, dz), bow = waterDepth(S.x + Math.sin(S.yaw) * 6.5, S.z + Math.cos(S.yaw) * 6.5);
      if (d < 0.5 || (bow < 0.35 && d < 30)) { S.ph = 'wait'; raid2Ashore(S); }
      else { const sp = Math.min(6.5, 1 + d * 0.3); S.x += dx / d * sp * dt; S.z += dz / d * sp * dt; S.yaw += angDiff(S.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 1.5); }
    } else if (S.ph === 'wait') {
      if (p.done || !p.men.some(h => h.alive && !h.gone && !h.aboard)) { S.ph = 'out'; S.hold = 2.5; }
      else if (S.t > 420) { S.ph = 'out'; S.hold = 0; }
    } else if (S.ph === 'out') {
      if ((S.hold -= dt) <= 0) {
        const dx = S.sea.x - S.x, dz = S.sea.z - S.z, d = Math.hypot(dx, dz);
        if (d < 3) { S.sea = { x: S.x + (S.x - S.stop.x) * 1.5, z: S.z + (S.z - S.stop.z) * 1.5 }; }
        else { const sp = Math.min(5.5, 0.8 + (S.hold < -6 ? 5 : -S.hold)); S.x += dx / d * sp * dt; S.z += dz / d * sp * dt; S.yaw += angDiff(S.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 0.8); }
        if (S.hold < -60 || (S.hold < -20 && Math.hypot(S.x - camera.position.x, S.z - camera.position.z) > 230)) { raid2ShipGone(S); RAID2.ships.splice(k, 1); continue; }
      }
    }
    raid2ShipPlace(S);
  }
}
function raid2ShipGone(S) { S.gone = true; scene.remove(S.mesh); for (const h of S.crew) if (!h.gone) h.remove(); for (const h of S.p.men) if (h.aboard === S && !h.gone) h.remove(); }
// the bow is on the sand: everyone jumps off and runs up the beach
function raid2Ashore(S) {
  const p = S.p; p.phase = 'attack'; p.t = 0;
  for (const h of p.men) {
    if (h.aboard !== S) continue;
    h.aboard = null; h.ownY = false;
    let x = S.land.x, z = S.land.z;
    for (let t = 0; t < 8; t++) { const qx = S.land.x + rr(-3.5, 3.5), qz = S.land.z + rr(-3.5, 3.5); if (waterDepth(qx, qz) <= 0) { x = qx; z = qz; break; } }
    h.pos.set(x, 0, z); h.ground(1, true); h.state = 'idle'; h.think = rr(0, 0.6);
  }
  if (S.p.to === 'own' || Math.hypot(camera.position.x - S.x, camera.position.z - S.z) < 160) AUD.play('horn', 0.7);
  raidAnnounce(p);
  if (p.men[0] && p.men[0].dCam < 60) say(p.men[0], pick(['קדימה! לחוף!', 'לאודין!', 'לוקחים הכל!']), 2.4);
}
// home for the raiders of a ship is the ship: they climb aboard with what they took
function raid2ShipHome(h, p, dt) {
  const S = p.ship, d = jobGo(h, S.land.x, S.land.z, h.sp.run * (h.rust ? 0.7 : 0.85), dt);
  if (d < 3.2 || (h.dCam > 90 && Math.hypot(h.pos.x - S.land.x, h.pos.z - S.land.z) < 40)) {
    raiderGone(h, true, true);
    if (!h.gone && h.alive && S.crew.length < 8 && !S.gone) { h.brain = 'shipCrew'; h.crewShip = S; h.deck = S.crew.length; h.ownY = true; h.raider = null; h.hunter = true; S.crew.push(h); }
    else if (!h.gone) h.remove();
  }
}
// ---------- the animals they drive off ----------
function raid2Herd(p) {
  const tc = raidTarget(p); if (!tc) return [];
  const g = p.to === 'own' ? (ownCamp() || {}).cowGroup : tc.cowGroup; if (!g) return [];
  return g.members.filter(m => m.alive && !m.gone && !m.young && !m.rustler && !m.rider && !m.harness);
}
BRAIN.rustled = function (a, dt) {
  const r = a.rustler;
  if (!r || !r.alive || r.gone || r.rust !== a) { a.brain = null; a.rustler = null; a.state = 'idle'; a.stT = 2; return; }
  const tx = r.pos.x - Math.sin(r.yaw) * 2.4, tz = r.pos.z - Math.cos(r.yaw) * 2.4, dx = tx - a.pos.x, dz = tz - a.pos.z, d = Math.hypot(dx, dz);
  if (d > 0.6) a.move(dx / d, dz / d, Math.min(a.sp.run, Math.max(1.2, d * 1.5)), dt); else a.move(0, 0, 0, dt);
  a.pose = a.speed > 0.2 ? 'move' : 'idle';
  if (d > 30) { a.pos.set(tx, 0, tz); a.ground(1, true); }
};
function rustleTask(h, p, dt) {
  if (h.rust) { h.rret = true; return true; }
  let b = h.rustT && h.rustT.alive && !h.rustT.gone && !h.rustT.rustler ? h.rustT : null;
  if (!b) { const L = raid2Herd(p); b = h.rustT = L.length ? L.sort((x, y) => dist2(x.pos, h.pos) - dist2(y.pos, h.pos))[0] : null; if (!b) return false; }
  const d = jobGo(h, b.pos.x, b.pos.z, h.sp.run * 0.85, dt);
  if (d < 2.4) {
    b.rustler = h; b.brain = 'rustled'; b.state = 'idle'; h.rust = b; h.rustT = null; h.rret = true; p.got.beasts = (p.got.beasts || 0) + 1;
    if (h.dCam < 40) say(h, pick(['זה בא איתי!', 'בהמה שמנה!', 'יופי של בהמה']), 2);
    if (p.to === 'own') { UI.notify(`🐑 ${h.name} גונב ${b.sp.he} מהכפר! אם יפול, היא תחזור`, 'bad'); P.pings.push({ x: h.pos.x, z: h.pos.z, t: 8 }); }
  }
  return true;
}
// a raider is out of the fight: the animal he led stays behind, or goes with him
function raid2Release(h, home) {
  const b = h.rust; h.rust = null; if (!b) return;
  b.rustler = null; b.brain = null;
  const p = h.raider;
  if (!home) { if (p) p.got.beasts = Math.max(0, (p.got.beasts || 0) - 1); if (b.alive && b.dCam < 60 && p && p.to === 'own') combatText(`${b.sp.he} ${b.sex === 'f' ? 'חוזרת' : 'חוזר'} לעדר`, 'good'); return; }
  if (!b.alive || b.gone) return;
  const c = p && HUNT.camps[p.from];
  if (c && c.cowGroup && !c.dormant && !p.ship) cowMove(b, c);
  else { const g = b.group; if (g) { const k = g.members.indexOf(b); if (k >= 0) g.members.splice(k, 1); if (g.leader === b) g.leader = g.members.find(q => q.alive) || null; } b.remove(); }
}
// ---------- far from you: decided at once, and you hear about it ----------
function raid2Abstract(p) {
  p.done = true; p.abstract = true; p.doneT = G.t;
  if (p.to === 'own') { raidAbstract(p); return; }
  const A = p.n0 * (p.kind2 === 'horde' ? 1.45 : p.kind2 === 'viking' ? 1.4 : 1.0) * rr(0.7, 1.3), D = npcPower(p.to) * rr(0.7, 1.3), win = A > D;
  if (win) {
    const b = Math.min(p.kind2 === 'horde' ? 3 : 2, raid2Herd(p).filter(m => (m.dCam || 999) > 150).length);
    for (const m of raid2Herd(p).filter(q => (q.dCam || 999) > 150).slice(0, b)) { const g = m.group; if (g) { const k = g.members.indexOf(m); if (k >= 0) g.members.splice(k, 1); if (g.leader === m) g.leader = g.members.find(q => q.alive) || null; } m.remove(); }
    p.got.beasts = b; p.got.food = Math.round(Math.min(WAR.food[p.to] || 0, 3 + A * 1.2));
  } else p.lost = Math.ceil(p.n0 / 2);
  raidEnd(p);
}
// the words for how it ended (a town, not your village)
function raid2Words(p, win) {
  const K = RAID2_K[p.kind2], who = raid2Who(p), W = [p.got.food ? `${p.got.food} מנות אוכל` : '', p.got.beasts ? (p.got.beasts === 1 ? 'בהמה אחת' : `${p.got.beasts} בהמות`) : ''].filter(Boolean);
  const what = W.length > 1 ? `${W[0]} ו${/^\d/.test(W[1]) ? '-' : ''}${W[1]}` : W[0] || '';
  return win ? `${K.ic} ${who} ${p.kind2 === 'viking' ? 'הגיעו מהים ופשטו' : 'פשטו'} על ${campName(p.to)}${what ? ` ולקחו ${what}` : ''}` : `${K.ic} ${campName(p.to)} הדפו ${p.kind2 === 'viking' ? 'ספינת ויקינגים' : p.kind2 === 'bandit' ? 'פשיטה של שודדים' : 'רוכבים'} ${p.kind2 === 'viking' ? `מ${campName(p.from)}` : `של ${campName(p.from)}`}`;
}
// after a raid on a town: the grudge between them, and the thanks to whoever helped
function raid2After(p, win) {
  if (p.to === 'own') return;
  if (!HUNT.camps[p.from].bandit) npcTrustAdd(p.from, p.to, -10);
  if (!win && p.helpK > 0 && HUNT.camps[p.to] && !HUNT.camps[p.to].gone) {
    const g = Math.min(40, 8 + p.helpK * 5); goldAdd(g); addTrust(p.to, 6 + p.helpK * 2);
    UI.notify(`🪙 ${campName(p.to)} מודים לך על העזרה בהדיפת ${raid2Who(p)}: קיבלת ${g} זהב`, 'good'); AUD.play('cheer', 0.5);
    warLog(`עזרת ל${campName(p.to)} להדוף ${raid2Who(p)}`, 'good'); PROG.flags.raidHelp = (PROG.flags.raidHelp || 0) + 1;
  }
}
// your raid at night: the people asleep wake slowly
function raid2Night(c) {
  let n = 0;
  for (const h of c.hunters) if (h.alive && !h.young && h.cls !== 'chief' && h.brain !== 'villager' && rng() < 0.45) { h.stun = rr(4, 9); n++; }
  return n;
}
// ---------- on the maps: the longships at sea ----------
function raid2MiniDots(pt) { for (const S of RAID2.ships) if (!S.gone) pt(S.x, S.z, 6, '#c8743a', true); }
function raid2BigMap(c, m) {
  c.save(); c.font = 'bold 18px Rubik,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const S of RAID2.ships) { if (S.gone) continue; const [x, y] = m(S.x, S.z); c.fillStyle = '#ff5a48'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillText('⛵', x, y + 1); }
  c.restore();
}
