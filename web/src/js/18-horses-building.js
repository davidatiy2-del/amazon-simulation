// ================= HORSES AND CATTLE: wild herds on the meadows, a stable for the tribe, riding, and a village herd of cows that grows =================
SPECIES.horse = { he: 'סוס', lat: 'Equus ferus caballus', kind: 'quad', ai: 'herb', hp: 140, dmg: 10, walk: 1.7, run: 11, swim: 1.6, reach: 1.5, atkCD: 1.2, sense: 36, safe: 70, food: 120, turn: 4,
  count: 5, group: [4, 8], hab: 'open', size: [0.95, 1.06], danger: 1, herd: true, fight: 0.5, diet: 'עשב', tpls: ['horse', 'horse2', 'horse3', 'horse4', 'horse5'],
  guide: 'סוסי בר רועים בעדרים בערבות הפתוחות. הם בורחים מהר מכל טורף, והסייחים רצים צמוד לאמהות. סוס מאולף נושא את הצייד מהר מכל הליכה.' };
if (!GUIDE_ORDER.includes('horse')) GUIDE_ORDER.push('horse');
for (const p of ['jaguar', 'puma']) if (SPECIES[p] && SPECIES[p].prey && !SPECIES[p].prey.includes('horse')) SPECIES[p].prey.push('horse');
PACKN.horse = 'עדרי סוסים';
CTXT.ride = ['horse', 'לרכוב', 'לעלות על הסוס'];
CTXT.unride = ['down', 'לרדת', 'לרדת מהסוס'];
const HORSEN = { m: ['רוח', 'ברק', 'סער', 'שחור', 'כוכב', 'רעם', 'אש', 'נוצה'], f: ['סערה', 'זהבית', 'לבנה', 'שלגיה', 'ענבר', 'כוכבה', 'נועה', 'רוחה'] };
// ---------- the horse: long legs, a long neck, a mane and a full tail ----------
function horseMane(ctx) {
  const { R, chest, neck, head, C } = ctx, nb = R.wp[neck].clone(), hd = R.wp[head].clone(), pts = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7, p = nb.clone().lerp(hd, t); p.y += 0.11 + (1 - t) * 0.07; p.z -= 0.05 + (1 - t) * 0.03; pts.push(p); }
  R.add(loft(pts, t => [0.028, 0.075 * (1 - t * 0.45)], 6), null, (x, y, z) => { const t = projT(nb, hd, x, y, z); return t < 0.45 ? [chest, neck, smooth(0, 0.45, t)] : [neck, head, smooth(0.55, 1.1, t)]; }, C.mane, 1);
  // a forelock between the ears
  R.add(new THREE.SphereGeometry(1, 8, 6), M([hd.x, hd.y + ctx.hr * 0.75, hd.z + ctx.hr * 0.35], [0.5, 0, 0], [ctx.hr * 0.35, ctx.hr * 0.18, ctx.hr * 0.45]), head, C.mane, 1);
}
function buildHorseTpls() {
  if (TPL.horse) return;
  const T = TPL.tapir.o;
  const horse = c => buildQuad(Object.assign({}, T, { L: 1.12, chestR: 0.33, hipR: 0.32, wid: 0.7, legLen: 0.92, legR: 0.058, pawR: 0.068, upFrac: 0.5, neckLen: 0.62, neckR: 0.135, neckUp: 0.92, neckWid: 0.75,
    headR: 0.12, headWid: 0.82, snoutLen: 0.36, snoutR: 0.085, snoutSquash: 0.95, snoutY: -0.03, ear: 'point', earR: 0.045, earUp: 0.92, tailLen: 0.78, tailR: 0.075, tailN: 3, tailTip: 0.9, tailBush: true, tailY: 0.55, c, extra: horseMane }));
  TPL.horse = horse({ fur: '#7a4a2a', belly: '#6a3e22', nose: '#2a1c14', eye: '#120e0c', ear: '#5a3420', mane: '#1c1410', tail: '#1c1410', paw: '#1c1612', legs: '#2a1c14' });
  TPL.horse2 = horse({ fur: '#a0602e', belly: '#8e5428', nose: '#3a2a20', eye: '#120e0c', ear: '#8a5028', mane: '#7a4220', tail: '#7a4220', paw: '#2a1e16' });
  TPL.horse3 = horse({ fur: '#26211e', belly: '#201c1a', nose: '#141010', eye: '#0a0808', ear: '#201c1a', mane: '#0e0c0b', tail: '#0e0c0b', paw: '#141010' });
  TPL.horse4 = horse({ fur: '#cfc9be', belly: '#c2bcb0', nose: '#6a625a', eye: '#120e0c', ear: '#bdb6aa', mane: '#e6e1d6', tail: '#e6e1d6', paw: '#4a4440' });
  TPL.horse5 = horse({ fur: '#c9a25a', belly: '#bb944e', nose: '#5a4632', eye: '#120e0c', ear: '#b08a48', mane: '#efe3c4', tail: '#efe3c4', paw: '#3a2e22' });
}
// wild herds: on the open meadows of the new land, or in any clearing
function spawnHorses(n, okFar) {
  buildHorseTpls();
  let c = null, bs = -1e9;
  for (let t = 0; t < 70; t++) {
    const x = rr(-JL + 40, JL - 40), z = rr(-JL + 40, JL - 40);
    if (!inBounds(x, z) || waterDepth(x, z) > 0 || getNY(x, z) < 0.9 || !okFar({ x, z })) continue;
    if (HUNT.camps.some(q => !q.gone && Math.hypot(q.x - x, q.z - z) < 90)) continue;
    const s = meadowK(x, z) * 40 + (1 - gridAt(FOREST, x, z)) * 20 + rng() * 6; if (s > bs) { bs = s; c = { x, z }; }
  }
  if (!c) return n;
  const grp = { kind: 'herd', members: [], leader: null }; GROUPS.push(grp);
  for (let i = 0; i < n; i++) {
    let x = c.x + rr(-6, 6), z = c.z + rr(-6, 6); if (waterDepth(x, z) > 0) { x = c.x; z = c.z; }
    const a = new Animal('horse', x, z, { group: grp, young: i >= 3 && rng() < 0.3 }); a.ground(1, true); grp.members.push(a); if (!grp.leader) grp.leader = a;
  }
  return n;
}
// ---------- the stable: the hunters bring wild horses and tame them for the tribe ----------
const tribeHorses = () => ANIMALS.filter(h => h.alive && !h.gone && h.tribeHorse);
const HORSE = { acc: 0, t: 0, cowT: 0, cowDay: -1 };
function makeTribeHorse(b, o) {
  buildHorseTpls();
  o = o || {};
  const sex = o.s || (rng() < 0.5 ? 'm' : 'f'), ang = rng() * TAU; let x = b ? b.x + Math.cos(ang) * 5 : o.x, z = b ? b.z + Math.sin(ang) * 5 : o.z;
  if (b && waterDepth(x, z) > 0) { x = b.x; z = b.z + 4; }
  const h = new Animal('horse', x, z, { sex, tpl: o.k && TPL[o.k] ? o.k : pick(SPECIES.horse.tpls), scale: rr(0.98, 1.05) }); h.ground(1, true);
  h.name = o.n || pick(HORSEN[sex]); h.tribeHorse = true; h.socialExtra = true; h.leash = 13; h.home.set(b ? b.x : x, 0, b ? b.z : z); h.stableB = b || null; h.mine = !!o.m;
  return h;
}
function stableTick(gh) {
  const st = BLD.list.filter(b => b.done && b.t === 'stable'), hs = tribeHorses();
  for (const h of hs) if (!h.stableB || !BLD.list.includes(h.stableB) || !h.stableB.done) { const b = st.length ? st.reduce((p, q) => dist2(q, h.pos) < dist2(p, h.pos) ? q : p) : null; h.stableB = b; if (b) h.home.set(b.x, 0, b.z); }
  if (!st.length || hs.length >= st.length * 3) return;
  HORSE.acc += gh / 7 * st.length; if (!hs.length) HORSE.acc = 1;   // a new stable gets its first horse at once
  if (HORSE.acc < 1) return; HORSE.acc = 0;
  const b = pick(st), h = makeTribeHorse(b);
  PROG.flags.tribeHorse = 1;
  UI.notify(`🐎 הציידים הביאו סוס בר ואילפו אותו: ${h.name}. אפשר לרכוב ${heb(h, 'עליו', 'עליה')} (כפתור הזהב ליד הסוס)`, 'good');
}
// ---------- riding ----------
BRAIN.ridden = function (a) { a.state = 'idle'; };
function rideNear() {
  const a = P.a; let best = null, bd = 2.8;
  for (const h of tribeHorses()) { if (h.ridden || h.rider || h.swimming) continue; const d = Math.hypot(h.pos.x - a.pos.x, h.pos.z - a.pos.z); if (d < bd) { bd = d; best = h; } }
  return best;
}
function rideCtx() {
  if (P.ride) return 'unride';
  if (!P.human || P.boat || P.climb || P.a.swimming) return null;
  return rideNear() ? 'ride' : null;
}
CTXH.ride = () => { if (CLB.latch) return; CLB.latch = true; const h = rideNear(); if (h) rideStart(h); };
CTXH.unride = () => { if (CLB.latch) return; CLB.latch = true; rideEnd(); };
const seatY = h => (h.tpl.by + h.tpl.o.bodyR * 0.62) * h.scale - 0.46;
function rideStart(h) {
  const a = P.a; if (!h || !a || P.ride) return;
  P.ride = h; h.ridden = true; h.prevBrain = h.brain || null; h.brain = 'ridden'; h.state = 'idle'; h.foe = null; h.threat = null;
  a.ownY = true; P.crouch = false; P.resting = false; P.dive = false;
  CAM.yaw = h.yaw; PROG.flags.ride = 1; AUD.play('clack', 0.5);
  if (!HORSE.told) { HORSE.told = 1; UI.notify(TOUCH ? `${h.name} נושא אותך. הג׳ויסטיק מכוון, ריצה דוהרת. כפתור הזהב: לרדת` : `${h.name} נושא אותך. WASD מכוונים, Shift דוהר. E: לרדת`, 'good'); }
}
function rideEnd(quiet) {
  const a = P.a, h = P.ride; if (!h) return;
  P.ride = null; h.ridden = false; h.brain = h.prevBrain || null; h.speed = 0; h.state = 'idle'; h.stT = 2;
  if (h.wild) { h.wild = false; h.tameCD = G.t + 8; TAME.w = null; }
  if (h.mine && !h.stableB) h.home.set(h.pos.x, 0, h.pos.z);   // the hunter's own horse waits where he got off
  if (!a) return;
  a.ownY = false;
  // step off to the side, onto dry open ground
  const sx = Math.cos(h.yaw), sz = -Math.sin(h.yaw); let px = h.pos.x + sx * 1.2, pz = h.pos.z + sz * 1.2;
  if (waterDepth(px, pz) > 0.3 || trunkPush({ x: px, z: pz }, 0.4)) { px = h.pos.x - sx * 1.2; pz = h.pos.z - sz * 1.2; }
  if (waterDepth(px, pz) > 0.3) { px = h.pos.x; pz = h.pos.z; }
  a.pos.set(px, 0, pz); a.ground(1, true); a.speed = 0;
  if (!quiet) AUD.play('clack', 0.35);
}
function rideStep(dt, dx, dz, mag, wantRun) {
  const a = P.a, h = P.ride;
  if (!h || !h.alive || h.gone || !a || !a.alive || P.sleeping || G.mode !== 'play') { rideEnd(true); return; }
  if (h.wild) { horseBuck(h, dt, dx, dz, mag); return; }
  const fast = wantRun && P.stam > 3 && mag > 0.3, spd = mag < 0.08 ? 0 : fast ? 12 : mag > 0.7 ? 6.5 : 3.4 * Math.max(0.4, mag);
  if (fast) P.stam = Math.max(0, P.stam - dt * 4); else P.stam = Math.min(100, P.stam + dt * 10);
  P.running = fast;
  if (mag > 0.08) h.yaw += angDiff(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * (fast ? 3.2 : 4.5));
  // deep water stops the horse; the rider would have to swim
  const nx = h.pos.x + Math.sin(h.yaw) * 1.6, nz = h.pos.z + Math.cos(h.yaw) * 1.6;
  const wet = waterDepth(nx, nz) > 0.85;
  h.move(Math.sin(h.yaw), Math.cos(h.yaw), wet ? 0 : spd, dt); h.pose = h.speed > 0.2 ? 'move' : 'idle';
  if (wet && spd > 0 && G.t - (HORSE.wetT || -9) > 4) { HORSE.wetT = G.t; combatText('המים עמוקים מדי לסוס', 'bad'); }
  const back = h.tpl.L * 0.08 * h.scale;
  a.pos.set(h.pos.x - Math.sin(h.yaw) * back, h.pos.y + seatY(h), h.pos.z - Math.cos(h.yaw) * back);
  a.yaw = h.yaw; a.speed = 0; a.swimming = false; a.airborne = false; a.vy = 0;
  if (h.speed > 7 && rng() < dt * 3 && h.dCam < 40) FX.spawn('dust', h.pos.x, h.pos.y + 0.1, h.pos.z, 2);
}
// ---------- the village herd: calves are born, and the cows give milk for the store ----------
function cowsDaily() {
  const v = ownCamp(); if (!v || !v.cowGroup) return;
  const g = v.cowGroup, cows = g.members.filter(m => m.alive && !m.gone), st = boxStore();
  const milk = Math.floor(cows.filter(m => !m.young).length / 2); if (milk) { st.cooked += milk; }
  if (cows.length < cowCap(v) && st.cooked + st.meat + st.fish > popCount() * 1.2) {
    const mom = cows.find(m => !m.young && m.sex === 'f') || cows[0]; if (!mom) { addCow(v, g); return; }
    const c = new Animal('cow', mom.pos.x + rr(-1.5, 1.5), mom.pos.z + rr(-1.5, 1.5), { group: g, young: true, tpl: mom.tplKey }); c.ground(1, true);
    c.home.set(v.x, 0, v.z); c.leash = 16; c.cowCamp = v; c.growH = 0; g.members.push(c); NATURE.young.push(c);
    tribeNews(`🐄 עגל נולד בעדר של הכפר (${cows.length + 1} פרות)`);
  }
  if (milk && P.a && dist2(P.a.pos, v) < villageR() + 60 && !HORSE.milkTold) { HORSE.milkTold = 1; UI.notify(`🥛 האוספים חולבים את הפרות כל בוקר: ${milk} מנות למחסן`, 'good'); }
}
function horsesUpdate(dt) {
  if (!ICON.horse) ICON.horse = SVG('<path d="M7 21v-6c0-3 1-5 3-6l-1-4 3 2c3 0 6 2 7 6l1 3-2 1-2-2h-2l-2 6"/><path d="M10 9l-2 2"/>');
  if ((HORSE.t -= dt) <= 0) { const step = 2 - HORSE.t; HORSE.t = 2; if (ownCamp()) stableTick(step * timeRate()); }
  const v = ownCamp();
  if (v && HORSE.cowDay !== G.day && G.time > 7.5) { if (HORSE.cowDay >= 0) cowsDaily(); HORSE.cowDay = G.day; }
}
function horsesSave() { return tribeHorses().map(h => [h.name, h.sex, h.tplKey, h.stableB ? BLD.list.indexOf(h.stableB) : -1, +h.pos.x.toFixed(1), +h.pos.z.toFixed(1), h.mine ? 1 : 0]); }
function horsesReset() { if (P.ride) rideEnd(true); for (const h of tribeHorses()) h.remove(); HORSE.acc = 0; HORSE.cowDay = -1; HORSE.told = 0; HORSE.milkTold = 0; }
function horsesLoad(list) {
  for (const [n, s, k, bi, x, z, m] of list || []) {
    const b = BLD.list[bi] && BLD.list[bi].t === 'stable' ? BLD.list[bi] : BLD.list.find(q => q.t === 'stable');
    if (!b && (x == null || !(m || ownCamp()))) continue;   // a horse without a stable: the hunter's own, or the village's
    const v = ownCamp(), h = makeTribeHorse(b || null, { n, s, k, m, x: x ?? (v ? v.x : 0), z: z ?? (v ? v.z : 0) }); if (x != null && waterDepth(x, z) === 0) { h.pos.set(x, 0, z); h.ground(1, true); if (!b) h.home.set(m ? x : v ? v.x : x, 0, m ? z : v ? v.z : z); }
  }
}
// ================= CLEARING THE GROUND: bushes and stumps are pulled out, by the hunter or by the builders =================
// The hunter clears with the gold button: a stump (it gives a little wood and no tree grows there again), or the bushes around.
// The builders clear the village by themselves when they have nothing else to do.
const CLEARABLE = new Set(['bush', 'fern', 'heli', 'log']);
const AUTOCLEAR = new Set(['bush', 'log']);
const CLR = { t: 0, e: null, cur: null, keysS: new Set(), keysU: new Set(), trees: [], snd: 0 };
CTXT.clearBrush = ['axe', 'לנקות', 'להחזיק כדי לעקור שיח או גדם'];
// the nearest stump or bush around a point (in front counts more); auto: only what the builders clear
function clearFind(x, z, r, fx, fz, auto, claimFree) {
  let best = null, bs = 1e9;
  const x0 = g10c(x - r), x1 = g10c(x + r), z0 = g10r(x, z - r), z1 = g10r(x, z + r);
  const score = (e, d) => d - (fx != null && d > 0.01 ? ((e.x - x) * fx + (e.z - z) * fz) / d * 0.6 : 0);
  for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
    const k = iz * GN + ix;
    for (const e of TREES.g[k] || []) {
      if (!e.cut || e.stump == null || e.sap > 0 || (claimFree && e.clrBy && e.clrBy.alive && e.clrBy.job && e.clrBy.job.f && e.clrBy.job.f.e === e)) continue;
      const d = Math.hypot(e.x - x, e.z - z); if (d > r) continue; const s = score(e, d); if (s < bs) { bs = s; best = { e, kind: 'stump', d }; }
    }
    for (const e of TREES.u[k] || []) {
      if (e.cut || e.ghost || !(auto ? AUTOCLEAR : CLEARABLE).has(e.id) || (claimFree && e.clrBy && e.clrBy.alive && e.clrBy.job && e.clrBy.job.f && e.clrBy.job.f.e === e)) continue;
      const d = Math.hypot(e.x - x, e.z - z); if (d > r) continue; const s = score(e, d) + (auto ? 1000 : 0.3); if (s < bs) { bs = s; best = { e, kind: 'bush', d }; }
    }
  }
  return best;
}
function clearCtx() {
  const a = P.a; if (P.ride || P.boat || a.swimming) return null;
  // keep pulling at the same stump or bush while the button is held
  const c = CLR.cur; if ((KEYS.KeyE || INPUT.use) && P.ctx === 'clearBrush' && c && !(c.kind === 'stump' ? c.e.stump == null : c.e.cut) && Math.hypot(c.e.x - a.pos.x, c.e.z - a.pos.z) < 2.4) return 'clearBrush';
  const f = clearFind(a.pos.x, a.pos.z, 1.8, Math.sin(a.yaw), Math.cos(a.yaw), false); if (!f) return null;
  CLR.cur = f; return 'clearBrush';
}
// a stump or bush right in front of the hunter comes before a tree a little farther away
function clearBeforeTree(e) {
  const a = P.a, c = CLR.cur; if (!c) return false;
  const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), d = c.d ?? Math.hypot(c.e.x - a.pos.x, c.e.z - a.pos.z), dot = d > 0.01 ? ((c.e.x - a.pos.x) * fx + (c.e.z - a.pos.z) * fz) / d : 1;
  return dot > 0.55 && d < Math.hypot(e.x - a.pos.x, e.z - a.pos.z) - treeTrunkR(e) - 0.2;
}
CTXH.clearBrush = dt => {
  const a = P.a, f = CLR.cur; if (!f || (f.kind === 'stump' ? f.e.stump == null : f.e.cut)) return;
  if (CLR.e !== f.e) { CLR.e = f.e; CLR.t = 0; }
  P.eating = false; showTool('axe'); a.chopT = 0.35;
  a.yaw += angDiff(a.yaw, Math.atan2(f.e.x - a.pos.x, f.e.z - a.pos.z)) * Math.min(1, dt * 6);
  CLR.t += dt;
  if ((CLR.snd -= dt) <= 0) { CLR.snd = 0.6; AUD.play('chop', 0.6); FX.spawn('dust', f.e.x, getH(f.e.x, f.e.z) + 0.4, f.e.z, 3); }
  const need = f.kind === 'stump' ? 2.4 * clamp(f.e.sc || 1, 0.7, 1.4) : 0.9;
  vxProgress(CLR.t / need, f.kind === 'stump' ? 'עוקרים את הגדם...' : 'מנקים את השיחים...');
  if (CLR.t < need) return;
  CLR.t = 0; CLR.e = null; PROG.flags.clearBrush = (PROG.flags.clearBrush || 0) + 1;
  if (f.kind === 'stump') { clearStump(f.e); giveWood(1, 'הגדם נעקר!'); }
  else { const n = clearBushAt(f.e.x, f.e.z, 1.4, CLEARABLE); combatText(n > 1 ? `פינית ${n} שיחים` : 'פינית את השיח', 'good'); }
};
// a stump pulled out: no tree grows there again
function clearStump(e) {
  if (e.stump == null) return;
  stumpHide(e); e.cleared = true; CLR.trees.push(e);
  const i = TREES.cutList.indexOf(e); if (i >= 0) TREES.cutList.splice(i, 1);
  CLR.keysS.add(tkey(e.x, e.z));
  if (Math.hypot(camera.position.x - e.x, camera.position.z - e.z) < 60) FX.spawn('dust', e.x, getH(e.x, e.z) + 0.3, e.z, 8);
}
function clearBush(e) { if (e.cut) return; hideInst(e); e.cut = true; TREES.uncl.push(e); CLR.keysU.add(tkey(e.x, e.z)); }
function clearBushAt(x, z, r, kinds) { let n = 0; treeScan(TREES.u, x, z, r, e => { if (kinds.has(e.id)) { clearBush(e); n++; } }); return n; }
// ---------- the builders tidy the village: stumps and thick bushes inside it ----------
function clearJobPick(a, v) {
  const f = clearFind(v.x, v.z, villageR(), null, null, true, true); if (!f) return null;
  f.e.clrBy = a; return f;
}
function clearJob(a, dt) {
  const j = a.job, f = j.f, e = f && f.e;
  if (!e || (f.kind === 'stump' ? e.stump == null : e.cut)) { a.job = null; return; }
  if (j.x == null) { const ang = Math.atan2(a.pos.x - e.x, a.pos.z - e.z), r = f.kind === 'stump' ? treeTrunkR(e) + 0.8 : 0.9; j.x = e.x + Math.sin(ang) * r; j.z = e.z + Math.cos(ang) * r; j.T = 60; }
  if ((j.T -= dt) <= 0) { e.clrBy = null; a.job = null; return; }
  if (jobGo(a, j.x, j.z, a.sp.walk * 1.3, dt) > 0.8) return;
  a.move(0, 0, 0, dt); a.yaw += angDiff(a.yaw, Math.atan2(e.x - a.pos.x, e.z - a.pos.z)) * Math.min(1, dt * 5); a.pose = f.kind === 'stump' ? 'chop' : 'gather';
  if ((j.snd = (j.snd || 0) - dt) <= 0) { j.snd = 0.75; if (a.dCam < 45) AUD.at('chop', a.pos, 0.5); }
  j.t = (j.t || 0) + dt;
  if (j.t < (f.kind === 'stump' ? 3.2 : 1.6)) return;
  if (f.kind === 'stump') { clearStump(e); boxStore(); CAMPH.store.wood += 1; } else clearBushAt(e.x, e.z, 1.3, AUTOCLEAR);
  e.clrBy = null; a.job = null;
}
// ---------- save and load ----------
function clearSave() { return { s: [...CLR.keysS], u: [...CLR.keysU] }; }
// a new game: the trees whose stumps were pulled out stand again (the rest of the forest was already restored)
function clearReset() {
  for (const e of CLR.trees) { if (!e.cleared) continue; e.cleared = false; showInst(e); e.cut = false; e.sap = 0; e.cutH = null; e.stump = null; if (!e.ghost) treeSolid(e); }
  CLR.trees = []; CLR.keysS = new Set(); CLR.keysU = new Set(); CLR.e = null; CLR.cur = null;
}
function clearLoad(d) {
  clearReset(); if (!d) return;
  for (const k of d.s || []) { const [x, z] = k.split(',').map(n => +n / 10); let best = null, bd = 0.25; for (let iz = -1; iz <= 1; iz++) for (let ix = -1; ix <= 1; ix++) { const L = TREES.g[clamp(((z + W.half) / 10 | 0) + iz, 0, GN - 1) * GN + clamp(((x + W.half) / 10 | 0) + ix, 0, GN - 1)]; if (L) for (const e of L) { const d = Math.hypot(e.x - x, e.z - z); if (e.cut && d < bd) { bd = d; best = e; } } } if (best) clearStump(best); }
  for (const k of d.u || []) { const [x, z] = k.split(',').map(n => +n / 10); treeScan(TREES.u, x, z, 0.3, e => { clearBush(e); return false; }); }
}
// ================= CHANGING THE VILLAGE: take any building down (its wood goes back to the store) or move it to a new place =================
// From the build screen: walk to a building and look at it (it is marked in orange), then move it or take it down.
// A fence line can be taken down piece by piece or all at once.
const MNG = { on: false, b: null, hud: null, ring: null, chk: 0, confirm: 0, line: false };
function manageStart(silent) {
  if (!ownCamp() || !P.a) return;
  if (BLD.mode) buildCancel(true);
  MNG.on = true; MNG.b = null; MNG.confirm = 0; MNG.chk = 0; manageHud(true);
  if (!silent) UI.notify(TOUCH ? 'הולכים למבנה ומסתכלים עליו: הוא מסומן בכתום. אפשר להזיז אותו או להרוס, והעצים חוזרים למחסן' : 'הולכים למבנה ומסתכלים עליו (מסומן בכתום). E להזיז · X להרוס · Esc סיום. העצים חוזרים למחסן', 'good');
}
function manageEnd() { MNG.on = false; MNG.b = null; manageHud(false); if (MNG.ring) MNG.ring.visible = false; }
// the building the hunter looks at: in front of him, within a few steps
function managePick() {
  const a = P.a, fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw), ax = a.pos.x + fx * 4.5, az = a.pos.z + fz * 4.5;
  let best = null, bs = 1e9;
  for (const b of BLD.list) {
    if (bldDist(b, a.pos.x, a.pos.z) - bldR(b) > 10) continue;
    const d = Math.max(0, bldDist(b, ax, az) - bldR(b)); if (d < bs) { bs = d; best = b; }
  }
  return bs < 5 ? best : null;
}
// all the pieces of a fence line that touch each other
function segLine(b) {
  const out = new Set([b]), queue = [b];
  while (queue.length) {
    const s = queue.pop(), e = segEnds(s);
    for (const q of BLD.list) {
      if (out.has(q) || !BTYPES[q.t].len) continue;
      const f = segEnds(q); if ([[e.ax, e.az], [e.bx, e.bz]].some(([x, z]) => Math.hypot(f.ax - x, f.az - z) < 0.8 || Math.hypot(f.bx - x, f.bz - z) < 0.8)) { out.add(q); queue.push(q); }
    }
  }
  return [...out];
}
// the wood that comes back: all the wood the building holds, finished or not (walls are paid when they are placed)
const bWood = b => b.cost != null ? b.cost : BTYPES[b.t].wood;
// ---------- what the hunter took down or moved away stays that way ----------
// The builders do not put something new on such a spot on their own for a while, and a fence or wall piece he removed
// is left out of their own ring plans until he asks for the whole ring again from the build screen.
const KEEP = { list: [] };
function keepAdd(b) {
  const T = BTYPES[b.t]; if (!T) return;
  KEEP.list.push({ x: b.x, z: b.z, r: T.len ? T.len * (b.sx || 1) / 2 : T.r, d: T.def ? 1 : 0, u: G.t + 900 });
  if (KEEP.list.length > 240) KEEP.list.splice(0, KEEP.list.length - 240);
}
// ring: is this a spot of a wall piece he took away? otherwise: was something taken away here a short while ago?
function keepAt(x, z, r, ring) {
  for (const k of KEEP.list) {
    if (ring ? !k.d : k.u < G.t) continue;
    if (Math.hypot(k.x - x, k.z - z) < r + (ring ? k.r * 0.55 : k.r)) return true;
  }
  return false;
}
function keepRingClear() { for (const k of KEEP.list) k.d = 0; }
function keepSave() { return KEEP.list.filter(k => k.d || k.u > G.t).map(k => [+k.x.toFixed(1), +k.z.toFixed(1), +k.r.toFixed(1), k.d, Math.max(0, Math.round(k.u - G.t))]); }
function keepLoad(d) { KEEP.list = (d || []).filter(q => Array.isArray(q) && q.length >= 5).map(([x, z, r, dd, left]) => ({ x, z, r, d: dd ? 1 : 0, u: G.t + left })); }
function keepReset() { KEEP.list = []; }
function demolishOne(b) {
  const back = bWood(b);
  keepAdd(b);
  for (const q of BLD.list) if (q.replaces === b) q.replaces = null;   // its upgrade now stands on its own
  b.replaces = null;
  // whoever slept inside wakes up outside
  for (const m of clanReal()) if (m.sleepAt && Math.hypot(m.sleepAt.x - b.x, m.sleepAt.z - b.z) < BTYPES[b.t].r + 1.5) { m.sleepAt = null; m.hidden = false; }
  for (const h of tribeHorses()) if (h.stableB === b) h.stableB = null;
  buildRemove(b);
  if (Math.hypot(camera.position.x - b.x, camera.position.z - b.z) < 70) FX.spawn('dust', b.x, getH(b.x, b.z) + 0.8, b.z, 10);
  return back;
}
function demolish(b, line) {
  const L = line && BTYPES[b.t].len ? segLine(b) : [b], T = BTYPES[b.t];
  let back = 0; for (const q of L) back += demolishOne(q);
  boxStore(); CAMPH.store.wood += back; AUD.play('chop', 0.8); PROG.flags.demolish = 1;
  UI.notify(`🔨 פירקתם ${L.length > 1 ? `${L.length} קטעים של ${T.n}` : `את ${T.len || T.def ? defDN(b.t) : `ה${T.n}`}`} · +${back} עצים חזרו למחסן`, 'good');
  defDirty(); saveGame();
}
// ---------- moving: the same placing as for a new building, without paying again ----------
function moveStart(b) {
  if (!b || !BLD.list.includes(b)) return;
  const t = b.t, T = BTYPES[t];
  MNG.on = false; manageHud(false); if (MNG.ring) MNG.ring.visible = false;
  BLD.moveB = b; BLD.mode = t; BLD.rot = 0; BLD.chk = 0; BLD.chain = 0;
  if (!BLD.gmat) { BLD.gmat = new THREE.MeshBasicMaterial({ color: '#7dff8a', transparent: true, opacity: 0.36, depthWrite: false }); BLD.rmat = new THREE.MeshBasicMaterial({ color: '#7dff8a', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }); }
  BLD.ghost = new THREE.Mesh(BGEO[t] || (BGEO[t] = bGeo(t)), BLD.gmat); BLD.ghost.renderOrder = 5; scene.add(BLD.ghost);
  BLD.ring = new THREE.Mesh(new THREE.RingGeometry(T.r - 0.12, T.r, 40), BLD.rmat); BLD.ring.rotation.x = -Math.PI / 2; BLD.ring.renderOrder = 6; BLD.ring.visible = !T.len; scene.add(BLD.ring);
  buildHud(true);
  UI.notify(`מזיזים את ${T.len || T.def ? defDN(t) : `ה${T.n}`}: הולכים למקום החדש. ירוק: אפשר להעביר לשם`, 'good');
}
function moveConfirm() {
  const b = BLD.moveB; if (!b || !BLD.list.includes(b)) { BLD.moveB = null; buildCancel(); return null; }
  const t = b.t, T = BTYPES[t], x = BLD.ghost.position.x, z = BLD.ghost.position.z, rot = BLD.ghost.rotation.y, sx = T.len ? BLD.ghost.scale.x : 1;
  const why = buildCheck(t, x, z, rot, sx); if (why) { UI.notify(why, 'bad'); return null; }
  const st = { done: b.done, work: b.work, hp: b.hp, broken: b.broken, unpaid: b.unpaid, sprung: b.sprung, planted: b.planted, fixPaid: b.fixPaid };
  const reps = BLD.list.filter(q => q.replaces === b), rp = b.replaces, horses = tribeHorses().filter(h => h.stableB === b);
  for (const m of clanReal()) if (m.sleepAt && Math.hypot(m.sleepAt.x - b.x, m.sleepAt.z - b.z) < T.r + 1.5) { m.sleepAt = null; m.hidden = false; }
  const ox = b.x, oz = b.z;
  keepAdd(b);   // the old spot is left free: the builders do not fill it on their own
  buildRemove(b);
  const nb = addBuilding(t, x, z, rot, st.work, false, true, sx);
  if (st.done) { buildDone(nb, true); if (st.hp != null) nb.hp = st.hp; if (st.broken) { nb.broken = true; nb.hp = 0; } if (st.sprung) nb.sprung = true; if (T.def) defLook(nb); }
  else nb.unpaid = !!st.unpaid;
  nb.planted = st.planted; nb.fixPaid = st.fixPaid;
  for (const q of reps) q.replaces = nb; nb.replaces = rp && BLD.list.includes(rp) ? rp : null;
  for (const h of horses) { h.stableB = nb; h.home.set(nb.x, 0, nb.z); }
  for (const [px, pz] of [[ox, oz], [x, z]]) if (Math.hypot(camera.position.x - px, camera.position.z - pz) < 70) FX.spawn('dust', px, getH(px, pz) + 0.6, pz, 8);
  AUD.play('hammer', 0.7); PROG.flags.moved = 1;
  UI.notify(`📦 ${T.len || T.def ? defDN(t) : `ה${T.n}`} ${T.g === 'f' || t === 'hut' || t === 'field' || t === 'tower' ? 'עברה' : 'עבר'} למקום החדש`, 'good');
  const zi = zoneTribeAt(x, z); if (zi >= 0) borderProvoke(zi, { x, z, b: nb }, T.n);
  defDirty(); saveGame();
  BLD.moveB = null; buildCancel(true); manageStart(true);
  return nb;
}
// ---------- the small panel and the orange mark ----------
function manageHud(on) {
  if (!MNG.hud) {
    const el = document.createElement('div'); el.id = 'vxManage'; el.className = 'pn';
    el.innerHTML = '<b></b><span></span><div class="vbb"><button class="btn pri" data-a="move">להזיז</button><button class="btn wdanger" data-a="del">להרוס</button><button class="btn" data-a="line">כל הקו</button><button class="btn" data-a="end">סיום</button></div><small class="vbk">E להזיז · X להרוס · Esc סיום</small>';
    document.body.appendChild(el); MNG.hud = el;
    for (const ev of ['pointerdown', 'touchstart']) el.addEventListener(ev, e => e.stopPropagation(), { passive: true });
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; manageAct(b.dataset.a); });
  }
  MNG.hud.style.display = on ? 'flex' : 'none';
}
function manageAct(a) {
  if (a === 'end') { manageEnd(); return; }
  const b = MNG.b; if (!b || !BLD.list.includes(b)) return;
  if (a === 'move') { if (BTYPES[b.t].span) { UI.notify('גשר נבנה בדיוק בין שתי גדות, אז לא מזיזים אותו: אפשר להרוס (כל העצים חוזרים) ולבנות במקום אחר', 'bad'); return; } moveStart(b); return; }
  if (a === 'del' || a === 'line') {
    const key = a + ':' + BLD.list.indexOf(b);
    if (MNG.confirm > 0 && MNG.confirmK === key) { MNG.confirm = 0; demolish(b, a === 'line'); MNG.b = null; MNG.chk = 0; manageText(); return; }
    MNG.confirm = 3; MNG.confirmK = key; manageText();
  }
}
function manageText() {
  const h = MNG.hud; if (!h) return;
  const b = MNG.b, T = b && BTYPES[b.t], seg = !!(T && T.len), line = seg ? segLine(b) : null;
  h.firstChild.textContent = b ? `${T.ic} ${T.n}${b.done ? '' : ' (בבנייה)'}` : '🔧 להזיז או להרוס';
  const conf = MNG.confirm > 0 ? MNG.confirmK.split(':')[0] : '', lw = line ? line.reduce((s, q) => s + bWood(q), 0) : 0;
  h.children[1].textContent = !b ? 'מסתכלים על מבנה, גדר או לפיד כדי לבחור אותו'
    : conf === 'del' ? `ללחוץ שוב כדי להרוס: ${bWood(b)} עצים חוזרים למחסן`
    : conf === 'line' ? `ללחוץ שוב כדי להרוס ${line.length} קטעים: ${lw} עצים חוזרים למחסן`
    : `להרוס מחזיר ${bWood(b)} עצים למחסן` + (seg && line.length > 1 ? ` · הקו: ${line.length} קטעים, ${lw} עצים` : '');
  h.children[1].style.color = conf ? '#e0892a' : '';
  const q = s => h.querySelector(`[data-a="${s}"]`);
  q('move').disabled = !b || !!(T && T.span); q('del').disabled = !b; q('line').hidden = !(seg && line.length > 1);
  q('del').textContent = conf === 'del' ? 'כן, להרוס' : 'להרוס'; q('line').textContent = conf === 'line' ? `כן, ${line.length} קטעים` : 'כל הקו';
}
function manageUpdate(dt) {
  if (!MNG.on) return;
  if (G.mode !== 'play' || !P.a || P.a.swimming || P.boat || !ownCamp()) { manageEnd(); return; }
  if (MNG.confirm > 0 && (MNG.confirm -= dt) <= 0) manageText();
  if ((MNG.chk -= dt) <= 0) { MNG.chk = 0.15; const b = managePick(); if (b !== MNG.b) { MNG.b = b; MNG.confirm = 0; } manageText(); }
  if (!MNG.ring) { MNG.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: '#ff9a2a', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); MNG.ring.rotation.x = -Math.PI / 2; MNG.ring.renderOrder = 6; scene.add(MNG.ring); }
  const b = MNG.b; MNG.ring.visible = !!b;
  if (b) { const T = BTYPES[b.t], r = T.span ? T.span * (b.sx || 1) / 2 + 0.4 : T.len ? T.len * (b.sx || 1) / 2 + 0.4 : T.r + 0.4; MNG.ring.position.set(b.x, getH(b.x, b.z) + 0.15, b.z); MNG.ring.scale.set(r, r, 1); MNG.ring.material.opacity = 0.55 + Math.sin(G.t * 6) * 0.25; }
}
addEventListener('keydown', e => {
  if (!MNG.on || G.mode !== 'play' || G.paused || BLD.mode) return;
  if (e.code === 'KeyE' || e.code === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) manageAct('move'); }
  else if (e.code === 'KeyX' || e.code === 'Delete') { e.stopImmediatePropagation(); if (!e.repeat) manageAct('del'); }
  else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); manageEnd(); }
}, true);
(function () {
  const st = document.createElement('style');
  st.textContent = `#vxManage{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);z-index:12;display:none;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:14px;min-width:min(420px,92vw);text-align:center;border:1px solid rgba(255,154,42,.6)}
#vxManage b{font-size:16px}#vxManage span{font-size:13px;color:var(--dim)}#vxManage .vbk{font-size:11.5px;color:var(--dim);margin-top:2px}body.touch #vxManage .vbk{display:none}#vxManage .vbb{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px}#vxManage .btn[disabled]{opacity:.45}
body.touch #vxManage{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 58px);min-width:min(360px,70vw);padding:7px 10px}body.touch #vxManage .btn{padding:6px 12px;font-size:13px}`;
  document.head.appendChild(st);
})();
// ---------- the journey: the new tasks ----------
{
  const ins = (after, ...ms) => { const at = MISSIONS.hunter.findIndex(m => m.id === after); MISSIONS.hunter.splice(at < 0 ? MISSIONS.hunter.length : at + 1, 0, ...ms); };
  ins('hunter.hut', MS('hunter.clear', 'לעקור גדם או שיח', 25, FL('clearBrush')));
  ins('hunter.field', MS('hunter.move', 'להזיז מבנה בכפר (בנייה ← לשנות את הכפר)', 40, FL('moved')));
  ins('hunter.tier2', MS('hunter.ride', 'לבנות אורווה ולרכוב על סוס', 120, FL('ride')));
  ins('hunter.raidWin', MS('hunter.vassal', 'שבט מובס נכנע והופך לשבט חסות', 200, FL('vassal')), MS('hunter.merge', 'שבט חסות מצטרף לשבט שלך', 300, FL('merged')));
  for (const m of MISSIONS.hunter) GOAL[m.id] = m;
}
// ================= BUILDING FROM ANYWHERE: a hammer button (N on a keyboard) opens the build screen wherever the hunter is =================
// From there: new buildings, fences and walls, and "choose a building" to move it or take it down. No walk back to the fire.
const BBTN = { el: null, tip: null };
function buildOpen() {
  if (G.mode !== 'play' || !P.human || !P.a) return;
  if (!ownCamp()) { UI.notify('בונים בכפר משלך: קודם צריך להקים שבט ליד מים', 'bad'); return; }
  if (BLD.mode) buildCancel(true);
  if (MNG.on) manageEnd();
  campMenu('build'); PROG.flags.buildBtn = 1;
}
function buildBtnUpdate() {
  const show = G.mode === 'play' && P.human && !!P.a && !!ownCamp();
  if (TOUCH) {
    const top = document.getElementById('ttop'); if (!top) return;
    if (!BBTN.el) {
      const b = document.createElement('button'); b.id = 'tBuild'; b.className = 'tb'; b.innerHTML = ICON.hammer; b.hidden = true;
      b.setAttribute('aria-label', 'בנייה: לבנות, להזיז ולהרוס');
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); buildOpen(); });
      BBTN.el = b;
    }
    // it stands beside the war button, or first in the row
    const b = BBTN.el, w = document.getElementById('tWar'), prev = w && w.parentNode === top ? w : null;
    if (b.parentNode !== top || b.previousElementSibling !== prev) top.insertBefore(b, prev ? prev.nextElementSibling : top.firstElementChild);
    if (b.hidden === show) b.hidden = !show;
    // a narrow upright phone: when even the smaller buttons would reach the minimap, they get smaller still
    if ((BBTN.fitT = (BBTN.fitT || 0) - 1) <= 0) {
      BBTN.fitT = 15;
      const mini = document.getElementById('mini'), n = [...top.children].filter(q => !q.hidden).length;
      if (mini && n) { const mr = mini.getBoundingClientRect(), tr = top.getBoundingClientRect(), room = tr.right - (document.body.classList.contains('minidown') ? 10 : mr.right) - 6, need = n * 36 + (n - 1) * 5; document.body.classList.toggle('ttight2', mr.width > 0 && tr.width > 0 && need > room); }
    }
  } else {
    const tip = document.getElementById('helpTip');
    if (tip && !BBTN.tip) { const s = document.createElement('span'); s.id = 'htBuild'; s.innerHTML = ' <kbd>N</kbd>בנייה'; s.hidden = true; tip.appendChild(s); BBTN.tip = s; }
    if (BBTN.tip && BBTN.tip.hidden === show) BBTN.tip.hidden = !show;
  }
  if (show && !PROG.flags.bbtnTold && !G.paused && G.t > 3) { PROG.flags.bbtnTold = 1; UI.notify(TOUCH ? '🔨 הכפתור למעלה פותח את מסך הבנייה מכל מקום: לבנות, להזיז ולהרוס' : 'N פותח את מסך הבנייה מכל מקום: לבנות, להזיז ולהרוס', 'good'); }
}
(function () {
  const st = document.createElement('style');
  st.textContent = 'body.touch.ttight2 #ttop{gap:4px}body.touch.ttight2 #ttop .tb{width:32px;height:32px}body.touch.ttight2 #ttop .tb svg{width:16px;height:16px}';
  document.head.appendChild(st);
})();
addEventListener('keydown', e => {
  if (e.code !== 'KeyN' || e.repeat || G.mode !== 'play' || !P.human) return;
  const el = document.getElementById('campov');
  if (el && !el.hidden) { closeCard('campov'); return; }
  if (!G.paused) buildOpen();
});
// ================= BRIDGES: a wooden deck from bank to bank. People walk over it, canoes pass under it =================
// A bridge is a building like any other: it is paid when it is placed (by its length), the builders build it plank by
// plank from the bank, and it can be taken down (all its wood back). While it stands, the ground under a walker is its deck.
BTYPES.bridge = { n: 'גשר', d: 'גשר עץ מגדה לגדה: הולכים מעליו בלי לשחות, וקאנו עובר מתחתיו', wood: 12, work: 60, r: 1.7, need: 6, tier: 1, ic: '🌉', water: 999, span: 12, bridge: 1, g: 'm' };
// the right word for "ready" (houses, towers and bridges are masculine in Hebrew; huts, gardens, kennels and stables feminine)
for (const [k, g] of [['hut', 'f'], ['field', 'f'], ['kennel', 'f'], ['stable', 'f']]) if (BTYPES[k] && !BTYPES[k].g) BTYPES[k].g = g;
const BR_W = 1.65, BR_MIN = 6, BR_MAX = 46;
const BRG = { list: [], n: 0, mask: null };
const brCost = L => Math.round(8 + L * 0.9);
function brEnds(b) {
  const L = BTYPES.bridge.span * (b.sx || 1), ux = Math.cos(b.rot), uz = -Math.sin(b.rot), h = L / 2;
  return { ax: b.x - ux * h, az: b.z - uz * h, bx: b.x + ux * h, bz: b.z + uz * h, ux, uz, L };
}
// the deck: from bank to bank, rising in an arch so that a canoe passes under it
function brProfile(b) {
  const e = brEnds(b), hA = getHT(e.ax, e.az) + 0.12, hB = getHT(e.bx, e.bz) + 0.12;
  let wl = -99; for (let s = 0; s <= 1.0001; s += 0.05) { const w = waterAtT(e.ax + e.ux * e.L * s, e.az + e.uz * e.L * s); if (w > wl) wl = w; }
  const mid = (hA + hB) / 2, arch = wl > -90 ? clamp(wl + 2.15 - mid, 0.35, 3.6) : 0.35;
  b.hA = hA; b.hB = hB; b.arch = arch; b.br = e; return e;
}
const brDeck = (b, t) => lerp(b.hA, b.hB, t) + b.arch * Math.sin(Math.PI * t);
// the height of a bridge deck at a point (or h when there is none higher)
function bridgeH(x, z, h) {
  if (!BRG.mask || !BRG.mask[g10(x, z)]) return h;
  for (const b of BRG.list) {
    const e = b.br, px = x - e.ax, pz = z - e.az, t = (px * e.ux + pz * e.uz) / e.L;
    if (t < 0 || t > 1 || Math.abs(px * e.uz - pz * e.ux) > BR_W) continue;
    const d = brDeck(b, t); if (d > h) h = d;
  }
  return h;
}
function brMask() {
  BRG.mask = BRG.mask || new Uint8Array(2 * GN * GN); BRG.mask.fill(0);
  for (const b of BRG.list) { const e = b.br; for (let s = 0; s <= e.L; s += 2) for (const o of [-2.5, 0, 2.5]) { const x = e.ax + e.ux * s - e.uz * o, z = e.az + e.uz * s + e.ux * o; BRG.mask[g10(x, z)] = 1; } }
  BRG.n = BRG.list.length;
}
function bridgeOn(b) { if (!BRG.list.includes(b)) BRG.list.push(b); brProfile(b); brMask(); PROG.flags.bridge = 1; }
function bridgeOff(b) { const i = BRG.list.indexOf(b); if (i >= 0) BRG.list.splice(i, 1); brMask(); }
function bridgesReset() { BRG.list = []; if (BRG.mask) BRG.mask.fill(0); BRG.n = 0; }
// ---------- how it looks: planks on stringers, posts and rails, pillars standing in the river ----------
function bridgeGeo(b) {
  const e = brProfile(b), L = e.L, G2 = new GB(), A = (geo, p, r, s, c, v) => G2.add(geo, M(p, r, s), c, v);
  const sn = Math.sin(b.rot), cs = Math.cos(b.rot), world = (lx, lz) => [b.x + e.ux * lx + sn * lz, b.z + e.uz * lx + cs * lz];
  const n = Math.max(8, Math.round(L / 0.5)), dl = L / n;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = -L / 2 + t * L, y = brDeck(b, t), sl = Math.atan2(brDeck(b, Math.min(1, t + 0.02)) - brDeck(b, Math.max(0, t - 0.02)), L * 0.04);
    A(new THREE.BoxGeometry(dl * 0.9, 0.09, 3.3), [x, y - 0.05, 0], [0, 0, sl], null, i % 3 ? '#7a5634' : i % 2 ? '#6b4a2c' : '#83603b', 0.18);
    // stringers under the planks
    for (const z of [-1.35, 1.35]) A(new THREE.BoxGeometry(dl * 1.02, 0.16, 0.16), [x, y - 0.17, z], [0, 0, sl], null, '#4f3722', 0.08);
    // rails on both sides
    A(new THREE.BoxGeometry(dl * 1.02, 0.07, 0.07), [x, y + 0.92, -1.6], [0, 0, sl], null, '#5f4228', 0.08);
    A(new THREE.BoxGeometry(dl * 1.02, 0.07, 0.07), [x, y + 0.92, 1.6], [0, 0, sl], null, '#5f4228', 0.08);
    // posts every two metres, and pillars down to the river bed every four
    if (i % Math.max(1, Math.round(2 / dl)) === 0) for (const z of [-1.6, 1.6]) A(new THREE.BoxGeometry(0.11, 1.0, 0.11), [x, y + 0.45, z], null, null, '#4f3722', 0.1);
    if (i % Math.max(1, Math.round(4 / dl)) === Math.round(2 / dl) % Math.max(1, Math.round(4 / dl))) {
      for (const z of [-1.25, 1.25]) {
        const [wx, wz] = world(x, z), bed = getHT(wx, wz) - 0.4, hgt = y - 0.2 - bed;
        if (hgt > 0.7) A(new THREE.CylinderGeometry(0.15, 0.19, hgt, 7), [x, bed + hgt / 2, z], null, null, '#4a3420', 0.1);
      }
    }
  }
  return G2.build();
}
// while it is built the planks are laid from the first bank to the other one
function bridgeLook(b) {
  const g = b.mesh.geometry, n = g.attributes.position.count, k = b.done ? 1 : clamp(b.work / BTYPES.bridge.work, 0, 1);
  g.setDrawRange(0, b.done ? n : Math.max(36, Math.floor(n * (0.04 + 0.96 * k) / 3) * 3));
}
// the trees and bushes on the line are cleared (their wood goes to the store)
function bridgeClear(b, quiet) {
  const e = b.br || brEnds(b), seen = new Set();
  for (let s = 0; s <= e.L; s += 1.5) treeScan(TREES.g, e.ax + e.ux * s, e.az + e.uz * s, 2.4, q => { seen.add(q); });
  let wood = 0; for (const q of seen) wood += treeCut(q, { anim: !quiet, dir: Math.atan2(q.x - b.x, q.z - b.z) });
  for (let s = 0; s <= e.L; s += 2) clearUnder(e.ax + e.ux * s, e.az + e.uz * s, 2.2);
  return wood;
}
// ---------- placing: standing on a bank, looking across the water ----------
function bridgeAim(a, fx, fz) {
  let wet0 = -1, wet1 = -1;
  for (let s = 0.5; s <= BR_MAX + 16; s += 0.5) {
    const w = waterDepthT(a.pos.x + fx * s, a.pos.z + fz * s) > 0.05;
    if (w && wet0 < 0) { if (s > 16) break; wet0 = s; }
    if (!w && wet0 >= 0) { wet1 = s; break; }
  }
  const rot = Math.atan2(-fz, fx);
  let s0, s1, why = '';
  if (wet0 < 0) { s0 = 2; s1 = 2 + BR_MIN; why = 'עומדים על הגדה ומסתכלים אל הגדה שמעבר למים'; }
  else if (wet1 < 0) { s0 = Math.max(0.8, wet0 - 2.2); s1 = s0 + BR_MAX; why = `הגדה השנייה רחוקה מדי (גשר עד ${BR_MAX} מ׳)`; }
  else { s0 = Math.max(0.8, wet0 - 2.2); s1 = wet1 + 2.2; }
  const L = Math.max(BR_MIN, s1 - s0), cx = a.pos.x + fx * (s0 + L / 2), cz = a.pos.z + fz * (s0 + L / 2);
  const b = { t: 'bridge', x: cx, z: cz, rot, sx: L / BTYPES.bridge.span }; brProfile(b);
  return { x: cx, z: cz, rot, sx: b.sx, L, y: (b.hA + b.hB) / 2 + b.arch * 0.7, tilt: Math.atan2(b.hB - b.hA, L), why, cost: brCost(L) };
}
function bridgeCheck(t, x, z, rot, sx) {
  const v = ownCamp(); if (!v) return 'קודם צריך מחנה משלך';
  if (!BLD.moveB && !buildUnlocked(t)) return `${BTYPES[t].n}: נפתח כשהמחנה הופך ל${TIERN[BTYPES[t].tier]}`;
  const b = { t, x, z, rot, sx }, e = brEnds(b);
  if (BLD.mode === t && BLD.brg && BLD.brg.why) return BLD.brg.why;
  if (e.L < BR_MIN - 0.01 || e.L > BR_MAX + 0.01) return `גשר נבנה באורך ${BR_MIN} עד ${BR_MAX} מ׳`;
  if (woodHave() < brCost(e.L)) return `צריך ${brCost(e.L)} עצים לגשר של ${Math.round(e.L)} מ׳ (יש ${woodHave()})`;
  const maxR = villageR() + 190;
  if (Math.hypot(e.ax - v.x, e.az - v.z) > maxR || Math.hypot(e.bx - v.x, e.bz - v.z) > maxR) return `רחוק מדי מהכפר (גשר עד ${Math.round(maxR)} מ׳ מהמדורה)`;
  for (const [px, pz] of [[e.ax, e.az], [e.bx, e.bz]]) { if (waterDepthT(px, pz) > 0) return 'שני הקצוות צריכים לעמוד על יבשה'; if (getNY(px, pz) < 0.66) return 'הגדה כאן משופעת מדי'; }
  if (Math.abs(getHT(e.ax, e.az) - getHT(e.bx, e.bz)) > 6) return 'הגדות בגבהים שונים מדי';
  let wet = 0; for (let s = 0.1; s < 0.95; s += 0.05) if (waterDepthT(e.ax + e.ux * e.L * s, e.az + e.uz * e.L * s) > 0.05) wet++;
  if (!wet) return 'אין כאן מים לעבור מעליהם';
  for (const q of BLD.list) { if (q === BLD.moveB || q.t === 'torch') continue; if (segDist(q.x, q.z, e.ax, e.az, e.ux, e.uz, e.L) < bldR(q) + BR_W + 0.3 || (BTYPES[q.t].span && bldDist(q, x, z) < 3)) return `צמוד מדי ל${BTYPES[q.t].n}`; }
  for (const c of HUNT.camps) if (!c.own && segDist(c.x, c.z, e.ax, e.az, e.ux, e.uz, e.L) < 14) return 'קרוב מדי למחנה של שבט אחר';
  return '';
}
const bridgeGhostGeo = () => { const g = new THREE.BoxGeometry(BTYPES.bridge.span, 0.16, 3.3); return g; };
BGEO.bridge = bridgeGhostGeo();
// the builders work from the bank nearer to them
function bridgeWorkSpot(s, a) {
  const e = s.br || brEnds(s), dA = Math.hypot(a.pos.x - e.ax, a.pos.z - e.az), dB = Math.hypot(a.pos.x - e.bx, a.pos.z - e.bz);
  return dA <= dB ? { x: e.ax - e.ux * 1.1 + rr(-0.6, 0.6) * e.uz, z: e.az - e.uz * 1.1 - rr(-0.6, 0.6) * e.ux } : { x: e.bx + e.ux * 1.1 + rr(-0.6, 0.6) * e.uz, z: e.bz + e.uz * 1.1 - rr(-0.6, 0.6) * e.ux };
}
// the maps: a bridge is a brown line
function bridgeBigMap(c, m, b) {
  const e = brEnds(b), [x1, y1] = m(e.ax, e.az), [x2, y2] = m(e.bx, e.bz);
  c.strokeStyle = b.done ? '#7a5634' : 'rgba(200,170,120,.55)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function bridgeMiniDots(pt, b) { const e = brEnds(b); for (let i = 0; i <= 4; i++) pt(e.ax + (e.bx - e.ax) * i / 4, e.az + (e.bz - e.az) * i / 4, 2.6, b.done ? '#8a6238' : 'rgba(184,145,90,.6)'); }
// a new bridge (or one loaded from a save): its own mesh, its ends cleared, its planks laid as the work goes on
function bridgeAdd(b, fresh) {
  brProfile(b);
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  b.mesh = new THREE.Mesh(bridgeGeo(b), BLD.mat); b.mesh.castShadow = true; b.mesh.receiveShadow = true;
  b.mesh.position.set(b.x, 0, b.z); b.mesh.rotation.set(0, b.rot, 0); scene.add(b.mesh);
  b.obs = [];
  const wood = bridgeClear(b, fresh !== true); b.cleared = wood;
  if (fresh && wood) { boxStore(); CAMPH.store.wood += wood; if (fresh === true) UI.notify(`פינו את הקצוות של הגשר (+${wood} עצים למחסן)`, 'good'); }
  if (!b.done) BLD.sites.push(b);
  BLD.list.push(b); bridgeLook(b);
  if (b.done) bridgeOn(b);
  return b;
}
// ================= WATER GATES: a wall across the water, with a gate that rises for our boats and drops for everyone else =================
// A water gate stands in a river or a lake channel between two walls: two posts, a beam, and a heavy grid of stakes that
// slides up and down. It rises when one of our boats (or one of our swimmers) comes near and drops behind it. Closed, it
// stops caimans, enemies and anyone swimming. The gold button by it on the bank keeps it up, or lets it work by itself.
BTYPES.watergate = { n: 'שער מים', dn: 'שער המים', g: 'm', d: 'סורג של יתדות בתוך המים, בין שתי חומות: עולה כשסירה שלנו מתקרבת ויורד אחריה. תנינים, אויבים ומי שבא בשחייה נעצרים', wood: 16, work: 34, r: 2.2, len: 4.4, need: 0, tier: 2, ic: '🌊', water: 999, def: { th: 0.4, hp: 380, water: 1 } };
{ const i = DEFT.indexOf('gate'); DEFT.splice(i >= 0 ? i + 1 : DEFT.length, 0, 'watergate'); }
DEF.wg = []; DEF.wgb = [];
CTXT.wgate = ['fence', 'שער מים', 'להרים את שער המים או להחזיר אותו לפעול לבד'];
// the water and the bed under a gate: how high the frame stands and how far the grid rises
function wgShape(b) {
  const e = segEnds(b); let wl = -99, bed = 99;
  for (let s = 0; s <= 1.0001; s += 0.1) { const x = e.ax + e.ux * e.L * s, z = e.az + e.uz * e.L * s, w = waterAtT(x, z), h = getHT(x, z); if (w > wl) wl = w; if (h < bed) bed = h; }
  if (wl < -90) wl = Math.max(getHT(e.ax, e.az), getHT(e.bx, e.bz)) + 0.2;
  b.wl = wl; b.bed = Math.min(bed, wl - 0.3); b.liftH = wl + 1.9 - b.bed; return e;
}
function wgGeo(b) {
  const e = wgShape(b), L = e.L, F = new GB(), A = (geo, p, r, s, c, v) => F.add(geo, M(p, r, s), c, v);
  const top = b.wl + 3.05, sn = Math.sin(b.rot), cs = Math.cos(b.rot), world = lx => [b.x + e.ux * lx, b.z + e.uz * lx];
  for (const sx of [-1, 1]) {
    const lx = sx * (L / 2 - 0.28), [wx, wz] = world(lx), base = Math.min(getHT(wx, wz), b.wl) - 0.4, h = top + 0.5 - base;
    A(new THREE.BoxGeometry(0.62, h, 0.72), [lx, base + h / 2, 0], null, null, '#5c4128', 0.12);
    A(new THREE.BoxGeometry(0.8, 0.5, 0.9), [lx, b.wl - 0.05, 0], null, null, '#77726a', 0.14);   // stones at the waterline
    A(new THREE.ConeGeometry(0.55, 0.6, 4), [lx, top + 0.8, 0], [0, Math.PI / 4, 0], null, '#4a3220', 0.1);
    for (const z of [-0.3, 0.3]) A(new THREE.BoxGeometry(0.09, h - 0.3, 0.09), [lx - sx * 0.36, base + h / 2, z], null, null, '#3e2a1a', 0.06);   // the grooves the grid slides in
  }
  A(new THREE.BoxGeometry(L, 0.38, 0.62), [0, top, 0], null, null, '#4f3722', 0.1);
  A(new THREE.BoxGeometry(L * 0.94, 0.12, 0.7), [0, top + 0.26, 0], null, null, '#6b4a2c', 0.1);
  for (const sx of [-1, 1]) A(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 10), [sx * L * 0.18, top + 0.45, 0], [Math.PI / 2, 0, 0], null, '#3e2a1a', 0.08);   // the winches
  const frame = F.build();
  // the grid of sharpened stakes
  const Gg = new GB(), B2 = (geo, p, r, s, c, v) => Gg.add(geo, M(p, r, s), c, v), w = L - 1.15, H = b.wl + 2.7 - b.bed, n = Math.max(5, Math.round(w / 0.34));
  for (let i = 0; i <= n; i++) {
    const lx = -w / 2 + w * i / n;
    B2(new THREE.CylinderGeometry(0.075, 0.085, H, 6), [lx, b.bed + H / 2, 0], null, null, i % 2 ? '#6b4a2c' : '#5f4228', 0.1);
    B2(new THREE.ConeGeometry(0.085, 0.32, 6), [lx, b.bed - 0.12, 0], [Math.PI, 0, 0], null, '#d9c79a', 0.06);
  }
  for (const f of [0.2, 0.5, 0.82]) B2(new THREE.BoxGeometry(w + 0.2, 0.13, 0.16), [0, b.bed + H * f, 0.1], null, null, '#4f3722', 0.08);
  return { frame, grid: Gg.build() };
}
function wgAdd(b, fresh) {
  if (!BLD.mat) BLD.mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const g = wgGeo(b);
  b.mesh = new THREE.Mesh(g.frame, BLD.mat); b.mesh.castShadow = true; b.mesh.receiveShadow = true;
  b.mesh.position.set(b.x, 0, b.z); b.mesh.rotation.set(0, b.rot, 0); scene.add(b.mesh);
  b.grid = new THREE.Mesh(g.grid, BLD.mat); b.grid.castShadow = true; b.mesh.add(b.grid);
  b.gateY = b.gateY || 0; b.obs = [];
  const e = segEnds(b); for (const [x, z] of [[e.ax, e.az], [e.bx, e.bz]]) if (waterDepthT(x, z) === 0) clearUnder(x, z, 1.6);
  if (!b.done) BLD.sites.push(b);
  BLD.list.push(b); wgLook(b); defDirty();
  return b;
}
// while it is built the frame rises piece by piece; the grid hangs only in a finished, unbroken gate
function wgLook(b) {
  if (!b.mesh) return;
  const g = b.mesh.geometry, n = g.attributes.position.count, k = b.done ? 1 : clamp(b.work / BTYPES.watergate.work, 0, 1);
  g.setDrawRange(0, b.done ? n : Math.max(36, Math.floor(n * (0.05 + 0.95 * k) / 3) * 3));
  b.mesh.scale.y = 1; b.mesh.rotation.x = 0;
  if (b.grid) { b.grid.visible = !!b.done && !b.broken; b.grid.position.y = (b.gateY || 0) * (b.liftH || 3); }
}
// ---------- up and down ----------
const wgOurs = u => !!u && (u.isPlayer || u.tribe || u.isPartner || u.escort);
function wgUpdate(dt) {
  const L = DEF.wgb; if (!L.length) return;
  const cp = camera.position;
  for (const b of L) {
    if (!b.done || b.broken || !b.seg) continue;
    const s = b.seg, near = (x, z, r) => segDist(x, z, s.ax, s.az, s.ux, s.uz, s.L) < r;
    let want = b.hold ? 1 : 0;
    if (!want) for (const B of BOATS) if (B.user && wgOurs(B.user) && near(B.x, B.z, 18)) { want = 1; break; }
    if (!want) for (const S of SHIPS.list) if (((S.user && wgOurs(S.user)) || S.trip) && near(S.x, S.z, 26)) { want = 1; break; }
    if (!want && P.a && P.a.swimming && near(P.a.pos.x, P.a.pos.z, 7)) want = 1;
    if (!want) shQuery(b.x, b.z, 9, w => { if (!want && w.swimming && w.alive && wgOurs(w) && near(w.pos.x, w.pos.z, 7)) want = 1; });
    const was = b.gateY || 0, sp = want ? 0.75 : 0.45;
    b.gateY = clamp(was + Math.sign(want - was) * Math.min(Math.abs(want - was), dt * sp), 0, 1);
    if (b.gateY !== was) {
      if (b.grid) b.grid.position.y = b.gateY * (b.liftH || 3);
      if (((was === 0 && want) || (was === 1 && !want)) && Math.hypot(cp.x - b.x, cp.z - b.z) < 70) { AUD.at('net', { x: b.x, z: b.z }, 0.8); AUD.at('hammer', { x: b.x, z: b.z }, 0.4); }
    }
  }
}
// a closed (or half closed) gate stops swimmers and boats
const wgClosed = s => !s.b.broken && (s.b.gateY || 0) < 0.62;
function wgClosedNear(x, z, r) {
  for (const s of DEF.wg) { if (!wgClosed(s)) continue; if (segDist(x, z, s.ax, s.az, s.ux, s.uz, s.L) < s.th + r) return s; }
  return null;
}
function wgPush(p, rad, who, dt) {
  for (const s of DEF.wg) {
    if (!wgClosed(s)) continue;
    let t = (p.x - s.ax) * s.ux + (p.z - s.az) * s.uz; t = t < 0 ? 0 : t > s.L ? s.L : t;
    const cx = s.ax + s.ux * t, cz = s.az + s.uz * t, ex = p.x - cx, ez = p.z - cz, d = Math.hypot(ex, ez), R = s.th + rad;
    if (d >= R) continue;
    let nx = s.nx, nz = s.nz; if (d > 1e-4) { nx = ex / d; nz = ez / d; } else if ((p.x - s.cx) * s.nx + (p.z - s.cz) * s.nz < 0) { nx = -nx; nz = -nz; }
    p.x = cx + nx * R; p.z = cz + nz * R;
    if (who && dt) { const side = defSide(who); if (side === 'foe') defContact(who, s, side, dt, nx, nz); }
  }
}
// ---------- the gold button on the bank: keep it up, or let it work by itself ----------
function wgCtx() {
  const a = P.a; if (!DEF.wgb.length || a.swimming || P.boat) return null;
  let best = null, bd = 5.5;
  for (const b of DEF.wgb) { if (!b.done || b.broken) continue; const d = bldDist(b, a.pos.x, a.pos.z); if (d < bd) { bd = d; best = b; } }
  if (!best) return null;
  WGS.near = best; CTXT.wgate[1] = best.hold ? 'להוריד' : 'להרים'; return 'wgate';
}
const WGS = { near: null };
XCTX.push(wgCtx);
CTXH.wgate = () => {
  if (CLB.latch) return; CLB.latch = true; const b = WGS.near; if (!b || !BLD.list.includes(b)) return;
  b.hold = !b.hold; AUD.play('ui'); PROG.flags.waterGate = 1;
  UI.notify(b.hold ? '🌊 שער המים מורם, ונשאר פתוח עד שתורידו אותו' : '🌊 שער המים חוזר לפעול לבד: עולה לסירות שלנו ויורד אחריהן', 'good'); saveGame();
};
