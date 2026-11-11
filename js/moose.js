/* FLOW LAB — 무스 청년 앵거스
 * 시골 1-3 에서 처음 나오는 순박한 농장 청년. 플레이어가 지역을 하나씩 끝낼 때마다 승진한다:
 *   농장 청년(시골 조끼) → 현장 보조(조끼 + 노란 안전모) → 현장 기사(형광 조끼) → 현장 소장(흰 안전모 + 서류판)
 * 그림 파일이 아니라 로우폴리 3D 모델을 직급·표정별로 한 장씩 렌더링해 오려 낸 스티커로 쓴다. 대사는 js/script.js 의 moose. */
(function (root) {
  'use strict';
  const SIZE = 420, EDGE = 10;
  function build(THREE, rank, pose) {
    const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    const fur = M(0x8a5a36), fur2 = M(0x6f4628), snout = M(0xc9a27a), dark = M(0x2b2622), antler = M(0xe6d3ad), white = M(0xf3f1ea);
    const box = new THREE.BoxGeometry(1, 1, 1), ico = new THREE.IcosahedronGeometry(1, 0), cyl = new THREE.CylinderGeometry(1, 1, 1, 8);
    const add = (geo, mat, x, y, z, sx, sy, sz, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); (parent || g).add(m); return m; };
    // 다리·발굽
    for (const s of [-1, 1]) { add(box, fur2, s * .17, .3, 0, .17, .6, .2); add(box, dark, s * .17, .04, .02, .19, .09, .24); }
    // 몸통
    add(box, fur, 0, .98, 0, .66, .8, .46); add(box, snout, 0, .92, .235, .34, .5, .02);
    // 옷: 직급에 따라
    const farm = rank <= 1, vest = M(farm ? 0x6f7f4a : 0xff7a1f), tape = M(0xf3f0c8);
    for (const s of [-1, 1]) { add(box, vest, s * .235, 1.0, .02, .2, .66, .5); if (!farm) { add(box, tape, s * .235, .86, .275, .2, .06, .01); add(box, tape, s * .235, 1.1, .275, .2, .06, .01); } else add(box, M(0x4f5c34), s * .2, .86, .275, .1, .1, .01); }
    add(box, vest, 0, 1.0, -.235, .66, .66, .02);
    // 팔
    const arm = (s, rz, rx) => { const sh = new THREE.Group(); sh.position.set(s * .37, 1.3, 0); sh.rotation.z = s * rz; sh.rotation.x = rx || 0; g.add(sh); add(box, fur, 0, -.28, 0, .14, .56, .16, sh); add(box, dark, 0, -.58, 0, .15, .08, .17, sh); return sh; };
    arm(-1, .12, 0);
    const ra = arm(1, pose === 'cheer' ? 2.5 : pose === 'shy' ? .5 : .12, pose === 'shy' ? -.9 : 0);
    if (rank === 3) add(box, M(0xcdb890), .06, -.5, .14, .26, .34, .03, ra);                      // 소장의 서류판
    // 머리
    const head = new THREE.Group(); head.position.set(0, 1.62, .04); head.rotation.x = pose === 'shy' ? .16 : -.04; head.rotation.z = pose === 'cheer' ? -.08 : 0; g.add(head);
    add(box, fur, 0, .12, 0, .4, .36, .38, head);
    add(box, snout, 0, .02, .3, .3, .26, .34, head); add(box, fur2, 0, -.02, .47, .32, .2, .04, head);
    for (const s of [-1, 1]) { add(ico, dark, s * .08, .0, .49, .028, .028, .02, head); add(ico, dark, s * .13, .2, .195, .04, .045, .02, head); add(ico, white, s * .118, .215, .21, .012, .012, .01, head); }
    if (pose === 'cheer') add(box, dark, 0, -.1, .44, .16, .05, .04, head);                        // 웃는 입
    for (const s of [-1, 1]) { const e = add(box, fur, s * .25, .24, -.06, .16, .08, .06, head); e.rotation.z = s * .5; }
    // 뿔
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * .15, .3, -.04); a.rotation.z = -s * .55; head.add(a);
      add(box, antler, 0, .14, 0, .05, .28, .05, a); add(box, antler, s * .1, .34, 0, .3, .07, .16, a);
      for (let k = 0; k < 3; k++) add(box, antler, s * (.0 + k * .11), .44, 0, .045, .15, .05, a);
    }
    // 머리에 쓴 것 / 문 것
    if (rank === 0) { const st = add(box, M(0xe2c96b), .12, -.06, .5, .26, .015, .015, head); st.rotation.y = -.5; }   // 지푸라기
    else {
      const hat = new THREE.Group(); hat.position.set(0, .32, .02); head.add(hat);
      const hm = M(rank === 3 ? 0xf6f3ea : 0xffc928);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), hm); dome.scale.set(1, .8, 1.05); hat.add(dome);
      add(cyl, hm, 0, .005, 0, .215, .03, .215, hat); add(box, hm, 0, 0, .2, .26, .025, .12, hat);
    }
    g.rotation.y = pose === 'shy' ? .45 : .35;
    return g;
  }
  function sticker(src) {
    const w = src.width, h = src.height, mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const mc = mask.getContext('2d'); mc.drawImage(src, 0, 0); mc.globalCompositeOperation = 'source-in'; mc.fillStyle = '#fff'; mc.fillRect(0, 0, w, h);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const oc = out.getContext('2d');
    for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; oc.drawImage(mask, Math.cos(a) * EDGE, Math.sin(a) * EDGE); }
    oc.drawImage(src, 0, 0);
    return out.toDataURL('image/png');
  }
  const cache = {};
  function image(rank, pose) {
    const key = rank + pose; if (key in cache) return cache[key];
    const THREE = root.THREE; if (!THREE) return (cache[key] = null);
    let renderer; try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return (cache[key] = null); }
    try {
      renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb9b2a2, .7));
      const sun = new THREE.DirectionalLight(0xfff1d6, .55); sun.position.set(-2.5, 4, 5); scene.add(sun);
      const camera = new THREE.PerspectiveCamera(23, 1, .1, 50); camera.position.set(.5, 1.9, 6.4); camera.lookAt(0, 1.16, 0);
      const g = build(THREE, rank, pose); scene.add(g); renderer.render(scene, camera);
      const copy = document.createElement('canvas'); copy.width = SIZE; copy.height = SIZE; copy.getContext('2d').drawImage(renderer.domElement, 0, 0);
      cache[key] = sticker(copy);
    } catch (e) { cache[key] = null; }
    finally { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); }
    return cache[key];
  }

  const SC = () => (root.PIP_SCRIPT || {}).moose || { name: '', ranks: [], hello: [], cheer: [[]], sorry: [], first: '' };
  const W = () => root.FlowStages.WORLDS, ST = () => root.FlowStages.STAGES;
  /* 직급: 끝낸 지역 수(그 지역의 모든 미니 스테이지에서 별 하나 이상) */
  function rankOf(progress) { let r = 0; for (const w of W()) { if (w.stages.every(s => (progress[s.id] || 0) > 0)) r++; else break; } return Math.min(3, r); }
  const met = st => ST().indexOf(st) >= 2;                       // 1-3 부터 등장
  function html(rank, pose, text) {
    const sc = SC(), src = image(rank, pose);
    return (src ? `<img src="${src}" alt="">` : '') + `<div><b>${sc.name} <small>${sc.ranks[rank] || ''}</small></b><p>${text}</p></div>`;
  }
  function brief(el, st, progress) {
    const sc = SC(), rank = rankOf(progress); let text = '';
    if (st.id === 'r3') text = sc.first; else if (st.si === 0 && st.wi > 0 && rank >= st.wi) text = sc.hello[st.wi] || '';
    el.innerHTML = text ? html(rank, st.id === 'r3' ? 'shy' : 'cheer', text) : ''; el.style.display = text ? '' : 'none';
  }
  function result(el, st, progress, stars) {
    if (stars < 0 || !met(st)) { el.innerHTML = ''; el.style.display = 'none'; return; }
    const sc = SC(), rank = rankOf(progress), pick = a => a[Math.floor(Math.random() * a.length)] || '';
    el.innerHTML = html(rank, stars > 0 ? 'cheer' : 'shy', stars > 0 ? pick(sc.cheer[rank] || sc.cheer[0]) : pick(sc.sorry)); el.style.display = '';
  }
  root.FlowMoose = { brief, result, rankOf, image };
})(window);
