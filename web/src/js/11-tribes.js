// ================= THE HUNTER'S JOURNEY: shared state, hooks, save and load for tribes, villages and the forest =================
const VX = {
  inited: false,
  known: new Set(),   // tribes the player has found (camp indices)
  mem: -1,            // the tribe the player belongs to (-1: none)
  rank: 0, pts: 0,    // rank and contribution inside that tribe
  trust: {},          // trust per tribe (0..100)
  quest: null,        // { camp, need, have }: bring meat to be accepted
  progEl: null, progT: 0, hintT: 0, told: {}
};
const CTXH = {};      // gold-button handlers: ctx -> fn(dt)
const TRIBEC = { river: '#2f6fbf', fish: '#c0402c', forest: '#3d8f36', own: '#e2a93b' };
function tribeKeyOf(c) { return !c || c.own ? 'own' : c.key ? c.key : c.deep ? 'forest' : c.tribe === 'שבט הדגים' ? 'fish' : 'river'; }
function waterDist(x, z) { const w = nearestWater(x, z); return w ? Math.hypot(w.x - x, w.z - z) : 999; }
function ownCamp() { const c = CAMPH.camp; return c && c.own ? c : null; }
function memberCamp() { return VX.mem >= 0 ? HUNT.camps[VX.mem] || null : null; }
function campIndex(c) { return HUNT.camps.indexOf(c); }
// the camp is no longer picked for you: you start alone, and a camp is yours only once you join a tribe or found one
function homeCamp() { return CAMPH.camp || null; }
function vxTell(key, text, kind) { if (VX.told[key]) return; VX.told[key] = 1; UI.notify(text, kind || 'good'); }
// a small progress bar above the gold button (felling, building)
function vxProgress(k, label) {
  if (!VX.progEl) {
    const el = document.createElement('div'); el.id = 'vxProg';
    el.innerHTML = '<span></span><i><b></b></i>'; document.body.appendChild(el); VX.progEl = el;
  }
  const el = VX.progEl; el.style.display = 'flex'; VX.progT = 0.25;
  el.firstChild.textContent = label; el.lastChild.firstChild.style.width = `${Math.round(clamp(k, 0, 1) * 100)}%`;
}
function vxInit() {
  VX.inited = true;
  const st = document.createElement('style');
  st.textContent = `#vxProg{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 118px);transform:translateX(-50%);z-index:11;display:none;flex-direction:column;align-items:center;gap:4px;pointer-events:none;font:600 13px Rubik,sans-serif;color:#fff2c8;text-shadow:0 1px 3px rgba(0,0,0,.8)}
#vxProg i{display:block;width:150px;height:7px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid rgba(255,230,170,.35)}#vxProg i b{display:block;height:100%;background:#e8b04b;border-radius:4px}
body.touch #vxProg{bottom:calc(env(safe-area-inset-bottom,0px) + 150px)}`;
  document.head.appendChild(st);
}
function vxUpdate(dt) {
  if (!VX.inited) vxInit();
  treesUpdate(dt);
  if (VX.progEl && VX.progT > 0) { VX.progT -= dt; if (VX.progT <= 0) VX.progEl.style.display = 'none'; }
  smokeUpdate(dt); buildBtnUpdate(); ordBtnUpdate();
  if (G.mode !== 'play' || !P.a) { bubblesUpdate(dt); return; }
  natureUpdate(dt);
  if (P.human) { const own = !!ownCamp(); CTXT.camp[1] = own ? 'הכפר' : 'השבט'; CTXT.camp[2] = own ? 'לפתוח את מסך הכפר' : 'לפתוח את מסך השבט'; }
  if (P.human) { tribesUpdate(dt); clanUpdate(dt); famUpdate(dt); buildUpdate(dt); structUpdate(dt); warUpdate(dt); tgUpdate(); horsesUpdate(dt); manageUpdate(dt); ordUpdate(dt); polUpdate(dt); depUpdate(dt); npcTripsUpdate(dt); raids2Update(dt); minesUpdate(dt); tameUpdate(dt); cartsUpdate(dt); shipsUpdate(dt); tradeUpdate(dt); plunderUpdate(dt); wpnUpdate(dt); trapsUpdate(dt); defUpdate(dt); pressureUpdate(dt); trackUpdate(); vxHints(dt); }
  peopleUpdate(dt);
  bubblesUpdate(dt);
}
// new game: the forest grows back, your village is gone, the tribes forget you
function vxReset() {
  structReset(); warReset(); wpnReset(); trapsReset(); treeRestoreAll(); natureReset(); buildReset(); horsesReset(); clearReset(); manageEnd(); keepReset(); DEF.ringWant = null; ordReset(); polReset(); tameReset(); cartsReset(); shipsReset(); tradeReset(); plunderReset(); clanReset(); removeOwnCamps(); tgReset(); tribesReset(); pressureReset(); bubblesClear();
  VX.known = new Set(); VX.mem = -1; VX.rank = 0; VX.pts = 0; VX.trust = {}; VX.quest = null; VX.told = {}; VX.hintT = 30; VX.track = null; FOUND.mode = false;
  depReset(); for (const c of NTRIP.list) c.trip = null; NTRIP.list = []; mineReset();
}
function removeOwnCamps() {
  for (let i = HUNT.camps.length - 1; i >= 0; i--) {
    const c = HUNT.camps[i]; if (!c.own) continue;
    if (c.mesh) scene.remove(c.mesh); for (const m of c.flames || []) scene.remove(m); if (c.glow) scene.remove(c.glow);
    if (c.cowGroup) for (const m of c.cowGroup.members.slice()) m.remove();
    HUNT.camps.splice(i, 1);
    const pi = POI.findIndex(p => p.camp && Math.hypot(p.x - c.x, p.z - c.z) < 1); if (pi >= 0) POI.splice(pi, 1);
  }
}
function vxSave() {
  // part by part: one that fails is left out (and reported), the rest of the village is still kept
  const o = {}, put = (k, f) => { try { o[k] = f(); } catch (e) { saveErr('vx.' + k, e); } };
  put('known', () => [...VX.known]); put('mem', () => VX.mem); put('rank', () => VX.rank); put('pts', () => VX.pts); put('trust', () => VX.trust);
  put('quest', () => VX.quest ? { c: VX.quest.c, need: VX.quest.need, have: VX.quest.have } : null);
  put('cut', treeKeys); put('b', buildSave); put('clan', clanSave); put('told', () => VX.told); put('bow', () => !!P.hasBow); put('press', pressureSave); put('found', () => !!FOUND.mode);
  put('mc', () => aliveMates().map(m => m.cls || '')); put('me', () => aliveMates().map(m => !!m.escort)); put('mr', () => aliveMates().map(m => m.knight ? 'k' : m.merchant ? 'm' : ''));
  put('td', tradeSave); put('lt', plunderSave); put('st', structSave); put('war', warSave); put('wp', wpnSave); put('tr', trapsSave); put('ct', treeCutTimes); put('gr', tgSave);
  put('hz', horsesSave); put('cl', clearSave); put('kp', keepSave); put('rw', () => DEF.ringWant || 0); put('od', ordSave); put('po', polSave); put('tm', tameSave);
  put('cr', cartsSave); put('sh', shipsSave); put('dp', () => DEP.uid || 0); put('mn', mineSave);
  return o;
}
function vxLoad(d, save) {
  const L = (k, f) => loadPart('vx.' + k, f);
  if (!d) {
    L('none', () => {
      tribeEnsure();
      // a game saved before the journey existed: the hunter belonged to the nearest tribe
      if (!ownCamp() && HUNT.camps.length && P.a) {
        const c = HUNT.camps.filter(q => !q.own).reduce((b, q) => Math.hypot(q.x - P.a.pos.x, q.z - P.a.pos.z) < Math.hypot(b.x - P.a.pos.x, b.z - P.a.pos.z) ? q : b);
        VX.mem = campIndex(c); VX.rank = 1; VX.known.add(VX.mem); CAMPH.camp = c;
      }
      for (let i = 0; i < HUNT.camps.length; i++) if (!HUNT.camps[i].own) VX.known.add(i);
      P.hasBow = true;
    });
    for (const [k, f] of [['clan', clanLoad], ['st', structLoad], ['gr', tgLoad], ['war', warLoad], ['wp', wpnLoad], ['tr', trapsLoad], ['mn', mineLoad]]) L(k, () => f(null));
    return;
  }
  L('core', () => {
    VX.known = new Set(d.known || []); VX.mem = d.mem ?? -1; VX.rank = d.rank || 0; VX.pts = d.pts || 0; VX.trust = d.trust || {}; VX.told = d.told || {};
    VX.quest = d.quest ? { c: d.quest.c, need: d.quest.need, have: d.quest.have } : null;
    if (!ownCamp() && VX.mem >= 0 && HUNT.camps[VX.mem]) CAMPH.camp = HUNT.camps[VX.mem];
    P.hasBow = d.bow ?? true; FOUND.mode = !!d.found && !ownCamp(); depReset(); DEP.uid = d.dp || 0;
    aliveMates().forEach((m, i) => { const c = (d.mc || [])[i], r = (d.mr || [])[i]; if (WORK.includes(c)) m.cls = c; m.escort = !!(d.me || [])[i]; m.knight = r === 'k' && m.cls === 'warrior'; m.merchant = r === 'm' && m.cls === 'gatherer'; if (m.knight) m.knightPaid = true; });
  });
  L('ensure', tribeEnsure);   // wives and children are people of the tribe from the first moment, not wandering hunters
  L('cut', () => treeApplyKeys(d.cut || [])); L('cl', () => clearLoad(d.cl || null)); L('ct', () => treeCutTimesLoad(d.ct || null));
  L('b', () => buildLoad(d.b || null)); L('kp', () => keepLoad(d.kp || null)); L('rw', () => { DEF.ringWant = d.rw && BTYPES[d.rw] ? d.rw : null; });
  L('clan', () => clanLoad(d.clan || null));
  L('press', () => pressureLoad(d.press || null));
  L('st', () => structLoad(d.st || null));
  L('hz', () => horsesLoad(d.hz || null));
  L('gr', () => tgLoad(d.gr || null));
  L('war', () => warLoad(d.war || null));
  L('wp', () => wpnLoad(d.wp || null));
  L('tr', () => trapsLoad(d.tr || null));
  L('od', () => ordLoad(d.od || null));
  L('po', () => polLoad(d.po || null));
  L('tm', () => tameLoad(d.tm || null));
  L('cr', () => cartsLoad(d.cr || null));
  L('sh', () => shipsLoad(d.sh || null));
  L('td', () => tradeLoad(d.td || null));
  L('lt', () => plunderLoad(d.lt || null));
  L('mn', () => mineLoad(d.mn || null));
  L('roles', () => { for (const m of tribeAll()) if (m.knight || m.merchant) { roleApply(m); retemplate(m, memberTpl(m)); } });
}
// ================= THE FOREST CAN BE CUT DOWN: real felling, stumps, falling trees, cleared ground, forest cover =================
const TREE_KIND = { giant: { wood: 22, hits: 8, tr: 1.9 }, canopy: { wood: 8, hits: 4, tr: 0.55 }, under: { wood: 3, hits: 2, tr: 0.2 }, palm: { wood: 4, hits: 3, tr: 0.26 }, tfern: { wood: 2, hits: 2, tr: 0.2 } };
const UNDER_KIND = new Set(['fern', 'heli', 'bush', 'grass', 'flower', 'log', 'rock']);
const TREES = { g: [], u: [], all: 0, cut: 0, keys: new Set(), cutList: [], uncl: [], stumps: null, stumpN: 0, fall: [], built: false,
  m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new V3(), s: new V3(1e-4, 1e-4, 1e-4), dirty: new Set() };
const tcell = g10;
const tkey = (x, z) => `${Math.round(x * 10)},${Math.round(z * 10)}`;
function treeIndexBuild() {
  const m = new THREE.Matrix4(); TREES.g = new Array(2 * GN * GN); TREES.u = new Array(2 * GN * GN); TREES.all = 0;
  for (const ch of VEG.chunks) for (const it of ch.items) {
    const id = it.t.id, tk = TREE_KIND[id], uk = UNDER_KIND.has(id); if (!tk && !uk) continue;
    for (let i = 0; i < it.total; i++) {
      it.near.getMatrixAt(i, m); const e = m.elements, x = e[12], z = e[14];
      if (Math.hypot(e[0], e[1], e[2]) < 1e-3) continue;   // the place of a plant that is no more (it only keeps the order)
      const ent = { x, z, it, i, id, sc: Math.hypot(e[0], e[1], e[2]), cut: false };
      const A = tk ? TREES.g : TREES.u, k = tcell(x, z); (A[k] || (A[k] = [])).push(ent);
      if (tk) TREES.all++;
    }
  }
  TREES.built = true; treeGhostSync();
}
// lower quality draws fewer trees, bushes and rocks: the ones that are not drawn must not block the way or hold
// monkeys in their crowns either. Called at the start and whenever the quality changes.
function treeGhostSync() {
  if (!TREES.built) return;
  mapTilesClear();   // the map draws only the trees that are drawn
  const veg = QUAL[SET.q].veg; let all = 0;
  for (const A of [TREES.g, TREES.u]) for (const L of A) if (L) for (const e of L) {
    const it = e.it, ghost = e.i >= Math.max(1, Math.ceil(it.total * (it.t.fixed ? 1 : veg)));
    if (ghost && !e.ghost) { e.ghost = true; if (!e.cut) { takeTrunk(e); if (it.t.crown) takeCrown(e); } }
    else if (!ghost && e.ghost) { e.ghost = false; if (!e.cut) treeSolid(e); }
    if (A === TREES.g && TREE_KIND[e.id] && !e.ghost) all++;
  }
  TREES.all = all;
}
// a trunk to bump into and a crown to perch on, back in their grids
function treeSolid(e) {
  if (e.trunk) { const k = tcell(e.x, e.z); (TREES_TRUNK_CELL(k)).push(...e.trunk); e.trunk = null; }
  if (e.crown) { const cr = e.crown, k = g25(cr.x, cr.z); cr.cut = false; CROWNS.push(cr); (CROWNG[k] || (CROWNG[k] = [])).push(cr); e.crown = null; }
}
const TREES_TRUNK_CELL = k => TRUNKS.g[k] || (TRUNKS.g[k] = []);
function treeScan(A, x, z, r, fn) {
  if (!TREES.built) return;
  const x0 = g10c(x - r), x1 = g10c(x + r), z0 = g10r(x, z - r), z1 = g10r(x, z + r);
  for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
    const L = A[iz * GN + ix]; if (!L) continue;
    for (const e of L) { if (e.cut || e.ghost) continue; const d = Math.hypot(e.x - x, e.z - z); if (d <= r && fn(e, d) === false) return; }
  }
}
function treeNearest(x, z, r, filt) { let best = null, bd = 1e9; treeScan(TREES.g, x, z, r, (e, d) => { if (d < bd && (!filt || filt(e))) { bd = d; best = e; } }); return best; }
const forestK = () => TREES.all ? 1 - TREES.cut / TREES.all : 1;
function treeTrunkR(e) { return (TREE_KIND[e.id] ? TREE_KIND[e.id].tr : 0.3) * clamp(e.sc, 0.6, 1.5); }
function hideInst(e) {
  mapTreeMark(e.x, e.z);
  e.it.near.getMatrixAt(e.i, TREES.m); e.m0 = TREES.m.clone();
  TREES.m.compose(TREES.v.set(e.x, -60, e.z), TREES.q, TREES.s); e.it.near.setMatrixAt(e.i, TREES.m); TREES.dirty.add(e.it.near.instanceMatrix);
}
function showInst(e) { if (!e.m0) return; mapTreeMark(e.x, e.z); e.it.near.setMatrixAt(e.i, e.m0); TREES.dirty.add(e.it.near.instanceMatrix); }
function takeTrunk(e) {
  const k = g10(e.x, e.z), cell = TRUNKS.g[k];
  if (cell) for (let j = 0; j < cell.length; j += 3) if (Math.abs(cell[j] - e.x) < 0.01 && Math.abs(cell[j + 1] - e.z) < 0.01) { e.trunk = cell.splice(j, 3); return; }
}
function takeCrown(e) {
  const k = g25(e.x, e.z), cell = CROWNG[k];
  const j = cell ? cell.findIndex(c => Math.abs(c.x - e.x) < 0.01 && Math.abs(c.z - e.z) < 0.01) : -1; if (j < 0) return;
  const cr = cell.splice(j, 1)[0], i = CROWNS.indexOf(cr); if (i >= 0) CROWNS.splice(i, 1);
  e.crown = cr; cr.cut = true;
  // whoever lived up there has to move
  for (const g of GROUPS) {
    if (g.kind === 'troop' && g.crown === cr) { const c = pickCrownNear(cr.x, cr.z, 90); if (c) { g.crown = c; g.spin = rng() * TAU; g.members.forEach((m, n) => { m.leapDelay = 0.2 + n * 0.3; }); } }
    if (g.kind === 'flock' && g.crown === cr) { g.state = 'perch'; flockFlush(g); }
  }
  for (const a of ANIMALS) {
    if (!a.alive || a.isPlayer) continue;
    if (a.crown === cr) {
      a.perched = false;
      if (a.sp.ai === 'raptor') { raptorSoar(a); continue; }
      const c = pickCrownNear(cr.x, cr.z, 120); if (c) { a.crown = c; a.goal3 = new V3(c.x + (a.offX || 0), c.top - 0.3, c.z + (a.offZ || 0)); a.state = 'fly'; }
    }
    if (a.hanging && Math.hypot(a.pos.x - e.x, a.pos.z - e.z) < 8) { a.hanging = false; a.perched = false; a.mesh.rotation.z = 0; a.ground(1, true); a.state = 'idle'; a.stT = 4; }
  }
  for (let i = HANGS.length - 1; i >= 0; i--) if (Math.hypot(HANGS[i].x - e.x, HANGS[i].z - e.z) < 8) HANGS.splice(i, 1);
}
function addStump(e) {
  if (!TREES.stumps) {
    const g = new THREE.CylinderGeometry(0.88, 1.05, 1, 9), P0 = g.attributes.position, N0 = g.attributes.normal, cl = [], top = col('#cfa874'), ring = col('#9a7448'), bark = col('#5c4431');
    for (let i = 0; i < P0.count; i++) { const ny = N0.getY(i), r = Math.hypot(P0.getX(i), P0.getZ(i)); const c = ny > 0.9 ? (r > 0.7 ? ring : top) : bark; cl.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    TREES.stumps = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }), 12000);
    TREES.stumps.count = 0; TREES.stumps.castShadow = true; TREES.stumps.receiveShadow = true; TREES.stumps.frustumCulled = false; scene.add(TREES.stumps);
  }
  // stumps of trees that grew back leave their slot free for the next one
  const free = TREES.freeSt && TREES.freeSt.length; if (!free && TREES.stumpN >= 12000) return;
  const r = Math.max(0.16, treeTrunkR(e) * 1.05), h = 0.3 + r * 0.55, y = getH(e.x, e.z);
  TREES.q.setFromEuler(new THREE.Euler(rr(-0.06, 0.06), rng() * TAU, rr(-0.06, 0.06)));
  TREES.m.compose(TREES.v.set(e.x, y + h * 0.5 - 0.06, e.z), TREES.q, new V3(r, h, r)); TREES.q.identity();
  e.stump = free ? TREES.freeSt.pop() : TREES.stumpN++; TREES.stumps.setMatrixAt(e.stump, TREES.m); TREES.stumps.count = TREES.stumpN; TREES.stumps.instanceMatrix.needsUpdate = true;
}
// cut one tree: hide it, free its collision and crown, leave a stump; returns the wood it gives
function treeCut(e, o = {}) {
  if (!e || e.cut) return 0;
  hideInst(e); e.cut = true; e.sap = 0; e.cutH = gameH(); TREES.cut++; TREES.cutList.push(e); TREES.keys.add(tkey(e.x, e.z));
  takeTrunk(e); takeCrown(e); addStump(e);
  if (o.anim) treeFall(e, o.dir ?? rng() * TAU);
  const k = TREE_KIND[e.id];
  return k ? Math.max(1, Math.round(k.wood * clamp(e.sc, 0.7, 1.4))) : 0;
}
function treeFall(e, dir) {
  const p = new V3(), q = new THREE.Quaternion(), s = new V3(); e.m0.decompose(p, q, s);
  const g = new THREE.Group(); g.position.copy(p);
  const mesh = new THREE.Mesh(e.it.near.geometry, VEG.mat); mesh.quaternion.copy(q); mesh.scale.copy(s); mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh); scene.add(g);
  const dx = Math.sin(dir), dz = Math.cos(dir);
  TREES.fall.push({ g, axis: new V3(dz, 0, -dx), t: 0, ang: 0, w: 0, x: p.x, y: p.y, z: p.z, dx, dz, landed: false, h: (e.id === 'giant' ? 34 : e.id === 'canopy' ? 17 : e.id === 'palm' ? 11 : 6) * s.y });
  AUD.at('fall', p, 1.3);
  shQuery(p.x, p.z, 26, b => { if (b.alive && !b.isPlayer && !b.tribe && !b.pet && !b.hunter && b.tpl.kind !== 'fish' && b.state !== 'fight' && (b.sp.ai === 'herb' || b.sp.ai === 'troop' || b.sp.herd)) threatReact(b, P.a || b, true); });
}
function treesUpdate(dt) {
  for (const a of TREES.dirty) a.needsUpdate = true; TREES.dirty.clear();
  for (let i = TREES.fall.length - 1; i >= 0; i--) {
    const f = TREES.fall[i]; f.t += dt;
    if (!f.landed) {
      f.w += dt * (0.9 + f.ang * 2.2); f.ang = Math.min(1.5, f.ang + f.w * dt);
      if (f.ang >= 1.5) {
        f.landed = true;
        if (Math.hypot(camera.position.x - f.x, camera.position.z - f.z) < 70) { for (let k = 2; k <= 8; k++) FX.spawn('dust', f.x + f.dx * f.h * k / 9, f.y + 0.4, f.z + f.dz * f.h * k / 9, 3); CAM.shake = Math.max(CAM.shake, 0.18); }
      }
    } else if (f.t > 4.5) { f.g.position.y -= dt * 0.9; if (f.t > 8) { scene.remove(f.g); TREES.fall.splice(i, 1); continue; } }
    f.g.quaternion.setFromAxisAngle(f.axis, f.ang + (f.landed ? Math.sin(Math.min(f.t, 3) * 9) * 0.02 * Math.max(0, 1 - f.t / 3) : 0));
  }
}
// clear bushes, ferns, grass and stones under a building
function clearUnder(x, z, r) {
  treeScan(TREES.u, x, z, r, e => { hideInst(e); e.cut = true; TREES.uncl.push(e); });
}
function treeRestoreAll() {
  for (const e of TREES.cutList) {
    showInst(e); e.cut = false; e.sap = 0; e.cutH = null; e.stump = null;
    if (!e.ghost) treeSolid(e);
  }
  for (const e of TREES.uncl) { showInst(e); e.cut = false; }
  for (const f of TREES.fall) scene.remove(f.g);
  TREES.cutList = []; TREES.uncl = []; TREES.fall = []; TREES.keys.clear(); TREES.cut = 0; TREES.stumpN = 0; TREES.freeSt = []; if (TREES.stumps) TREES.stumps.count = 0;
}
function treeKeys() { return [...TREES.keys]; }
function treeApplyKeys(list) {
  for (const k of list) {
    const [x, z] = k.split(',').map(n => +n / 10); let best = null, bd = 0.25;
    treeScan(TREES.g, x, z, 0.3, (e, d) => { if (d < bd) { bd = d; best = e; } });
    if (best) treeCut(best, {});
  }
}
// the hunter fells trees with the axe: a few strokes, then the tree comes down for real
CTXT.wood = ['axe', 'לכרות', 'להחזיק כדי לכרות את העץ'];
function woodStep(dt) {
  const a = P.a, e = CAMPH.treeEnt; if (!e || e.cut) return;
  P.eating = false; showTool('axe'); a.chopT = 0.35;
  const k = TREE_KIND[e.id], need = k.hits * 0.75 * clamp(e.sc, 0.8, 1.3) * (P.workshopOn ? 0.75 : 1);
  a.yaw += angDiff(a.yaw, Math.atan2(e.x - a.pos.x, e.z - a.pos.z)) * Math.min(1, dt * 6);
  CAMPH.woodT += dt; CAMPH.chopK = (CAMPH.chopK || 0) - dt;
  if (CAMPH.chopK <= 0) { CAMPH.chopK = 0.75; AUD.play('chop', 0.85); FX.spawn('dust', e.x - Math.sin(a.yaw) * treeTrunkR(e), a.pos.y + 1, e.z - Math.cos(a.yaw) * treeTrunkR(e), 3); }
  vxProgress(CAMPH.woodT / need, e.id === 'giant' ? 'כורתים עץ ענק...' : 'כורתים...');
  if (CAMPH.woodT < need) return;
  CAMPH.woodT = 0; CAMPH.treeEnt = null;
  const w = treeCut(e, { anim: true, dir: Math.atan2(e.x - a.pos.x, e.z - a.pos.z) }); PROG.flags.wood = 1; PROG.flags.fell = (PROG.flags.fell || 0) + 1;
  giveWood(w, 'העץ נפל!');
}
function giveWood(w, head) {
  const room = Math.max(0, CARRY.wood - (P.inv.wood || 0)), take = Math.min(w, room); P.inv.wood = (P.inv.wood || 0) + take;
  let rest = w - take, stored = 0;
  const oc = ownCamp(); if (rest > 0 && oc && Math.hypot(P.a.pos.x - oc.x, P.a.pos.z - oc.z) < villageR() + 25) { boxStore(); CAMPH.store.wood += rest; stored = rest; rest = 0; }
  UI.notify(`${head} ${take} עצים לארגז${stored ? `, ${stored} למחסן הכפר` : ''}${rest > 0 ? ` (${rest} לא נכנסו)` : ''}`, 'good');
}
// ================= THE TRIBES OF THE JUNGLE: classes, a chief, joining as a stranger, earning rank, smoke you can follow =================
const TNAMES = {
  m: ['טאיאו', 'אקאי', 'פוראן', 'יאקי', 'טופאן', 'קאיקה', 'ג׳ורה', 'טאקו', 'ראוני', 'איטה', 'אובירה', 'קאוואן', 'ג׳אגו', 'מאווי', 'אראקן', 'טיבאו', 'יוראן', 'קאוי', 'נאוני', 'פאיה', 'רודה', 'סאקאי', 'טאפי', 'אוראק', 'ג׳ובה', 'קורוא', 'מאנאו', 'ביראה', 'טוקה', 'אינארו', 'קאביה', 'רואה', 'אונה', 'טאווי', 'פינדו', 'גואקה'],
  f: ['ייארה', 'אינאה', 'מאיה', 'ראיני', 'טואני', 'אמאני', 'ייבה', 'ג׳אסי', 'אריה', 'קאואה', 'נאיה', 'פורה', 'איארה', 'ג׳ורנה', 'טאינה', 'מואנה', 'קאירה', 'ליארה', 'אובה', 'ניארה', 'סואה', 'פאטי', 'רואנה', 'יאסי', 'אנאי', 'טוקאה', 'מירה', 'קאוה', 'אילאני', 'בורה', 'ג׳אנה', 'סאיה']
};
const RANKS = [{ n: 'מצטרף', at: 0 }, { n: 'צייד השבט', at: 8 }, { n: 'לוחם השבט', at: 20 }, { n: 'יד ימינו של ראש השבט', at: 40 }];
function tribeName(sex) {
  const used = new Set(ANIMALS.filter(a => a.alive && a.tpl.kind === 'human').map(a => a.name));
  const L = TNAMES[sex] || TNAMES.m, free = L.filter(n => !used.has(n)); return free.length ? pick(free) : pick(L);
}
function spawnHunters() {
  if (!HUNT.camps.length) pickCamps();
  HUNT.camps.forEach((c, i) => { buildCamp(c); tribePopulate(c, i); });
}
function tribePopulate(c, i) {
  if (c.own) return;
  if (c.civ || c.bandit) { civPopulate(c, i); return; }
  const plan = ['chief', 'warrior', 'warrior', 'hunter', 'gatherer', 'gatherer', 'child', 'child'];
  if (!c.deep) plan.push('hunter', 'elder');
  plan.forEach((cls, k) => spawnVillager(c, cls, null, cls === 'hunter' && k === 3 && i === 0));
}
function spawnVillager(c, cls, sex, withPet, job) {
  if (c.dormant) return null;
  sex = sex || (cls === 'gatherer' ? 'f' : cls === 'child' ? (rng() < 0.5 ? 'm' : 'f') : cls === 'hunter' && rng() < 0.2 ? 'f' : 'm');
  const look = job && TOWNJOBS.includes(job) ? job : cls, seed = lookSeed(), key = ensureTribal(look, tribeKeyOf(c), sex, false, seed % 3);
  for (let t = 0; t < 25; t++) {
    const ang = rng() * TAU, d = rr(2.6, 7), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    if (waterDepth(x, z) > 0) continue;
    const h = new Animal('hunter', x, z, { sex, tpl: key, scale: rr(0.95, 1.05), young: cls === 'child' });
    Object.assign(h, { cls, hunter: true, camp: c, name: c.civ || c.bandit ? civName(c, sex) : tribeName(sex), pets: [], state: 'idle', stT: rr(2, 10), spearCD: rr(0, 2), netCD: 0, vd: 230 });
    h.home.set(c.x, 0, c.z); civLook(h, c, seed);
    if (cls === 'chief') { h.elite = true; h.maxHp *= 1.5; h.hp = h.maxHp; }
    if (cls === 'warrior') { h.maxHp *= 1.25; h.hp = h.maxHp; }
    if (cls === 'gatherer' || cls === 'child' || cls === 'elder') h.brain = 'villager';
    if (job) { h.job = job; if (TOWNJOBS.includes(job)) h.brain = 'villager'; }
    c.hunters.push(h);
    if (withPet) {
      const id = pick(['coati', 'capybara', 'peccary']), b = new Animal(id, x + rr(-2, 2), z + rr(-2, 2), { young: id !== 'coati' });
      if (waterDepth(b.pos.x, b.pos.z) > 0) { b.pos.set(x, 0, z); b.ground(1, true); }
      makePet(h, b);
    }
    return h;
  }
  return null;
}
// a tribe refills whatever it is missing: a chief first, then women, warriors, children, hunters
function spawnHunter(c, withPet) {
  if (!c || c.own || c.gone || c.dormant) return null;
  const alive = c.hunters.filter(h => h.alive && !h.gone), cnt = k => alive.filter(h => h.cls === k).length;
  // a gang of bandits takes in only fighting men, and not many of them
  if (c.bandit && (alive.length >= 6 || !alive.length)) return null;
  const cls = c.bandit ? (cnt('chief') ? (cnt('warrior') < 3 ? 'warrior' : 'hunter') : 'chief') : !cnt('chief') ? 'chief' : cnt('gatherer') < 2 ? 'gatherer' : cnt('warrior') < 2 ? 'warrior' : cnt('child') < 2 ? 'child' : 'hunter';
  const h = spawnVillager(c, cls, c.bandit ? 'm' : null, withPet && !c.bandit);
  if (h && cls === 'chief' && (c.civ || c.bandit)) civRuler(c, h);
  return h;
}
function hunterPlan(h) {
  h.crouch = false; h.target = null;
  h.pets = (h.pets || []).filter(b => b.alive && !b.gone && b.pet === h);
  const c = h.camp;
  // no camp: a wife or a child of yours who has not been taken into the tribe yet (right after loading)
  if (!c) { if (P.human && (h.isPartner || h.cub)) tribeJoin(h); h.state = 'idle'; h.stT = 1; return; }
  if ((h.job === 'guard' || h.job === 'patrol') && guardPlan(h)) return;
  if (isNight()) { hGoto(h, c.x + rr(-3, 3), c.z + rr(-3, 3), 'camp'); return; }
  const r = rng();
  if (h.cls === 'chief' || h.cls === 'warrior') {
    if (r < (h.cls === 'chief' ? 0.65 : 0.3)) { hGoto(h, c.x + rr(-2.6, 2.6), c.z + rr(-2.6, 2.6), 'camp'); return; }
    for (let t = 0; t < 8; t++) { const ang = rng() * TAU, d = rr(8, 24), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d; if (inBounds(x, z) && waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { hGoto(h, x, z, null); return; } }
    h.state = 'idle'; h.stT = rr(4, 9); return;
  }
  if (h.pets.length < 2 && r < 0.3) { const b = findTameTarget(h, 50); if (b) { h.state = 'tame'; h.target = b; h.tameT = 0; h.stT = 45; return; } }
  if (r < 0.7) { const p = findHunterPrey(h, 60); if (p) { h.state = 'hunt'; h.target = p; h.stT = 50; return; } }
  if (r < 0.9) { const s = fishingSpot(h); if (s) { h.fishSpot = s; hGoto(h, s.x, s.z, 'fish'); return; } }
  for (let t = 0; t < 8; t++) { const ang = rng() * TAU, d = rr(15, 80), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d; if (inBounds(x, z) && waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { hGoto(h, x, z, null); return; } }
  h.state = 'idle'; h.stT = rr(3, 8);
}
// women, children and elders: gather, fetch water, play, talk by the fire, and run from danger
function vGoto(h, x, z, then, t) { h.state = 'goto'; h.goal = { x, z }; h.goalThen = then; h.thenT = t || 6; h.stT = 60; h.blocked = 0; }
function villagerThreat(h, r) {
  let th = null;
  const war = h.camp && atWar(campIndex(h.camp));
  shQuery(h.pos.x, h.pos.z, r, b => {
    if (th || !b.alive || b.young || b.brain === 'captive') return;
    if ((b.isPlayer || b.tribe) ? war : b.hunter ? warHit(h, b) : false) { th = b; return; }
    if (!b.isPlayer && !b.hunter && !b.tribe && !b.pet && b.tpl.kind !== 'bird' && b.tpl.kind !== 'fish' && (b.sp.ai === 'pred' || b.sp.ai === 'pack' || b.sp.ai === 'croc' || b.state === 'fight')) th = b;
  });
  return th;
}
BRAIN.villager = function (h, dt) {
  h.stT -= dt; h.think -= dt; h.hp = Math.min(h.maxHp, h.hp + dt * 0.5);
  if (h.fleeing) return hunterFlee(h, dt);
  const c = h.camp; if (!c) { h.move(0, 0, 0, dt); h.pose = 'idle'; return; }
  if (h.state === 'defend') { h.state = 'vflee'; h.threat = h.foe; h.stT = 6; }
  if (h.think <= 0) {
    h.think = 0.6 + rng() * 0.4;
    const th = h.state !== 'vflee' ? villagerThreat(h, 16) : null;
    if (th) {
      h.state = 'vflee'; h.threat = th; h.stT = 7; h.carry = false;
      if (h.dCam < 40 && rng() < 0.6) say(h, pick(['עזרה! טורף!', 'לרוץ למדורה!', 'יש כאן טורף!']), 2.4);
      for (const o of c.hunters) if (o.alive && !o.brain && o.state !== 'defend' && dist2(o.pos, h.pos) < 50) { o.foe = th; o.state = 'defend'; }
    }
  }
  const home = () => { h.carry = false; if (c.spots && c.civ && !h.young) { townHome(h); return; } vGoto(h, c.x + rr(-3.2, 3.2), c.z + rr(-3.2, 3.2), h.young ? 'play' : 'sit', rr(10, 25)); };
  if (TSTATES[h.state]) { townState(h, dt); return; }
  switch (h.state) {
    case 'vflee': {
      const t = h.threat;
      if (!t || !t.alive || h.stT <= 0 || dist2(t.pos, h.pos) > 32) { home(); return; }
      let fx = c.x - h.pos.x, fz = c.z - h.pos.z; const ax = h.pos.x - t.pos.x, az = h.pos.z - t.pos.z, ad = Math.hypot(ax, az) || 1, cd = Math.hypot(fx, fz) || 1;
      fx = fx / cd * 0.6 + ax / ad; fz = fz / cd * 0.6 + az / ad; const fl = Math.hypot(fx, fz) || 1;
      h.move(fx / fl, fz / fl, (h.sp.run || 5) * (h.young ? 0.75 : 0.9), dt); h.pose = 'move'; return;
    }
    case 'goto': {
      const g = h.goal; if (!g) { h.state = 'idle'; return; }
      h.steerTo(g.x, g.z, h.young ? 2.6 : (h.sp.walk || 1.5) * (h.carry ? 0.85 : 1), dt); h.pose = h.carry ? 'carry' : 'move';
      // the way may go round by a gate: arrived means at the goal itself
      const d = Math.hypot(g.x - h.pos.x, g.z - h.pos.z);
      if (d < 1.2 || h.blocked > 1.2 || h.stT <= 0) { h.state = h.goalThen || 'idle'; h.stT = h.thenT || 6; }
      return;
    }
    case 'gather': h.move(0, 0, 0, dt); h.pose = 'gather'; if (h.stT <= 0) { h.carry = true; home(); } return;
    case 'water': h.move(0, 0, 0, dt); h.pose = 'kneel'; if (h.stT <= 0) { h.carry = true; home(); } return;
    case 'sit': case 'camp': {
      h.move(0, 0, 0, dt); const d = dist2(h.pos, c); if (d > 1.4) h.yaw += angDiff(h.yaw, Math.atan2(c.x - h.pos.x, c.z - h.pos.z)) * Math.min(1, dt * 3);
      h.pose = isNight() && G.time > 21.5 || G.time < 5 ? 'sleep' : h.cls === 'elder' || h.young ? 'sit' : 'sit'; if (h.stT <= 0) villagerPlan(h); return;
    }
    case 'play': {
      if (!h.playGoal || dist2(h.pos, h.playGoal) < 1 || (h.playT = (h.playT || 0) - dt) <= 0) {
        const mate = c.hunters.find(o => o !== h && o.alive && o.young && rng() < 0.5);
        const ang = rng() * TAU, r = rr(3, 9); h.playGoal = mate ? { x: mate.pos.x, z: mate.pos.z } : { x: c.x + Math.cos(ang) * r, z: c.z + Math.sin(ang) * r }; h.playT = rr(2, 5);
      }
      h.steerTo(h.playGoal.x, h.playGoal.z, rng() < 0.5 ? 3.2 : 1.6, dt); h.pose = 'move';
      if (rng() < dt * 0.05 && h.dCam < 25) say(h, pick(['תתפוס אותי!', 'הנה אני!', 'חחח', 'מהר יותר!']), 1.8);
      if (h.stT <= 0) villagerPlan(h); return;
    }
    case 'chat': {
      const o = h.chatWith; if (!o || !o.alive || h.stT <= 0) { h.chatWith = null; villagerPlan(h); return; }
      const dx = o.pos.x - h.pos.x, dz = o.pos.z - h.pos.z, d = Math.hypot(dx, dz) || 0.01;
      if (d > 1.7) { h.move(dx / d, dz / d, h.sp.walk || 1.5, dt); h.pose = 'move'; return; }
      h.move(dx / d, dz / d, 0.01, dt); h.pose = 'talk';
      if ((h.chatK = (h.chatK || 0) - dt) <= 0) { h.chatK = rr(3, 6); if (h.dCam < 18) say(h, pick(chatLines(h))); }
      return;
    }
  }
  h.move(0, 0, 0, dt); h.pose = 'idle'; if (h.stT <= 0) villagerPlan(h);
};
const CHAT = ['הציידים חזרו עם קפיברה', 'בלילה שמעתי יגואר ליד הנהר', 'צריך עוד עצים למדורה', 'הזר הזה... אפשר לסמוך עליו?', 'המים עלו בנהר', 'ראש השבט מרוצה', 'הילדים שוב ברחו ליער', 'מצאתי פירות מתוקים'];
function villagerPlan(h) {
  const c = h.camp, r = rng(); h.carry = false;
  if (c && c.civ && c.spots && townPlan(h)) return;
  if (isNight()) { vGoto(h, c.x + rr(-3.5, 3.5), c.z + rr(-3.5, 3.5), 'sit', 30); return; }
  if (h.young) { h.state = 'play'; h.stT = rr(15, 35); return; }
  if (h.cls === 'elder') { vGoto(h, c.x + rr(-2.2, 2.2), c.z + rr(-2.2, 2.2), 'sit', rr(30, 70)); return; }
  if (r < 0.2) { const o = c.hunters.find(q => q !== h && q.alive && !q.young && q.brain === 'villager' && q.state !== 'chat' && dist2(q.pos, h.pos) < 15); if (o) { h.state = 'chat'; h.chatWith = o; h.stT = rr(10, 18); o.state = 'chat'; o.chatWith = h; o.stT = h.stT; return; } }
  if (r < 0.5) { for (let t = 0; t < 8; t++) { const ang = rng() * TAU, d = rr(10, 28), x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.8) { vGoto(h, x, z, 'gather', rr(6, 11)); return; } } }
  if (r < 0.7) { const w = nearestWater(c.x, c.z); if (w && Math.hypot(w.x - c.x, w.z - c.z) < 60) { const dx = w.x - c.x, dz = w.z - c.z, L = Math.hypot(dx, dz) || 1; vGoto(h, w.x - dx / L * 1.5, w.z - dz / L * 1.5, 'water', rr(3, 5)); return; } }
  vGoto(h, c.x + rr(-3.5, 3.5), c.z + rr(-3.5, 3.5), 'sit', rr(12, 30));
}

// ---------- smoke rising over every camp: the way to find people ----------
const SMOKE = { tex: null, cols: [] };
function smokeUpdate(dt) {
  if (!SMOKE.tex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(128,122,114,.95)'); gr.addColorStop(0.45, 'rgba(150,145,137,.55)'); gr.addColorStop(1, 'rgba(170,166,158,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    SMOKE.tex = new THREE.CanvasTexture(cv);
  }
  for (const c of HUNT.camps) if (!c.gone && !SMOKE.cols.some(s => s.c === c)) {
    const s = { c, parts: [] };
    for (let i = 0; i < 18; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE.tex, color: 0xa8a198, transparent: true, depthWrite: false, fog: false, opacity: 0 })); sp.renderOrder = 2; scene.add(sp); s.parts.push({ sp, t: i / 18 * 12 }); }
    SMOKE.cols.push(s);
  }
  const cp = camera.position, night = SKY.night || 0, wind = 0.5 + G.rain;
  for (let k = SMOKE.cols.length - 1; k >= 0; k--) {
    const s = SMOKE.cols[k];
    if (!HUNT.camps.includes(s.c) || s.c.gone) { for (const p of s.parts) scene.remove(p.sp); SMOKE.cols.splice(k, 1); continue; }
    const c = s.c, d = Math.hypot(cp.x - c.x, cp.z - c.z), vis = d < 700 && d > 6, fade = clamp(1 - (d - 260) / 560, 0.35, 1) * (1 - night * 0.75), far = smooth(40, 220, d);
    s.parts.forEach((p, i) => {
      p.sp.visible = vis; if (!vis) return;
      p.t = (p.t + dt) % 12; const u = p.t / 12, y = (c.fy || c.y) + 1.2 + u * 52;
      p.sp.position.set(c.x + Math.sin(u * 3 + i) * u * 2 + u * u * 12 * wind, y, c.z + Math.cos(u * 2.3 + i) * u * 2 + u * u * 5 * wind);
      // from far away the column is wider and denser, so it can be seen over the canopy
      p.sp.scale.setScalar((1.6 + u * 11) * (1 + far * 1.1)); p.sp.material.opacity = smooth(0, 0.08, u) * Math.pow(1 - u, 0.8) * (0.62 + far * 0.28) * fade;
    });
  }
}

// ---------- finding a tribe, trust, rank ----------
function campTrust(i) { return VX.trust[i] || 0; }
function addTrust(i, n) { VX.trust[i] = clamp(campTrust(i) + n, -100, 100); }
function rankName(r) { return (RANKS[r] || RANKS[0]).n; }
function addPts(n, why) {
  if (VX.mem < 0) return;
  VX.pts += n; const before = VX.rank;
  while (VX.rank < RANKS.length - 1 && VX.pts >= RANKS[VX.rank + 1].at) VX.rank++;
  if (why) combatText(`${why} +${n} כבוד בשבט`, 'good');
  if (VX.rank > before) { const c = memberCamp(); UI.big('עלית בדרגה!', `${c ? c.tribe : 'השבט'}: עכשיו אתה ${rankName(VX.rank)}`); AUD.play('chime'); PROG.flags['rank' + VX.rank] = 1; saveGame(); }
}
function tribesUpdate(dt) {
  const p = P.a;
  for (let i = 0; i < HUNT.camps.length; i++) {
    const c = HUNT.camps[i]; if (c.own || c.gone || VX.known.has(i)) continue;
    if (Math.hypot(c.x - p.pos.x, c.z - p.pos.z) < 55) {
      VX.known.add(i); PROG.flags.foundTribe = 1;
      const ch = c.hunters.find(h => h.alive && h.cls === 'chief'), n = c.hunters.filter(h => h.alive).length;
      if (c.bandit) UI.big(`מחנה שודדים: ${c.tribe}`, `${n} שודדים שאורבים למי שעובר בדרך. מי שמנצח אותם מוצא אצלם זהב ושלל`);
      else UI.big(`מצאת את ${c.tribe}`, `${c.civ && c.cap && c.realm ? `בירת ${c.realm}. ` : ''}${n} אנשים. ${c.civ ? (c.cap ? 'השליט' : heb(ch, 'ראש המקום', 'ראשת המקום')) : heb(ch, 'ראש השבט', 'ראשת השבט')}: ${ch ? ch.name : 'לא ידוע'}. אפשר לגשת ${ch && ch.sex === 'f' ? 'אליה' : 'אליו'} ולדבר`);
      AUD.play('chime'); discover('hunter'); saveGame();
    }
  }
  // the tribes slowly refill: a newborn, a stranger who joins
  if (VX.refillDay !== G.day && G.time > 6) { VX.refillDay = G.day; for (const c of HUNT.camps) if (!c.own && !c.gone && c.hunters.filter(h => h.alive).length < tribeCap(c)) spawnHunter(c, false); }
  VX.hintT -= dt;
  if (VX.hintT <= 0 && !VX.known.size && G.mode === 'play') {
    VX.hintT = 240;
    const c = HUNT.camps.filter(q => !q.own && !q.gone).sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z))[0];
    if (c) { const d = Math.hypot(c.x - p.pos.x, c.z - p.pos.z), dir = whereIs({ pos: { x: c.x, z: c.z } }).replace(/^\d+ מ׳ /, ''); UI.notify(`עשן עולה מעל העצים, ${dir}, בערך ${Math.round(d / 10) * 10} מ׳ מכאן. אולי גרים שם אנשים. הנקודה האפורה במצפן מראה את הכיוון`, 'good'); }
  }
  // the quest: bring meat to the tribe to be accepted
  const q = VX.quest;
  if (q && VX.mem < 0 && q.have >= q.need) { const c = HUNT.camps[q.c]; VX.quest = null; addTrust(q.c, 50); if (c) joinTribe(c, 'הבאת את הבשר. ראש השבט מקבל אותך'); }
}
// a member of the tribe is hit: the tribe comes to help
function vxOnPlayerHit(src) {
  if (!P.human || !src || src.hunter || src.tribe) return;
  const c = memberCamp(); if (!c || VX.rank < 1 || dist2(c, P.a.pos) > 90) return;
  let n = 0;
  for (const o of c.hunters) if (o.alive && !o.brain && !o.young && o.state !== 'defend' && dist2(o.pos, P.a.pos) < 45) { o.foe = src; o.state = 'defend'; n++; }
  if (n && G.t - (VX.helpT || -99) > 30) { VX.helpT = G.t; UI.notify(`בני ${c.tribe} באים לעזור לך!`, 'good'); }
}
// hurting the people of a tribe costs their trust; killing one gets you thrown out
function vxHitVillager(t) {
  const c = t.camp, i = c ? campIndex(c) : -1; if (i < 0 || t.duel || t.raider || c.bandit || atWar(i)) return;
  addTrust(i, -12);
  if (i === VX.mem) { VX.pts = Math.max(0, VX.pts - 4); if (G.t - (VX.hitT || -99) > 15) { VX.hitT = G.t; UI.notify(`פגעת ב${t.name}, ${heb(t, 'אחד', 'אחת')} מבני השבט שלך! השבט כועס`, 'bad'); } }
}
function vxOnKill(t) {
  if (!P.human || !t) return;
  if (t.hunter && t.camp) {
    if (t.camp.bandit) { PROG.flags.banditKill = 1; return; }
    const i = campIndex(t.camp); addTrust(i, -60);
    if (i === VX.mem) { const c = t.camp; leaveTribe(true); UI.big('גורשת מהשבט', `הרגת את ${t.name}. ${c.tribe} לא ${you('יקבל אותך', 'יקבל אותך')} יותר בקלות`); }
    return;
  }
  const c = memberCamp(), danger = (t.sp.danger || 0) >= 3 || t.sp.ai === 'pred' || t.sp.ai === 'croc' || t.sp.ai === 'pack';
  if (c && danger && dist2(c, t.pos) < 90) addPts(4, 'הגנת על השבט!');
  const oc = ownCamp(); if (oc && danger && dist2(oc, t.pos) < villageR() + 60) { PRESS.kills = (PRESS.kills || 0) + 1; }
}
function joinTribe(c, why) {
  const i = campIndex(c); if (i < 0) return;
  if (VX.mem >= 0 && VX.mem !== i) leaveTribe(true);
  VX.mem = i; VX.rank = 0; VX.pts = 0; VX.quest = null; VX.known.add(i); addTrust(i, 20);
  if (!ownCamp()) CAMPH.camp = c;
  const gifts = [];
  if (!P.hasBow) { P.hasBow = true; P.arrows = Math.max(P.arrows || 0, 8); gifts.push('קשת ושמונה חצים'); }
  if (P.spears < P.mods.spearsMax) { P.spears++; gifts.push('חנית'); }
  PROG.flags.joined = 1;
  UI.big(you(`בן ${c.tribe}`, `בת ${c.tribe}`), `${why}. ${you('אתה', 'את')} ${rankName(0)}${gifts.length ? `. קיבלת ${gifts.join(' ו')}` : ''}`);
  UI.notify(`כדי לעלות בדרגה: להביא בשר לראש השבט, ולהגן על השבט מטורפים. בדרגה גבוהה ראש השבט נותן ${P.sex === 'f' ? 'בעל' : 'אישה'} בקלות`, 'good');
  AUD.play('chime'); saveGame();
}
function leaveTribe(silent) {
  const c = memberCamp(); if (!c) return;
  if (!silent) UI.notify(`עזבת את ${c.tribe} בברכה. הם יזכרו אותך`, 'good');
  addTrust(VX.mem, 10); VX.mem = -1; VX.rank = 0; VX.pts = 0;
  if (CAMPH.camp === c) CAMPH.camp = ownCamp();
}
function tribesReset() {
  for (const c of HUNT.camps) for (const h of c.hunters || []) { h.consent = false; h.asked = false; }
}
// ---------- the chief decides about women ----------
function consentAsk(t) {
  const ch = chiefOf(t); if (!ch) return false;
  const c = t.camp, i = campIndex(c), mem = i === VX.mem, chance = mem ? [0.35, 0.7, 0.9, 1][VX.rank] : clamp(0.12 + campTrust(i) / 250 + (P.renown || 0) * 0.04, 0.1, 0.5);
  const food = (P.inv.meat || 0) + (P.inv.cooked || 0) + (P.inv.fish || 0), gift = food >= 3 ? 'food' : (P.inv.wood || 0) >= 6 ? 'wood' : null;
  const txt = mem ? `${you('אתה בן השבט', 'את בת השבט')} בדרגת ${rankName(VX.rank)}. ${VX.rank >= 2 ? 'ראש השבט סומך עליך.' : 'ראש השבט עוד בוחן אותך.'}` : you('אתה זר. ראש השבט לא מוסר בקלות את אחת מבנות השבט לזר.', 'את זרה. ראש השבט לא מוסר בקלות את אחד מבני השבט לזרה.');
  const el = uiCard('consentov', `<h2>${t.name}</h2><p>${clsWord(t)} מ${c.tribe}. ${txt} אפשר לבקש, להביא מתנה, או להילחם בראש השבט.</p>` +
    `<div class="btns" style="flex-wrap:wrap"><button class="btn pri" data-a="ask"${t.asked === G.day ? ' disabled' : ''}>${t.asked === G.day ? 'כבר ביקשת היום' : `לבקש רשות (${Math.round(chance * 100)}%)`}</button>` +
    `<button class="btn${gift ? ' pri' : ''}" data-a="gift"${gift ? '' : ' disabled'}>${gift === 'food' ? 'מתנה: 3 מנות אוכל' : gift === 'wood' ? 'מתנה: 6 עצים' : 'מתנה: צריך 3 מנות אוכל או 6 עצים'}</button>` +
    `<button class="btn" data-a="fight">דו-קרב עם ${ch.name}</button><button class="btn" data-a="close">לוותר</button></div>`);
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.a === 'ask') {
      if (t.asked === G.day) return; t.asked = G.day;
      if (rng() < chance) { closeCard('consentov'); consentGiven(t, `${ch.name} מסכים`); }
      else { say(ch, 'לא. עוד לא הוכחת את עצמך'); UI.notify(`${ch.name} מסרב. אפשר להביא מתנה או להילחם בו`, 'bad'); consentAsk(t); }
      return;
    }
    if (b.dataset.a === 'gift' && gift) { if (gift === 'food') payFood(3); else P.inv.wood -= 6; addTrust(i, 10); closeCard('consentov'); consentGiven(t, `${ch.name} קיבל את המתנה ומסכים`); return; }
    if (b.dataset.a === 'fight') { closeCard('consentov'); startDuel(ch, t); return; }
    closeCard('consentov');
  };
  return true;
}
function payFood(n) {
  for (const k of ['meat', 'fish', 'cooked']) { const take = Math.min(n, P.inv[k] || 0); P.inv[k] -= take; n -= take; if (n <= 0) break; }
}
function consentGiven(t, msg) {
  t.consent = true; UI.notify(`${msg}. ${t.name} ${heb(t, 'מצטרף', 'מצטרפת')} לשבט שלך`, 'love'); bond(t); PROG.flags.consent = 1;
  const ch = chiefOf(t); if (ch && ch.alive) say(ch, heb(t, 'שמור עליו', 'שמור עליה'), 3);
}
