// ================= ANIMALS & AI =================
const ANIMALS = [], GROUPS = [];
let NEXT_ID = 1;
const SHC = []; for (let i = 0; i < 2 * SHN * SHN; i++) SHC.push([]);
const shKey = (x, z) => (clamp(((z + W.half) / 20) | 0, 0, SHN - 1) + (x > OLDX ? SHN : 0)) * SHN + clamp(((gxo(x) + W.half) / 20) | 0, 0, SHN - 1);
function shBuild() { for (let i = 0; i < 2 * SHN * SHN; i++) SHC[i].length = 0; for (const a of ANIMALS) SHC[shKey(a.pos.x, a.pos.z)].push(a); }
function shQuery(x, z, r, fn) {
  const xo = gxo(x), bo = x > OLDX ? SHN : 0, x0 = clamp(((xo - r + W.half) / 20) | 0, 0, SHN - 1), x1 = clamp(((xo + r + W.half) / 20) | 0, 0, SHN - 1);
  const z0 = clamp(((z - r + W.half) / 20) | 0, 0, SHN - 1), z1 = clamp(((z + r + W.half) / 20) | 0, 0, SHN - 1), r2 = r * r;
  for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
    const cell = SHC[(iz + bo) * SHN + ix];
    for (let k = 0; k < cell.length; k++) { const a = cell[k], dx = a.pos.x - x, dz = a.pos.z - z, d2 = dx * dx + dz * dz; if (d2 < r2 && fn(a, Math.sqrt(d2)) === false) return; }
  }
}
const _tmp = new V3(), _t2 = new V3();
const isNight = () => G.time > 19.2 || G.time < 5.3;
const heb = (a, m, f) => a && a.sex === 'f' ? f : m;

class Animal {
  constructor(spId, x, z, o = {}) {
    this.id = NEXT_ID++; this.spId = spId; this.sp = SPECIES[spId];
    this.tplKey = o.tpl || (this.sp.tpls ? pick(this.sp.tpls) : spId); this.tpl = TPL[this.tplKey];
    const sk = makeSkinned(this.tpl); this.mesh = sk.mesh; this.B = sk.B; this.bones = sk.bones;
    { const self = this; this.mesh.onBeforeRender = (r, s, c, g, m) => charUniforms(self, m); }
    this.tailBones = this.tpl.kind === 'quad' ? Object.keys(this.B).filter(k => /^t\d+$/.test(k)).sort((p, q) => +p.slice(1) - +q.slice(1)).map(k => this.B[k]) : [];
    this.young = !!o.young; this.baseScale = o.scale || rr(this.sp.size[0], this.sp.size[1]);
    this.scale = this.baseScale * (this.young ? 0.45 : 1); this.mesh.scale.setScalar(this.scale);
    this.pos = new V3(x, 0, z); this.vel = new V3(); this.yaw = o.yaw ?? rng() * TAU;
    this.speed = 0; this.vy = 0; this.pitch = 0; this.look = 0; this.bank = 0; this.acc = 0; this.blocked = 0;
    this.maxHp = this.sp.hp * (this.young ? 0.35 : 1) * this.baseScale; this.hp = this.maxHp;
    this.state = 'idle'; this.pose = 'idle'; this.stT = rr(0, 4); this.think = rr(0, 0.6);
    this.hunger = rr(0, 45); this.thirst = rr(0, 40); this.stam = 100; this.affinity = rr(-5, 15);
    this.sex = o.sex || (rng() < 0.5 ? 'm' : 'f'); this.home = new V3(x, 0, z);
    this.alive = true; this.dead = false; this.food = 0; this.deadT = 0; this.group = o.group || null;
    this.atkCD = 0; this.windup = 0; this.anim = { phase: rng(), t: rng() * 10, atk: 0, hurt: 0 };
    const tp = this.tpl, oo = tp.o, k = tp.kind;
    if (k === 'quad') {
      this.rad = (Math.max(oo.chestR, oo.hipR) + tp.L * 0.3) * this.scale; this.height = (tp.by + oo.bodyR * 1.3) * this.scale;
      this.swimDepth = tp.legLen * 0.95 * this.scale; this.floatDepth = tp.by * 1.05 * this.scale;
      if (spId === 'caiman') this.floatDepth = 0.36 * this.scale;
      this.vd = 90 + 140 * Math.min(1, Math.max(oo.chestR, oo.hipR) * 3.2);
    } else if (k === 'bird') { this.rad = oo.r * 1.5 * this.scale; this.height = oo.r * this.scale; this.vd = spId === 'harpy' ? 240 : spId === 'hummer' ? 45 : 170; }
    else if (k === 'fish') { this.rad = oo.ry * this.scale; this.height = oo.ry * this.scale; this.vd = oo.len > 1 ? 90 : 55; }
    else if (k === 'snake') { this.rad = oo.r * 2 * this.scale; this.height = oo.r * 2 * this.scale; this.swimDepth = 0.35; this.floatDepth = oo.r * 0.7 * this.scale; this.vd = oo.len > 3 ? 130 : 45; }
    else if (k === 'human') { this.rad = 0.3 * this.scale; this.height = 1.75 * this.scale; this.swimDepth = 1.05 * this.scale; this.floatDepth = 1.3 * this.scale; this.vd = 230; }
    else { this.rad = 0.07; this.height = 0.08; this.vd = 32; }
    this.waterOnly = k === 'fish' || this.sp.ai === 'eel'; this.ownY = this.sp.ai === 'eel';
    this.mesh.position.copy(this.pos); scene.add(this.mesh); ANIMALS.push(this);
    if ((k === 'quad' || k === 'snake' || k === 'frog' || k === 'human') && !this.ownY) this.ground(1, true);
  }
  canSwim() { return this.tpl.kind !== 'frog' && (this.sp.swim || 0) > 0; }
  noise() {
    if (this.isPlayer) return P.noise;
    if (this.dive) return 0.15;
    if (this.spId === 'caiman' && this.swimming) return 0.3;
    if (this.crouch) return 0.45;
    return this.speed > (this.sp.walk || 2) * 1.6 ? 1.3 : 0.8;
  }
  steerTo(x, z, spd, dt) {
    if (WALLED.length && !this.isPlayer) { const g = gateDetour(this, x, z); if (g) { x = g.x; z = g.z; } }
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { this.move(0, 0, 0, dt); return d; }
    this.move(dx / d, dz / d, spd, dt); return d;
  }
  move(dx, dz, spd, dt) {
    if (this.gw && spd > 0.005) { const g = gateSteer(this, dx, dz); dx = g[0]; dz = g[1]; }
    if (spd > 0.005) this.yaw += angDiff(this.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * (this.sp.turn || 5) * (this.isPlayer ? 2.2 : 1));
    this.speed += (spd - this.speed) * Math.min(1, dt * (spd > this.speed ? 3.5 : 7));
    if (this.speed < 0.01) { this.speed = 0; return; }
    const step = this.speed * dt;
    let nx = this.pos.x + Math.sin(this.yaw) * step, nz = this.pos.z + Math.cos(this.yaw) * step;
    if (!inBounds(nx, nz)) {
      if (this.isPlayer) { if (!inWorld(nx, nz)) { nz = clamp(nz, -LIMIT + 1, LIMIT - 1); this.blocked += dt; } }
      else { const c = landCX(this.pos.x); nx = c + clamp(nx - c, -LIMIT, LIMIT); nz = clamp(nz, -LIMIT, LIMIT); this.blocked += dt; }
    }
    const k = this.tpl.kind;
    if (k === 'quad' || k === 'snake' || k === 'frog' || k === 'human') {
      const h0 = getH(this.pos.x, this.pos.z), h1 = getH(nx, nz), wd = waterDepth(nx, nz);
      if (!this.airborne && (h1 - h0) / Math.max(step, 1e-4) > 1.3 && wd < this.swimDepth) { this.blocked += dt; this.speed *= 0.4; return; }
      if (wd > this.swimDepth && !this.canSwim()) { this.blocked += dt; this.speed *= 0.4; return; }
      if (this.waterOnly && wd < 0.55 && !this.lunging) { this.blocked += dt; this.speed *= 0.4; return; }
      if ((k === 'quad' || k === 'human') && !this.swimming) { _tmp.set(nx, 0, nz); trunkPush(_tmp, this.rad * 0.55); if (DEF.n) defPush(_tmp, this.rad * 0.55, this, dt); nx = _tmp.x; nz = _tmp.z; }
      else if (this.swimming && DEF.wg.length) { _tmp.set(nx, 0, nz); wgPush(_tmp, this.rad * 0.55, this, dt); nx = _tmp.x; nz = _tmp.z; }
    }
    else if (k === 'fish' && !this.isPlayer && waterDepth(nx, nz) < 0.45) { this.blocked += dt; this.speed *= 0.4; return; }
    this.pos.x = nx; this.pos.z = nz; this.blocked = Math.max(0, this.blocked - dt * 0.5);
  }
  ground(dt, snap) {
    if (this.perched || this.hanging) return;
    const h = getH(this.pos.x, this.pos.z), ws = waterAt(this.pos.x, this.pos.z), depth = ws > -900 ? ws - h : 0;
    const was = this.swimming;
    this.swimming = !this.dead && depth > this.swimDepth && this.canSwim();
    if (this.swimming && !was && !snap && this.dCam < 45) { FX.spawn('splash', this.pos.x, ws, this.pos.z, 10); AUD.at('splash', this.pos, 0.5); }
    if (this.airborne) {
      this.vy -= 18 * dt; this.pos.y += this.vy * dt;
      const floor = this.swimming ? ws - this.floatDepth : h;
      if (this.pos.y <= floor) { this.pos.y = floor; this.airborne = false; this.vy = 0; if (this.onLand) this.onLand(); }
    } else if (this.swimming) {
      const ty = ws - this.floatDepth - (this.dive ? (this.diveD != null ? this.diveD : 0.55 + this.height) : 0);
      this.pos.y = snap ? ty : this.pos.y + (ty - this.pos.y) * Math.min(1, dt * 4);
    } else if (this.dead && depth > 0.25) this.pos.y += (Math.max(h, ws - 0.2 * this.scale) - this.pos.y) * Math.min(1, dt * 2);
    else this.pos.y = h;
    if (this.tpl.kind === 'quad' && !this.swimming && !this.dead) {
      const L = this.tpl.L * this.scale * 0.6 + 0.2, fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const p = Math.atan2(getH(this.pos.x + fx * L, this.pos.z + fz * L) - getH(this.pos.x - fx * L, this.pos.z - fz * L), 2 * L);
      this.pitch += (clamp(p, -0.6, 0.6) - this.pitch) * Math.min(1, dt * 6);
    } else this.pitch *= 0.9;
  }
  update(dt) {
    if (this.gone) return;
    const cp = camera.position, dc = Math.hypot(this.pos.x - cp.x, this.pos.z - cp.z);
    this.dCam = dc; this.acc += dt;
    const far = dc > 170 && !this.isPlayer && !this.isPartner && !this.cub;
    if (far && this.acc < 0.3) { this.mesh.visible = false; this.mesh.matrixWorldAutoUpdate = false; return; }
    const step = Math.min(0.5, far ? this.acc : dt); this.acc = 0;
    if (this.dead) {
      this.deadT += step; this.speed = 0; this.pose = 'dead';
      if (this.deadT > 220 || this.food <= 0.01) { if (!this.isPlayer) { this.remove(); return; } }
      const k = this.tpl.kind;
      if (k === 'bird') { const g = Math.max(getH(this.pos.x, this.pos.z), waterAt(this.pos.x, this.pos.z)); if (this.pos.y > g + 0.05) { this.vy -= 12 * step; this.pos.y = Math.max(g, this.pos.y + this.vy * step); } }
      if (k === 'fish' && !this.landed) { const w = waterAt(this.pos.x, this.pos.z); this.pos.y += ((w > -900 ? w : 0) - 0.12 - this.pos.y) * Math.min(1, step * 1.5); }
      if (k === 'quad' && !this.carriedBy && !this.heldBy && waterDepth(this.pos.x, this.pos.z) > 0.4) { const w = waterAt(this.pos.x, this.pos.z); this.ownY = true; this.pos.y += (w - this.height * 0.25 - this.pos.y) * Math.min(1, step * 1.2); }
      if (this.carriedBy) this.pos.copy(this.carriedBy.pos).y -= 0.45;
    } else {
      if (this.stunT > 0) { this.stunT -= step; this.speed *= 0.9; this.vel.multiplyScalar(0.9); }
      else if (this.trapLure && trapLureStep(this, step)) this.atkCD -= 0;
      else if (this.lured && luredStep(this, step)) this.atkCD -= 0;
      else if (!this.isPlayer && !this.frozen) BRAIN[this.brain || this.sp.ai](this, step);
      this.atkCD -= step;
    }
    if (this.mount) mountSync(this, step);
    const gk = this.tpl.kind; if ((gk === 'quad' || gk === 'snake' || gk === 'frog' || gk === 'human') && !this.ownY) { if (!this.carriedBy) this.ground(step); }
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw;
    const vis = dc < this.vd * (QUAL[SET.q].view / 245 * 0.4 + 0.6) && !this.hidden;
    this.mesh.visible = vis; this.mesh.matrixWorldAutoUpdate = vis;
    if (vis && dc < 150) animate(this, step);
  }
  remove() {
    if (this.mount) mountOff(this); else if (this.rider) mountOff(this.rider);
    this.gone = true; this.alive = false; scene.remove(this.mesh);
    if (this.mesh.skeleton) this.mesh.skeleton.dispose();
    if (this.mesh.material && this.mesh.material.userData.own) this.mesh.material.dispose();
    const i = ANIMALS.indexOf(this); if (i >= 0) ANIMALS.splice(i, 1);
    if (this.group) { const m = this.group.members, j = m.indexOf(this); if (j >= 0) m.splice(j, 1); }
  }
}

// ---------- combat ----------
function hurt(t, dmg, src) {
  if (!t || !t.alive || dmg <= 0) return;
  if (src && t.spId === 'bushdog' && src.spId === 'bushdog' && (!!t.pet !== !!src.pet)) return;
  dmg *= sizeDmg(src, t);
  if (src && playerSide(t)) attackNote(t, src);
  if (src && src.pet === P.a && src.spId === 'bushdog' && !t.isPlayer) t.stunT = Math.max(t.stunT || 0, 0.45);
  if (src && byPlayerSide(src) && !t.isPlayer) provoke(t, src);
  if (t.tpl.kind === 'bird' && src && src.tpl && src.tpl.kind !== 'bird' && !src.isPlayer && !src.hunter && rng() < 0.75) { birdEvade(t, src); return; }
  if (t.cowCamp) cowAttacked(t, src);
  if (t.spId === 'frog' && src && src !== t && !src.isPlayer && src.tpl && src.tpl.kind !== 'frog') { frogToxic(t, src); dmg *= 0.35; }
  if (src && src.legend) dmg *= src.legend.dmg;
  if ((t.inShip || (t.isPlayer && P.ship)) && src && !src.hunter && !src.isPlayer) return;
  if (t.isPlayer) { if (P.dodgeT > 0 || G.mode !== 'play') return; dmg *= P.armor || 1; }
  t.hp -= dmg; t.anim.hurt = Math.min(0.35, t.anim.hurt + dmg * 0.02 + 0.05);
  if (!t.hunter) startBleed(t, dmg);
  if (src) { t.lastHit = src; t.lastHitT = G.t; }
  if (t.dCam < 50 && dmg > 1.5) FX.spawn('hit', t.pos.x, t.pos.y + t.height * 0.8, t.pos.z, Math.min(10, 2 + dmg * 0.3));
  if (t.hunter && t.duel) { t.hp = Math.max(1, t.hp); return; }
  if (t.hunter && src && src.isPlayer) vxHitVillager(t);
  if (t.hunter && !t.duel && t.hp <= 0 && src && warKillOk(t, src)) { kill(t, src); hunterKilled(t, src); return; }
  if (t.hunter) { if (t.hp <= 0 && src && !src.isPlayer && !src.hunter && !src.tribe) { kill(t, src); hunterKilled(t, src); return; } if (t.hp < t.maxHp * 0.18) { t.hp = Math.max(1, t.hp); hunterStartFlee(t, src); } else hunterProvoked(t, src); return; }
  if (t.pet && src && src !== t.pet && !t.isPlayer) hunterProvoked(t.pet, src);
  if (t.isPlayer) { playerHurt(dmg, src); vxOnPlayerHit(src); return; }
  if (t.hp <= 0) { kill(t, src); return; }
  if (src) reactToAttack(t, src);
}
function kill(t, src) {
  if (!t.alive) return;
  t.hp = 0; t.alive = false; t.dead = true; t.state = 'dead'; t.pose = 'dead'; t.speed = 0; t.deadT = 0; t.vy = 0;
  t.food = (t.sp.food || 4) * (t.young ? 0.4 : 1) * t.baseScale;
  t.perched = false; t.hanging = false; if (t.mesh.rotation.z) t.mesh.rotation.z = 0;
  if (t.group) { const m = t.group.members, j = m.indexOf(t); if (j >= 0) m.splice(j, 1); t.group = null; }
  if (t.isPlayer) return;
  if (src && src.isPlayer) onPlayerKill(t);
  else if (src && src.pet === P.a && P.human) { PROG.kb = PROG.kb || {}; PROG.kb[t.spId] = (PROG.kb[t.spId] || 0) + 1; PROG.flags.dogKill = 1; UI.notify(`${src.name || 'הכלב'} ${heb(src, 'הפיל', 'הפילה')} ${t.sp.he}! אפשר לחתוך בשר`, 'good'); if (src.state === 'fight') { src.state = 'follow'; src.foe = null; } fetchStart(src, t); }
  else if (src && !src.isPlayer && !src.hunter && !src.tribe && !src.escort && src.pet !== P.a && src.alive && src.sp.ai !== 'raptor') { src.state = 'eat'; src.target = t; src.stT = 30; }
  if (t.cub || t.isPartner) onFamilyDeath(t);
}
function reactToAttack(t, src) {
  if (t.state === 'held' || t.isPlayer) return;
  const k = t.tpl.kind;
  if (t.hunter) return;
  if (k === 'bird' || k === 'fish' || k === 'frog') { if (t.social && src.isPlayer && t.spId === P.spId && t.sex === src.sex && !t.young) { t.state = 'fight'; t.foe = src; t.isRival = true; } else t.scared = 4; return; }
  if (t.isPartner || t.cub) { if (!src.isPlayer && !t.cub) { t.state = 'fight'; t.foe = src; } return; }
  const ai = t.sp.ai, brave = ai === 'pred' || ai === 'croc' || ai === 'snake' || (t.sp.fight && rng() < t.sp.fight + 0.15);
  if (brave && t.hp > t.maxHp * 0.3) { t.state = 'fight'; t.foe = src; if (t.spId === P.spId && src.isPlayer) t.isRival = t.sex === src.sex; return; }
  threatReact(t, src, true);
}
function preys(p, a) {
  if (!p || !a || p === a || p.frozen || a.frozen) return false;
  if (a.isPlayer && P.climb && P.climb.phase !== 'drop' && p.sp.ai !== 'raptor') return false;
  if (a.isPlayer && (P.growth || 1) >= 1.7 && p.sp.ai !== 'raptor' && !p.legend) return false;
  if (a.atDen && a.cub) return false;
  if (p.hunter) return HUNTER_PREY.includes(a.spId) && !a.pet && !a.young && !a.cub;
  if (a.isPlayer && P.human) return !p.pet && !p.young && !p.isPlayer && MANEATER.has(p.spId);
  if (a.tpl.kind === 'bird' && p.tpl.kind !== 'bird' && a.pos.y > getH(a.pos.x, a.pos.z) + 1.5) return false;
  if (p.isPlayer) return P.isPred && (((P.sp.prey || []).includes(a.spId)) || (a.young && a.spId !== P.spId)) && !a.isPartner && !a.cub;
  if (a.isPlayer && (p.isPartner || p.state === 'follow')) return false;
  if (p.spId === a.spId) return false;
  const pr = p.sp.prey; if (!pr) return false;
  return pr.includes(a.spId) || (a.young && (p.sp.ai === 'pred' || p.sp.ai === 'croc'));
}
function findThreat(a) {
  if (a.lastHit && a.lastHit.alive && G.t - a.lastHitT < 6) return a.lastHit;
  let best = null, bd = 1e9; const sense = (a.sp.sense || 20) * (isNight() ? 0.8 : 1);
  shQuery(a.pos.x, a.pos.z, sense * 1.5, (b, d) => {
    if (b === a || !b.alive || !preys(b, a)) return;
    const det = sense * b.noise() * (b.tpl.kind === 'bird' && a.tpl.kind !== 'bird' ? 0.4 : 1) * (trustsHunter(a, b) ? 0 : 1);
    if (d < det && d < bd) { bd = d; best = b; }
  });
  return best;
}
function threatReact(a, th, forced) {
  const sp = a.sp;
  let fight = !!sp.fight && rng() < sp.fight;
  if (sp.herd && a.group) { let n = 0; for (const m of a.group.members) if (m.alive && dist2(m.pos, a.pos) < 25) n++; fight = n >= 4 && rng() < 0.85; }
  if (byPlayerSide(th) && !((a.provokedT || 0) > G.t || (a.group && (a.group.provokedT || 0) > G.t))) fight = false;
  if (th.isPlayer && P.renown > 6) fight = false;
  if (fight) { a.state = 'fight'; a.foe = th; } else { a.state = 'flee'; a.threat = th; a.fleeWater = null; }
  a.stT = 0; a.dive = false;
  if (a.group) for (const m of a.group.members) if (m !== a && m.alive && m.state !== 'flee' && m.state !== 'fight' && dist2(m.pos, a.pos) < 35) {
    if (fight) { m.state = 'fight'; m.foe = th; } else { m.state = 'flee'; m.threat = th; m.fleeWater = null; }
  }
  if (a.dCam < 70) { if (a.spId === 'capybara') AUD.at('capy', a.pos, 0.6); else if (a.spId === 'peccary') AUD.at('clack', a.pos, 0.7); }
}
function doFlee(a, dt) {
  const t = a.threat;
  if (!t || !t.alive) { a.state = 'idle'; a.threat = null; a.stT = rr(2, 4); a.dive = false; return; }
  const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, d = Math.hypot(dx, dz) || 1;
  if (d > (a.sp.safe || 50)) { a.state = 'idle'; a.threat = null; a.stT = rr(2, 5); a.dive = false; return; }
  let fx = dx / d, fz = dz / d;
  if (a.sp.swimmer && !a.swimming) {
    const w = a.fleeWater || (a.fleeWater = nearestWater(a.pos.x, a.pos.z));
    if (w) { const wx = w.x - a.pos.x, wz = w.z - a.pos.z, wd = Math.hypot(wx, wz) || 1; if (wd < 45 && (wx * fx + wz * fz) / wd > -0.3) { fx = fx * 0.3 + wx / wd * 0.7; fz = fz * 0.3 + wz / wd * 0.7; } }
  }
  if (a.swimming && a.spId === 'capybara') a.dive = d < 25;
  if (a.blocked > 0.25) { a.fleeTurn = a.fleeTurn || (rng() < 0.5 ? 1 : -1); const c = Math.cos(1.3 * a.fleeTurn), s = Math.sin(1.3 * a.fleeTurn); const nx = fx * c - fz * s; fz = fx * s + fz * c; fx = nx; }
  a.stam -= dt * 7;
  a.move(fx, fz, (a.swimming ? (a.sp.swim || 1) : (a.sp.run || 3)) * (a.stam > 0 ? 1 : 0.55), dt);
  a.pose = a.swimming ? 'swim' : 'move';
}
function doFight(a, dt) {
  const f = a.foe;
  if (!f || !f.alive) { a.state = 'idle'; a.foe = null; a.stT = 1.5; a.windup = 0; return; }
  const dx = f.pos.x - a.pos.x, dz = f.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  const reach = (a.sp.reach || 1.4) * a.scale + f.rad;
  if (a.hp < a.maxHp * 0.25 && !a.isPartner) {
    a.state = 'flee'; a.threat = f; a.stT = 0; a.windup = 0;
    if (a.isRival && f.isPlayer && !a.defeated) rivalSubmit(a);
    return;
  }
  if (d > 45 || (f.swimming && !a.canSwim())) { a.state = 'idle'; a.foe = null; a.windup = 0; return; }
  a.look = clamp(angDiff(a.yaw, Math.atan2(dx, dz)), -1, 1);
  if (a.windup > 0) {
    a.windup -= dt; a.move(dx / d, dz / d, 0.01, dt); a.pose = a.swimming ? 'swim' : 'fight';
    if (a.windup <= 0) {
      if (a.feint) { a.feint = false; a.atkCD = 0.55; a.move(-dx / d, -dz / d, 4, 0.12); a.yaw = Math.atan2(dx, dz); return; }
      a.anim.atk = 0.45; a.atkCD = (a.sp.atkCD || 1.1) * (f.isPlayer ? 1.25 : 1);
      if (d < reach + 0.6) { hurt(f, (a.sp.dmg || 5) * a.scale * rr(0.8, 1.15) * (a.young ? 0.3 : 1) * (f.isPlayer ? 0.85 : 1) * (a.dmgK || 1), a); if (a.dCam < 50) AUD.at('bite', a.pos, 0.8); }
      if (f.isPlayer && f.alive && a.sp.ai === 'pred' && !a.young && d < reach + 0.6 && rng() < 0.28) { a.windup = 0.4; P.warnFrom = a; }
    }
    return;
  }
  if (d > reach * 0.9) { a.move(dx / d, dz / d, a.swimming ? (a.sp.swim || 1) : (a.sp.run || 3) * 0.85, dt); a.pose = a.swimming ? 'swim' : 'move'; }
  else fightClose(a, f, dx, dz, d, reach, dt);
}
function doFollow(a, dt) {
  if (a.cub && denHold(a, dt)) return;
  if (a.stay && stayStep(a, dt)) return;
  const L = a.followTarget;
  if (!L || !L.alive) { a.state = 'idle'; a.followTarget = null; a.stT = 2; return; }
  if (a.cub && a.cubHunger > 35 && a.think <= 0) {
    a.think = 1;
    if (P.isPred) { const c = findCarcass(a, 30); if (c) { a.state = 'eat'; a.target = c; a.stT = 30; return; } }
    else if (L.pose === 'eat' || rng() < 0.3) { a.state = 'graze'; a.stT = rr(4, 8); return; }
  }
  a.think -= dt;
  const dx = L.pos.x - a.pos.x, dz = L.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > 110 && a.dCam > 40) { const ang = rng() * TAU; a.pos.set(L.pos.x + Math.cos(ang) * 6, 0, L.pos.z + Math.sin(ang) * 6); a.ground(dt, true); return; }
  const want = a.cub ? 2.2 + (a.id % 3) * 0.8 : 4.5;
  if (d > want + 1.5) {
    const spd = d > 25 ? (a.sp.run || 4) : d > 9 ? (a.sp.walk || 1.6) * 2.2 : (a.sp.walk || 1.6) * 1.3;
    a.move(dx / d, dz / d, a.swimming ? (a.sp.swim || 1) : spd, dt); a.pose = a.swimming ? 'swim' : 'move';
  } else {
    a.move(dx / d, dz / d, 0, dt);
    a.pose = a.swimming ? 'swim' : (L.pose === 'lie' || L.pose === 'sleep') ? 'lie' : (L.pose === 'eat' && !a.cub) ? 'eat' : 'idle';
    a.look = clamp(angDiff(a.yaw, Math.atan2(dx, dz)), -1, 1);
  }
}
function findCarcass(a, r) {
  let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, r, (b, d) => { if (b.dead && b.food > 1 && (b.tpl.kind === 'quad' || b.tpl.kind === 'snake') && (!b.swimming || a.canSwim()) && d < bd) { bd = d; best = b; } });
  return best;
}
function findPrey(a, r) {
  let best = null, bs = -1e9;
  shQuery(a.pos.x, a.pos.z, r, (b, d) => {
    if (!b.alive || b === a || !preys(a, b)) return;
    if (b.swimming && !a.sp.swimmer) return;
    if (b.isPlayer && (d > 38 || P.sleepSafe)) return;
    if (b.tpl.kind !== 'quad') return;
    const s = -d + (b.young ? 15 : 0) + (b.isPlayer ? 6 : 0);
    if (s > bs) { bs = s; best = b; }
  });
  return best;
}
function doHunt(a, dt) {
  const t = a.target;
  if (!t || !t.alive) { if (t && t.dead && !t.gone) { a.state = 'eat'; a.stT = 30; return; } a.state = 'idle'; a.target = null; a.stT = 3; a.crouch = false; return; }
  const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (a.stT <= 0 || d > 70 || (t.swimming && !a.sp.swimmer)) { a.state = 'idle'; a.target = null; a.stT = rr(6, 14); a.crouch = false; return; }
  if (t.isPlayer && d < 7) { a.state = 'fight'; a.foe = t; a.crouch = false; return; }
  a.look = clamp(angDiff(a.yaw, Math.atan2(dx, dz)), -1, 1);
  const reach = a.sp.reach * a.scale + t.rad;
  if (d < reach) {
    a.move(dx / d, dz / d, Math.min(a.sp.run, t.speed + 1), dt); a.pose = 'move'; a.crouch = false;
    if (a.atkCD <= 0) { a.anim.atk = 0.45; a.atkCD = a.sp.atkCD; hurt(t, a.sp.dmg * a.scale * rr(0.85, 1.2), a); if (a.dCam < 60) AUD.at('bite', a.pos, 0.8); }
    return;
  }
  const aware = t.state === 'flee' || t.state === 'fight' || t.isPlayer;
  if (!aware && d > 13) { a.crouch = true; a.move(dx / d, dz / d, a.sp.walk * 0.8, dt); a.pose = 'crouch'; return; }
  a.crouch = false; a.stam -= dt * 9;
  a.move(dx / d, dz / d, (a.swimming ? a.sp.swim : a.sp.run) * (a.stam > 0 ? 1 : 0.6), dt);
  a.pose = a.swimming ? 'swim' : 'move';
}
function doEat(a, dt) {
  const c = a.target;
  if (!c || c.gone || c.food <= 0.5) { a.target = null; if (a.cub) a.state = 'follow'; else { a.state = 'rest'; a.stT = rr(15, 40); } return; }
  const dx = c.pos.x - a.pos.x, dz = c.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  if (d > a.rad + c.rad + 0.5) { a.move(dx / d, dz / d, (a.sp.walk || 1.5) * 1.7, dt); a.pose = a.swimming ? 'swim' : 'move'; if (a.stT <= 0) { a.state = 'idle'; a.target = null; } return; }
  a.move(dx / d, dz / d, 0.01, dt); a.pose = 'eat';
  const bite = dt * (a.young ? 1.2 : 3.5);
  c.food -= bite; a.hunger = Math.max(0, a.hunger - bite * 3);
  if (a.cub) { a.cubHunger = Math.max(0, a.cubHunger - bite * 9); if (a.cubHunger < 3) { a.state = 'follow'; a.target = null; } }
  else if (a.hunger < 3) { a.state = 'rest'; a.stT = rr(20, 50); a.target = null; }
}
function setGoal(a, x, z, spd, then, water) { a.state = 'goto'; a.goal = { x, z }; a.goalSpd = spd; a.goalThen = then || null; a.goalWater = !!water; a.stT = 25; a.blocked = 0; }
function wanderGoal(a, r) {
  if (a.leash) r = Math.min(r, a.leash);
  for (let i = 0; i < 10; i++) {
    const ang = rng() * TAU, d = rr(r * 0.3, r), x = a.home.x + Math.cos(ang) * d, z = a.home.z + Math.sin(ang) * d;
    if (!inBounds(x, z) || getNY(x, z) < 0.72) continue;
    if (waterDepth(x, z) > (a.canSwim() ? 99 : 0)) continue;
    return { x, z };
  }
  return null;
}
function waterGoal(a, r, min = 1.0) {
  for (let i = 0; i < 14; i++) {
    const ang = rng() * TAU, d = rr(3, r), x = a.home.x + Math.cos(ang) * d, z = a.home.z + Math.sin(ang) * d;
    if (inBounds(x, z) && getH(x, z) < -min && waterDepth(x, z) > min) return { x, z };
  }
  return null;
}
function goDrink(a) { const w = nearestWater(a.pos.x, a.pos.z); if (!w || Math.hypot(w.x - a.pos.x, w.z - a.pos.z) > 160) return false; setGoal(a, w.x, w.z, (a.sp.walk || 1.5) * 1.2, 'drink', true); return true; }
function doGoto(a, dt) {
  const g = a.goal; if (!g) { pickNext(a); return; }
  const d = a.steerTo(g.x, g.z, a.swimming ? Math.min(a.goalSpd, a.sp.swim || 1) : a.goalSpd, dt);
  a.pose = a.swimming ? 'swim' : 'move';
  if (a.goalWater && !a.swimming) { const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), r = a.rad + 0.3; if (waterDepth(a.pos.x + fx * r, a.pos.z + fz * r) > 0.04) { a.state = 'drink'; a.stT = rr(5, 9); return; } }
  if (d < 1.5 || a.blocked > 0.8 || a.stT <= 0) { if (a.goalThen && d < 3) { a.state = a.goalThen; a.stT = rr(5, 9); } else pickNext(a); }
}
function pickNext(a) {
  const sp = a.sp, r = rng(); a.look = 0; a.dive = false;
  if (a.isPartner || a.cub || a.pet || a.stolenBy) { a.state = 'follow'; return; }
  const noct = (sp.night || 0) > 0.5;
  if (!noct && isNight() && r < 0.7) { a.state = 'sleep'; a.stT = rr(30, 90); return; }
  if (noct && G.time > 10 && G.time < 16 && r < 0.45) { a.state = 'rest'; a.stT = rr(20, 60); return; }
  if (a.thirst > 55 && goDrink(a)) return;
  const L = a.group && a.group.leader;
  if (L && L !== a && L.alive) { const d = dist2(L.pos, a.pos); if (d > 10 || r < 0.4) { setGoal(a, L.pos.x + rr(-7, 7), L.pos.z + rr(-7, 7), (sp.walk || 1.5) * (d > 20 ? 1.8 : 1)); return; } }
  if (sp.ai === 'herb' && r < 0.45) { a.state = 'graze'; a.stT = rr(4, 11); return; }
  if (r < 0.55) { a.state = 'idle'; a.stT = rr(2, 6); return; }
  if (r < 0.63) { a.state = 'rest'; a.stT = rr(8, 22); return; }
  const g = sp.waterLover && rng() < 0.6 ? waterGoal(a, 40) : wanderGoal(a, a.group ? 40 : 60);
  if (g) setGoal(a, g.x, g.z, sp.walk || 1.5); else { a.state = 'idle'; a.stT = 3; }
}
function idleStates(a, dt) {
  switch (a.state) {
    case 'goto': return doGoto(a, dt);
    case 'graze': a.move(0, 0, 0, dt); a.pose = a.swimming ? 'swim' : 'eat'; a.hunger = Math.max(0, a.hunger - dt * 3); if (a.cub) a.cubHunger = Math.max(0, a.cubHunger - dt * 6); if (a.stT <= 0) pickNext(a); return;
    case 'drink': a.move(0, 0, 0, dt); a.pose = a.swimming ? 'swim' : 'drink'; a.thirst = Math.max(0, a.thirst - dt * 15); if (a.stT <= 0) pickNext(a); return;
    case 'rest': case 'sleep': a.move(0, 0, 0, dt); a.pose = a.swimming ? 'swim' : a.state === 'sleep' ? 'sleep' : 'lie'; if (a.stT <= 0 || (a.state === 'sleep' && !isNight() && !(a.sp.night > 0.5))) pickNext(a); return;
    case 'held': a.move(0, 0, 0, dt); a.pose = 'fight'; return;
    default: a.move(0, 0, 0, dt); a.pose = a.swimming ? 'swim' : 'idle'; a.look = Math.sin(a.anim.t * 0.5 + a.id) * 0.6; if (a.stT <= 0) pickNext(a);
  }
}
function socialNPC(a, dt) {
  const p = P.a;
  if (!p || !p.alive || G.mode !== 'play' || a.young || a.isPartner || a.cub || a.stolenBy || a.spId !== P.spId) return false;
  if (a.state === 'fight' || a.state === 'flee' || a.state === 'held' || a.state === 'eat') return false;
  const dx = p.pos.x - a.pos.x, dz = p.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
  a.look = clamp(angDiff(a.yaw, Math.atan2(dx, dz)), -1, 1);
  if (a.sex === p.sex) {
    if (a.defeated) return false;
    const inTerr = Math.hypot(p.pos.x - a.home.x, p.pos.z - a.home.z) < 40;
    if (a.state === 'warn') {
      a.warnT += dt;
      if (d > 10) { a.move(dx / d, dz / d, a.sp.walk || 1.5, dt); a.pose = a.swimming ? 'swim' : 'move'; } else { a.move(dx / d, dz / d, 0.01, dt); a.pose = 'warn'; }
      a.growlT -= dt; if (a.growlT <= 0) { a.growlT = 2.6; if (d < 60) AUD.at('growl', a.pos, 0.8); }
      if (d > 55 || (!inTerr && d > 30)) { a.state = 'idle'; a.stT = 3; return true; }
      if ((a.warnT > 9 && d < 22) || d < 5.5) { a.state = 'fight'; a.foe = p; a.isRival = true; UI.notify(heb(a, `${a.name} תוקף! זה קרב על השטח`, `${a.name} תוקפת! זה קרב על השטח`), 'bad'); }
      return true;
    }
    if (inTerr && d < 32 && P.renown < 4 && a.state !== 'goto') {
      a.state = 'warn'; a.warnT = 0; a.growlT = 0;
      UI.notify(heb(a, `${a.name} נוהם עליך. אתה בשטח שלו`, `${a.name} נוהמת עלייך. את בשטח שלה`), 'bad');
      return true;
    }
    return false;
  }
  if (a.state === 'court') { a.move(dx / d, dz / d, 0.01, dt); a.pose = 'court'; a.stT -= dt; if (a.stT <= 0) { a.state = 'curious'; a.stT = 20; } return true; }
  if (a.state === 'curious') {
    a.stT -= dt;
    if (d > 8) { a.move(dx / d, dz / d, (a.sp.walk || 1.5) * 1.4, dt); a.pose = a.swimming ? 'swim' : 'move'; }
    else { a.move(dx / d, dz / d, 0.01, dt); a.pose = a.swimming ? 'swim' : 'sit'; }
    if (a.stT <= 0 || d > 140) { a.state = 'idle'; a.stT = 3; }
    return true;
  }
  if (d < 22 && a.affinity > 5 && a.state !== 'goto' && rng() < dt * 0.15) { a.state = 'curious'; a.stT = 18; return true; }
  return false;
}

const BRAIN = {
  herb(a, dt) {
    a.hunger += dt * 0.04; a.thirst += dt * 0.05; a.stam = Math.min(100, a.stam + dt * 6); a.stT -= dt; a.think -= dt;
    if (a.social && socialNPC(a, dt)) return;
    if (a.think <= 0) {
      a.think = 0.25 + rng() * 0.25;
      if (a.state !== 'flee' && a.state !== 'fight' && a.state !== 'held' && !(a.state === 'follow' && !a.cub)) { const th = findThreat(a); if (th && !(a.cub && dist2(th.pos, a.pos) > 12)) threatReact(a, th); }
    }
    switch (a.state) {
      case 'flee': return doFlee(a, dt);
      case 'fight': return doFight(a, dt);
      case 'follow': return doFollow(a, dt);
      case 'eat': return doEat(a, dt);
    }
    idleStates(a, dt);
  },
  pred(a, dt) {
    a.hunger += dt * 0.09; a.thirst += dt * 0.06; a.stam = Math.min(100, a.stam + dt * 7); a.stT -= dt; a.think -= dt;
    if (a.social && socialNPC(a, dt)) return;
    switch (a.state) {
      case 'flee': return doFlee(a, dt);
      case 'fight': return doFight(a, dt);
      case 'hunt': return doHunt(a, dt);
      case 'eat': return doEat(a, dt);
      case 'follow': return doFollow(a, dt);
    }
    if (a.think <= 0) {
      a.think = 0.6 + rng() * 0.4;
      if (a.young && a.state !== 'follow') { const th = findThreat(a); if (th) { threatReact(a, th); return; } }
      if (a.hunger > 50 && !a.young && (a.state === 'idle' || a.state === 'goto' || a.state === 'rest')) {
        const c = findCarcass(a, 35); if (c) { a.state = 'eat'; a.target = c; a.stT = 30; return; }
        const prey = findPrey(a, (a.sp.sense || 30) * 1.6); if (prey) { a.state = 'hunt'; a.target = prey; a.stT = 16; return; }
      }
    }
    idleStates(a, dt);
  },
  croc(a, dt) {
    a.hunger += dt * 0.05; a.stT -= dt; a.think -= dt; a.waterOnly = true; a.lunging = false;
    switch (a.state) {
      case 'fight': a.waterOnly = false; a.lunging = true; if (a.foe && Math.hypot(a.foe.pos.x - a.pos.x, a.foe.pos.z - a.pos.z) > 10 && !a.swimming) { a.state = 'float'; a.foe = null; return; } return doFight(a, dt);
      case 'eat': a.waterOnly = false; a.lunging = true; return doEat(a, dt);
      case 'flee': return doFlee(a, dt);
      case 'lunge': {
        a.waterOnly = false; a.lunging = true; const t = a.target;
        if (!t || !t.alive || a.stT <= 0) { a.state = 'float'; a.stT = 5; return; }
        const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
        a.move(dx / d, dz / d, 8.5, dt); a.pose = a.swimming ? 'swim' : 'move';
        if (d < a.sp.reach * a.scale + t.rad) {
          a.anim.atk = 0.45; hurt(t, a.sp.dmg * a.scale * rr(1, 1.25) * (t.isPlayer ? 0.8 : 1), a); AUD.at('bite', a.pos, 1);
          if (t.isPlayer && t.alive && rng() < (P.spId === 'jaguar' ? 0.3 : 0.5)) startRoll(a);
          if (t.alive) { a.state = 'fight'; a.foe = t; a.atkCD = 1.2; } a.target = t;
        }
        return;
      }
      case 'bask': {
        a.waterOnly = false; a.lunging = true;
        if (a.goal && dist2(a.goal, a.pos) > 1.2 && a.stT > 40) { a.steerTo(a.goal.x, a.goal.z, a.sp.walk, dt); a.pose = a.swimming ? 'swim' : 'move'; }
        else { a.move(0, 0, 0, dt); a.pose = 'lie'; }
        if (a.stT <= 0 || (a.think <= 0 && findThreat(a))) { a.state = 'float'; a.goal = null; a.stT = 3; }
        if (a.think <= 0) a.think = 1;
        return;
      }
    }
    if (!a.swimming) { a.waterOnly = false; a.lunging = true; const w = nearestWater(a.pos.x, a.pos.z); if (w) a.steerTo(w.x, w.z, a.sp.walk * 1.4, dt); a.pose = 'move'; return; }
    a.pose = 'swim';
    if (a.think <= 0) {
      a.think = 0.4;
      if (a.hunger > 25) {
        let best = null, bd = 1e9;
        shQuery(a.pos.x, a.pos.z, 20, (b, d) => {
          if (!b.alive || !preys(a, b) || b.tpl.kind !== 'quad') return;
          const nearW = b.swimming || b.state === 'drink' || b.pose === 'drink' || waterDepth(b.pos.x + Math.sin(b.yaw) * 1.6, b.pos.z + Math.cos(b.yaw) * 1.6) > 0.1;
          if (nearW && d < bd) { bd = d; best = b; }
        });
        if (best) {
          a.target = best;
          if (bd < 8) { a.state = 'lunge'; a.stT = 1.6; if (best.isPlayer) { UI.notify('קיימן מזנק מהמים!', 'bad'); AUD.at('hiss', a.pos, 1); } return; }
          a.goal = { x: best.pos.x, z: best.pos.z }; a.stalk = true; a.stT = 10;
        }
      }
      if (G.time > 10 && G.time < 15 && rng() < 0.012 && !a.stalk) {
        for (let i = 0; i < 10; i++) { const ang = rng() * TAU, x = a.pos.x + Math.cos(ang) * 7, z = a.pos.z + Math.sin(ang) * 7; if (waterDepth(x, z) === 0 && getH(x, z) < 1.6 && getNY(x, z) > 0.8) { a.state = 'bask'; a.goal = { x, z }; a.stT = rr(50, 110); return; } }
      }
    }
    if (!a.goal || a.stT <= 0) { a.goal = waterGoal(a, 55) || { x: a.home.x, z: a.home.z }; a.stT = rr(8, 20); a.stalk = false; }
    const d = a.steerTo(a.goal.x, a.goal.z, a.stalk ? 2.6 : 1.1, dt);
    if (d < 2 && !a.stalk) a.move(0, 0, 0, dt);
    if (a.blocked > 0.6) { a.goal = null; a.blocked = 0; }
  },
  snake(a, dt) {
    a.hunger += dt * 0.03; a.stT -= dt; a.think -= dt;
    switch (a.state) {
      case 'coil': {
        const t = a.target;
        if (!t || t.gone || !t.alive) { if (t && t.dead && !t.gone) { a.state = 'eat'; a.target = t; a.stT = 40; } else { a.state = 'rest'; a.stT = 40; a.target = null; } if (P.coil === a) endCoil(false); return; }
        a.pos.x += (t.pos.x - a.pos.x) * Math.min(1, dt * 5); a.pos.z += (t.pos.z - a.pos.z) * Math.min(1, dt * 5); a.pose = 'coil'; a.speed = 0;
        if (!t.isPlayer) { t.state = 'held'; t.speed = 0; hurt(t, a.sp.dmg * dt * 1.4, a); }
        else hurt(t, a.sp.dmg * dt * 0.9, a);
        if (a.hp < a.maxHp * 0.4) { if (!t.isPlayer && t.alive) { t.state = 'flee'; t.threat = a; } if (P.coil === a) endCoil(true); a.state = 'flee'; a.threat = t; }
        return;
      }
      case 'strike': {
        const t = a.target; if (!t || !t.alive || a.stT <= 0) { a.state = 'rest'; a.stT = 10; return; }
        const dx = t.pos.x - a.pos.x, dz = t.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 0.01;
        a.move(dx / d, dz / d, 6, dt); a.pose = 'strike';
        if (d < a.rad + t.rad + 0.5) { a.state = 'coil'; a.target = t; if (t.isPlayer) startCoil(a); else t.state = 'held'; AUD.at('hiss', a.pos, 1); }
        return;
      }
      case 'eat': { const c = a.target; a.move(0, 0, 0, dt); a.pose = 'rest'; if (c && !c.gone) { c.food -= dt * 0.8; a.hunger = Math.max(0, a.hunger - dt * 2); } if (!c || c.gone || c.food <= 0.5 || a.stT <= 0) { a.state = 'rest'; a.stT = 60; a.target = null; } return; }
      case 'fight': return doFight(a, dt);
      case 'flee': return doFlee(a, dt);
      case 'move': { const d = a.steerTo(a.goal.x, a.goal.z, a.swimming ? 1.6 : 0.9, dt); a.pose = 'move'; if (d < 1 || a.blocked > 1 || a.stT <= 0) { a.state = 'rest'; a.stT = rr(20, 60); } break; }
      default: a.move(0, 0, 0, dt); a.pose = 'rest'; if (a.stT <= 0) { const g = wanderGoal(a, 30); if (g) { a.goal = g; a.state = 'move'; a.stT = 30; } else a.stT = 10; }
    }
    if (a.think <= 0 && a.state !== 'move' || a.think <= 0 && a.hunger > 40) {
      a.think = 0.5;
      if (a.hunger > 25) shQuery(a.pos.x, a.pos.z, 6.5, (b, d) => { if (b.alive && b.tpl.kind === 'quad' && preys(a, b) && !(b.isPlayer && P.coilCD > 0)) { a.state = 'strike'; a.target = b; a.stT = 1.6; return false; } });
    }
  },
  viper(a, dt) {
    a.stT -= dt; a.alert = (a.alert || 0) - dt;
    if (a.state === 'flee') return doFlee(a, dt);
    if (a.state === 'retreat') { const t = a.threat; if (t) { const dx = a.pos.x - t.pos.x, dz = a.pos.z - t.pos.z, d = Math.hypot(dx, dz) || 1; a.move(dx / d, dz / d, 1.0, dt); } a.pose = 'move'; if (a.stT <= 0) { a.state = 'rest'; a.stT = 30; } return; }
    a.move(0, 0, 0, dt); a.pose = a.alert > 0 ? 'alert' : 'rest';
    if (a.atkCD > 0) return;
    shQuery(a.pos.x, a.pos.z, 3.4, (b, d) => {
      if (b === a || !b.alive || b.tpl.kind !== 'quad' || b.perched) return;
      if (d < 1.0 + b.rad - (b.isPlayer && P.crouch ? 0.5 : 0)) {
        a.yaw = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z); a.pose = 'strike'; a.anim.atk = 0.4;
        hurt(b, a.sp.dmg, a); AUD.at('hiss', a.pos, 1);
        if (b.isPlayer) { P.poison = Math.max(P.poison, 30); UI.notify('צפע ראש־חנית הכיש אותך! הארס מתפשט', 'bad'); }
        else if (b.alive && b.maxHp < 60) hurt(b, 30, a);
        a.atkCD = 3; a.state = 'retreat'; a.stT = 4; a.threat = b; return false;
      }
      if (d < 3.4) a.alert = 1.5;
    });
  },
  flock(a, dt) {
    if (a.social || a.isPartner || a.cub) { birdSocial(a, dt); return; }
    const f = a.group; if (!f) { a.state = 'dead'; return; }
    const o = f.offs[a.slot % f.offs.length];
    if (f.state === 'fly') {
      _tmp.set(f.pos.x + o.x + Math.sin(G.t * 0.8 + a.slot) * 1.6, f.pos.y + o.y + Math.sin(G.t * 1.3 + a.slot) * 0.6, f.pos.z + o.z + Math.cos(G.t * 0.7 + a.slot) * 1.6);
      flyToward(a, _tmp, 17, dt, 3); a.pose = 'fly';
    } else {
      const c = f.state === 'clay' ? { x: CLAY.x + o.x * 1.6, y: getH(CLAY.x + o.x * 1.6, CLAY.z + o.z * 1.6), z: CLAY.z + o.z * 1.6 } : { x: f.crown.x + o.x * 0.7, y: f.crown.top - 0.4 + o.y * 0.08, z: f.crown.z + o.z * 0.7 };
      _tmp.set(c.x, c.y, c.z);
      if (a.pos.distanceTo(_tmp) > 0.4) { flyToward(a, _tmp, 7, dt, 4); a.pose = 'fly'; }
      else { a.pos.lerp(_tmp, Math.min(1, dt * 5)); a.vel.set(0, 0, 0); a.vy = 0; a.bank = 0; a.pose = f.state === 'clay' ? 'ground' : 'perch'; a.speed = 0; }
    }
    if (a.scared > 0) { a.scared -= dt; if (f.state !== 'fly') flockFlush(f); }
  },
  perch(a, dt) {
    if (a.social || a.isPartner || a.cub) { birdSocial(a, dt); return; }
    a.stT -= dt;
    if (a.state === 'fly') { const d = flyToward(a, a.goal3, 9, dt, 2.5); a.pose = 'fly'; if (d < 0.4) { a.state = 'perch'; a.stT = rr(10, 40); } return; }
    if (!a.crown) a.crown = pickCrownNear(a.pos.x, a.pos.z, 60, false) || CROWNS[0];
    _tmp.set(a.crown.x + a.offX, a.crown.top - 0.3, a.crown.z + a.offZ);
    a.pos.lerp(_tmp, Math.min(1, dt * 4)); a.pose = 'perch'; a.speed = 0; a.vel.set(0, 0, 0); a.bank = 0;
    const scared = a.scared > 0 || (P.a && P.a.alive && a.pos.distanceTo(P.a.pos) < 6);
    a.scared = (a.scared || 0) - dt;
    if (a.stT <= 0 || scared) {
      const c = pickCrownNear(a.pos.x, a.pos.z, 70, false);
      if (c && c !== a.crown) { a.crown = c; a.offX = rr(-2, 2); a.offZ = rr(-2, 2); a.goal3 = new V3(c.x + a.offX, c.top - 0.3, c.z + a.offZ); a.state = 'fly'; if (a.dCam < 60) AUD.at('toucan', a.pos, 0.5); }
      else a.stT = rr(5, 15);
    }
  },
  raptor(a, dt) {
    if (a.social || a.isPartner || a.cub) { birdSocial(a, dt); return; }
    a.hunger += dt * 0.07; a.stT -= dt; a.think -= dt;
    if (a.state === 'dive') {
      const t = a.target;
      if (!t || !t.alive || a.stT <= 0) { raptorSoar(a); return; }
      _tmp.copy(t.pos); _tmp.y += t.height * 0.6;
      const d = flyToward(a, _tmp, 19, dt, 6); a.pose = 'fly';
      if (d < 1.4 + t.rad) {
        a.anim.atk = 0.4;
        if (t.isPlayer) { hurt(t, a.sp.dmg * (P.bird ? 0.6 : 1), a); UI.notify('עיט הארפיה תקף מהשמיים!', 'bad'); AUD.at('screech', a.pos, 1); raptorSoar(a); a.hunger = 30; return; }
        kill(t, a); t.carriedBy = a; a.carry = t; a.state = 'carry';
        const c = pickCrownNear(a.pos.x, a.pos.z, 200, true) || CROWNS[0]; a.goal3 = new V3(c.x, c.top + 0.5, c.z); a.crown = c; AUD.at('screech', a.pos, 0.8);
      }
      return;
    }
    if (a.state === 'carry') {
      const d = flyToward(a, a.goal3, 12, dt, 3); a.pose = 'fly';
      if (d < 0.8) { if (a.carry) { a.carry.remove(); a.carry = null; } a.state = 'perch'; a.stT = rr(40, 90); a.hunger = 0; }
      return;
    }
    if (a.state === 'perch') {
      if (!a.crown) a.crown = pickCrownNear(a.pos.x, a.pos.z, 200, true) || CROWNS[0];
      _tmp.set(a.crown.x, a.crown.top + 0.2, a.crown.z); a.pos.lerp(_tmp, Math.min(1, dt * 3)); a.pose = 'perch'; a.vel.set(0, 0, 0); a.bank = 0;
      if (a.stT <= 0 || (a.hunger > 60 && a.think <= 0)) { a.think = 2; if (!raptorHunt(a)) raptorSoar(a); }
      return;
    }
    a.circA = (a.circA || 0) + dt * 0.22;
    _tmp.set(a.circC.x + Math.cos(a.circA) * 55, a.circY, a.circC.z + Math.sin(a.circA) * 55);
    flyToward(a, _tmp, 13, dt, 1.5); a.pose = 'fly';
    if (a.think <= 0) { a.think = 3; if (a.hunger > 45 && raptorHunt(a)) return; }
    if (a.stT <= 0) { a.state = 'perch'; a.crown = pickCrownNear(a.pos.x, a.pos.z, 200, true); a.stT = rr(30, 80); }
  },
  hummer(a, dt) {
    a.stT -= dt;
    const p = P.a && P.a.alive ? P.a.pos : camera.position;
    if (!a.flower || Math.hypot(a.flower.x - p.x, a.flower.z - p.z) > 40 || a.stT <= 0) {
      a.stT = rr(2, 5); let best = null;
      for (let i = 0; i < 25; i++) { const f = FLOWERS[Math.floor(rng() * FLOWERS.length)]; if (f && Math.hypot(f.x - p.x, f.z - p.z) < 28) { best = f; break; } }
      if (best) a.flower = best; else { a.hidden = true; return; }
    }
    a.hidden = false;
    _tmp.set(a.flower.x + Math.sin(G.t * 1.7 + a.id) * 0.35, a.flower.y + 0.35 + Math.sin(G.t * 2.3 + a.id) * 0.1, a.flower.z + Math.cos(G.t * 1.3 + a.id) * 0.35);
    if (P.a && P.a.alive && a.pos.distanceTo(P.a.pos) < 1.8) a.stT = 0;
    const d = flyToward(a, _tmp, 7, dt, 8); a.pose = 'hover';
    if (d < 0.4) a.yaw += angDiff(a.yaw, Math.atan2(a.flower.x - a.pos.x, a.flower.z - a.pos.z)) * Math.min(1, dt * 4);
  },
  school(a, dt) {
    if (a.social || a.isPartner || a.cub) { fishSocial(a, dt); return; }
    const s = a.group; if (!s) { fishWander(a, dt); return; }
    if (s.playerLed) { escortSwim(a, s, dt); return; }
    const i = a.slot, ang = G.t * (0.6 + (i % 5) * 0.06) + i * 1.7;
    if (s.attack && P.a && P.a.alive) {
      _tmp.set(P.a.pos.x + Math.cos(ang * 2) * 0.6, P.a.pos.y - 0.25, P.a.pos.z + Math.sin(ang * 2) * 0.6);
      if (a.pos.distanceTo(P.a.pos) < 1.1 && a.atkCD <= 0) { a.atkCD = 0.8 + rng() * 0.6; hurt(P.a, 1.6, a); if (rng() < 0.5) FX.spawn('blood', a.pos.x, -0.1, a.pos.z, 3); }
    } else _tmp.set(s.c.x + Math.cos(ang) * 1.7, s.c.y + Math.sin(G.t * 1.1 + i) * 0.35, s.c.z + Math.sin(ang) * 1.7);
    swimToward(a, _tmp, s.attack ? 5 : 2.4, dt);
  },
  bigfish(a, dt) {
    if (a.social || a.isPartner || a.cub) { fishSocial(a, dt); return; }
    if (fishPredStep(a, dt)) return;
    a.stT -= dt; a.breath = (a.breath ?? rr(10, 60)) - dt;
    if (!a.goal || a.stT <= 0 || dist2(a.goal, a.pos) < 2) { const g = waterGoal(a, 45, 2.2); a.goal = g ? { x: g.x, z: g.z, y: -rr(0.8, Math.min(2.4, waterDepth(g.x, g.z) - 0.5)) } : { x: a.home.x, z: a.home.z, y: -1 }; a.stT = rr(10, 25); }
    let ty = a.goal.y;
    if (a.breath < 0) { ty = -0.12; if (a.pos.y > -0.4 && !a.gulped) { a.gulped = true; if (a.dCam < 60) { FX.spawn('splash', a.pos.x, 0, a.pos.z, 12); AUD.at('gulp', a.pos, 0.9); } } if (a.breath < -3) { a.breath = rr(40, 80); a.gulped = false; } }
    _tmp.set(a.goal.x, ty, a.goal.z); swimToward(a, _tmp, a.spId === 'dolphin' ? 3.6 : 1.5, dt);
  },
  dolphin(a, dt) {
    if (fishPredStep(a, dt)) return;
    a.stT -= dt;
    if (!a.goal || a.stT <= 0 || dist2(a.goal, a.pos) < 3) { const g = waterGoal(a, 90, 2.3); a.goal = g || { x: a.home.x, z: a.home.z }; a.stT = rr(12, 30); }
    const y = Math.min(-0.05, -1.2 + Math.sin(a.anim.t * 0.7 + a.id) * 1.3);
    _tmp.set(a.goal.x, y, a.goal.z); swimToward(a, _tmp, 3.6, dt);
    if (y > -0.1 && !a.puffed && a.dCam < 60) { a.puffed = true; FX.spawn('splash', a.pos.x, 0, a.pos.z, 6); AUD.at('gulp', a.pos, 0.5); }
    if (y < -0.6) a.puffed = false;
  },
  eel(a, dt) {
    if (a.social || a.isPartner || a.cub) { fishSocial(a, dt); return; }
    a.stT -= dt;
    if (!a.goal || a.stT <= 0 || dist2(a.goal, a.pos) < 1.5) { const g = waterGoal(a, 25, 1.3); a.goal = g ? { x: g.x, z: g.z } : { x: a.home.x, z: a.home.z }; a.stT = rr(8, 20); }
    const ty = Math.max(getH(a.pos.x, a.pos.z) + 0.35, -1.6);
    _tmp.set(a.goal.x, ty, a.goal.z); swimToward(a, _tmp, 0.9, dt); a.pose = 'move';
    const p = P.a;
    if (p && p.alive && p.swimming && P.spId !== 'eel' && a.atkCD <= 0 && a.pos.distanceTo(p.pos) < 3.6) {
      a.atkCD = 8; hurt(p, a.sp.dmg, a); P.stun = 1.3; FX.spawn('spark', p.pos.x, p.pos.y + 0.3, p.pos.z, 14); AUD.play('shock');
      UI.notify('צלופח חשמלי! הזרם שיתק אותך לרגע', 'bad');
    }
  },
  troop(a, dt) {
    const tr = a.group; if (!tr) { a.perched = false; a.state = 'idle'; return; }
    const spot = troopSpot(tr, a.slot);
    a.howl = (a.howl || 0) - dt;
    if (a.leapT !== undefined) {
      a.leapT += dt / a.leapDur; const t = clamp(a.leapT, 0, 1);
      a.pos.lerpVectors(a.leapFrom, spot, t); a.pos.y += Math.sin(Math.PI * t) * a.leapH;
      a.yaw += angDiff(a.yaw, Math.atan2(spot.x - a.leapFrom.x, spot.z - a.leapFrom.z)) * Math.min(1, dt * 8);
      a.pose = 'leap'; if (t >= 1) a.leapT = undefined; return;
    }
    if (a.leapDelay > 0) {
      a.leapDelay -= dt;
      if (a.leapDelay <= 0) { a.leapFrom = a.pos.clone(); const d = a.pos.distanceTo(spot); a.leapT = 0; a.leapDur = clamp(d / 8, 0.5, 1.5); a.leapH = 1.5 + d * 0.12; }
    } else a.pos.lerp(spot, Math.min(1, dt * 3));
    a.pose = 'perch'; a.speed = 0;
    a.look = Math.sin(a.anim.t * 0.4 + a.id) * 0.8;
  },
  sloth(a, dt) { a.pose = 'hang'; a.speed = 0; if (a.hang) a.pos.set(a.hang.x, a.hang.y, a.hang.z); },
  frog(a, dt) {
    a.stT -= dt;
    if (a.airborne) { a.move(Math.sin(a.yaw), Math.cos(a.yaw), 1.5, dt); return; }
    a.move(0, 0, 0, dt); a.pose = 'idle';
    const p = P.a, flee = p && p.alive && dist2(p.pos, a.pos) < 1.7;
    if (a.stT <= 0 || flee) {
      a.stT = rr(2, 7);
      a.yaw = flee ? Math.atan2(a.pos.x - p.pos.x, a.pos.z - p.pos.z) + rr(-0.5, 0.5) : a.yaw + rr(-1.5, 1.5);
      a.airborne = true; a.vy = 2.3;
    }
  }
};

function flyToward(a, tgt, spd, dt, agil) {
  const dx = tgt.x - a.pos.x, dy = tgt.y - a.pos.y, dz = tgt.z - a.pos.z, d = Math.hypot(dx, dy, dz) || 0.001;
  const s = Math.min(spd, d * 2.2 + 0.4);
  _t2.set(dx / d * s, dy / d * s, dz / d * s);
  const gh = getH(a.pos.x, a.pos.z), dh = Math.hypot(dx, dz);
  if (a.pos.y < gh + 1.2 && dh > 3) _t2.y = Math.max(_t2.y, 3);
  a.vel.lerp(_t2, Math.min(1, dt * agil));
  const oy = a.yaw;
  a.pos.addScaledVector(a.vel, dt);
  const hs = Math.hypot(a.vel.x, a.vel.z);
  if (hs > 0.3) a.yaw += angDiff(a.yaw, Math.atan2(a.vel.x, a.vel.z)) * Math.min(1, dt * 6);
  a.bank += (clamp(angDiff(oy, a.yaw) / Math.max(dt, 1e-3) * 0.25, -0.8, 0.8) - a.bank) * Math.min(1, dt * 4);
  a.vy = a.vel.y; a.speed = a.vel.length();
  return d;
}
function swimToward(a, tgt, spd, dt) {
  const floor = getH(a.pos.x, a.pos.z) + 0.2;
  tgt.y = clamp(tgt.y, floor, -0.1);
  const dx = tgt.x - a.pos.x, dy = tgt.y - a.pos.y, dz = tgt.z - a.pos.z, d = Math.hypot(dx, dy, dz) || 0.001;
  const s = Math.min(spd, d * 2 + 0.3);
  _t2.set(dx / d * s, dy / d * s, dz / d * s); a.vel.lerp(_t2, Math.min(1, dt * 2.5));
  const nx = a.pos.x + a.vel.x * dt, nz = a.pos.z + a.vel.z * dt;
  if (waterDepth(nx, nz) > 0.45 && getH(nx, nz) < -0.3) { a.pos.x = nx; a.pos.z = nz; } else { a.vel.x *= -0.5; a.vel.z *= -0.5; a.goal = null; }
  a.pos.y = clamp(a.pos.y + a.vel.y * dt, getH(a.pos.x, a.pos.z) + 0.15, -0.08);
  const hs = Math.hypot(a.vel.x, a.vel.z);
  if (hs > 0.05) { const oy = a.yaw; a.yaw += angDiff(a.yaw, Math.atan2(a.vel.x, a.vel.z)) * Math.min(1, dt * 5); a.bank = clamp(angDiff(oy, a.yaw) / Math.max(dt, 1e-3) * 0.3, -0.6, 0.6); }
  a.vy = a.vel.y; a.speed = a.vel.length(); a.pose = 'swim';
  if (a.scared > 0) a.scared -= dt;
}
function pickCrownNear(x, z, r, giant) {
  const list = crownsNear(x, z, r).filter(c => !giant || c.giant);
  if (list.length) return pick(list);
  const all = giant ? CROWNS.filter(c => c.giant) : CROWNS;
  return all.length ? pick(all) : null;
}
function troopSpot(tr, i) {
  const c = tr.crown, ang = i * 2.39 + (tr.spin || 0), rr2 = c.r * (0.25 + (i % 3) * 0.17);
  return _t2.set(c.x + Math.cos(ang) * rr2, c.top - 0.6 - (i % 3) * 0.5, c.z + Math.sin(ang) * rr2).clone();
}
function raptorSoar(a) { a.state = 'soar'; a.circC = a.circC || a.pos.clone(); a.circC.set(a.pos.x, 0, a.pos.z); a.circY = Math.max(getH(a.pos.x, a.pos.z), 10) + 60; a.stT = rr(40, 90); a.target = null; }
function raptorHunt(a) {
  let best = null, bd = 1e9;
  shQuery(a.pos.x, a.pos.z, 150, (b, d) => {
    if (!b.alive || b.carriedBy) return;
    const ok = (a.sp.prey.includes(b.spId) && !(b.isPlayer && P.bird && P.flying && P.flySpd > 7)) || (b.cub && b.baseScale * 0.45 < 0.6) || (b.isPlayer && (P.spId === 'ocelot' || P.spId === 'capybara') && gridAt(FOREST, b.pos.x, b.pos.z) < 0.35);
    if (ok && d < bd) { bd = d; best = b; }
  });
  if (!best) return false;
  a.state = 'dive'; a.target = best; a.stT = 14;
  if (best.isPlayer || best.cub) UI.notify('צל גדול חולף מעליך... עיט הארפיה צד!', 'bad');
  return true;
}
function flockFlush(f) {
  if (f.state === 'fly') return;
  const c = pickCrownNear(f.pos.x, f.pos.z, 200, true); if (!c) return;
  f.crown = c; f.state = 'fly'; f.dest = 'perch'; f.target.set(c.x, c.top, c.z);
  AUD.at('macaw', f.pos, 1);
}
function updateFlock(f, dt) {
  if (!f.members.length) return;
  f.t -= dt;
  if (f.state === 'fly') {
    const dx = f.target.x - f.pos.x, dz = f.target.z - f.pos.z, dh = Math.hypot(dx, dz) || 0.01;
    const cruise = dh > 30 ? Math.max(getH(f.pos.x, f.pos.z) + 34, f.target.y + 10) : f.target.y;
    _tmp.set(dx / dh * Math.min(13, dh * 1.5 + 1), clamp((cruise - f.pos.y) * 0.8, -6, 6), dz / dh * Math.min(13, dh * 1.5 + 1));
    f.vel.lerp(_tmp, Math.min(1, dt * 1.5)); f.pos.addScaledVector(f.vel, dt);
    if (!f.sea && rng() < dt * 0.4) AUD.at('macaw', f.pos, 0.7);
    if (dh < 2.5 && Math.abs(f.target.y - f.pos.y) < 3) { f.state = f.dest; f.t = f.dest === 'clay' ? rr(45, 90) : rr(25, 70); f.vel.set(0, 0, 0); }
    return;
  }
  const p = P.a;
  if (p && p.alive && f.state === 'clay') { const d = dist2(p.pos, f.pos); if (d < 15 && !(P.crouch && d > 8)) { flockFlush(f); return; } }
  if (f.state === 'clay' && (f.chk = (f.chk || 0) - dt) <= 0) { f.chk = 0.5; let pr = false; shQuery(f.pos.x, f.pos.z, 9, b => { if (!pr && b.alive && !b.isPlayer && (b.sp.ai === 'pred' || b.sp.ai === 'croc')) pr = true; }); if (pr) { flockFlush(f); return; } }
  if (f.t <= 0) {
    if (!f.sea && G.time > 6.5 && G.time < 10.5 && f.lastClay !== G.day && rng() < 0.7) { f.lastClay = G.day; f.state = 'fly'; f.dest = 'clay'; f.target.set(CLAY.x, getH(CLAY.x, CLAY.z) + 0.5, CLAY.z); }
    else { const c = pickCrownNear(f.pos.x, f.pos.z, 220, !f.sea); if (c) { f.crown = c; f.state = 'fly'; f.dest = 'perch'; f.target.set(c.x, c.top, c.z); } else f.t = 20; }
  }
}
function updateTroop(tr, dt) {
  if (!tr.members.length) return;
  tr.t -= dt;
  if (tr.sp === 'howler' && ((G.time > 5.5 && G.time < 6.6) || (G.time > 17.5 && G.time < 18.4)) && tr.lastHowl !== G.day + (G.time > 12 ? 0.5 : 0)) {
    tr.lastHowl = G.day + (G.time > 12 ? 0.5 : 0);
    for (const m of tr.members) m.howl = 7;
    AUD.at('howler', tr.members[0].pos, 1.4);
  }
  if (tr.t <= 0) {
    tr.t = tr.sp === 'squirrel' ? rr(5, 14) : rr(12, 30);
    const list = crownsNear(tr.crown.x, tr.crown.z, 24).filter(c => c !== tr.crown && Math.hypot(c.x - tr.crown.x, c.z - tr.crown.z) > 5);
    if (!list.length) return;
    tr.crown = pick(list); tr.spin = rng() * TAU;
    tr.members.forEach((m, i) => { m.leapDelay = 0.2 + i * 0.35 + rng() * 0.4; });
  }
}
function updateSchool(s, dt) {
  if (!s.members.length) return;
  if (s.playerLed) { if (P.a) s.c.copy(P.a.pos); return; }
  s.t -= dt;
  const p = P.a;
  s.attack = !s.calm && !!(p && p.alive && P.spId !== 'piranha' && p.swimming && Math.hypot(p.pos.x - s.c.x, p.pos.z - s.c.z) < 14 && (p.hp < p.maxHp * 0.75 || s.aggro));
  if (s.attack) { s.c.lerp(p.pos, Math.min(1, dt * 1.5)); return; }
  if (!s.goal || s.t <= 0 || Math.hypot(s.goal.x - s.c.x, s.goal.z - s.c.z) < 2) {
    for (let i = 0; i < 12; i++) { const ang = rng() * TAU, d = rr(5, 35), x = s.home.x + Math.cos(ang) * d, z = s.home.z + Math.sin(ang) * d; if (waterDepth(x, z) > 1.6 && getH(x, z) < -1.6) { s.goal = { x, z, y: -rr(0.6, Math.min(2, waterDepth(x, z) - 0.6)) }; break; } }
    s.t = rr(10, 25); s.aggro = rng() < 0.25;
  }
  if (s.goal) { _tmp.set(s.goal.x - s.c.x, s.goal.y - s.c.y, s.goal.z - s.c.z); const d = _tmp.length() || 1; s.c.addScaledVector(_tmp, Math.min(1.4, d) * dt / d); }
}

// ---------- spawning ----------
function habitatPoint(hab, okFn) {
  for (let t = 0; t < 400; t++) {
    const x = rr(-LIMIT + 25, LIMIT - 25), z = rr(-LIMIT + 25, LIMIT - 25);
    if (okFn && !okFn({ x, z })) continue;
    const wd = waterDepth(x, z), h = getH(x, z), ny = getNY(x, z);
    if (hab === 'forest' && wd === 0 && h > 0.6 && h < 70 && ny > 0.8 && gridAt(FOREST, x, z) > 0.2) return { x, z };
    if (hab === 'open' && wd === 0 && h > 0.6 && h < 60 && ny > 0.8) return { x, z };
    if (hab === 'shore' && wd === 0 && h > 0.3 && h < 6 && ny > 0.78) { const w = nearestWater(x, z); if (w && Math.hypot(w.x - x, w.z - z) < 16) return { x, z }; }
    if ((hab === 'water' || hab === 'deep') && h < -1.7 && wd > 1.6) return { x, z };
    if (hab === 'stream' && wd === 0 && gridAt(STREAMD, x, z) < 9 && h > 0.5 && ny > 0.75) return { x, z };
  }
  return null;
}
function spawnGroup0(id, n, far) {
  const sp = SPECIES[id], ai = sp.ai;
  const okFar = p => !far || !P.a || Math.hypot(p.x - P.a.pos.x, p.z - P.a.pos.z) > 140;
  if (ai === 'pack') return spawnPack(id, n, okFar);
  if (id === 'llama') return spawnCamelids(n, okFar);
  if (id === 'horse') return spawnHorses(n, okFar);
  if (id === 'capuchin') buildHerdTpls();
  if (ai === 'troop') {
    let c = null; for (let i = 0; i < 20 && !c; i++) { const cc = pick(CROWNS.filter(q => !q.giant)); if (cc && okFar(cc)) c = cc; }
    if (!c) return n;
    const tr = { kind: 'troop', members: [], crown: c, t: rr(5, 20), sp: id, spin: 0 }; GROUPS.push(tr);
    for (let i = 0; i < n; i++) { const a = new Animal(id, c.x, c.z, { group: tr }); a.slot = i; a.perched = true; tr.members.push(a); a.pos.copy(troopSpot(tr, i)); }
    return n;
  }
  if (ai === 'sloth') {
    for (let i = 0; i < n; i++) { const h = pick(HANGS); if (!h) break; const a = new Animal(id, h.x, h.z); a.hang = h; a.hanging = true; a.perched = true; a.pos.set(h.x, h.y, h.z); a.yaw = h.ry; a.mesh.rotation.z = Math.PI; }
    return n;
  }
  if (ai === 'flock') {
    let c = null; for (let i = 0; i < 20 && !c; i++) { const q = landPt(id), cc = pickCrownNear(q[0], q[1], 150, !sp.sea); if (cc && okFar(cc)) c = cc; }
    if (!c) return n;
    const f = { kind: 'flock', members: [], crown: c, pos: new V3(c.x, c.top, c.z), vel: new V3(), target: new V3(c.x, c.top, c.z), state: 'perch', t: rr(10, 50), offs: [], sea: !!sp.sea };
    for (let i = 0; i < n; i++) f.offs.push(new V3(rr(-3, 3), rr(-1.5, 1.5), rr(-3, 3)));
    GROUPS.push(f);
    for (let i = 0; i < n; i++) { const a = new Animal(id, c.x, c.z, { group: f }); a.slot = i; a.perched = true; a.pos.set(c.x + f.offs[i].x * 0.7, c.top - 0.4, c.z + f.offs[i].z * 0.7); f.members.push(a); }
    return n;
  }
  if (ai === 'perch' || ai === 'raptor') {
    for (let i = 0; i < n; i++) {
      let c = null; for (let k = 0; k < 20 && !c; k++) { const cc = pickCrownNear(rr(-WR, WR), rr(-WR, WR), 120, ai === 'raptor'); if (cc && okFar(cc)) c = cc; }
      if (!c) continue;
      const a = new Animal(id, c.x, c.z); a.perched = true; a.crown = c; a.offX = rr(-2, 2); a.offZ = rr(-2, 2); a.pos.set(c.x, c.top, c.z);
      a.state = 'perch'; a.stT = rr(5, 40);
      if (ai === 'raptor') { a.circC = new V3(c.x, 0, c.z); a.circY = c.top + 50; }
    }
    return n;
  }
  if (ai === 'hummer') {
    for (let i = 0; i < n; i++) { const f = pick(FLOWERS); if (!f) break; const a = new Animal(id, f.x, f.z, { scale: 1.8 }); a.perched = true; a.pos.set(f.x, f.y + 0.4, f.z); }
    return n;
  }
  if (ai === 'shoal') return spawnShoal(id, n, okFar);
  if (ai === 'school') {
    const c = habitatPoint('deep', okFar); if (!c) return n;
    const s = { kind: 'school', members: [], c: new V3(c.x, -1, c.z), home: new V3(c.x, 0, c.z), t: 0, calm: !!sp.calm }; GROUPS.push(s);
    for (let i = 0; i < n; i++) { const a = new Animal(id, c.x + rr(-2, 2), c.z + rr(-2, 2), { group: s }); a.slot = i; a.pos.y = -1; s.members.push(a); }
    return n;
  }
  if (ai === 'bigfish' || ai === 'dolphin' || ai === 'eel' || ai === 'shark' || ai === 'whale') {
    for (let i = 0; i < n; i++) { const c = habitatPoint('deep', okFar); if (!c) break; const a = new Animal(id, c.x, c.z); a.pos.y = -1.2; }
    return n;
  }
  const hab = ai === 'croc' ? 'water' : ai === 'snake' ? 'shore' : ai === 'frog' ? 'stream' : sp.hab === 'shore' ? 'shore' : sp.hab === 'water' ? 'water' : OPEN_HABS.has(sp.hab) ? sp.hab : 'forest';
  const c = habitatPoint(hab, okFar); if (!c) return n;
  const grp = n > 1 ? { kind: 'herd', members: [], leader: null } : null;
  if (grp) GROUPS.push(grp);
  for (let i = 0; i < n; i++) {
    let x = c.x + rr(-6, 6), z = c.z + rr(-6, 6);
    if (hab !== 'water' && waterDepth(x, z) > 0) { x = c.x; z = c.z; }
    const a = new Animal(id, x, z, { group: grp });
    if (grp) { grp.members.push(a); if (!grp.leader) grp.leader = a; }
    if (ai === 'snake' || ai === 'viper') { a.state = 'rest'; a.stT = rr(5, 40); }
    if (ai === 'croc') a.state = 'float';
  }
  return n;
}
function spawnAll() {
  const f = QUAL[SET.q].fauna * faunaK();
  for (const id of GUIDE_ORDER) {
    const sp = SPECIES[id]; if (!sp.ai || !sp.count) continue;
    const target = Math.max(1, Math.round(sp.count * f)); let made = 0, guard = 0;
    while (made < target && guard++ < 40) { const g = Math.min(target - made, Math.max(1, Math.round(rr(sp.group[0], sp.group[1])))); made += spawnGroup(id, g, false); }
  }
  spawnHunters(); spawnVultures(); spawnCows(); spawnLakeFish();
}
let faunaT = 8, discT = 0;
function manageFauna(dt) {
  faunaT -= dt; if (faunaT > 0) return; faunaT = 8;
  const f = QUAL[SET.q].fauna * faunaK(), counts = {};
  for (const a of ANIMALS) if (a.alive && !a.cub && !a.isPlayer && !a.socialExtra && !a.owf) counts[a.spId] = (counts[a.spId] || 0) + 1;
  for (const id of GUIDE_ORDER) {
    const sp = SPECIES[id]; if (!sp.ai || !sp.count) continue;
    const target = Math.max(1, Math.round(sp.count * f)), c = counts[id] || 0;
    if (c < target * 0.7) spawnGroup(id, Math.min(target - c, Math.max(1, sp.group[1])), true);
  }
  for (let i = GROUPS.length - 1; i >= 0; i--) if (!GROUPS[i].members.length) GROUPS.splice(i, 1);
}
function updateAnimals(dt) {
  shBuild();
  for (const g of GROUPS) {
    if (g.kind === 'flock') updateFlock(g, dt); else if (g.kind === 'troop') updateTroop(g, dt); else if (g.kind === 'school') updateSchool(g, dt); else if (g.kind === 'shoal') updateShoal(g, dt); else if (g.kind === 'pack') updatePack(g, dt);
    else if (g.kind === 'herd' && (!g.leader || !g.leader.alive)) g.leader = g.members.find(m => m.alive) || null;
  }
  // far animals update less often (with the full elapsed time), so a crowded jungle stays smooth
  const fr = (updateAnimals.fr = (updateAnimals.fr || 0) + 1);
  for (let i = ANIMALS.length - 1; i >= 0; i--) {
    const a = ANIMALS[i]; if (!a) continue;
    const lod = a.isPlayer || a.isPartner || a.cub || a.pet || a.tribe || a.legend || a.carriedBy || a.heldBy || !(a.dCam > 120) ? 1 : a.dCam < 220 ? 3 : a.dCam < 700 || a.raider || a.ctrip || a.lead ? 6 : 12;
    if (lod === 1) { if (a.lodAcc) { a.update(Math.min(a.lodAcc + dt, 0.25)); a.lodAcc = 0; } else a.update(dt); continue; }
    a.lodAcc = (a.lodAcc || 0) + dt;
    if ((fr + a.id) % lod === 0) { a.update(Math.min(a.lodAcc, 0.3)); a.lodAcc = 0; }
  }
  updateHunters(dt);
  if (G.mode === 'play') {
    manageFauna(dt);
    discT -= dt;
    if (discT <= 0 && P.a) {
      discT = 0.5;
      const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw);
      shQuery(P.a.pos.x, P.a.pos.z, 34, (b, d) => {
        if (b.isPlayer || !b.mesh.visible || P.discovered.has(b.spId)) return;
        if (d < 6 || ((b.pos.x - P.a.pos.x) * fx + (b.pos.z - P.a.pos.z) * fz) / (d || 1) > 0.25) discover(b.spId);
      });
    }
  }
}
