/* FLOW LAB — 로우폴리 3D 뷰 (시뮬레이션 실행 중 화면)
 * 설계는 2D 도면에서, 실행은 3D 디오라마에서.  three.js(vendor/three.min.js) 사용.
 * WebGL 을 쓸 수 없으면 create() 가 null 을 돌려주고 게임은 2D 로 계속 동작한다. */
(function (root) {
  'use strict';
  const F = root.FlowSim, W = F.W, H = F.H, DX = F.DX, DY = F.DY;
  const DECK = 0.5, TUN = -0.35;
  const CARCOL = { normal: 0x4a86d9, speeder: 0xe5483f, novice: 0xffc928, bus: 0x1f9d6b };
  const NORMAL_VARIANTS = [0x4a86d9, 0xf6f3ea, 0x3fa7b5, 0x7c8296, 0x5b6fc7];
  const TERMCOL = { home: 0x4a86d9, factory: 0x8a6fd1, office: 0xf2a93b, port: 0x2fa89a };

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
    scene.fog = new THREE.Fog(0xcfe3e4, 30, 74);
    const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb9b2a2, 0.58));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.62);
    sun.position.set(W / 2 - 7, 14, H / 2 + 7.5); sun.target.position.set(W / 2, 0, H / 2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);

    const M = (color, opt) => new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opt || {}));
    // 배경(지형·나무·물·격자 밖 동네)용 재질: 설계 모드에서는 흑백, 실행하면 컬러로 서서히 바뀐다
    const decor = [];
    const D = (color, opt, gray) => {
      const m = M(color, opt), c = new THREE.Color(color), l = .3 * c.r + .59 * c.g + .11 * c.b;
      decor.push({ m, c, g: gray !== undefined ? new THREE.Color(gray) : new THREE.Color(l * .5 + .2, l * .5 + .2, l * .5 + .225) }); return m;
    };
    const mats = {
      soil: D(0xa89f8c, { side: THREE.DoubleSide }), soil2: D(0x8d8678, { side: THREE.DoubleSide }), water: D(0x86b6c2, { transparent: true, opacity: 0.96 }, 0x93a6b0),
      rock: D(0x8f958f), rock2: D(0x767c78), snow: D(0xf4f7fb), trunk: D(0x7a5a44),
      leaf: D(0x6f9a5c), leaf2: D(0x5c8a5a), leaf3: D(0x86a862), leaf4: D(0x4f7b58), autumn: D(0xc39a4e), hedge: D(0x4c7350),
      grassA: D(0xa3bf86, {}, 0xcfcdc6), grassB: D(0xa8c38b, {}, 0xc9c7c0), garden: D(0x9cba80, {}, 0xbcbab3), rockBg: D(0xc9c2a8), parkBg: D(0x93b578, {}, 0xb0b3ac), verge: D(0xa9c08e, {}, 0x9d9da0),
      pave: D(0xd9d3c5, {}, 0xb4b2ae), siteBg: D(0xc7a878), gravel: D(0xcdc4ae), bed: D(0x7b6250), stone: D(0xddd6c6), wood: D(0x8b6a4c),
      fl1: D(0xf3ede0), fl2: D(0xe6c453), fl3: D(0xd98a9a), pond: D(0x7fb0c0, {}, 0x93a6b0), duck: D(0xf5f2ea), beak: D(0xe39a3c),
      hill: D(0x9db59a), hill2: D(0xa9bfae), hill3: D(0x8faa94), boatA: D(0x3f6257), boatB: D(0x8e3f3a), boatC: D(0x2f3b55),
      asph: M(0x5a5d68), line: M(0xe9e2cc), iron: M(0x2f5a4e), glow: new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
      dark: M(0x2b2f3a), glass: M(0x1d2433), white: M(0xf3f1ea), pole: M(0x5b6170), beam: M(0xf2b233), beam2: M(0xd9544a),
      deck: M(0x4b4f5e), orange: M(0xff8a2a), yellow: M(0xffd23f), concrete: M(0xc9c4b6), wall: M(0xe8dfcf), roofR: M(0xb5604c), roofB: M(0x55718f),
      metal: M(0x9aa3b5), red: M(0xc8433c), skin: M(0xe8c4a2), skin2: M(0xa8795a)
    };
    const LEAF = [mats.leaf, mats.leaf2, mats.leaf3, mats.leaf4, mats.leaf, mats.leaf2, mats.leaf3, mats.autumn];
    /* 건물 색: 격자 안(항상 컬러)과 격자 밖(설계 중엔 흑백) 두 벌 */
    const palette = K => ({
      wall: [0xf0e7d4, 0xc47f66, 0xe6d6b4, 0xb7c7d1, 0xd6dbc0, 0xeaded0, 0xd49c7a].map(c => K(c)),
      roof: [0x6f7786, 0xb5644d, 0x8c6b57, 0x8d97a3].map(c => K(c)),
      block: [0xe9e0cd, 0xd6ae94, 0xc2ced6, 0xdcd3b9, 0xcdbba8].map(c => K(c)),
      awn: [0xb5524a, 0x3f6f62, 0xd8a941, 0x4f6d94].map(c => K(c)),
      car: [0x8a4a44, 0x4f6d94, 0xe6dfd0, 0x566b5c, 0x3a3f4c].map(c => K(c)),
      win: K(0x56657a), lit: K(0x8aa0b8), door: K(0x5a4638), trim: K(0xf1ece0), brick: K(0x9a5b48), flat: K(0x8b8f96), red: K(0xc8433c)
    });
    const PIN = palette(M), POUT = palette(D);
    const COAT = [0x2f4a6b, 0xc79a3a, 0x8a3b3f, 0x3f6b55, 0xe9e2d0, 0x6b6f7a, 0xd27a5a, 0x4a4f6a].map(c => M(c));
    const HAIR = [0x2b2622, 0x6b4a32, 0xd9b77a, 0xb9b4ac, 0x8a3f2a].map(c => M(c));
    const DOG = [0x8a6240, 0xf1ece0, 0x2b2622, 0xd3a55c, 0x9a9690].map(c => M(c));

    const G = {
      box: new THREE.BoxGeometry(1, 1, 1), cone5: new THREE.ConeGeometry(1, 1, 5), cone6: new THREE.ConeGeometry(1, 1, 6), cone4: new THREE.ConeGeometry(1, 1, 4),
      cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl10: new THREE.CylinderGeometry(1, 1, 1, 10), ico: new THREE.IcosahedronGeometry(1, 0), ico1: new THREE.IcosahedronGeometry(1, 1),
      plane: new THREE.PlaneGeometry(1, 1), prism: new THREE.BufferGeometry()
    };
    G.plane.rotateX(-Math.PI / 2);
    // 박공지붕(용마루가 z 방향인 삼각기둥)
    G.prism.setAttribute('position', new THREE.Float32BufferAttribute([
      -.5, -.5, .5, .5, -.5, .5, 0, .5, .5, .5, -.5, -.5, -.5, -.5, -.5, 0, .5, -.5,
      -.5, -.5, -.5, -.5, -.5, .5, 0, .5, .5, -.5, -.5, -.5, 0, .5, .5, 0, .5, -.5,
      .5, -.5, .5, .5, -.5, -.5, 0, .5, -.5, .5, -.5, .5, 0, .5, -.5, 0, .5, .5], 3));
    G.prism.computeVertexNormals();

    /* 움직이지 않는 것들은 재질별로 한 덩어리로 합쳐 그린다 (그리기 호출 수천 → 수십) */
    const flatPos = geo => geo.userData.flat || (geo.userData.flat = (geo.index ? geo.toNonIndexed() : geo).attributes.position.array);
    function Batch() {
      const map = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), v = new THREE.Vector3();
      const self = {
        add(geo, mat, x, y, z, sx, sy, sz, ry, rx, rz, shadow) {
          const src = flatPos(geo), key = mat.uuid + (shadow === false ? 'n' : 's');
          let b = map.get(key); if (!b) map.set(key, b = { mat, shadow: shadow !== false, arr: [] });
          e.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(e); m4.compose(p.set(x, y, z), q, s.set(sx, sy, sz));
          const arr = b.arr;
          for (let i = 0; i < src.length; i += 3) { v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(m4); arr.push(v.x, v.y, v.z); }
        },
        /* 두 점을 잇는 각재. wd 는 수평 폭(생략하면 정사각 단면) */
        beam(mat, x1, y1, z1, x2, y2, z2, th, wd, shadow) {
          const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, hl = Math.hypot(dx, dz);
          self.add(G.box, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, Math.hypot(hl, dy), th, wd || th, -Math.atan2(dz, dx), 0, Math.atan2(dy, hl), shadow);
        },
        flush(parent) {
          for (const b of map.values()) {
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.arr, 3)); g.computeVertexNormals();
            const m = new THREE.Mesh(g, b.mat); m.castShadow = b.shadow; m.receiveShadow = true; parent.add(m);
          }
          map.clear();
        }
      };
      return self;
    }

    let world = null, env = null, tex = null, hoverMesh = null, amb = [], lastAmb = 0, boats = [];
    let heat = [], signals = [], peds = [], camSweeps = [], walkers = [], envWalkers = [];
    const cars = new Map(), fx = new Map();
    let tilesRef = null, graphRef = null;
    const VIEWS = { top: { yaw: 0, pitch: 1.5, tz: H / 2 + .45 }, iso: { yaw: -0.24, pitch: 0.8, tz: H / 2 + .9 } };
    const cam = { yaw: -0.24, pitch: 0.9, dist: 18.5, tx: W / 2, tz: H / 2 + 0.35, touched: false, mode: 'iso' };
    const tgt = { yaw: -0.24, pitch: 0.9, dist: 18.5, tz: H / 2 + 0.35 };
    let vw = 1, vh = 1, amt = 1, tAmt = 1, lastNow = 0, hover = null;
    function fitDist(mode) { const a = vw / vh; return mode === 'top' ? Math.max(22, 26 / a) : Math.max(20, 27 / a); }
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
    const vnoise = (x, z) => {                                 // 동네 구획용 저주파 노이즈
      const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, h = (a, b) => hash(a * 57.3 + b * 131.7), s = t => t * t * (3 - 2 * t);
      const a = h(xi, zi), b = h(xi + 1, zi), c = h(xi, zi + 1), d = h(xi + 1, zi + 1);
      return a + (b - a) * s(fx) + (c - a) * s(fz) + (a - b - c + d) * s(fx) * s(fz);
    };
    function nodeH(n) { const l = n % 3; return l === 1 ? DECK : l === 2 ? TUN : 0; }
    function carH(sim, c) {
      const a = nodeH(c.path[c.i]), b = nodeH(c.path[c.i + 1]);
      if (a === b) return a;
      const u = c.s * c.s * (3 - 2 * c.s); return a + (b - a) * u;
    }

    /* ---------- 소품 ---------- */
    function tree(b, x, z, s, kind) {
      const k = hash(x * 13.7 + z * 7.3);
      if (kind === undefined) kind = k < .2 ? 1 : 0;
      if (kind === 1) {                                        // 침엽수
        const lm = k < .1 ? mats.leaf4 : mats.leaf2;
        b.add(G.cyl6, mats.trunk, x, .08 * s, z, .03 * s, .16 * s, .03 * s);
        b.add(G.cone6, lm, x, .3 * s, z, .15 * s, .34 * s, .15 * s); b.add(G.cone6, lm, x, .46 * s, z, .105 * s, .28 * s, .105 * s);
      } else {                                                 // 활엽수: 둥근 수관 두 덩이
        const lm = LEAF[Math.floor(hash(x * 3.1 + z * 9.7) * LEAF.length)];
        b.add(G.cyl6, mats.trunk, x, .09 * s, z, .026 * s, .18 * s, .026 * s);
        b.add(G.ico, lm, x, .27 * s, z, .16 * s, .14 * s, .16 * s, k * 6);
        b.add(G.ico, lm, x + (k - .5) * .12 * s, .37 * s, z + .03 * s, .1 * s, .09 * s, .1 * s, k * 11);
      }
    }
    function bush(b, x, z, s) { b.add(G.ico, hash(x + z * 3) < .5 ? mats.hedge : mats.leaf, x, .035 * s, z, .07 * s, .05 * s, .06 * s, x * 5); }
    function hedge(b, x1, z1, x2, z2) { b.add(G.box, mats.hedge, (x1 + x2) / 2, .024, (z1 + z2) / 2, Math.abs(x2 - x1) + .03, .048, Math.abs(z2 - z1) + .03); }
    function lamp(b, x, z) {
      b.add(G.box, mats.iron, x, .11, z, .012, .22, .012); b.add(G.box, mats.iron, x, .226, z, .034, .012, .034);
      b.add(G.box, mats.glow, x, .212, z, .022, .016, .022, 0, 0, 0, false);
    }
    function bench(b, x, z, ry) {
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
      b.add(G.box, mats.wood, x, .032, z, .11, .01, .036, ry); b.add(G.box, mats.wood, x - s * .018, .055, z - c * .018, .11, .03, .008, ry);
      b.add(G.box, mats.iron, x - c * .045, .014, z + s * .045, .008, .028, .03, ry, 0, 0, false); b.add(G.box, mats.iron, x + c * .045, .014, z - s * .045, .008, .028, .03, ry, 0, 0, false);
    }
    function postbox(b, P, x, z) { b.add(G.cyl10, P.red, x, .034, z, .017, .068, .017); b.add(G.cyl10, mats.dark, x, .072, z, .02, .008, .02, 0, 0, 0, false); }
    function phoneBox(b, P, x, z) {
      b.add(G.box, P.red, x, .06, z, .042, .12, .042); b.add(G.box, P.win, x, .068, z, .046, .07, .03, 0, 0, 0, false); b.add(G.box, P.win, x, .068, z, .03, .07, .046, 0, 0, 0, false);
      b.add(G.box, P.red, x, .124, z, .048, .01, .048, 0, 0, 0, false);
    }
    function parked(b, P, x, z, ry, k) {
      const bm = P.car[Math.floor(hash(k) * P.car.length)];
      b.add(G.box, bm, x, .05, z, .2, .05, .1, ry); b.add(G.box, mats.glass, x, .09, z, .1, .04, .09, ry, 0, 0, false); b.add(G.box, mats.dark, x, .018, z, .16, .02, .104, ry, 0, 0, false);
    }
    /* 집 한 채. 문은 +z(남쪽)를 보고, 용마루는 가로로 놓인다 */
    function house(b, P, cx, cz, w, d, h, wi, ri, o) {
      o = o || {};
      const wall = P.wall[wi % P.wall.length], roof = P.roof[ri % P.roof.length], rh = d * .52;
      b.add(G.box, wall, cx, h / 2, cz, w, h, d);
      b.add(G.prism, wall, cx, h + rh * .46, cz, d, rh * .92, w + .006, Math.PI / 2);
      b.add(G.prism, roof, cx, h + rh / 2 + .004, cz, d * 1.14, rh, w, Math.PI / 2);
      if (!o.noChimney) { b.add(G.box, P.brick, cx + w * .28, h + rh * .78, cz - d * .12, .04, rh * .7, .04); b.add(G.box, mats.dark, cx + w * .28, h + rh * 1.14, cz - d * .12, .026, .014, .026, 0, 0, 0, false); }
      const f = cz + d / 2, two = h > .19, dx = o.door === undefined ? -w * .2 : o.door;
      b.add(G.box, P.door, cx + dx, .04, f, .044, .08, .012, 0, 0, 0, false); b.add(G.box, P.trim, cx + dx, .006, f + .016, .06, .012, .03, 0, 0, 0, false);
      const win = (lx, y, lit) => { b.add(G.box, P.trim, cx + lx, y, f, .066, .058, .008, 0, 0, 0, false); b.add(G.box, lit ? P.lit : P.win, cx + lx, y, f, .05, .044, .014, 0, 0, 0, false); };
      win(-dx, two ? .06 : h * .56, hash(cx * 9 + cz) < .3);
      if (two) { win(-dx, .155, hash(cx * 5 + cz * 3) < .3); win(dx, .155, false); }
    }
    function shed(b, P, x, z) { b.add(G.box, mats.wood, x, .04, z, .1, .08, .08); b.add(G.prism, P.roof[0], x, .095, z, .1, .035, .11, Math.PI / 2); }
    function washing(b, x, z) {
      b.add(G.box, mats.pole, x - .09, .05, z, .008, .1, .008, 0, 0, 0, false); b.add(G.box, mats.pole, x + .09, .05, z, .008, .1, .008, 0, 0, 0, false);
      b.add(G.box, mats.dark, x, .096, z, .18, .003, .003, 0, 0, 0, false);
      [mats.fl1, mats.fl3, mats.fl1, mats.fl2].forEach((m, k) => b.add(G.box, m, x - .06 + k * .04, .08, z, .026, .03, .004, 0, 0, 0, false));
    }
    /* 주택 한 칸: 단독 두 채 / 연립 세 채 / 큰 집과 차고 */
    function houseTile(b, P, x, z, seed) {
      const v = Math.floor(hash(seed * 1.7 + .3) * 3), r = k => hash(seed * 3.1 + k), wi = Math.floor(r(1) * 7), ri = Math.floor(r(2) * 4);
      if (v === 0) {
        house(b, P, x + .29, z + .33, .36, .27, .15 + .06 * r(3), wi, ri); house(b, P, x + .73, z + .58, .3, .25, .15, wi + 2, ri + 1, { door: .07 });
        tree(b, x + .22, z + .76, .7 + r(4) * .2, 0); bush(b, x + .78, z + .2, 1);
        hedge(b, x + .06, z + .94, x + .4, z + .94); hedge(b, x + .06, z + .56, x + .06, z + .94);
        if (r(5) < .5) washing(b, x + .76, z + .86);
      } else if (v === 1) {
        for (let k = 0; k < 3; k++) house(b, P, x + .22 + k * .28, z + .36, .28, .29, .21, wi + k, ri, { door: k % 2 ? .07 : -.07 });
        for (let k = 0; k < 4; k++) hedge(b, x + .08 + k * .28, z + .6, x + .08 + k * .28, z + .9);
        bush(b, x + .22, z + .78, .8); if (r(6) < .6) shed(b, P, x + .78, z + .82); b.add(G.box, mats.fl2, x + .5, .012, z + .74, .12, .012, .05, 0, 0, 0, false);
      } else {
        house(b, P, x + .4, z + .4, .46, .32, .22, wi, ri);
        b.add(G.box, P.wall[wi % 7], x + .8, .065, z + .46, .22, .13, .2); b.add(G.box, P.flat, x + .8, .135, z + .46, .24, .012, .22); b.add(G.box, P.trim, x + .8, .05, z + .562, .15, .09, .008, 0, 0, 0, false);
        tree(b, x + .8, z + .82, .85, 0); hedge(b, x + .06, z + .94, x + .56, z + .94);
        [mats.fl3, mats.fl1, mats.fl2, mats.fl3].forEach((m, k) => b.add(G.box, m, x + .16 + k * .05, .016, z + .66, .022, .022, .022, k, 0, 0, false));
        if (r(7) < .5) washing(b, x + .3, z + .8);
      }
    }
    /* 큰 건물 한 동: 창은 층마다 따로 붙이고, 1층은 가게 */
    function block(b, P, cx, cz, w, d, h, seed, shop) {
      const wall = P.block[Math.floor(hash(seed) * P.block.length)];
      b.add(G.box, wall, cx, h / 2, cz, w, h, d);
      b.add(G.box, P.trim, cx, h + .012, cz, w + .03, .024, d + .03); b.add(G.box, P.flat, cx, h + .026, cz, w - .04, .008, d - .04, 0, 0, 0, false);
      const y0 = shop ? .215 : .1, fl = Math.max(1, Math.floor((h - y0 + .06) / .14));
      const nx = Math.max(2, Math.round(w / .14)), nz = Math.max(2, Math.round(d / .14));
      for (let f = 0; f < fl; f++) {
        const y = y0 + f * .14;
        for (let k = 0; k < nx; k++) { const lx = cx - w / 2 + (k + .5) * w / nx, m = hash(seed * 7 + f * 3 + k) < .16 ? P.lit : P.win; b.add(G.box, m, lx, y, cz + d / 2, w / nx * .5, .075, .012, 0, 0, 0, false); b.add(G.box, P.win, lx, y, cz - d / 2, w / nx * .5, .075, .012, 0, 0, 0, false); }
        for (let k = 0; k < nz; k++) { const lz = cz - d / 2 + (k + .5) * d / nz; b.add(G.box, P.win, cx + w / 2, y, lz, .012, .075, d / nz * .5, 0, 0, 0, false); b.add(G.box, P.win, cx - w / 2, y, lz, .012, .075, d / nz * .5, 0, 0, 0, false); }
      }
      if (shop) {
        const n = Math.max(1, Math.round(w / .3));
        for (let k = 0; k < n; k++) {
          const lx = cx - w / 2 + (k + .5) * w / n, ww = w / n * .8;
          b.add(G.box, P.win, lx, .065, cz + d / 2, ww, .09, .012, 0, 0, 0, false);
          b.add(G.box, P.awn[Math.floor(hash(seed * 5 + k) * 4)], lx, .135, cz + d / 2 + .034, ww + .02, .012, .075, 0, .4, 0);
        }
      }
      const r = hash(seed * 7.7);
      if (r < .45) b.add(G.box, mats.metal, cx + w * .2, h + .055, cz - d * .15, .1, .05, .08);
      else if (r < .7) { b.add(G.cyl6, mats.wood, cx - w * .2, h + .07, cz + d * .1, .045, .08, .045); b.add(G.cone6, mats.dark, cx - w * .2, h + .125, cz + d * .1, .05, .03, .05, 0, 0, 0, false); }
    }
    function bldgTile(b, P, x, z, seed, hs) {
      const v = Math.floor(hash(seed * 1.7) * 3), r = k => hash(seed * 2.3 + k);
      if (v === 0) {
        block(b, P, x + .44, z + .42, .62, .5, hs * (.75 + .5 * r(1)), seed, true);
        tree(b, x + .86, z + .8, .7, 0); postbox(b, P, x + .14, z + .82); lamp(b, x + .6, z + .86);
      } else if (v === 1) {
        block(b, P, x + .5, z + .38, .84, .4, .3 + .1 * r(2), seed, true);
        for (let k = 0; k < 3; k++) b.add(G.box, P.brick, x + .22 + k * .28, .4 + .1 * r(2) + .04, z + .3, .05, .09, .04);
        bench(b, x + .3, z + .84, 0); tree(b, x + .78, z + .82, .65, 0); phoneBox(b, P, x + .52, z + .8);
      } else {
        block(b, P, x + .3, z + .42, .42, .5, hs * (.8 + .4 * r(3)), seed, true); block(b, P, x + .75, z + .48, .34, .42, hs * (.45 + .3 * r(4)), seed + 1.3, false);
        bush(b, x + .16, z + .86, 1); bush(b, x + .3, z + .88, .8); lamp(b, x + .86, z + .84);
      }
    }
    /* 빈 터: 길을 낼 수 있는 땅. 풀밭·꽃밭·텃밭·주차장 … 길을 내면 사라진다 */
    function lotTile(b, P, x, z, seed) {
      const k = hash(seed * 3.3), r = n => hash(seed * 5.1 + n);
      if (k < .26) { tree(b, x + .25 + r(1) * .5, z + .25 + r(2) * .5, .8 + r(3) * .35); if (r(4) < .5) tree(b, x + .2 + r(5) * .6, z + .2 + r(6) * .6, .6 + r(7) * .3); }
      else if (k < .36) { bush(b, x + .3, z + .6, 1.1); bush(b, x + .42, z + .66, .8); b.add(G.ico, mats.rock, x + .66, .035, z + .38, .09, .06, .07, k * 20); }
      else if (k < .5) { const fm = [mats.fl1, mats.fl2, mats.fl3]; for (let n = 0; n < 11; n++) b.add(G.box, fm[n % 3], x + .12 + r(n) * .76, .014, z + .12 + r(n + 20) * .76, .02, .02, .02, n, 0, 0, false); if (r(40) < .5) bush(b, x + .7, z + .3, .9); }
      else if (k < .62) {                                      // 텃밭
        for (let n = 0; n < 3; n++) { b.add(G.box, mats.bed, x + .42, .006, z + .22 + n * .2, .6, .012, .11, 0, 0, 0, false); for (let j = 0; j < 6; j++) b.add(G.box, n === 1 ? mats.leaf3 : mats.leaf, x + .17 + j * .1, .022, z + .22 + n * .2, .035, .025, .04, 0, 0, 0, false); }
        shed(b, P, x + .84, z + .28); b.add(G.box, mats.wood, x + .84, .02, z + .66, .1, .04, .14);
      }
      else if (k < .72) {                                      // 자갈 주차장
        b.add(G.box, mats.gravel, x + .5, .004, z + .5, .78, .008, .56, 0, 0, 0, false);
        parked(b, P, x + .3, z + .42, Math.PI / 2, seed); if (r(8) < .7) parked(b, P, x + .52, z + .44, Math.PI / 2, seed + 1); if (r(9) < .4) parked(b, P, x + .74, z + .42, Math.PI / 2, seed + 2);
        for (let n = 0; n < 4; n++) b.add(G.box, mats.line, x + .19 + n * .22, .009, z + .42, .012, .002, .24, 0, 0, 0, false);
      }
      else if (k < .82) { bench(b, x + .5, z + .4, 0); lamp(b, x + .28, z + .38); tree(b, x + .72, z + .68, .9, 0); }
      else if (k < .88) { tree(b, x + .3, z + .3, .9, 1); tree(b, x + .62, z + .5, 1.1, 1); tree(b, x + .36, z + .72, .7, 1); }
    }
    /* 공원: 산책로·연못·벤치 */
    function parkTile(b, x, z, seed, first) {
      b.add(G.box, mats.gravel, x + .5, .004, z + .52, 1, .008, .1, 0, 0, 0, false);
      tree(b, x + .24, z + .22, 1, 0); tree(b, x + .74, z + .26, 1.15, 0); tree(b, x + .86, z + .8, .8, 0);
      if (first) {
        b.add(G.cyl10, mats.stone, x + .34, .004, z + .8, .19, .008, .13, 0, 0, 0, false); b.add(G.cyl10, mats.pond, x + .34, .007, z + .8, .165, .008, .105, 0, 0, 0, false);
        for (const [dx, dz] of [[.3, .78], [.4, .83]]) { b.add(G.box, mats.duck, x + dx, .02, z + dz, .028, .016, .018, dx * 9, 0, 0, false); b.add(G.box, mats.beak, x + dx + .016, .028, z + dz, .01, .006, .008, 0, 0, 0, false); }
        bench(b, x + .58, z + .42, 0);
      } else { bench(b, x + .46, z + .42, 0); lamp(b, x + .64, z + .42); bush(b, x + .3, z + .82, 1); tree(b, x + .5, z + .84, .7, 0); }
    }
    /* 강을 건너는 지상 도로: 석조 교대 + 주철 아치 + 난간 */
    function riverBridge(b, u0, u1, c, wd, vert) {
      const L = u1 - u0, um = (u0 + u1) / 2, e = wd / 2;
      const A = (mat, u, y, v, su, sy, sv, sh) => vert ? b.add(G.box, mat, c + v, y, u, sv, sy, su, 0, 0, 0, sh) : b.add(G.box, mat, u, y, c + v, su, sy, sv, 0, 0, 0, sh);
      const Bm = (mat, a1, y1, v1, a2, y2, v2, th) => vert ? b.beam(mat, c + v1, y1, a1, c + v2, y2, a2, th) : b.beam(mat, a1, y1, c + v1, a2, y2, c + v2, th);
      A(mats.stone, um, -.045, 0, L + .04, .09, wd);
      for (const s of [-1, 1]) {
        A(mats.iron, um, -.06, s * e, L, .07, .022);
        for (const u of [u0 + .035, u1 - .035]) { A(mats.stone, u, .07, s * (e - .03), .07, .16, .07); A(mats.concrete, u, .156, s * (e - .03), .085, .014, .085, false); }
        A(mats.iron, um, .105, s * (e - .03), L - .14, .014, .014, false); A(mats.iron, um, .03, s * (e - .03), L - .14, .012, .012, false);
        const n = Math.max(3, Math.round((L - .14) / .075));
        for (let k = 1; k < n; k++) A(mats.iron, u0 + .07 + (L - .14) * k / n, .066, s * (e - .03), .008, .075, .008, false);
        let pu = u0, py = -.3;
        for (let k = 1; k <= 6; k++) {
          const u = u0 + L * k / 6, y = -.3 + .2 * Math.sin(Math.PI * k / 6);
          Bm(mats.iron, pu, py, s * (e - .012), u, y, s * (e - .012), .034);
          if (k < 6 && k !== 3) Bm(mats.iron, u, y, s * (e - .012), u, -.09, s * (e - .012), .016);
          pu = u; py = y;
        }
      }
      for (const [u, s] of [[u0 + .035, -1], [u1 - .035, 1]]) { A(mats.iron, u, .25, s * (e - .03), .012, .18, .012); A(mats.iron, u, .345, s * (e - .03), .036, .012, .036, false); A(mats.glow, u, .331, s * (e - .03), .024, .016, .024, false); }
    }
    /* 육교: 상판·계단·난간이 한 구조물로 이어진다.  로컬 X = 길을 건너는 방향, Z = 차도 방향 */
    const FB = { H: .44, X: .405, SW: .13, DW: .15, Z1: .075, Z2: .53 };
    const FB_SEG = [], FB_PATH = [[-FB.X, 0, -FB.Z2 - .04], [-FB.X, FB.H, -FB.Z1], [-FB.X, FB.H, 0], [FB.X, FB.H, 0], [FB.X, FB.H, FB.Z1], [FB.X, 0, FB.Z2 + .04]];
    for (let k = 0; k < FB_PATH.length - 1; k++) FB_SEG.push(Math.hypot(FB_PATH[k + 1][0] - FB_PATH[k][0], FB_PATH[k + 1][1] - FB_PATH[k][1], FB_PATH[k + 1][2] - FB_PATH[k][2]));
    const FB_LEN = FB_SEG.reduce((a, b) => a + b, 0);
    function footbridge(b, cx, cz, rot) {
      const T = rot ? (lx, lz) => [cx + lz, cz - lx] : (lx, lz) => [cx + lx, cz + lz];
      const A = (mat, lx, y, lz, sx, sy, sz, sh) => { const p = T(lx, lz); rot ? b.add(G.box, mat, p[0], y, p[1], sz, sy, sx, 0, 0, 0, sh) : b.add(G.box, mat, p[0], y, p[1], sx, sy, sz, 0, 0, 0, sh); };
      const Bm = (mat, x1, y1, z1, x2, y2, z2, th, wd, sh) => { const p = T(x1, z1), q = T(x2, z2); b.beam(mat, p[0], y1, p[1], q[0], y2, q[1], th, wd, sh); };
      const Hh = FB.H, X = FB.X, SW = FB.SW, DW = FB.DW, Z1 = FB.Z1, Z2 = FB.Z2, full = 2 * X + SW, RH = .085, xo = X + SW / 2 - .008, xi = X - SW / 2 + .008, zr = DW / 2 - .008;
      A(mats.concrete, 0, Hh - .02, 0, full, .04, DW);                                    // 상판
      for (const s of [-1, 1]) A(mats.iron, 0, Hh - .052, s * (DW / 2 - .012), full - .02, .03, .02);
      const rail = (x1, y1, z1, x2, y2, z2) => {                                          // 손잡이 + 중간대 + 동자기둥
        Bm(mats.iron, x1, y1 + RH, z1, x2, y2 + RH, z2, .014, 0, false); Bm(mats.iron, x1, y1 + RH * .5, z1, x2, y2 + RH * .5, z2, .008, 0, false);
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / .1));
        for (let k = 0; k <= n; k++) { const u = k / n; A(mats.iron, x1 + (x2 - x1) * u, y1 + (y2 - y1) * u + RH / 2, z1 + (z2 - z1) * u, .01, RH, .01, false); }
      };
      rail(-xo, Hh, zr, xi, Hh, zr); rail(-xi, Hh, -zr, xo, Hh, -zr);
      for (const s of [-1, 1]) {
        A(mats.iron, s * X, (Hh - .04) / 2, 0, .05, Hh - .04, .05); A(mats.stone, s * X, .012, 0, .09, .024, .09);     // 기둥
        rail(s * xo, Hh, -s * zr, s * xo, Hh, s * Z1);                                    // 상판 끝 난간 → 계단 바깥 난간으로 이어짐
        Bm(mats.concrete, s * X, Hh - .028, s * Z1, s * X, -.028, s * Z2, .04, SW);       // 계단 옆판(경사 슬래브)
        const n = 9;
        for (let k = 0; k < n; k++) A(mats.stone, s * X, Hh * (1 - (k + .5) / n) - .004, s * (Z1 + (Z2 - Z1) * (k + .5) / n), SW - .016, .016, (Z2 - Z1) / n + .004);
        A(mats.iron, s * X, Hh * .25 - .03, s * (Z1 + (Z2 - Z1) * .5), .03, Hh * .5 - .04, .03);
        rail(s * xo, Hh, s * Z1, s * xo, 0, s * Z2); rail(s * xi, Hh, s * Z1, s * xi, 0, s * Z2);
      }
    }
    /* 사람 / 강아지: +x 를 보고 선다 */
    function person(seed, parent) {
      const g = new THREE.Group(), coat = COAT[Math.floor(hash(seed * 1.3) * COAT.length)], legM = hash(seed * 2.9) < .5 ? mats.dark : mats.pole;
      const legs = [];
      for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(0, .05, s * .011); g.add(hip); mesh(G.box, legM, 0, -.025, 0, .016, .05, .016, hip); legs.push(hip); }
      mesh(G.box, coat, 0, .078, 0, .028, .056, .044, g);
      mesh(G.box, hash(seed * 4.1) < .7 ? mats.skin : mats.skin2, 0, .122, 0, .028, .03, .03, g);
      mesh(G.box, HAIR[Math.floor(hash(seed * 6.7) * HAIR.length)], -.003, .139, 0, .032, .012, .034, g, false);
      g.userData.legs = legs; g.scale.setScalar(1.1); (parent || world).add(g); return g;
    }
    function dog(seed, parent) {
      const g = new THREE.Group(), m = DOG[Math.floor(hash(seed * 3.7) * DOG.length)], sm = hash(seed) < .5 ? 1 : .78;
      mesh(G.box, m, 0, .03, 0, .052, .022, .022, g); mesh(G.box, m, .032, .044, 0, .022, .02, .02, g); mesh(G.box, mats.dark, .045, .041, 0, .008, .008, .01, g, false);
      const tail = mesh(G.box, m, -.03, .045, 0, .006, .024, .006, g, false); tail.rotation.z = .6;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.box, m, sx * .018, .011, sz * .007, .007, .022, .006, g, false);
      g.userData.tail = tail; g.scale.setScalar(sm); parent.add(g); return g;
    }
    /* 보도를 오가는 사람. run = { horiz, c(고정 좌표), a, b } */
    function walker(run, seed, withDog, parent, list) {
      const g = new THREE.Group(); parent.add(g);
      const p = person(seed, g), w = { g, p, run, pos: run.a + hash(seed * 9.1) * (run.b - run.a), dir: hash(seed * 2.2) < .5 ? 1 : -1, v: .16 + hash(seed * 7.3) * .1, ph: hash(seed) * 6, wait: 0, seed };
      if (withDog) {
        w.dog = dog(seed, g); w.dog.position.set(.115, 0, .028); w.v *= .85;
        const lead = mesh(G.box, mats.dark, .066, .066, .026, .1, .003, .003, g, false); lead.rotation.z = -.42;
      }
      list.push(w);
    }
    function stepWalkers(list, dt, t) {
      for (const w of list) {
        if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0 && w.turn) { w.dir = -w.dir; w.turn = false; } }
        else {
          w.pos += w.dir * w.v * dt; w.ph += dt * w.v * 60;
          if (w.pos > w.run.b) { w.pos = w.run.b; w.wait = .6 + hash(w.seed + t) * 1.5; w.turn = true; }
          else if (w.pos < w.run.a) { w.pos = w.run.a; w.wait = .6 + hash(w.seed + t) * 1.5; w.turn = true; }
          else if (w.dog && hash(Math.floor(t * .5) + w.seed * 13) < .06) w.wait = 1.6;   // 강아지가 냄새를 맡는다
        }
        const moving = w.wait <= 0, sw = moving ? Math.sin(w.ph) * .55 : 0;
        w.p.userData.legs[0].rotation.z = sw; w.p.userData.legs[1].rotation.z = -sw;
        w.p.position.y = moving ? Math.abs(Math.sin(w.ph)) * .004 : 0;
        if (w.dog) { w.dog.userData.tail.rotation.x = Math.sin(t * 14 + w.seed) * .5; w.dog.position.y = moving ? Math.abs(Math.sin(w.ph * 1.7)) * .006 : 0; w.dog.rotation.z = moving ? 0 : -.25; }
        if (w.run.horiz) { w.g.position.set(w.pos, 0, w.run.c); w.g.rotation.y = w.dir > 0 ? 0 : Math.PI; }
        else { w.g.position.set(w.run.c, 0, w.pos); w.g.rotation.y = w.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
      }
    }

    /* 공사 구역: 울타리·크레인·굴착기 */
    function construction(x, z, i, first) {
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
          mesh(G.box, k % 2 ? mats.white : mats.orange, x + .16 + k * .23, .07, z + .5 + s * .44, .22, .12, .025);
          mesh(G.box, k % 2 ? mats.orange : mats.white, x + .5 + s * .44, .07, z + .16 + k * .23, .025, .12, .22);
        }
      }
      if (first) {
        mesh(G.box, mats.yellow, x + .3, .55, z + .3, .05, 1.1, .05); mesh(G.box, mats.yellow, x + .62, 1.08, z + .3, .9, .04, .04);
        mesh(G.box, mats.dark, x + .2, 1.02, z + .3, .12, .1, .1); mesh(G.box, mats.dark, x + .95, .9, z + .3, .012, .32, .012, world, false); mesh(G.box, mats.concrete, x + .95, .72, z + .3, .1, .06, .1);
        label('공사중', '#c9661a', x + 1, 1.45, z + .5);
      } else {
        mesh(G.box, mats.yellow, x + .45, .1, z + .55, .26, .12, .18); mesh(G.box, mats.glass, x + .4, .2, z + .55, .12, .1, .15);
        const arm = mesh(G.box, mats.yellow, x + .64, .24, z + .55, .3, .04, .04); arm.rotation.z = .6; mesh(G.box, mats.dark, x + .45, .03, z + .55, .3, .05, .22);
      }
      for (let k = 0; k < 3; k++) { const p = mesh(G.cyl6, mats.concrete, x + .68, .05 + (k === 2 ? .07 : 0), z + .22 + (k === 2 ? .04 : k * .08), .04, .34, .04); p.rotation.z = Math.PI / 2; }
      mesh(G.cone6, mats.orange, x + .25, .06, z + .78, .04, .12, .04);
    }

    /* 격자 바깥의 동네: 한 번만 만든다 (주택가·공원·상가 조금·강·언덕) */
    function buildEnv(tiles) {
      env = new THREE.Group(); scene.add(env);
      const eb = Batch();
      const E = 48, quad = (arr, x0, z0, x1, z1, y) => arr.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0);
      const geo = arr => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); return g; };
      const flatMesh = (arr, mat) => { const m = new THREE.Mesh(geo(arr), mat); m.receiveShadow = true; env.add(m); return m; };
      let wx0 = Infinity, wx1 = -Infinity;
      for (let x = 0; x < W; x++) if (tiles[x].base === 'water') { wx0 = Math.min(wx0, x); wx1 = Math.max(wx1, x + 1); }
      const river = wx0 !== Infinity, ground = [];
      if (!river) quad(ground, -E, -E, W + E, H + E, -.012);
      else {
        quad(ground, -E, -E, wx0, H + E, -.012); quad(ground, wx1, -E, W + E, H + E, -.012);
        flatMesh((a => { quad(a, wx0, -E, wx1, H + E, -.3); return a; })([]), mats.water);
        const bank = [];
        for (const bx of [wx0, wx1]) bank.push(bx, 0, -E, bx, 0, H + E, bx, -.34, H + E, bx, 0, -E, bx, -.34, H + E, bx, -.34, -E);
        env.add(new THREE.Mesh(geo(bank), mats.soil));
      }
      flatMesh(ground, mats.verge);
      // 주변 도로 + 보도
      const HS = [-1.5, H + 1.5, -5.5, H + 5.5], VS = [-1.5, W + 1.5, -5.5, W + 5.5], asph = [], lines = [], pave = [];
      for (const z of HS) { quad(pave, -E, z - .56, W + E, z + .56, .001); quad(asph, -E, z - .4, W + E, z + .4, .004); for (let x = -E; x < W + E; x += .9) quad(lines, x, z - .02, x + .45, z + .02, .007); }
      for (const x of VS) { quad(pave, x - .56, -E, x + .56, H + E, .001); quad(asph, x - .4, -E, x + .4, H + E, .004); for (let z = -E; z < H + E; z += .9) quad(lines, x - .02, z, x + .02, z + .45, .007); }
      if (river) {
        for (const z of HS) riverBridge(eb, wx0, wx1, z, 1.12, false);
        for (const s of [[wx0 - .03, -1], [wx1 + .03, 1]]) {                                  // 강둑 갓돌 (격자 구간·다리 구간은 건너뛴다)
          const cuts = [-E, HS[2] - .6, HS[2] + .6, HS[0] - .6, HS[0] + .6, 0, H, HS[1] - .6, HS[1] + .6, HS[3] - .6, HS[3] + .6, H + E];
          for (let k = 0; k < cuts.length; k += 2) eb.add(G.box, mats.stone, s[0], .012, (cuts[k] + cuts[k + 1]) / 2, .06, .034, cuts[k + 1] - cuts[k]);
        }
      }
      // 주변 블록: 저주파 노이즈로 공원 / 주택가 / 상가 구획을 나눈다
      const onStreet = (c, arr) => arr.some(v => c === Math.floor(v));
      const lawn = [];
      for (let cz = -15; cz < H + 12; cz++) for (let cx = -17; cx < W + 17; cx++) {
        if (cx >= 0 && cx < W && cz >= 0 && cz < H) continue;
        if (onStreet(cx, VS) || onStreet(cz, HS) || (cx >= wx0 && cx < wx1)) continue;
        const k = cx * 31.7 + cz * 17.3, r = hash(k), r2 = hash(k + 3);
        const far = Math.max(cx < 0 ? -cx : cx - W + 1, cz < 0 ? -cz : cz - H + 1, 0);
        if (river && (cx === wx0 - 1 || cx === wx1)) {                                        // 강변 산책로: 가로수와 벤치
          const side = cx === wx1 ? .3 : .7;
          tree(eb, cx + side, cz + .3 + r * .4, .85 + r2 * .3, 0);
          if (r < .3) bench(eb, cx + side + (cx === wx1 ? .28 : -.28), cz + .7, cx === wx1 ? Math.PI / 2 : -Math.PI / 2);
          else if (r > .82) lamp(eb, cx + (cx === wx1 ? .12 : .88), cz + .8);
          continue;
        }
        let n = vnoise(cx / 3.3 + 20, cz / 3.3 + 20) - Math.max(0, far - 7) * .07;            // 멀어질수록 녹지
        if (cz >= H && n > .64) n = .6;                                                       // 카메라 앞쪽은 낮은 집만
        if (n < .34) {                                                                        // 녹지
          if (r < .55) { tree(eb, cx + .3, cz + .35, .9 + r2 * .4); tree(eb, cx + .7, cz + .6, .7 + r * .5); if (r2 < .5) tree(eb, cx + .35, cz + .8, .8); }
          else if (r < .65) { eb.add(G.cyl10, mats.pond, cx + .5, .004, cz + .5, .3, .008, .22, r * 3, 0, 0, false); bush(eb, cx + .16, cz + .3, 1); tree(eb, cx + .84, cz + .78, .8, 0); }
          else if (r < .8) { tree(eb, cx + .5, cz + .5, 1.1, 0); bench(eb, cx + .5, cz + .78, 0); }
        } else if (n < .64) {                                                                 // 주택가
          if (r < .74) { quad(lawn, cx + .02, cz + .02, cx + .98, cz + .98, .001); houseTile(eb, POUT, cx, cz, k); }
          else if (r < .88) { tree(eb, cx + .4, cz + .4, 1, 0); tree(eb, cx + .72, cz + .7, .75, 0); }
          else lotTile(eb, POUT, cx, cz, k);
        } else {                                                                              // 상가·사무실
          quad(pave, cx, cz, cx + 1, cz + 1, .001);
          const hs = cz < 0 ? .7 + r2 * .5 + Math.min(.5, -cz * .05) : .55 + r2 * .4;
          if (r < .62) bldgTile(eb, POUT, cx, cz, k, hs);
          else if (r < .8) { tree(eb, cx + .3, cz + .3, .9, 0); tree(eb, cx + .7, cz + .68, .9, 0); bench(eb, cx + .5, cz + .5, r * 6); lamp(eb, cx + .82, cz + .2); }
          else { eb.add(G.box, mats.gravel, cx + .5, .004, cz + .5, .86, .008, .7, 0, 0, 0, false); parked(eb, POUT, cx + .28, cz + .4, Math.PI / 2, k); parked(eb, POUT, cx + .5, cz + .42, Math.PI / 2, k + 1); parked(eb, POUT, cx + .72, cz + .62, Math.PI / 2, k + 2); }
        }
      }
      flatMesh(pave, mats.pave); flatMesh(lawn, mats.garden);
      flatMesh(asph, mats.asph); env.add(new THREE.Mesh(geo(lines), mats.line));
      // 먼 언덕
      for (let k = 0; k < 18; k++) {
        const r = 7 + hash(k * 2.3) * 7, hh = 2.2 + hash(k * 4.1) * 3.4;
        eb.add(G.ico1, [mats.hill, mats.hill2, mats.hill3][k % 3], -30 + k * 4.2 + hash(k) * 2, -.3, -24 - hash(k * 7.7) * 10, r, hh, r * .8, k, 0, 0, false);
      }
      for (let k = 0; k < 7; k++) for (const sx of [-1, 1]) {
        const r = 6 + hash(k * 9.1 + sx) * 5, hh = 2 + hash(k * 3.3 + sx) * 3;
        eb.add(G.ico1, k % 2 ? mats.hill : mats.hill3, W / 2 + sx * (33 + hash(k + sx) * 6), -.3, -18 + k * 6.5, r * .8, hh, r, k * 2, 0, 0, false);
      }
      // 정박한 배 한 척 + 강을 오르내리는 배 한 척
      if (river) {
        const boat = (m, len, moving) => {
          const g = new THREE.Group(); env.add(g);
          mesh(G.box, mats.dark, 0, .02, 0, .15, .05, len, g); mesh(G.box, m, 0, .065, -len * .04, .125, .05, len * .68, g); mesh(G.box, mats.stone, 0, .094, -len * .04, .135, .01, len * .7, g, false);
          for (let k = 0; k < 3; k++) for (const s of [-1, 1]) mesh(G.box, mats.glow, s * .0635, .068, -len * .28 + k * len * .2, .004, .02, .05, g, false);
          mesh(G.box, mats.wood, 0, .07, len * .42, .012, .05, .012, g, false);
          if (moving) boats.push(g); return g;
        };
        boat(mats.boatA, .62, true).position.set((wx0 + wx1) / 2 + .14, -.3, H + 4);
        boat(mats.boatB, .5, false).position.set(wx0 + .14, -.3, H + 2.8);
        boat(mats.boatC, .56, false).position.set(wx1 - .14, -.3, -3.4);
      }
      eb.flush(env);
      // 주변 도로의 차와 보도의 사람들
      amb = []; envWalkers = [];
      let id = 0;
      const add = (horiz, c, dir, pos) => { const m = carMesh({ type: 'normal', id: id++, len: .26 }, env); amb.push({ m, horiz, c, dir, pos, v: 1.1 + hash(id) * .5 }); };
      for (const z of HS) for (let k = 0; k < 5; k++) add(true, z, k % 2 ? 1 : -1, -14 + k * 7.3 + hash(k + z) * 2);
      for (const x of VS) for (let k = 0; k < 4; k++) add(false, x, k % 2 ? 1 : -1, -10 + k * 6.7 + hash(k + x) * 2);
      let ws = 100;
      for (const z of HS.slice(0, 2)) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { ws++; walker({ horiz: true, c: z + s * .48, a: -9 + k * 7, b: -3 + k * 7 }, ws, hash(ws) < .35, env, envWalkers); }
      for (const x of VS.slice(0, 2)) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { ws++; walker({ horiz: false, c: x + s * .48, a: -1 + k * 5, b: 4 + k * 5 }, ws, hash(ws) < .35, env, envWalkers); }
    }

    function label(text, color, x, y, z) {                    // 도로 표지판 모양 이름표
      const c = document.createElement('canvas'); c.width = 256; c.height = 112;
      const g = c.getContext('2d');
      const rrp = (x0, y0, w, h, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); };
      g.font = '900 54px "Wanted Sans",sans-serif';
      const w = Math.min(240, g.measureText(text).width + 56), x0 = (256 - w) / 2;
      g.fillStyle = '#1c1f27'; rrp(x0, 14, w, 88, 18); g.fill();
      g.fillStyle = color; rrp(x0, 6, w, 88, 18); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 5; rrp(x0 + 8, 14, w - 16, 72, 12); g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 53);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
      sp.position.set(x, y, z); sp.scale.set(1.05, .46, 1); sp.renderOrder = 10; world.add(sp);
    }
    function building(b, t, x, z) {
      const kind = t.term.kind, col = TERMCOL[kind], cm = TERMMAT[kind] || (TERMMAT[kind] = M(col));
      const cx = x + .5, cz = z + .5;
      if (kind === 'home') {
        house(b, PIN, cx - .2, cz - .2, .32, .26, .2, 0, 1); house(b, PIN, cx + .2, cz + .02, .3, .25, .16, 3, 0, { door: .07 }); house(b, PIN, cx - .2, cz + .28, .3, .22, .15, 2, 1, { noChimney: true });
        tree(b, cx + .28, cz - .3, .7, 0); hedge(b, cx + .06, cz + .42, cx + .42, cz + .42);
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
        const cc = [mats.red, mats.roofB, mats.yellow, mats.iron, mats.orange];
        for (let k = 0; k < 5; k++) mesh(G.box, cc[k], cx - .22 + (k % 2) * .22, .15 + Math.floor(k / 2) * .14, cz + .18 - (k % 3) * .04, .2, .13, .34);
        mesh(G.box, cm, cx + .27, .4, cz - .2, .06, .8, .06); mesh(G.box, cm, cx + .1, .78, cz - .2, .5, .05, .06);
        mesh(G.box, mats.dark, cx - .08, .68, cz - .2, .02, .16, .02);
      }
      label(t.term.name, kind === 'home' || kind === 'factory' ? '#1d5fbf' : '#0f7a55', cx, kind === 'office' ? 1.55 : kind === 'home' ? .95 : 1.1, cz);
    }
    const TERMMAT = {};
    function beam(x1, y1, z1, x2, y2, z2, th, mat) {
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = Math.hypot(dx, dy, dz);
      const m = mesh(G.box, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, len, th, th);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
      return m;
    }
    /* 고가 다리 상판 한 구간: (x1,y1,z1)→(x2,y2,z2), 폭 wd, 트러스 포함 */
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
      if (!env) buildEnv(tiles);
      world = new THREE.Group(); scene.add(world);
      heat = []; signals = []; peds = []; camSweeps = []; walkers = [];
      cars.clear(); fx.clear();
      const wb = Batch();

      // 지면 텍스처: 2D 렌더러로 도로·노면 표시를 그려 그대로 입힌다
      const TP = 128, tc = document.createElement('canvas'); tc.width = W * TP; tc.height = H * TP;
      root.FlowRender.draw(tc.getContext('2d'), { TS: TP, tiles, graph, sim: null, mode: opt && opt.edit ? 'edit' : 'tex', theme: 'poly', groundOnly: true, now: 0 });
      if (tex) tex.dispose();
      tex = new THREE.CanvasTexture(tc); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const quads = { grassA: [], grassB: [], rockBg: [], parkBg: [], pave: [], siteBg: [], garden: [] }, side = [], side2 = [];
      const GROUND = { rock: 'rockBg', park: 'parkBg', bldg: 'pave', site: 'siteBg', house: 'garden' };
      const isLand = (x, y) => !(x >= 0 && y >= 0 && x < W && y < H) || tiles[y * W + x].base !== 'water';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = tiles[y * W + x];
        if (t.base === 'water') continue;
        quads[GROUND[t.base] || ((x + y) % 2 ? 'grassA' : 'grassB')].push(x, 0, y, x, 0, y + 1, x + 1, 0, y + 1, x, 0, y, x + 1, 0, y + 1, x + 1, 0, y);
        for (let d = 0; d < 4; d++) {
          if (isLand(x + DX[d], y + DY[d])) continue;
          const c = [[x, y, x + 1, y], [x + 1, y, x + 1, y + 1], [x + 1, y + 1, x, y + 1], [x, y + 1, x, y]][d];
          const band = (arr, t, b) => arr.push(c[0], t, c[1], c[2], t, c[3], c[2], b, c[3], c[0], t, c[1], c[2], b, c[3], c[0], b, c[1]);
          band(side, 0, -.2); band(side2, -.2, -.7);
          const wt = tiles[(y + DY[d]) * W + x + DX[d]];                                    // 강가 갓돌 (다리가 닿는 곳은 비운다)
          if (!wt.road && !wt.bridge) wb.add(G.box, mats.stone, (c[0] + c[2]) / 2 - DX[d] * .03, .012, (c[1] + c[3]) / 2 - DY[d] * .03, d % 2 ? .06 : 1, .034, d % 2 ? 1 : .06);
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
      const g3 = new THREE.BufferGeometry(); g3.setAttribute('position', new THREE.Float32BufferAttribute(side2, 3)); g3.computeVertexNormals();
      world.add(new THREE.Mesh(g3, mats.soil2));
      // 도로·노면 표시 레이어(투명 배경 텍스처)
      const rg = new THREE.PlaneGeometry(W, H); rg.rotateX(-Math.PI / 2);
      const roads = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false }));
      roads.position.set(W / 2, .006, H / 2); roads.receiveShadow = true; roads.renderOrder = 1; world.add(roads);
      // 선택 타일 표시
      hoverMesh = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x3ef0ff, transparent: true, opacity: .35, depthWrite: false }));
      hoverMesh.position.y = .03; hoverMesh.visible = false; hoverMesh.renderOrder = 5; world.add(hoverMesh);

      const arms = i => { const a = [false, false, false, false]; for (const b of graph.nbr[i * 3]) { const bi = (b / 3) | 0, dx = bi % W - i % W, dy = ((bi / W) | 0) - ((i / W) | 0); a[dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0] = true; } return a; };
      const ARM = [];

      for (let i = 0; i < W * H; i++) {
        const t = tiles[i], x = i % W, z = (i / W) | 0, cx = x + .5, cz = z + .5;
        const free = !t.road && !t.term && !t.bridge && !t.tunnel;
        if (t.base === 'rock') {
          [[.34, .4, .34, .62], [.68, .56, .27, .46], [.3, .76, .2, .3]].forEach((p, k) => {
            const m = mesh(G.cone5, k ? mats.rock2 : mats.rock, x + p[0], p[3] / 2, z + p[1], p[2], p[3], p[2]); m.rotation.y = hash(i + k) * 3;
            if (k < 2) { const s = mesh(G.cone5, mats.snow, x + p[0], p[3] * .82, z + p[1], p[2] * .36, p[3] * .36, p[2] * .36); s.rotation.y = m.rotation.y; }
          });
        } else if (t.base === 'bldg') {
          bldgTile(wb, PIN, x, z, i + 1, .5 + (1 - z / (H - 1)) * .45);
        } else if (t.base === 'house') {
          houseTile(wb, PIN, x, z, i + 1);
        } else if (t.base === 'site') {
          construction(x, z, i, !(x > 0 && tiles[i - 1].base === 'site'));
        } else if (t.base === 'park') {
          if (!t.tunnel && !t.bridge) parkTile(wb, x, z, i, !(x > 0 && tiles[i - 1].base === 'park'));
        } else if (t.base === 'grass' && free) {
          lotTile(wb, PIN, x, z, i + 1);
        }
        if (t.term) building(wb, t, x, z);
        const a = ARM[i] = arms(i), vert = (a[0] || a[2]) && !(a[1] || a[3]);

        if (t.road) {
          const hp = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: 0x36f1a0, transparent: true, opacity: 0, depthWrite: false }));
          hp.position.set(cx, .012, cz); hp.scale.set(.8, 1, .8); hp.renderOrder = 2; world.add(hp); heat.push({ m: hp, i });
          if (t.base === 'water') riverBridge(wb, vert ? z : x, vert ? z + 1 : x + 1, vert ? cx : cz, .92, vert);
          if (t.round) { wb.add(G.cyl10, mats.stone, cx, .02, cz, .15, .04, .15); wb.add(G.cyl10, mats.leaf3, cx, .035, cz, .125, .04, .125); tree(wb, cx, cz, .55, 0); }
          if (t.bump) { const b = mesh(G.box, mats.yellow, cx + (graph.ctrl[i * 3] ? .36 : 0), .015, cz, .1, .035, .54); if (vert) { b.rotation.y = Math.PI / 2; b.position.set(cx, .015, cz); } }
          if (t.barricade) {
            const grp = new THREE.Group(); grp.position.set(cx, 0, cz); if (!vert) grp.rotation.y = Math.PI / 2; world.add(grp);
            for (const s of [-.1, .1]) { mesh(G.box, mats.orange, 0, .13, s, .66, .07, .03, grp); mesh(G.box, mats.white, -.16, .13, s, .1, .072, .032, grp); mesh(G.box, mats.white, .16, .13, s, .1, .072, .032, grp); mesh(G.box, mats.pole, -.3, .07, s, .03, .14, .03, grp); mesh(G.box, mats.pole, .3, .07, s, .03, .14, .03, grp); }
            mesh(G.cone6, mats.orange, -.2, .07, .25, .05, .14, .05, grp); mesh(G.cone6, mats.orange, .2, .07, -.25, .05, .14, .05, grp);
          }
          if (t.signal && graph.ctrl[i * 3]) for (let d = 0; d < 4; d++) if (a[d]) {
            const px = cx + DX[d] * .36 + DY[d] * .36, pz = cz + DY[d] * .36 - DX[d] * .36;
            wb.add(G.box, mats.pole, px, .26, pz, .03, .52, .03);
            wb.add(G.box, mats.dark, px, .5, pz, .08, .16, .08);
            const lm = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
            mesh(G.ico, lm, px, .5, pz, .045, .045, .045, world, false); signals.push({ m: lm, node: i * 3, d });
          }
          if (t.camera) {
            wb.add(G.box, mats.pole, cx + .36, .3, cz - .36, .03, .6, .03); wb.add(G.box, mats.pole, cx + .25, .6, cz - .36, .24, .03, .03);
            wb.add(G.box, mats.white, cx + .16, .56, cz - .36, .12, .08, .08); mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xff3b3b }), cx + .16, .5, cz - .36, .025, .025, .025, world, false);
            const ring = new THREE.Mesh(new THREE.RingGeometry(F.CAM_RADIUS - .04, F.CAM_RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2; ring.position.set(cx, .02, cz); world.add(ring);
            const disc = new THREE.Mesh(new THREE.CircleGeometry(F.CAM_RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .07, depthWrite: false }));
            disc.rotation.x = -Math.PI / 2; disc.position.set(cx, .018, cz); world.add(disc);
            const sw = new THREE.Mesh(new THREE.CircleGeometry(F.CAM_RADIUS, 12, 0, .55), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
            sw.rotation.x = -Math.PI / 2; sw.position.set(cx, .022, cz); world.add(sw); camSweeps.push(sw);
          }
          if (t.crosswalk) {
            const rot = !(a[0] || a[2]);                               // 도로가 가로 → 보행자는 세로로 건넌다
            const grp = new THREE.Group(); grp.position.set(cx, 0, cz); if (rot) grp.rotation.y = Math.PI / 2; world.add(grp);
            if (t.overpass) footbridge(wb, cx, cz, rot);
            for (let k = 0; k < 3; k++) {
              const p = person(i * 7 + k, grp);
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
      wb.flush(world);

      /* 보도를 걷는 사람들: 곧게 뻗은 1차로 구간의 양쪽 보도를 오간다 */
      const straight = (i, horiz) => {
        const t = tiles[i], a = ARM[i];
        if (!t.road || t.wide || t.rev || t.round || t.bridge || t.tunnel || (t.crosswalk && t.overpass)) return false;
        return horiz ? (a[1] && a[3] && !a[0] && !a[2]) : (a[0] && a[2] && !a[1] && !a[3]);
      };
      const runs = [];
      for (let y = 0; y < H; y++) for (let x = 0, s = -1; x <= W; x++) {
        const ok = x < W && straight(y * W + x, true);
        if (ok && s < 0) s = x; else if (!ok && s >= 0) { for (const sd of [-1, 1]) runs.push({ horiz: true, c: y + .5 + sd * .375, a: s + .12, b: x - .12 }); s = -1; }
      }
      for (let x = 0; x < W; x++) for (let y = 0, s = -1; y <= H; y++) {
        const ok = y < H && straight(y * W + x, false);
        if (ok && s < 0) s = y; else if (!ok && s >= 0) { for (const sd of [-1, 1]) runs.push({ horiz: false, c: x + .5 + sd * .375, a: s + .12, b: y - .12 }); s = -1; }
      }
      for (let y = 0; y < H; y++) for (let x = 0, s = -1; x <= W; x++) {                   // 공원 산책로
        const ok = x < W && tiles[y * W + x].base === 'park' && !tiles[y * W + x].tunnel && !tiles[y * W + x].bridge;
        if (ok && s < 0) s = x; else if (!ok && s >= 0) { runs.push({ horiz: true, c: y + .52, a: s + .08, b: x - .08, park: true }); s = -1; }
      }
      runs.forEach((r, k) => {
        const len = r.b - r.a, n = r.park ? 1 + (len > 1.2 ? 1 : 0) : (len > 2.4 ? 2 : hash(k * 3.3) < .75 ? 1 : 0);
        for (let j = 0; j < n && walkers.length < 26; j++) walker(r, k * 17 + j * 5 + 3, r.park ? j === 0 : hash(k * 7.1 + j) < .3, world, walkers);
      });
    }

    function carMesh(c, parent) {
      const g = new THREE.Group(), col = c.type === 'normal' ? NORMAL_VARIANTS[c.id % NORMAL_VARIANTS.length] : CARCOL[c.type], bm = M(col), L = c.len;
      g.scale.setScalar(1.18);
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
      g.userData.body = bm; (parent || world).add(g); return g;
    }
    function boom() {
      const g = new THREE.Group();
      const core = new THREE.Mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xff9a2a })); g.add(core);
      const inner = new THREE.Mesh(G.ico, new THREE.MeshBasicMaterial({ color: 0xffe36b })); inner.scale.setScalar(.55); g.add(inner);
      g.userData.smoke = [];
      for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(G.ico, new THREE.MeshLambertMaterial({ color: 0x55575f, flatShading: true, transparent: true })); g.add(s); g.userData.smoke.push(s); }
      g.userData.core = core; g.userData.inner = inner; world.add(g); return g;
    }

    const cA = new THREE.Color(), sunDay = new THREE.Color(0xfff1d6), sunEve = new THREE.Color(0xffd0a3);
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
      const adt = Math.min(.1, Math.max(0, (now - lastAmb) / 1000)); lastAmb = now;
      for (const c of amb) {                                    // 주변 도로의 차들은 막힘 없이 달린다
        c.pos += c.dir * c.v * adt;
        const lo = c.horiz ? -16 : -13, hi = c.horiz ? W + 16 : H + 13;
        if (c.pos > hi) c.pos = lo; else if (c.pos < lo) c.pos = hi;
        if (c.horiz) { c.m.position.set(c.pos, 0, c.c + c.dir * .15); c.m.rotation.y = c.dir > 0 ? 0 : Math.PI; }
        else { c.m.position.set(c.c - c.dir * .15, 0, c.pos); c.m.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
      }
      stepWalkers(envWalkers, adt, t); stepWalkers(walkers, adt, t);
      for (const b of boats) { b.position.z -= adt * .22; if (b.position.z < -16) b.position.z = H + 13; b.position.y = -.3 + Math.sin(t * 1.3) * .004; }
      for (const pd of peds) {                                  // 횡단보도 / 육교를 건너는 사람들
        const active = pd.over || (!!sim && sim.cwActive(pd.idx));
        pd.g.visible = active;
        if (!active) continue;
        const ph = pd.over ? (t * .075 + pd.k * .37) % 1 : (((sim.t + (pd.idx * 3.7) % 13) % 13) / 4 * (0.9 + pd.k * .12) + pd.k * .22) % 1;
        const u = pd.k % 2 ? 1 - ph : ph, back = pd.k % 2 ? Math.PI : 0, sw = Math.sin(t * 11 + pd.k * 2) * .55;
        pd.g.userData.legs[0].rotation.z = sw; pd.g.userData.legs[1].rotation.z = -sw;
        if (!pd.over) { pd.g.position.set(-.42 + u * .84, 0, -.07 + pd.k * .07); pd.g.rotation.y = back; continue; }
        let d = u * FB_LEN, s = 0;
        while (s < FB_SEG.length - 1 && d > FB_SEG[s]) d -= FB_SEG[s++];
        const A = FB_PATH[s], B = FB_PATH[s + 1], f = Math.min(1, d / FB_SEG[s]);
        pd.g.position.set(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f);
        pd.g.rotation.y = -Math.atan2(B[2] - A[2], B[0] - A[0]) + back;
      }
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
      zoom(f) { cam.touched = true; tgt.dist = Math.max(5, Math.min(36, tgt.dist * f)); },
      look(x, z, dist, yaw, pitch) { cam.touched = true; cam.tx = x; tgt.tz = cam.tz = z; if (dist) tgt.dist = cam.dist = dist; if (yaw !== undefined) tgt.yaw = cam.yaw = yaw; if (pitch !== undefined) tgt.pitch = cam.pitch = pitch; },
      show(on) { canvas.style.display = on ? 'block' : 'none'; }
    };
  }
  root.FlowView3D = { create };
})(window);
