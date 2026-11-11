/* FLOW LAB — 로우폴리 3D 뷰 (시뮬레이션 실행 중 화면)
 * 설계는 2D 도면에서, 실행은 3D 디오라마에서.  three.js(vendor/three.min.js) 사용.
 * WebGL 을 쓸 수 없으면 create() 가 null 을 돌려주고 게임은 2D 로 계속 동작한다. */
(function (root) {
  'use strict';
  const F = root.FlowSim, W = F.W, H = F.H, DX = F.DX, DY = F.DY;
  const DECK = 0.5, TUN = -0.35;
  const CARCOL = { normal: 0x4d9bff, speeder: 0xff4d5e, novice: 0xffd23f, bus: 0x2fd39a };
  const TERMCOL = { home: 0x5aa9ff, factory: 0xb58bff, office: 0xffa63d, port: 0x36d6c0 };

  function create(wrap) {
    const THREE = root.THREE;
    if (!THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    const canvas = renderer.domElement; canvas.id = 'map3d';
    wrap.insertBefore(canvas, wrap.firstChild);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc9e3e6, 22, 46);
    const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7f6a, 0.66));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.9);
    sun.position.set(W / 2 - 7, 14, H / 2 - 5); sun.target.position.set(W / 2, 0, H / 2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);

    const M = (color, opt) => new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opt || {}));
    // 배경(지형·나무·물)용 재질: 설계 모드에서는 흑백, 실행하면 컬러로 서서히 바뀐다
    const decor = [];
    const D = (color, opt) => {
      const m = M(color, opt), c = new THREE.Color(color), l = .3 * c.r + .59 * c.g + .11 * c.b;
      decor.push({ m, c, g: new THREE.Color(l * .5 + .2, l * .5 + .2, l * .5 + .225) }); return m;
    };
    const mats = {
      soil: D(0x9a7350, { side: THREE.DoubleSide }), water: D(0x4f93c9, { transparent: true, opacity: 0.94 }),
      rock: D(0x8f958f), rock2: D(0x767c78), snow: D(0xf4f7fb), trunk: D(0x8a5a3a), leaf: D(0x4f9f5a), leaf2: D(0x3f8a55), leaf3: D(0x69b565),
      grassA: D(0x74b45e), grassB: D(0x7dbd66), rockBg: D(0xcfc9a8), parkBg: D(0x74b360), sheep: D(0xf3f1ea),
      dark: M(0x2b2f3a), glass: M(0x1d2433), white: M(0xf3f1ea), pole: M(0x5b6170), beam: M(0xf2b233), beam2: M(0xd9544a),
      deck: M(0x4b4f5e), orange: M(0xff8a2a), yellow: M(0xffd23f), concrete: M(0xc9c4b6), wall: M(0xe8dfcf), roofR: M(0xd9604a), roofB: M(0x4a7fd9),
      metal: M(0x9aa3b5), red: M(0xe0453f)
    };
    const G = {
      box: new THREE.BoxGeometry(1, 1, 1), cone5: new THREE.ConeGeometry(1, 1, 5), cone6: new THREE.ConeGeometry(1, 1, 6), cone4: new THREE.ConeGeometry(1, 1, 4),
      cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl10: new THREE.CylinderGeometry(1, 1, 1, 10), ico: new THREE.IcosahedronGeometry(1, 0), plane: new THREE.PlaneGeometry(1, 1)
    };
    G.plane.rotateX(-Math.PI / 2);

    let world = null, tex = null, water = null, waterBase = null, hoverMesh = null;
    let heat = [], signals = [], peds = [], camSweeps = [];
    const cars = new Map(), fx = new Map();
    let tilesRef = null, graphRef = null;
    const VIEWS = { top: { yaw: 0, pitch: 1.5, tz: H / 2 + .25 }, iso: { yaw: -0.24, pitch: 0.9, tz: H / 2 + 0.75 } };
    const cam = { yaw: -0.24, pitch: 0.9, dist: 18.5, tx: W / 2, tz: H / 2 + 0.35, touched: false, mode: 'iso' };
    const tgt = { yaw: -0.24, pitch: 0.9, dist: 18.5, tz: H / 2 + 0.35 };
    let vw = 1, vh = 1, amt = 1, tAmt = 1, lastNow = 0, hover = null;
    function fitDist(mode) { const a = vw / vh; return mode === 'top' ? Math.max(20.5, 26 / a) : Math.max(20, 27 / a); }
    function setView(mode, instant) {
      cam.mode = mode; cam.touched = false;
      const v = VIEWS[mode]; tgt.yaw = v.yaw; tgt.pitch = v.pitch; tgt.tz = v.tz; tgt.dist = fitDist(mode);
      tAmt = mode === 'top' ? 0 : 1;
      if (instant) { cam.yaw = tgt.yaw; cam.pitch = tgt.pitch; cam.tz = tgt.tz; cam.dist = tgt.dist; amt = tAmt; }
    }

    function mesh(geo, mat, x, y, z, sx, sy, sz, parent, shadow) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.scale.set(sx, sy, sz);
      if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
      (parent || world).add(m); return m;
    }
    const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    function nodeH(n) { const l = n % 3; return l === 1 ? DECK : l === 2 ? TUN : 0; }
    function carH(sim, c) {
      const a = nodeH(c.path[c.i]), b = nodeH(c.path[c.i + 1]);
      if (a === b) return a;
      const u = c.s * c.s * (3 - 2 * c.s); return a + (b - a) * u;
    }

    function tree(x, z, s, parent) {
      const k = hash(x * 13 + z * 7);
      mesh(G.cyl6, mats.trunk, x, .09 * s, z, .035 * s, .18 * s, .035 * s, parent);
      const lm = k < .33 ? mats.leaf : k < .66 ? mats.leaf2 : mats.leaf3;
      mesh(G.cone6, lm, x, .32 * s, z, .17 * s, .36 * s, .17 * s, parent);
      mesh(G.cone6, lm, x, .5 * s, z, .12 * s, .3 * s, .12 * s, parent);
    }
    function label(text, color, x, y, z) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(12,18,40,.9)'; g.beginPath(); g.roundRect ? g.roundRect(8, 8, 112, 48, 14) : g.rect(8, 8, 112, 48); g.fill();
      g.strokeStyle = color; g.lineWidth = 5; g.stroke();
      g.fillStyle = color; g.font = '800 34px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 34);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
      sp.position.set(x, y, z); sp.scale.set(.8, .4, 1); sp.renderOrder = 10; world.add(sp);
    }
    function building(t, x, z) {
      const kind = t.term.kind, col = TERMCOL[kind], cm = M(col);
      const cx = x + .5, cz = z + .5;
      if (kind === 'home') {
        [[-.2, -.18, .3], [.2, .16, .34], [-.2, .22, .24]].forEach((p, k) => {
          mesh(G.box, mats.wall, cx + p[0], p[2] / 2, cz + p[1], .3, p[2], .3);
          const r = mesh(G.cone4, k === 1 ? mats.roofB : mats.roofR, cx + p[0], p[2] + .1, cz + p[1], .27, .2, .27); r.rotation.y = Math.PI / 4;
        });
        tree(cx + .26, cz - .26, .7);
      } else if (kind === 'factory') {
        mesh(G.box, mats.concrete, cx, .16, cz, .76, .32, .6);
        for (let k = 0; k < 3; k++) { const r = mesh(G.box, cm, cx - .25 + k * .25, .36, cz, .25, .1, .6); r.rotation.z = .35; }
        mesh(G.cyl6, mats.roofR, cx + .28, .45, cz - .2, .06, .9, .06); mesh(G.cyl6, mats.white, cx + .28, .82, cz - .2, .065, .08, .065);
        mesh(G.cyl6, mats.roofR, cx + .12, .38, cz - .2, .05, .7, .05);
      } else if (kind === 'office') {
        mesh(G.box, cm, cx - .12, .55, cz - .05, .38, 1.1, .38);
        mesh(G.box, mats.glass, cx - .12, .55, cz - .05, .4, .9, .3);
        mesh(G.box, mats.wall, cx + .22, .32, cz + .12, .3, .64, .34);
        mesh(G.box, mats.glass, cx + .22, .34, cz + .12, .32, .44, .26);
        mesh(G.box, mats.white, cx - .12, 1.13, cz - .05, .2, .06, .2);
      } else {
        mesh(G.box, mats.concrete, cx, .04, cz, .84, .08, .84);
        const cc = [0xe0453f, 0x4a7fd9, 0xffd23f, 0x2fd39a, 0xff8a2a];
        for (let k = 0; k < 5; k++) mesh(G.box, M(cc[k]), cx - .22 + (k % 2) * .22, .15 + Math.floor(k / 2) * .14, cz + .18 - (k % 3) * .04, .2, .13, .34);
        mesh(G.box, cm, cx + .27, .4, cz - .2, .06, .8, .06); mesh(G.box, cm, cx + .1, .78, cz - .2, .5, .05, .06);
        mesh(G.box, mats.dark, cx - .08, .68, cz - .2, .02, .16, .02);
      }
      label(t.term.id, '#' + col.toString(16).padStart(6, '0'), cx, kind === 'office' ? 1.5 : 1.05, cz);
    }
    function beam(x1, y1, z1, x2, y2, z2, th, mat) {
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = Math.hypot(dx, dy, dz);
      const m = mesh(G.box, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, len, th, th);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
      return m;
    }
    /* 다리 상판 한 구간: (x1,y1,z1)→(x2,y2,z2), 폭 wd, 트러스 포함 */
    function deckSpan(x1, y1, z1, x2, y2, z2, wd) {
      const dx = x2 - x1, dz = z2 - z1, hl = Math.hypot(dx, dz), px = -dz / hl * wd / 2, pz = dx / hl * wd / 2;
      const d = beam(x1, y1 - .035, z1, x2, y2 - .035, z2, .05, mats.deck); d.scale.z = wd;
      for (const sgn of [-1, 1]) {
        const ox = px * sgn, oz = pz * sgn;
        beam(x1 + ox, y1 + .16, z1 + oz, x2 + ox, y2 + .16, z2 + oz, .028, mats.beam);
        beam(x1 + ox, y1, z1 + oz, x2 + ox, y2, z2 + oz, .03, mats.beam);
        const n = 2;
        for (let k = 0; k < n; k++) {
          const a = k / n, b = (k + .5) / n, c2 = (k + 1) / n, L = (u, h) => [x1 + dx * u + ox, y1 + (y2 - y1) * u + h, z1 + dz * u + oz];
          const A = L(a, 0), B = L(b, .16), C2 = L(c2, 0);
          beam(A[0], A[1], A[2], B[0], B[1], B[2], .022, mats.beam); beam(B[0], B[1], B[2], C2[0], C2[1], C2[2], .022, mats.beam);
        }
      }
    }

    function build(tiles, graph, opt) {
      tilesRef = tiles; graphRef = graph; hover = null;
      if (world) { scene.remove(world); world.traverse(o => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); if (o.material && o.material.map && o.material.map !== tex) { o.material.map.dispose(); } }); }
      world = new THREE.Group(); scene.add(world);
      heat = []; signals = []; peds = []; camSweeps = [];
      cars.clear(); fx.clear();

      // 지면 텍스처: 2D 렌더러로 도로·노면 표시를 그려 그대로 입힌다
      const TP = 128, tc = document.createElement('canvas'); tc.width = W * TP; tc.height = H * TP;
      root.FlowRender.draw(tc.getContext('2d'), { TS: TP, tiles, graph, sim: null, mode: opt && opt.edit ? 'edit' : 'tex', theme: 'poly', groundOnly: true, now: 0 });
      if (tex) tex.dispose();
      tex = new THREE.CanvasTexture(tc); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const quads = { grassA: [], grassB: [], rockBg: [], parkBg: [] }, side = [];
      const isLand = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tiles[y * W + x].base !== 'water';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = tiles[y * W + x];
        if (t.base === 'water') continue;
        quads[t.base === 'rock' ? 'rockBg' : t.base === 'park' ? 'parkBg' : (x + y) % 2 ? 'grassA' : 'grassB'].push(x, 0, y, x, 0, y + 1, x + 1, 0, y + 1, x, 0, y, x + 1, 0, y + 1, x + 1, 0, y);
        for (let d = 0; d < 4; d++) {
          if (isLand(x + DX[d], y + DY[d])) continue;
          const c = [[x, y, x + 1, y], [x + 1, y, x + 1, y + 1], [x + 1, y + 1, x, y + 1], [x, y + 1, x, y]][d], b = -.6;
          side.push(c[0], 0, c[1], c[2], 0, c[3], c[2], b, c[3], c[0], 0, c[1], c[2], b, c[3], c[0], b, c[1]);
        }
      }
      for (const k in quads) {
        if (!quads[k].length) continue;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(quads[k], 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, mats[k]); m.receiveShadow = true; world.add(m);
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute(side, 3)); g2.computeVertexNormals();
      world.add(new THREE.Mesh(g2, mats.soil));
      // 도로·노면 표시 레이어(투명 배경 텍스처)
      const rg = new THREE.PlaneGeometry(W, H); rg.rotateX(-Math.PI / 2);
      const roads = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false }));
      roads.position.set(W / 2, .006, H / 2); roads.receiveShadow = true; roads.renderOrder = 1; world.add(roads);
      // 선택 타일 표시
      hoverMesh = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x3ef0ff, transparent: true, opacity: .35, depthWrite: false }));
      hoverMesh.position.y = .03; hoverMesh.visible = false; hoverMesh.renderOrder = 5; world.add(hoverMesh);

      // 물: 삼각형 면이 살아 있는 로우폴리 수면
      const wg = new THREE.PlaneGeometry(W + 7, H + 7, 22, 18).toNonIndexed(); wg.rotateX(-Math.PI / 2);
      water = new THREE.Mesh(wg, mats.water); water.position.set(W / 2, -.24, H / 2); water.receiveShadow = true; world.add(water);
      waterBase = Float32Array.from(wg.attributes.position.array);

      const arms = i => { const a = [false, false, false, false]; for (const b of graph.nbr[i * 3]) { const bi = (b / 3) | 0, dx = bi % W - i % W, dy = ((bi / W) | 0) - ((i / W) | 0); a[dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0] = true; } return a; };

      for (let i = 0; i < W * H; i++) {
        const t = tiles[i], x = i % W, z = (i / W) | 0, cx = x + .5, cz = z + .5;
        if (t.base === 'rock') {
          [[.34, .4, .34, .62], [.68, .56, .27, .46], [.3, .76, .2, .3]].forEach((p, k) => {
            const m = mesh(G.cone5, k ? mats.rock2 : mats.rock, x + p[0], p[3] / 2, z + p[1], p[2], p[3], p[2]); m.rotation.y = hash(i + k) * 3;
            if (k < 2) { const s = mesh(G.cone5, mats.snow, x + p[0], p[3] * .82, z + p[1], p[2] * .36, p[3] * .36, p[2] * .36); s.rotation.y = m.rotation.y; }
          });
        } else if (t.base === 'park') {
          tree(x + .28, z + .3, 1); tree(x + .7, z + .36, 1.2); tree(x + .42, z + .72, 1.05); tree(x + .78, z + .78, .8);
        } else if (t.base === 'grass' && !t.road && !t.term && !t.bridge && !t.tunnel) {
          const k = hash(i * 3.3);
          if (k < .22) tree(x + .3 + hash(i) * .4, z + .3 + hash(i + 9) * .4, .8 + hash(i + 4) * .4);
          else if (k < .3) { const r = mesh(G.ico, mats.rock, x + .5, .05, z + .55, .12, .08, .1); r.rotation.y = k * 20; }
          else if (k < .36) { mesh(G.ico, mats.sheep, x + .4, .07, z + .5, .08, .06, .06); mesh(G.box, mats.dark, x + .47, .08, z + .5, .04, .04, .04); }   // 양
        }
        if (t.term) building(t, x, z);
        const a = arms(i), vert = (a[0] || a[2]) && !(a[1] || a[3]);

        if (t.road) {
          const hp = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x36f1a0, transparent: true, opacity: 0, depthWrite: false }));
          hp.position.set(cx, .012, cz); hp.scale.set(.8, 1, .8); hp.renderOrder = 2; world.add(hp); heat.push({ m: hp, i });
          if (t.base === 'water') {                                   // 기존 교량: 교각·난간
            mesh(G.box, mats.concrete, cx, -.32, cz, .16, .6, .5);
            for (const s of [-1, 1]) { beam(x, .09, cz + s * .33, x + 1, .09, cz + s * .33, .03, mats.red); beam(x, 0, cz + s * .33, x + .5, .09, cz + s * .33, .02, mats.red); beam(x + .5, .09, cz + s * .33, x + 1, 0, cz + s * .33, .02, mats.red); }
          }
          if (t.round) { mesh(G.cyl10, mats.leaf3, cx, .03, cz, .13, .06, .13); tree(cx, cz, .55); }
          if (t.bump) { const b = mesh(G.box, mats.yellow, cx + (graph.ctrl[i * 3] ? .36 : 0), .015, cz, .1, .035, .54); if (vert) { b.rotation.y = Math.PI / 2; b.position.set(cx, .015, cz); } }
          if (t.barricade) {
            const grp = new THREE.Group(); grp.position.set(cx, 0, cz); if (!vert) grp.rotation.y = Math.PI / 2; world.add(grp);
            for (const s of [-.1, .1]) { mesh(G.box, mats.orange, 0, .13, s, .66, .07, .03, grp); mesh(G.box, mats.white, -.16, .13, s, .1, .072, .032, grp); mesh(G.box, mats.white, .16, .13, s, .1, .072, .032, grp); mesh(G.box, mats.pole, -.3, .07, s, .03, .14, .03, grp); mesh(G.box, mats.pole, .3, .07, s, .03, .14, .03, grp); }
            mesh(G.cone6, mats.orange, -.2, .07, .25, .05, .14, .05, grp); mesh(G.cone6, mats.orange, .2, .07, -.25, .05, .14, .05, grp);
          }
          if (t.signal && graph.ctrl[i * 3]) for (let d = 0; d < 4; d++) if (a[d]) {
            const px = cx + DX[d] * .36 + DY[d] * .36, pz = cz + DY[d] * .36 - DX[d] * .36;
            mesh(G.box, mats.pole, px, .26, pz, .03, .52, .03);
            mesh(G.box, mats.dark, px, .5, pz, .08, .16, .08);
            const lm = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
            const l = mesh(G.ico, lm, px - DX[d] * .0, .5, pz, .045, .045, .045, world, false); signals.push({ m: lm, node: i * 3, d });
            void l;
          }
          if (t.camera) {
            mesh(G.box, mats.pole, cx + .36, .3, cz - .36, .03, .6, .03); mesh(G.box, mats.pole, cx + .25, .6, cz - .36, .24, .03, .03);
            mesh(G.box, mats.white, cx + .16, .56, cz - .36, .12, .08, .08); mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xff3b3b }), cx + .16, .5, cz - .36, .025, .025, .025, world, false);
            const ring = new THREE.Mesh(new THREE.RingGeometry(F.CAM_RADIUS - .04, F.CAM_RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2; ring.position.set(cx, .02, cz); world.add(ring);
            const disc = new THREE.Mesh(new THREE.CircleGeometry(F.CAM_RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .07, depthWrite: false }));
            disc.rotation.x = -Math.PI / 2; disc.position.set(cx, .018, cz); world.add(disc);
            const sw = new THREE.Mesh(new THREE.CircleGeometry(F.CAM_RADIUS, 12, 0, .55), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
            sw.rotation.x = -Math.PI / 2; sw.position.set(cx, .022, cz); world.add(sw); camSweeps.push(sw);
          }
          if (t.crosswalk) {
            const grp = new THREE.Group(); grp.position.set(cx, 0, cz); if (a[0] || a[2]) { /* 도로가 세로 → 보행자는 가로로 이동 */ } else grp.rotation.y = Math.PI / 2; world.add(grp);
            if (t.overpass) {
              mesh(G.box, mats.metal, 0, .42, 0, .96, .04, .2, grp);
              for (const s of [-1, 1]) { mesh(G.box, mats.concrete, s * .42, .2, 0, .06, .4, .16, grp); const st = mesh(G.box, mats.metal, s * .47, .21, s * .22, .1, .04, .5, grp); st.rotation.x = -s * .95; mesh(G.box, mats.beam, 0, .5, s * .1, .96, .02, .015, grp); }
            }
            for (let k = 0; k < 3; k++) {
              const p = new THREE.Group(); grp.add(p);
              mesh(G.box, M([0xff5fa2, 0x3ec7ff, 0xffd23f][k]), 0, .06, 0, .045, .09, .035, p); mesh(G.ico, mats.wall, 0, .13, 0, .028, .028, .028, p);
              p.visible = !!t.overpass; peds.push({ g: p, idx: i, k, over: t.overpass });
            }
          }
        }
        // 고가 다리
        if (t.bridge) {
          const n = i * 3 + 1, d2 = t.bridge === 'H' ? [1, 3] : [0, 2];
          for (const d of d2) {
            const nx = x + DX[d], nz = z + DY[d]; let nb = -1;
            for (const b of graph.nbr[n]) if (((b / 3) | 0) === nz * W + nx) nb = b;
            if (nb >= 0 && nb % 3 === 1) deckSpan(cx, DECK, cz, cx + DX[d] * .5, DECK, cz + DY[d] * .5, .6);
            else if (nb >= 0) deckSpan(cx, DECK, cz, cx + DX[d], nodeH(nb), cz + DY[d], .6);
            else deckSpan(cx, DECK, cz, cx + DX[d] * .5, DECK, cz + DY[d] * .5, .6);
          }
          const px = t.bridge === 'H' ? 0 : .38, pz = t.bridge === 'H' ? .38 : 0;
          if (t.road) { mesh(G.box, mats.concrete, cx + px, DECK / 2 - .04, cz + pz, .07, DECK, .07); mesh(G.box, mats.concrete, cx - px, DECK / 2 - .04, cz - pz, .07, DECK, .07); }
          else mesh(G.box, mats.concrete, cx, (DECK - .6) / 2 - .04, cz, .14, DECK + .6, .14);
        }
        // 지하차도: 입구 아치
        if (t.tunnel) {
          const n = i * 3 + 2, d2 = t.tunnel === 'H' ? [1, 3] : [0, 2];
          for (const d of d2) {
            const nx = x + DX[d], nz = z + DY[d]; let nb = -1;
            for (const b of graph.nbr[n]) if (((b / 3) | 0) === nz * W + nx) nb = b;
            if (nb < 0 || nb % 3 === 2) continue;
            const ex = cx + DX[d] * .5, ez = cz + DY[d] * .5;
            const grp = new THREE.Group(); grp.position.set(ex, 0, ez); grp.rotation.y = d % 2 ? 0 : Math.PI / 2; world.add(grp);
            mesh(G.box, mats.concrete, 0, .3, 0, .12, .1, .8, grp); mesh(G.box, mats.concrete, 0, .14, .36, .12, .3, .08, grp); mesh(G.box, mats.concrete, 0, .14, -.36, .12, .3, .08, grp);
            mesh(G.box, mats.glass, 0, .13, 0, .1, .25, .64, grp); mesh(G.box, mats.orange, 0, .33, 0, .13, .03, .5, grp);
            const hole = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x15171f, transparent: true, opacity: .75, depthWrite: false }));
            hole.position.set(ex + DX[d] * .25, .014, ez + DY[d] * .25); hole.scale.set(d % 2 ? .5 : .56, 1, d % 2 ? .56 : .5); world.add(hole);
          }
        }
      }
    }

    function carMesh(c) {
      const g = new THREE.Group(), col = CARCOL[c.type], bm = M(col), L = c.len;
      if (c.type === 'bus') {
        mesh(G.box, bm, 0, .1, 0, L, .13, .15, g); mesh(G.box, mats.glass, 0, .125, 0, L * .9, .045, .155, g); mesh(G.box, mats.white, 0, .17, 0, L * .96, .02, .14, g);
      } else {
        mesh(G.box, bm, 0, .065, 0, L, .06, .125, g);
        const cab = c.type === 'speeder' ? .045 : .06;
        mesh(G.box, mats.glass, -.015, .095 + cab / 2, 0, L * .5, cab, .11, g); mesh(G.box, bm, -.015, .1 + cab, 0, L * .46, .012, .105, g);
        if (c.type === 'speeder') { mesh(G.box, mats.dark, -L / 2 + .02, .12, 0, .03, .012, .13, g); }
        if (c.type === 'novice') mesh(G.box, M(0x7bd651), -.02, .175, 0, .05, .02, .05, g);
        mesh(G.box, mats.wall, L / 2 - .005, .07, .04, .012, .02, .03, g); mesh(G.box, mats.wall, L / 2 - .005, .07, -.04, .012, .02, .03, g);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.cyl6, mats.dark, sx * L * .3, .03, sz * (c.type === 'bus' ? .075 : .063), .03, .02, .03, g).rotation.x = Math.PI / 2;
      g.userData.body = bm; world.add(g); return g;
    }
    function boom() {
      const g = new THREE.Group();
      const core = new THREE.Mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xff9a2a })); g.add(core);
      const inner = new THREE.Mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xffe36b })); inner.scale.setScalar(.55); g.add(inner);
      g.userData.smoke = [];
      for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(G.ico, new THREE.MeshLambertMaterial({ color: 0x55575f, flatShading: true, transparent: true })); g.add(s); g.userData.smoke.push(s); }
      g.userData.core = core; g.userData.inner = inner; world.add(g); return g;
    }

    const cA = new THREE.Color(), sunDay = new THREE.Color(0xfff1d6), sunEve = new THREE.Color(0xffb27a);
    function applyCam(now) {
      const dt = Math.min(.1, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
      const k = 1 - Math.exp(-dt * 4.5);
      cam.yaw += (tgt.yaw - cam.yaw) * k; cam.pitch += (tgt.pitch - cam.pitch) * k; cam.dist += (tgt.dist - cam.dist) * k; cam.tz += (tgt.tz - cam.tz) * k;
      if (Math.abs(tAmt - amt) > .002) { amt += (tAmt - amt) * Math.min(1, dt * 3.2); for (const d of decor) d.m.color.copy(cA.copy(d.g).lerp(d.c, amt)); }
      const yaw = cam.yaw + ((cam.touched || cam.mode === 'top') ? 0 : Math.sin(now * 0.00012) * 0.07 * amt);
      const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      camera.position.set(cam.tx + Math.sin(yaw) * cp * cam.dist, sp * cam.dist, cam.tz + Math.cos(yaw) * cp * cam.dist);
      camera.lookAt(cam.tx, 0, cam.tz);
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    }

    function update(sim, now) {
      if (!world) return;
      const t = now / 1000;
      // 수면 출렁임
      const p = water.geometry.attributes.position.array;
      for (let k = 0; k < p.length; k += 3) p[k + 1] = Math.sin(waterBase[k] * 1.9 + waterBase[k + 2] * .7 + t * 1.3) * .07 + Math.cos(waterBase[k + 2] * 2.3 - waterBase[k] * .5 + t * 1.1) * .07;
      water.geometry.attributes.position.needsUpdate = true; water.geometry.computeVertexNormals();

      if (sim) {
        // 차량
        const seen = new Set();
        for (const c of sim.cars) {
          seen.add(c.id);
          let m = cars.get(c.id); if (!m) cars.set(c.id, m = carMesh(c));
          const h = carH(sim, c), a = nodeH(c.path[c.i]), b = nodeH(c.path[c.i + 1]);
          m.position.set(c.x, h, c.y);
          m.rotation.set(c.crashed ? .25 : 0, -c.ang + (c.crashed ? (c.id % 2 ? .6 : -.5) : 0), a === b ? 0 : Math.atan((b - a) * 1.5 * (1 - Math.abs(2 * c.s - 1))));
          m.visible = h > -.3;
          if (c.crashed && !m.userData.dead) { m.userData.dead = true; m.userData.body.color.multiplyScalar(.45); }
        }
        for (const [id, m] of cars) if (!seen.has(id)) { world.remove(m); cars.delete(id); }
        // 혼잡도 히트맵 · 사고 차단 타일
        for (const hp of heat) {
          const blocked = sim.blockedUntil[hp.i * 3] > sim.t, h = sim.heat[hp.i] / 2.6;
          if (blocked) { hp.m.material.color.setHex(0xff2846); hp.m.material.opacity = .45 + .15 * Math.sin(t * 8); hp.m.scale.set(1, 1, 1); }
          else if (h > .05) { hp.m.material.color.set(root.FlowRender.heatColor(h, 1).replace('rgba', 'rgb').replace(/,1\)$/, ')')); hp.m.material.opacity = Math.min(.55, .15 + .4 * h); hp.m.scale.set(.8, 1, .8); }
          else hp.m.material.opacity = 0;
        }
        for (const s of signals) { const sg = sim.sig[s.node]; const green = sg && (s.d % 2) === sg.axis && sim.t >= sg.clearUntil; s.m.color.setHex(green ? 0x3dff8f : 0xff3b3b); }
        for (const pd of peds) {
          const active = pd.over || sim.cwActive(pd.idx);
          pd.g.visible = active;
          if (!active) continue;
          const ph = pd.over ? (t * .22 + pd.k * .37) % 1 : (((sim.t + (pd.idx * 3.7) % 13) % 13) / 4 * (0.9 + pd.k * .12) + pd.k * .22) % 1;
          const u = pd.k % 2 ? 1 - ph : ph;
          pd.g.position.set(-.42 + u * .84, pd.over ? .44 : 0, -.06 + pd.k * .06);
        }
        // 사고 이펙트
        sim.crashes.forEach((cr, k) => {
          const age = sim.t - cr.t; let g = fx.get(k);
          if (age > 10.5) { if (g) { world.remove(g); fx.delete(k); } return; }
          if (!g) fx.set(k, g = boom());
          g.position.set(cr.x, .16, cr.y);
          const R = (age < .5 ? .15 + age * .5 : .3 + Math.sin(t * 10) * .03) * (age > 9.5 ? (10.5 - age) : 1);
          g.userData.core.scale.setScalar(R); g.userData.core.rotation.set(t * 2, t * 3, 0);
          g.userData.inner.scale.setScalar(R * .6); g.userData.inner.rotation.set(-t * 3, t, 0);
          g.userData.smoke.forEach((s, j) => { const u = (t * .45 + j * .25) % 1; s.position.set(Math.sin(j * 2.1) * .1 + u * .15, .1 + u * .9, Math.cos(j * 1.7) * .1); s.scale.setScalar(.08 + u * .16); s.material.opacity = .75 * (1 - u); });
        });
        for (const [k, g] of fx) if (k >= sim.crashes.length) { world.remove(g); fx.delete(k); }
      }
      else for (const hp of heat) hp.m.material.opacity = 0;
      // 퇴근 시간대에는 노을빛
      const eve = sim ? Math.max(0, Math.min(1, (sim.t - F.PM_START + 6) / 12)) : 0;
      sun.color.copy(sunDay).lerp(sunEve, eve);
      if (hoverMesh) { hoverMesh.visible = !!hover; if (hover) { hoverMesh.position.set(hover.x + .5, .03, hover.y + .5); hoverMesh.material.color.setHex(hover.ok ? 0x3ef0ff : 0xff4d6d); } }
      camSweeps.forEach((sw, k) => { sw.rotation.z = t * 1.4 + k; });
      applyCam(now);
      renderer.render(scene, camera);
    }

    const v3 = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    return {
      canvas, build, update, nodeH, carH, setView,
      get colorAmt() { return amt; },
      resize(w, h, dpr) { vw = w; vh = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); if (!cam.touched) tgt.dist = fitDist(cam.mode); },
      project(x, y, h) { v3.set(x, h || 0, y).project(camera); return [(v3.x + 1) / 2 * vw, (1 - v3.y) / 2 * vh]; },
      /* 화면 좌표 → 지면 좌표(타일 단위) */
      pick(px, py) { ndc.set(px / vw * 2 - 1, 1 - py / vh * 2); ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(plane, v3) ? [v3.x, v3.z] : null; },
      setHover(h) { hover = h; },
      orbit(dx, dy) { if (cam.mode !== 'iso') return; cam.touched = true; tgt.yaw -= dx * 0.006; tgt.pitch = Math.max(0.35, Math.min(1.45, tgt.pitch + dy * 0.005)); },
      zoom(f) { cam.touched = true; tgt.dist = Math.max(8, Math.min(36, tgt.dist * f)); },
      show(on) { canvas.style.display = on ? 'block' : 'none'; }
    };
  }
  root.FlowView3D = { create };
})(window);
