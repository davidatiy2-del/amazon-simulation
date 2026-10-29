// A photo studio inside the game page: people (or animals) in a row on a plain floor, lit like a sunny day.
// studio({ people: [{ o: {...buildHuman options} | key: 'tpl key', pal: {1: '#hex', ...}, x, z, yaw, s }], cam: { pos, at, fov } })
(() => {
  window.__freeze = true; for (const id of ['menu', 'hud', 'loading']) { const e = document.getElementById(id); if (e) e.hidden = true; }
  const S = window.STUDIO || (window.STUDIO = (() => {
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#a9bccb');
    sc.add(new THREE.HemisphereLight('#e8f0f8', '#6a5a44', 1.25));
    const sun = new THREE.DirectionalLight('#fff2dc', 2.4); sun.position.set(4, 7, 6); sc.add(sun);
    const back = new THREE.DirectionalLight('#c8d8ff', 0.6); back.position.set(-5, 3, -6); sc.add(back);
    const g = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshLambertMaterial({ color: '#8a9468' })); g.rotation.x = -Math.PI / 2; sc.add(g);
    const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.03, 400);
    return { sc, cam, objs: [] };
  })());
  window.studio = (spec) => {
    for (const m of S.objs) S.sc.remove(m); S.objs = [];
    const out = [];
    for (const p of spec.people || []) {
      let tpl = null;
      try { tpl = p.key ? (TPL[p.key] || TPL[vxTpl(p.key)]) : p.quad ? buildQuad(p.quad) : buildHuman(p.o); } catch (e) { out.push('build: ' + e.message); continue; }
      if (!tpl) { out.push('no tpl ' + p.key); continue; }
      const sk = makeSkinned(tpl), m = sk.mesh; m.position.set(p.x || 0, 0, p.z || 0); m.rotation.y = p.yaw || 0; m.scale.setScalar(p.s || 1);
      const pal = p.palJs ? eval(p.palJs) : p.pal ? Object.fromEntries(Object.entries(p.pal).map(([k, v]) => [k, col(v)])) : null;
      const a = { pal, tpl }; if (pal) m.material = personalMat(tpl);
      m.onBeforeRender = (r, s, c, g, mat) => { if (!mat || !mat.isMeshPhongMaterial) return; CHAR_U.uHit.value = 0; CHAR_U.uWound.value = 0; CHAR_U.uTint.value = pal ? personTint(a) : TINT1; mat.uniformsNeedUpdate = true; };
      if (p.pose) for (const [bn, r] of Object.entries(p.pose)) if (sk.B[bn]) sk.B[bn].rotation.set(r[0] || 0, r[1] || 0, r[2] || 0);
      m.updateMatrixWorld(true);
      S.sc.add(m); S.objs.push(m);
      out.push(tpl.geo.attributes.position.count + 'v/' + (tpl.geo.index ? tpl.geo.index.count / 3 : '-') + 't');
    }
    const c = spec.cam || {}, pos = c.pos || [0, 1.5, 4], at = c.at || [0, 1.1, 0];
    S.cam.fov = c.fov || 30; S.cam.aspect = innerWidth / innerHeight; S.cam.updateProjectionMatrix();
    S.cam.position.set(...pos); S.cam.lookAt(...at); S.cam.updateMatrixWorld();
    CHAR_U.uRimCol.value.setRGB(0, 0, 0); CHAR_U.uNight.value = 0;
    renderer.setRenderTarget(null); renderer.render(S.sc, S.cam);
    return out;
  };
  return 'studio ready';
})()
