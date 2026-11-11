/* FLOW LAB — 현장 주임 "핍"
 * 로우폴리 3D 펭귄을 포즈별로 한 장씩 찍고, 흰 테두리를 둘러 오려 낸 사진(스티커)처럼 만든다.
 * 결과는 PNG data URL. WebGL 을 못 쓰면 null 을 돌려주고, 튜토리얼은 글만으로 진행한다. */
(function (root) {
  'use strict';
  const SIZE = 560, EDGE = 13;

  /* 포즈: yaw 몸 방향, L/R 날개 [옆으로 들기, 앞으로 내밀기], look 고개 들기(+)·숙이기(-), beak 벌림, tilt/lean 몸 기울기 */
  const POSES = {
    search: { yaw: -1.15, L: [.2, .1], R: [.5, .7], look: -.05, beak: .12, lean: .14 },
    call:   { yaw: .7, L: [.75, -.3], R: [.75, -.3], look: .55, beak: .5, lean: -.1 },
    found:  { yaw: .55, L: [.15, 0], R: [2.3, 0], look: .12, beak: .25, tilt: .06 },
    talk:   { yaw: .6, L: [.15, 0], R: [.5, .3], look: 0, beak: .18 },
    point:  { yaw: .75, L: [1.5, .1], R: [.15, 0], look: 0, beak: .15, tilt: .05 },
    worry:  { yaw: .45, L: [1.25, .2], R: [1.25, .2], look: .1, beak: .4, sweat: true },
    cheer:  { yaw: .5, L: [2.35, 0], R: [2.35, 0], look: .3, beak: .45, hop: .1 },
    teach:  { yaw: .5, L: [.15, 0], R: [2.2, .1], look: .1, beak: .25, tilt: .04, stick: true },
    teach2: { yaw: .35, L: [.5, .3], R: [1.75, .2], look: .05, beak: .4, stick: true },
    think:  { yaw: -.55, L: [.15, 0], R: [.2, 0], look: .2, beak: 0, tilt: -.1 }
  };

  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const NAVY = [0x262c38, 0x2d3442, 0x232833, 0x323a49], WHITE = [0xf6f4ef, 0xe9e8ee, 0xdcdde8, 0xefeef2], GOLD = [0xf6c443, 0xf2a93b, 0xf9d86a];

  /* 몸통: 실제 펭귄의 옆모습 윤곽을 회전시킨 10각 기둥. 면마다 색을 따로 칠한다(등은 남색, 배는 흰색, 목 옆은 노랑) */
  function torso(THREE) {
    const prof = [[.02, .03], [.3, .06], [.43, .3], [.47, .62], [.45, .95], [.38, 1.22], [.28, 1.44], [.245, 1.57], [.265, 1.72], [.235, 1.87], [.13, 1.98], [.01, 2.02]];
    const g = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 10).toNonIndexed();
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const a = Math.abs(Math.atan2(x, z)), k = Math.floor(hash(i * .37) * 4);
      let hex;
      if (y > 1.8) hex = NAVY[k];                                            // 정수리
      else if (y > 1.5) hex = a < 1.3 ? WHITE[k % 2] : NAVY[k];              // 얼굴
      else if (y > 1.28 && a > .65 && a < 1.9) hex = GOLD[k % 3];            // 목 옆 노란 무늬
      else if (a < 1.3) hex = y > 1.2 && a < .65 ? 0xf7e9b8 : WHITE[k];      // 배
      else hex = NAVY[k];
      c.setHex(hex);
      for (let j = 0; j < 3; j++) { col[(i + j) * 3] = c.r; col[(i + j) * 3 + 1] = c.g; col[(i + j) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
    m.scale.z = .9; return m;
  }

  function build(THREE, P) {
    const M = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    const m = { navy: M(0x2a303c), navy2: M(0x343c4b), beak: M(0x2b2d33), beak2: M(0xf08a2c), foot: M(0xee8a26), hat: M(0xffc928), hat2: M(0xe6b01a), vest: M(0xff6d1f), tape: M(0xe9eed6),
      eye: M(0x15171c), white: M(0xf6f4ef), sweat: M(0x8fd0ea) };
    const ico = new THREE.IcosahedronGeometry(1, 0), box = new THREE.BoxGeometry(1, 1, 1), cone4 = new THREE.ConeGeometry(1, 1, 4), oct = new THREE.OctahedronGeometry(1, 0);
    const g = new THREE.Group();
    const add = (geo, mat, x, y, z, sx, sy, sz, parent) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); (parent || g).add(o); return o; };

    g.add(torso(THREE));
    // 발·꼬리
    for (const s of [-1, 1]) { const f = add(cone4, m.foot, s * .17, .035, .3, .15, .34, .05); f.rotation.x = Math.PI / 2; f.rotation.z = -s * .3; }
    add(cone4, m.navy, 0, .13, -.4, .13, .34, .05).rotation.x = -Math.PI / 2 + .5;
    // 안전조끼: 앞이 벌어진 10각 통 + 반사띠 + 어깨끈
    const open = .82, seg = (rt, rb, h, y, mat) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10, 1, true, open / 2, Math.PI * 2 - open), mat); o.material.side = THREE.DoubleSide; o.position.y = y; o.scale.z = .9; g.add(o); return o; };
    seg(.425, .5, .58, .86, m.vest);
    seg(.495, .505, .07, .72, m.tape); seg(.455, .465, .07, .98, m.tape);
    for (const s of [-1, 1]) { const st = add(box, m.vest, s * .2, 1.25, .04, .12, .34, .5); st.rotation.x = -.42; st.rotation.z = -s * .5; }
    // 머리에 달린 것들: 부리·점눈·안전모 (고개를 들고 숙일 때 함께 움직인다)
    const head = new THREE.Group(); head.position.set(0, 1.7, 0); head.rotation.x = -(P.look || 0); g.add(head);
    const up = add(cone4, m.beak, 0, .0, .38, .08, .44, .055, head); up.rotation.x = Math.PI / 2 + .08;
    const lo = add(cone4, m.beak2, 0, -.05, .35, .065, .36, .04, head); lo.rotation.x = Math.PI / 2 + .12 + (P.beak || 0);
    for (const s of [-1, 1]) add(ico, m.eye, s * .155, .035, .185, .036, .036, .036, head);
    if (P.sweat) { add(cone4, m.sweat, .3, .2, .1, .04, .12, .04, head).rotation.z = -.3; add(ico, m.sweat, .315, .13, .1, .042, .042, .042, head); }
    const hat = new THREE.Group(); hat.position.set(0, .2, -.02); hat.rotation.x = -.22; head.add(hat);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.275, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), m.hat); dome.scale.set(1, .86, 1.04); hat.add(dome);
    add(new THREE.CylinderGeometry(.295, .31, .035, 10), m.hat2, 0, .008, 0, 1, 1, 1, hat);
    add(box, m.hat2, 0, 0, .29, .34, .03, .17, hat);                                                            // 챙
    add(box, m.hat2, 0, .2, 0, .06, .08, .46, hat);                                                             // 정수리 보강대
    add(box, m.white, 0, .1, .283, .09, .06, .02, hat);
    // 날개: 길고 납작하게, 평소엔 몸 옆에 늘어뜨린다
    const wing = (s, a) => {
      const sh = new THREE.Group(); sh.position.set(s * .37, 1.3, -.02); g.add(sh);
      sh.rotation.order = 'ZXY'; sh.rotation.z = s * a[0]; sh.rotation.x = -a[1];
      add(oct, m.navy, s * .03, -.4, 0, .06, .44, .15, sh).rotation.y = s * .95;
      add(oct, m.white, s * .008, -.41, .014, .045, .36, .11, sh).rotation.y = s * .95;                          // 날개 안쪽 흰 면
    };
    wing(-1, P.L); wing(1, P.R);
    if (P.stick) {                                                                                            // 발표봉: 오른쪽 날개 끝에 쥐고 있다
      const sh = g.children[g.children.length - 1];
      add(box, M(0x8b6a4c), .04, -1.16, .02, .035, .86, .035, sh); add(box, M(0xe5483f), .04, -1.62, .02, .05, .1, .05, sh);
    }
    g.rotation.order = 'YXZ'; g.rotation.y = P.yaw || 0; g.rotation.z = P.tilt || 0; g.rotation.x = P.lean || 0; g.position.y = P.hop || 0;
    return g;
  }

  /* 알파가 있는 그림 둘레에 흰 테두리와 얕은 그림자를 둘러 "오려 낸 사진"으로 만든다 */
  function sticker(src) {
    const w = src.width, h = src.height, mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const mc = mask.getContext('2d'); mc.drawImage(src, 0, 0); mc.globalCompositeOperation = 'source-in'; mc.fillStyle = '#fff'; mc.fillRect(0, 0, w, h);
    const cut = document.createElement('canvas'); cut.width = w; cut.height = h; const cc = cut.getContext('2d');
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; cc.drawImage(mask, Math.cos(a) * EDGE, Math.sin(a) * EDGE); }
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; cc.drawImage(mask, Math.cos(a) * EDGE * .5, Math.sin(a) * EDGE * .5); }
    cc.drawImage(src, 0, 0);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const oc = out.getContext('2d');
    oc.shadowColor = 'rgba(20,22,30,.38)'; oc.shadowBlur = 14; oc.shadowOffsetY = 7; oc.drawImage(cut, 0, 0);
    return out.toDataURL('image/png');
  }

  function make() {
    const THREE = root.THREE; if (!THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return null; }
    renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb9b2a2, .62));
    const sun = new THREE.DirectionalLight(0xfff1d6, .6); sun.position.set(-2.5, 4, 5); scene.add(sun);
    const camera = new THREE.PerspectiveCamera(24, 1, .1, 50); camera.position.set(.4, 1.9, 6.6); camera.lookAt(0, 1.08, 0);
    const res = {}, copy = document.createElement('canvas'); copy.width = SIZE; copy.height = SIZE; const cx = copy.getContext('2d');
    try {
      for (const name in POSES) {
        const g = build(THREE, POSES[name]); scene.add(g);
        renderer.render(scene, camera);
        cx.clearRect(0, 0, SIZE, SIZE); cx.drawImage(renderer.domElement, 0, 0);
        res[name] = sticker(copy);
        scene.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      }
    } catch (e) { return null; }
    finally { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); }
    return res;
  }

  root.FlowPenguin = { make, POSES };
})(window);
