// ================= TOWN LIFE: the trades of the Old World's towns and the day of their people =================
// Vendors stand at their stalls and call out their wares, smiths strike their anvils, farmers hoe the fields, fishers
// sit on the piers, priests and scholars keep to their temples, water is drawn at the wells, guards hold the gates and
// walk the walls. In the evening the town gathers in its square; at night everyone goes home to sleep.
const JOBW = {
  vendor: ['סוחר', 'סוחרת'], farmer: ['איכר', 'איכרה'], smith: ['נפח', 'נפחית'], fisher: ['דייג', 'דייגת'], water: ['שואב מים', 'שואבת מים'], herder: ['רועה', 'רועה'], guard: ['שומר', 'שומרת'],
  priest: { knights: ['נזיר', 'נזירה'], vikings: ['משורר', 'משוררת'], mongols: ['שמאן', 'שמאנית'], china: ['נזיר', 'נזירה'], japan: ['נזיר', 'נזירה'], arabs: ['מלומד', 'מלומדת'], egypt: ['כוהן', 'כוהנת'], mali: ['מלומד', 'מלומדת'], india: ['כוהן', 'כוהנת'] }
};
function jobWord(h) {
  const j = h.job, w = j && JOBW[j]; if (!w) return null;
  const L = Array.isArray(w) ? w : w[h.camp && h.camp.civ] || ['כוהן', 'כוהנת'];
  return h.sex === 'f' ? L[1] : L[0];
}
const WARES = {
  knights: ['לחם טרי! לחם טרי מהתנור!', 'גבינה מהכפר, שלוש בזהב אחד!', 'תפוחים אדומים מהבוסתן!', 'צמר משובח מהאחו!', 'יין מהכרמים, טעמו!'],
  vikings: ['דג מלוח לחורף!', 'פרוות של זאב ושל שועל!', 'דבש מתוק מהיער!', 'גרזנים חדים מהנפח!'],
  mongols: ['חלב סוסות טרי!', 'לבד חם לאוהל!', 'אוכפים ורסנים!', 'קשתות ממוגוליה!'],
  china: ['משי! משי מהמזרח!', 'תה ירוק וריחני!', 'אורז טרי מהשדות!', 'כלי חרסינה עדינים!', 'מניפות ופנסים!'],
  japan: ['דג טרי מהבוקר!', 'בדי כותנה צבועים!', 'מאווררים יפים!', 'תה ירוק חם!'],
  arabs: ['תמרים מתוקים מהנווה!', 'תבלינים מהודו!', 'שטיחים צבעוניים!', 'בשמים ומור!', 'כלי נחושת!'],
  egypt: ['פפירוס לכתיבה!', 'לחם טרי!', 'פשתן לבן מהנילוס!', 'כדי חרס חזקים!'],
  mali: ['מלח מהמדבר!', 'זהב מהמכרות!', 'ספרים מטימבוקטו!', 'בדים צבועים בכחול!'],
  india: ['תבלינים! כורכום וכמון!', 'בדי כותנה צבועים!', 'מנגו מתוק!', 'תה עם חלב וג׳ינג׳ר!']
};
const CIVCHAT = {
  knights: ['המלך יוצא לצוד מחר', 'שמעתי ששודדים ארבו בדרך', 'הקציר השנה טוב', 'האבירים מתאמנים בחצר', 'הכומר אמר שיהיה גשם', 'הסוחר מהעיר השנייה הגיע'],
  vikings: ['הספינות חוזרות לפני החורף', 'הים היה סוער אתמול', 'היארל רוצה להפליג מערבה', 'צריך עוד עצים לאש', 'שמעתי זאבים ביער'],
  mongols: ['הסוסים צריכים מרעה חדש', 'החאן קורא לכולם', 'הערבה רחבה מתמיד', 'הסוסה שלי המליטה'],
  china: ['הקיסר שלח שליחים', 'האורז גדל יפה', 'מחר יש שוק גדול', 'הנהר עלה על גדותיו', 'המלומדים כותבים ספר חדש'],
  japan: ['עצי הדובדבן פורחים', 'השוגון מאמן את הסמוראים', 'הדייגים חזרו עם שלל', 'ההר שקט היום'],
  arabs: ['השיירה הגיעה מהמדבר', 'המים בבאר קרים', 'הסולטן בונה כיפה חדשה', 'יש סערת חול בדרום'],
  egypt: ['הנילוס עולה השנה', 'הפרעה בונה מקדש חדש', 'החיטה בשלה', 'ראיתי תנין ליד הגדה'],
  mali: ['השיירה הביאה מלח', 'המלומדים מעתיקים ספרים', 'המנסה שולח זהב לעולם', 'הבאובב נותן צל טוב'],
  india: ['הגשמים יגיעו בקרוב', 'המהרג׳ה רוכב על פיל', 'התבלינים יקרים השנה', 'נמר נראה ליד הכפר']
};
const chatLines = h => (h && h.camp && CIVCHAT[h.camp.civ]) || CHAT;
// what a town's people do: the trades and how many of each a place has (added to CIV_PLAN)
const CIV_JOBS = {
  castle: ['gatherer:vendor', 'gatherer:vendor', 'builder:smith', 'builder:farmer', 'builder:farmer', 'elder:priest', 'gatherer:water', 'child'],
  city: ['gatherer:vendor', 'gatherer:vendor', 'gatherer:vendor', 'builder:smith', 'builder:farmer', 'builder:farmer', 'hunter:fisher', 'elder:priest', 'gatherer:water', 'child'],
  town: ['gatherer:vendor', 'gatherer:vendor', 'builder:smith', 'builder:farmer', 'builder:farmer', 'hunter:fisher', 'elder:priest', 'gatherer:water'],
  village: ['gatherer:vendor', 'builder:farmer', 'builder:farmer', 'hunter:fisher', 'gatherer:water'],
  camp: ['hunter:herder', 'hunter:herder', 'builder:smith', 'elder:priest', 'gatherer:vendor', 'gatherer:water']
};
function jobSex(job) { const r = rng(); return job === 'smith' ? (r < 0.95 ? 'm' : 'f') : job === 'water' ? (r < 0.85 ? 'f' : 'm') : job === 'fisher' || job === 'farmer' || job === 'herder' ? (r < 0.75 ? 'm' : 'f') : r < 0.5 ? 'm' : 'f'; }
// ---------- the plan of a townsperson: where to be at this hour ----------
const TSTATES = { sell: 1, hammer: 1, farm: 1, fishing: 1, pray: 1, preach: 1, draw: 1, shop: 1, tend: 1, tsleep: 1, chatwait: 1, post2: 1, stand: 1 };
function spotsOf(c, k) { return c && c.spots && c.spots[k] && c.spots[k].length ? c.spots[k] : null; }
function townPlan(h) {
  const c = h.camp, t = G.time; if (!c || !c.spots) return false;
  const any = k => { const L = spotsOf(c, k); return L ? L[Math.floor(rng() * L.length)] : null; };
  const mine = k => { const L = spotsOf(c, k); return L ? L[(h.id * 7 + (h.slotK || 0)) % L.length] : null; };
  const go = (sp, then, dur, off, face) => { if (!sp) return false; const o = off || 0; vGoto(h, sp.x + Math.sin(sp.a) * o + rr(-0.35, 0.35), sp.z + Math.cos(sp.a) * o + rr(-0.35, 0.35), then, dur); h.spotA = face ?? sp.a; return true; };
  // night: home to a door to sleep (the old and the children go first)
  const bed = h.young || h.cls === 'elder' ? 20.2 : 21.4;
  if (t > bed || t < 5.6) return go(mine('door'), 'tsleep', rr(50, 90), 0.3);
  // the evening: to the square, to talk
  if (t > 18.4 && rng() < 0.65 && !(h.job === 'vendor' && t < 19.2)) return go(any('plaza'), 'chatwait', rr(25, 45), rr(1.5, 4), rng() * TAU);
  switch (h.job) {
    case 'vendor': return go(mine('market'), 'sell', rr(50, 110));
    case 'smith': return go(mine('forge'), 'hammer', rr(30, 70));
    case 'farmer': return go(any('field'), 'farm', rr(25, 50), 0, rng() * TAU);
    case 'fisher': return go(mine('dock'), 'fishing', rr(50, 110)) || go(any('well'), 'draw', rr(5, 9));
    case 'priest': return rng() < 0.6 ? go(mine('temple'), 'pray', rr(30, 60)) : go(any('plaza'), 'preach', rr(20, 35), rr(1, 3), rng() * TAU);
    case 'water': return go(any('well'), 'draw', rr(5, 9));
    case 'herder': return go(any('herd'), 'tend', rr(30, 60), 0, rng() * TAU);
  }
  if (h.young) return false;
  const r = rng();
  // a shopper stands before a stall, looking at the vendor
  if (r < 0.28) { const s = any('market'); if (s) return go(s, 'shop', rr(8, 16), 1.9, s.a + Math.PI); }
  if (r < 0.45) return go(any('well'), 'draw', rr(5, 9));
  if (r < 0.6) { const b = any('bench'); if (b) return go(b, 'stand', rr(15, 30)); }
  if (r < 0.72) return go(mine('door'), 'stand', rr(10, 25), 0.8);
  if (r < 0.82) return go(any('temple'), 'pray', rr(15, 30));
  return false;
}
// ---------- what a townsperson does once there ----------
function townState(h, dt) {
  const st = h.state, c = h.camp, face = () => { if (h.spotA != null) h.yaw += angDiff(h.yaw, h.spotA) * Math.min(1, dt * 3); };
  h.move(0, 0, 0, dt); face();
  const near = (h.dCam || 999) < 32, pl = P.a && P.a.alive ? dist2(P.a.pos, h.pos) : 999;
  switch (st) {
    case 'sell':
      h.pose = (h.anim.t % 9) < 2.2 ? 'talk' : 'idle';
      if (pl < 13 && (h.callT = (h.callT || rr(1, 4)) - dt) <= 0) { h.callT = rr(8, 14); say(h, pick(WARES[c.civ] || WARES.knights), 2.6); if (rng() < 0.4) { h.gestT = 1.6; h.gest = 'wave'; } }
      break;
    case 'hammer':
      h.pose = 'hammer';
      if (near && (h.sparkT = (h.sparkT || 0) - dt) <= 0) { h.sparkT = 0.75; const fx = h.pos.x + Math.sin(h.yaw) * 0.55, fz = h.pos.z + Math.cos(h.yaw) * 0.55; FX.spawn('ember', fx, h.pos.y + 0.75, fz, 5); if (h.dCam < 22) AUD.at('hammer', h.pos, 0.3); }
      break;
    case 'farm': h.pose = (h.anim.t % 8) < 5 ? 'chop' : 'gather'; break;
    case 'fishing': h.pose = 'fish'; if (near) setProp(h, 'rod', true, 'Rha'); break;
    case 'pray': h.pose = 'kneel'; break;
    case 'preach': h.pose = 'talk'; if (pl < 10 && (h.callT = (h.callT || rr(2, 5)) - dt) <= 0) { h.callT = rr(12, 20); say(h, pick(chatLines(h)), 2.6); } break;
    case 'draw': h.pose = 'gather'; if (h.stT <= 0) { h.carry = true; townHome(h); return; } break;
    case 'shop': h.pose = 'talk'; break;
    case 'tend': {
      // walking slowly round the herd
      const L = spotsOf(c, 'herd'), s = L && L[0]; if (s && (h.tendT = (h.tendT || 0) - dt) <= 0) { h.tendT = rr(4, 8); h.tendG = { x: s.x + rr(-6, 6), z: s.z + rr(-4, 4) }; }
      if (h.tendG && dist2(h.pos, h.tendG) > 1) { h.steerTo(h.tendG.x, h.tendG.z, 1.1, dt); h.pose = 'move'; } else h.pose = 'idle';
      break;
    }
    case 'tsleep': h.pose = 'sleep'; if (G.time > 5.6 && G.time < 12) h.stT = Math.min(h.stT, 0); break;
    case 'chatwait': {
      h.pose = 'idle';
      if ((h.chatT = (h.chatT || 0) - dt) <= 0) {
        h.chatT = rr(2, 4);
        const o = c.hunters.find(q => q !== h && q.alive && !q.young && q.brain === 'villager' && q.state === 'chatwait' && dist2(q.pos, h.pos) < 9);
        if (o) { h.state = 'chat'; h.chatWith = o; h.stT = rr(10, 18); o.state = 'chat'; o.chatWith = h; o.stT = h.stT; return; }
      }
      break;
    }
    default: h.pose = 'idle';
  }
  if (st !== 'fishing' && h.props && h.props.rod && h.props.rod.visible) setProp(h, 'rod', false);
  if (h.stT <= 0) { if (h.props && h.props.rod) setProp(h, 'rod', false); villagerPlan(h); }
}
function townHome(h) { const c = h.camp, L = spotsOf(c, 'door'), s = L ? L[(h.id * 7) % L.length] : null; if (s) { vGoto(h, s.x, s.z, 'stand', rr(6, 12)); h.spotA = s.a; } else vGoto(h, c.x + rr(-3, 3), c.z + rr(-3, 3), 'sit', rr(10, 20)); }
// ---------- the guards: some hold the gates, the others walk round the town ----------
function guardPlan(h) {
  const c = h.camp; if (!c || !c.spots) return false;
  const G2 = spotsOf(c, h.job === 'guard' ? 'gate' : 'patrol') || spotsOf(c, 'guard') || spotsOf(c, 'patrol');
  if (!G2) return false;
  const s = h.job === 'guard' ? G2[(h.slotK || 0) % G2.length] : G2[Math.floor(rng() * G2.length)];
  const o = h.job === 'guard' ? 0.3 : 1.8; hGoto(h, s.x + rr(-o, o), s.z + rr(-o, o), 'post'); h.postA = h.job === 'guard' ? s.a : rng() * TAU; h.postT = h.job === 'guard' ? rr(60, 120) : rr(6, 14);
  return true;
}
// ---------- near the camera: the trades' tools in hand, the guards' torches at night ----------
function townLifeUpdate(dt) {
  const T = townLifeUpdate; T.t = (T.t || 0) - dt; if (T.t > 0) return; T.t = 0.5;
  const night = nightK() > 0.3;
  for (const c of HUNT.camps) {
    if (!c.civ || c.gone || c.dormant || !c.spots) continue;
    if (Math.hypot(c.x - camera.position.x, c.z - camera.position.z) > 120) continue;
    for (const h of c.hunters) {
      if (!h.alive || !h.B || !(h.job === 'guard' || h.job === 'patrol')) continue;
      const torch = night && (h.dCam || 999) < 70 && (h.state === 'post' || h.state === 'goto' || h.state === 'idle');
      if (torch || (h.props && h.props.torch)) setProp(h, 'torch', torch, 'Lha');
      if (h.props && h.props.torch && h.props.torch.visible) { const f = h.props.torch.userData.flame; if (f) f.scale.set(1, 0.85 + Math.sin(G.t * 15 + h.id) * 0.15, 1); }
    }
  }
}
