// Builds "שבט הלוחמים": a walled city of about 300 people in the forest by the river (east bank, south of the clay bank),
// with the hunter as its chief. Runs inside the game page (the lab or a test page) and returns a report.
// Used to make a ready-made save for the player; the city is made with the game's own functions, as if it had grown.
(() => {
  const R = { steps: [], placed: {}, missed: {} };
  const note = s => R.steps.push(s);
  // ---------- a new journey: a man, the chief to be ----------
  SET.sp = 'hunter'; SET.sex = 'm'; saveSet();
  startGame(false); window.askPreg = () => { };
  __sim(1);
  // ---------- the place: flat, dry, water within reach, no tribe's land around ----------
  const X0 = 48, Z0 = 475;
  let best = null, bs = -1e9;
  for (let r = 0; r <= 30; r += 3) for (let k = 0; k < (r ? 12 : 1); k++) {
    const a = k / 12 * TAU, x = X0 + Math.cos(a) * r, z = Z0 + Math.sin(a) * r;
    if (waterDepth(x, z) > 0 || getNY(x, z) < 0.95 || waterDist(x, z) > 55) continue;
    let rough = 0; for (let q = 0; q < 8; q++) { const b = q / 8 * TAU; rough += Math.abs(getH(x + Math.cos(b) * 10, z + Math.sin(b) * 10) - getH(x, z)); }
    let zone = 0; for (let q = 0; q < 16; q++) { const b = q / 16 * TAU; if (zoneTribeAt(x + Math.cos(b) * 85, z + Math.sin(b) * 85) >= 0) zone++; }
    const sc = -rough - zone * 10 - r * 0.05; if (sc > bs) { bs = sc; best = { x, z }; }
  }
  P.a.pos.set(best.x, 0, best.z); P.a.ground(1, true);
  const v = foundCampAt(best.x, best.z);
  CLAN.tname = 'שבט הלוחמים';
  note(`camp at ${Math.round(v.x)},${Math.round(v.z)}`);
  // the chief knows the tribes around, and is known: a chief of a city
  for (let i = 0; i < HUNT.camps.length; i++) { const c = HUNT.camps[i]; if (!c.own && !c.gone && !isOld(c.x)) VX.known.add(i); }
  P.renown = 8; P.hasBow = true;
  // ---------- many people live here already (the houses are counted for them) ----------
  CLAN.residents = 220;
  boxStore().wood = 100000;   // (boxStore makes a new object each time: always through it, never a kept reference)
  // ---------- the buildings, as the builders would place them ----------
  const place = (t, n) => {
    for (let i = 0; i < n; i++) {
      if (!buildUnlocked(t)) { R.missed[t] = (R.missed[t] || 0) + 1; continue; }
      const s = autoSpot(t, v); if (!s) { R.missed[t] = (R.missed[t] || 0) + 1; continue; }
      const b = addBuilding(t, s.x, s.z, s.rot, 0, false, 'q'); buildDone(b, true);
      R.placed[t] = (R.placed[t] || 0) + 1;
    }
  };
  place('hall', 1); place('totem', 1);
  place('long', 8); place('house', 10); place('granary', 3);
  place('long', 4); place('house', 10); place('hut', 8);
  place('armory', 2); place('stable', 3); place('kennel', 2); place('aviary', 1); place('cartshop', 1);
  place('granary', 1); place('dock', 2); place('shipyard', 1);
  // gardens by the water (the builders' own search only looks near the middle of the town)
  for (let r = 18, n = 0; r <= 90 && n < 6; r += 3) for (let k = 0; k < 60 && n < 6; k++) {
    const a = k / 60 * TAU, x = v.x + Math.cos(a) * r, z = v.z + Math.sin(a) * r, rot = Math.atan2(v.x - x, v.z - z);
    if (waterDist(x, z) > 30 || zoneTribeAt(x, z) >= 0 || buildCheck('field', x, z, rot, 1)) continue;
    const b = addBuilding('field', x, z, rot, 0, false, 'q'); buildDone(b, true); R.placed.field = (R.placed.field || 0) + 1; n++;
  }
  place('tower', 6); place('torch', 30);
  BLD.tier = villageTier();
  note(`tier ${villageTier()} housing ${housing()}`);
  // the camp itself, all of it
  for (const u of UPG) if (!CAMPH.up[u.id]) { CAMPH.up[u.id] = 1; applyCampUp(u.id, true); }
  // ---------- the wall: stone all around, fortified gates, towers in the wall ----------
  keepRingClear && keepRingClear();
  const ring = defPlanRing('stonewall', false, false, { budget: 1e9 });
  note(`ring ${JSON.stringify(ring && { made: ring.made, open: ring.open, gates: ring.gates, R: Math.round(ring.R) })}`);
  for (const b of BLD.sites.slice()) if (BTYPES[b.t].def) { b.unpaid = false; buildDone(b, true); }
  const tw = defAddTowers(false, { budget: 1e9 });
  for (const b of BLD.sites.slice()) if (BTYPES[b.t].def) { b.unpaid = false; buildDone(b, true); }
  note(`wall towers ${tw}`);
  // in front of the wall: sharp stakes, and hidden pits beside every gate
  const wallR = defRingR(v);
  const gates = BLD.list.filter(b => b.t === 'gatehouse' || b.t === 'gate' || b.t === 'watergate');
  let stakes = 0, pits = 0;
  for (const b of BLD.list.filter(q => (q.t === 'stonewall' || q.t === 'walltower') && q.done)) {
    if (gates.some(g => Math.hypot(g.x - b.x, g.z - b.z) < 16)) continue;
    const dx = b.x - v.x, dz = b.z - v.z, d = Math.hypot(dx, dz) || 1, x = b.x + dx / d * 6, z = b.z + dz / d * 6;
    if (stakes % 1 === 0 && !segCheck('stakes', x, z, b.rot, 1, true)) { const s2 = addBuilding('stakes', x, z, b.rot, 0, false, 'q', 1); buildDone(s2, true); stakes++; }
  }
  for (const g of gates.filter(q => q.t === 'gatehouse')) {
    const dx = g.x - v.x, dz = g.z - v.z, d = Math.hypot(dx, dz) || 1, ox = dx / d, oz = dz / d, sx = -oz, sz = ox;
    for (const s of [-1, 1]) { const x = g.x + ox * 7 + sx * s * 5, z = g.z + oz * 7 + sz * s * 5; if (waterDepth(x, z) === 0 && !buildCheck('spikepit', x, z, 0, 1)) { const p = addBuilding('spikepit', x, z, 0, 0, false, 'q'); buildDone(p, true); pits++; } }
  }
  for (const b of BLD.sites.slice()) buildDone(b, true);
  defDirty();
  note(`stakes ${stakes} pits ${pits} wallR ${Math.round(wallR)}`);
  // ---------- the people out in the city: couples, children, workers, warriors and knights ----------
  const spread = m => {
    const hs = BLD.list.filter(b => b.done && (BTYPES[b.t].cap || b.t === 'granary' || b.t === 'armory' || b.t === 'field'));
    for (let t = 0; t < 12; t++) { const h = pick(hs), a = rng() * TAU, x = h.x + Math.cos(a) * (BTYPES[h.t].r + 2.5), z = h.z + Math.sin(a) * (BTYPES[h.t].r + 2.5); if (waterDepth(x, z) === 0 && !trunkPush({ x, z }, 0.6)) { m.pos.set(x, 0, z); m.ground(1, true); m.home && m.home.set(v.x, 0, v.z); return; } }
  };
  const make = (cls, sex) => { const b = spawnNewcomer(v, cls); if (!b) return null; if (sex && b.sex !== sex) { b.sex = sex; b.name = tribeName(sex); retemplate(b, memberTpl(b)); } b.clsLock = true; spread(b); return b; };
  // the chief's wife and two children
  const wife = new Animal('hunter', v.x + 2, v.z + 2, { sex: 'f', tpl: vxMateTpl('f') }); wife.ground(1, true);
  Object.assign(wife, { name: 'נועה', social: true, socialExtra: true, affinity: 100, isPartner: true, state: 'follow', followTarget: P.a, bondH: 0 });
  P.mates.push(wife); P.partner = wife; tribeEnsure(); PROG.flags.found = 1;
  for (const [n, s, age] of [['אריאל', 'm', 12], ['מאיה', 'f', 9]]) {
    const c = new Animal('hunter', v.x + rr(-2, 2), v.z + rr(-2, 2), { young: true, sex: s, tpl: vxKidTpl(s) }); c.ground(1, true);
    Object.assign(c, { mom: wife, cub: true, state: 'follow', followTarget: wife, age, cubHunger: 0, name: n, socialExtra: true }); P.cubs.push(c);
  }
  tribeEnsure();
  // twenty couples: the husbands warriors, hunters and builders; the wives gatherers, warriors and builders
  const HUS = ['warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'hunter', 'hunter', 'hunter', 'hunter', 'hunter', 'builder', 'builder', 'builder', 'builder', 'builder', 'warrior', 'warrior', 'hunter', 'builder'];
  const WIV = ['gatherer', 'gatherer', 'gatherer', 'gatherer', 'gatherer', 'gatherer', 'gatherer', 'gatherer', 'warrior', 'warrior', 'builder', 'builder', 'gatherer', 'gatherer', 'hunter', 'hunter', 'gatherer', 'builder', 'gatherer', 'warrior'];
  const couples = [];
  for (let i = 0; i < 20; i++) { const m = make(HUS[i], 'm'), f = make(WIV[i], 'f'); if (!m || !f) continue; m.spouse = f; f.spouse = m; f.birthCD = rr(4, 30); f.pos.set(m.pos.x + rr(-1.5, 1.5), 0, m.pos.z + rr(-1.5, 1.5)); f.ground(1, true); couples.push([m, f]); }
  // single people: young warriors (the knights among them), builders and gatherers
  for (const c of ['warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'builder', 'gatherer']) make(c);
  // children of the couples
  let kids = 0;
  for (const [m, f] of couples) {
    const n = kids < 18 ? (rng() < 0.45 ? 2 : 1) : 0;
    for (let k = 0; k < n && kids < 18; k++) {
      const sex = rng() < 0.5 ? 'm' : 'f', c = new Animal('hunter', f.pos.x + rr(-1, 1), f.pos.z + rr(-1, 1), { sex, tpl: vxKidTpl(sex), young: true, scale: rr(0.95, 1.05) }); c.ground(1, true);
      c.name = tribeName(sex); c.kidAge = rr(2, KID_H * 0.85); c.momU = f.uid; c.dadU = m.uid; c.cubHunger = 0;
      tribeJoin(c); TRIBE.adults.push(c); kidScale(c); kids++;
    }
  }
  // the knights: armour, a shield and a sword, a horse in the stable for each
  const wars = clanAdults().filter(m => m.cls === 'warrior' && !m.isPartner && m.sex === 'm');
  let knights = 0; for (const m of wars.slice(0, 8)) { m.knightPaid = true; if (setRole(m, 'knight', true)) { roleApply(m); retemplate(m, memberTpl(m)); knights++; } }
  // the merchants: two of the gatherers trade for the city
  let merch = 0; for (const m of clanAdults().filter(q => q.cls === 'gatherer' && !q.isPartner && !q.spouse).concat(clanAdults().filter(q => q.cls === 'gatherer' && !q.isPartner)).slice(0, 2)) if (setRole(m, 'merchant', true)) merch++;
  // every warrior with a sword from the armory
  for (const m of clanAdults()) if (m.cls === 'warrior' && m.wpn !== 'sword') { m.wpn = 'sword'; retemplate(m, memberTpl(m)); }
  CLAN.residents = Math.max(0, 300 - 1 - clanReal().length);
  note(`people: bodies ${clanReal().length} (adults ${clanAdults().length}, kids ${kids + P.cubs.length}), couples ${couples.length}, knights ${knights}, merchants ${merch}, residents ${CLAN.residents}, pop ${popCount()}`);
  // ---------- animals and vehicles ----------
  const stables = BLD.list.filter(b => b.done && b.t === 'stable'); for (const b of stables) for (let i = 0; i < 3; i++) makeTribeHorse(b);
  const dogOwners = clanAdults().filter(m => (m.cls === 'hunter' || m.cls === 'warrior') && !m.isPartner);
  const kn = BLD.list.filter(b => b.done && b.t === 'kennel'); let dogs = 0; for (let i = 0; i < Math.min(6, kn.length * 3); i++) { const o = dogOwners[i], k = kn[i % kn.length]; if (o) { makeTribeDog(o, k.x + rr(-1.5, 1.5), k.z + rr(-1.5, 1.5)); dogs++; } }
  const av = BLD.list.find(b => b.done && b.t === 'aviary'); let eagles = 0; if (av) for (const o of clanAdults().filter(m => m.cls === 'hunter' && !m.isPartner).slice(0, 2)) { makeEagle(o, av.x, av.z); eagles++; }
  for (let i = 0; i < 6; i++) addCow(v, v.cowGroup);
  for (const b of BLD.list.filter(q => q.done && q.t === 'cartshop')) { const h = cartHome(b); cartAdd(h.x, h.z, h.yaw, b); }
  for (const b of BLD.list.filter(q => q.done && q.t === 'shipyard')) { const h = shipHome(b); shipAdd(h.x, h.z, h.yaw, b); }
  note(`horses ${tribeHorses().length} dogs ${dogs} eagles ${eagles} cows ${v.cowGroup.members.filter(c => c.alive).length} carts ${CARTS.list.length} ships ${SHIPS.list.length}`);
  // ---------- the stores of a city ----------
  Object.assign(boxStore(), { wood: 900, cooked: 700, meat: 160, fish: 160, spears: 30, arrows: 240, swords: 6 });
  for (const [k, n] of [['stone', 300], ['iron', 60], ['copper', 40], ['salt', 40], ['gems', 6]]) boxStore()[k] = n;
  goldAdd(800 - goldHave());
  // the chief's own gear: iron points and an iron blade
  Object.assign(P, { ironSpear: true, ironArrow: true, arrows: 60 });
  P.spears = P.mods.spearsMax;
  // ---------- what a chief of a city has done already (the missions show what is still ahead) ----------
  for (const t of Object.keys(R.byT0 = (() => { const o = {}; for (const b of BLD.list) o[b.t] = 1; return o; })())) PROG.flags['built_' + t] = 1;
  for (const f of ['drink', 'throw', 'butcher', 'cook', 'foundTribe', 'talkChief', 'joined', 'rank1', 'rank2', 'arrow', 'found', 'setcls', 'promote', 'wedding', 'tribeBirth', 'tribeDog', 'tribeEagle', 'tribeHorse', 'iron', 'built_fence', 'built_gate', 'autoBuild', 'autoDef', 'defPlan', 'site', 'campup'])
    PROG.flags[f] = 1;
  PROG.flags.fell = 20; PROG.flags.built = BLD.list.filter(b => !BTYPES[b.t].def).length; PROG.flags.defBuilt = BLD.list.filter(b => BTYPES[b.t].def).length;
  for (let t = 1; t <= villageTier(); t++) PROG.flags['tier' + t] = 1;
  BLD.tier = villageTier(); P.discovered.add('hunter');
  silentDone();
  // ---------- the day: the tenth morning, the city wakes up ----------
  G.day = 10; G.time = 7.6; G.lastDawn = G.time; CLAN.dayK = G.day; CLAN.pmK = G.day;
  P.food = 95; P.water = 95;
  __sim(3);
  R.v = [Math.round(v.x), Math.round(v.z)]; R.tier = villageTier(); R.pop = popCount(); R.name = vxVillageName(); R.b = BLD.list.length;
  R.byT = {}; for (const b of BLD.list) R.byT[b.t] = (R.byT[b.t] || 0) + 1;
  return R;
})()
