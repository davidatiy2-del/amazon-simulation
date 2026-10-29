# shared set-ups for the tests
SETUP = r"""(() => {
  const spot = (() => { for (let r = 0; r < 400; r += 10) for (let a = 0; a < 12; a++) { const x = 260 + Math.cos(a) * r, z = 40 + Math.sin(a) * r; if (waterDepth(x, z) === 0 && getNY(x, z) > 0.9 && HUNT.camps.every(c => Math.hypot(c.x - x, c.z - z) > 110)) return { x, z }; } })();
  P.a.pos.set(spot.x, 0, spot.z); P.a.ground(1, true);
  const v = foundCampAt(spot.x, spot.z, true); CAMPH.camp = v; v.own = true;
  for (let k = 0; k < 8; k++) spawnNewcomer(v, 'warrior');
  for (let k = 0; k < 2; k++) spawnNewcomer(v, 'hunter');
  return { v: [v.x, v.z], n: clanAdults().length };
})()"""
