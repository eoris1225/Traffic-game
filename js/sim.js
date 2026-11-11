/* ============================================================================
 * FLOW LAB — 교통 시뮬레이션 엔진 (DOM 의존성 없음: 브라우저 / Node 공용)
 *
 *  - 경로 탐색 : 동적 가중치 A*  (간선 비용 = BPR 함수  t = t0·(1 + α·(v/c)^β))
 *  - 차량 추종 : 단순화 IDM      v* = v_max · max(0, (Δx − d_min) / d_safe)
 *  - 사고 판정 : 물리적 충돌(차체 겹침) + TTC(Time-To-Collision) 기록
 *  - 이질적 에이전트 : 차량마다 θ_i = (v0, T, a, b) 를 정규분포 난수로 할당
 *
 *  엔진은 "어느 좌표에 무엇을 깔았는지"를 채점하지 않는다.
 *  타일 속성 → 국소 규칙만 계산하고, 결과(통행시간·사고)는 전부 창발적으로 나온다.
 * ========================================================================== */
(function (root) {
  'use strict';

  const W = 12, H = 8;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];          // 0:N 1:E 2:S 3:W
  const SB = 0.7;                                          // 교차로 박스 시작 지점(간선 진행률)
  const DT = 1 / 30;
  const DEMAND_END = 100, SIM_END = 130;
  const BPR_ALPHA = 0.15, BPR_BETA = 4;
  const CLEAR_TIME = 10;                                   // 사고 수습 시간(초)
  const CRASH_PENALTY = 30;                                // 사고 차량 통행시간 페널티(초)
  const CAM_RADIUS = 2.2, CAM_LIMIT = 1.3;
  const BUMP_LIMIT = 0.55;
  const ROUND_R = 0.24, ROUND_DELTA = Math.asin(0.14 / ROUND_R);
  const TWO_PI = Math.PI * 2;

  const BUDGET = 3500;
  const COST = {
    road: 100, wide: 250, oneway: 100, guide: 100, bus: 150, rev: 200,
    round: 500, signal: 300, camera: 400, bump: 100, barricade: 100,
    bridge: 700, tunnel: 800, overpass: 400, demolish: 50
  };
  const FLAGS = ['wide', 'guide', 'bus', 'rev', 'round', 'signal', 'camera', 'bump', 'barricade', 'overpass'];

  /* ---- Stage 1 맵 -----------------------------------------------------------
   *  . 빈 터(길을 낼 수 있음)   ~ 강   B 큰 건물   H 주택   C 공사 구역   P 공원
   *  # 일반 도로   L 잠금 도로   X 잠금 도로+횡단보도   = 잠금 교량(강 위)
   *  1 S1 주거단지  2 S2 산업단지  3 E1 오피스  4 E2 물류항
   * ------------------------------------------------------------------------ */
  const STAGE1 = [
    'HH..B.P.~.BB',
    'H..P2..H~H..',
    '..B.####=###',
    '.H..#PP.~..#',
    '1LXLLLLL=XL3',
    '#..HCC.#~..B',
    '########~..H',
    '.BH..P.4~H.B'
  ];
  const TERMS = {
    '1': { id: 'S1', kind: 'home', name: '주택가' },
    '2': { id: 'S2', kind: 'factory', name: '공장' },
    '3': { id: 'E1', kind: 'office', name: '회사' },
    '4': { id: 'E2', kind: 'port', name: '항구' }
  };

  /* 수요(대/초): 전반부 = 출근(서→동), 후반부 = 퇴근(동→서) */
  const FLOWS = [
    { from: 'S1', to: 'E1', am: 0.60, pm: 0.18 },
    { from: 'E1', to: 'S1', am: 0.08, pm: 0.50 },
    { from: 'S1', to: 'E2', am: 0.07, pm: 0.03 },
    { from: 'S2', to: 'E1', am: 0.07, pm: 0.03 },
    { from: 'E1', to: 'S2', am: 0.02, pm: 0.06 },
    { from: 'E2', to: 'S1', am: 0.02, pm: 0.06 }
  ];
  const PM_START = 50;
  const DEMAND_SCALE = 1.5;
  const CW_CYCLE = 12, CW_WALK = 8;                     // 횡단보도: 12초 주기 중 8초 보행 신호(병목)
  const BUS_LINES = [
    { from: 'S1', to: 'E1', start: 3, every: 12, until: 100 },
    { from: 'E1', to: 'S1', start: 56, every: 15, until: 100 }
  ];

  /* 운전자 유형별 파라미터 평균 (단위: 타일, 초).  1타일/s ≈ 48km/h 로 표기 */
  const TYPES = {
    normal:  { share: 0.70, v0: 1.25, sd: 0.08, T: 0.8,  a: 1.4, b: 4.5, bc: 2.2, tau: 0.12, percep: 1.6,  agg: 1.0, len: 0.26, W: 1 },
    speeder: { share: 0.15, v0: 1.90, sd: 0.12, T: 0.3,  a: 2.2, b: 5.0, bc: 3.0, tau: 0.24, percep: 0.45,  agg: 1.5, len: 0.26, W: 1 },
    novice:  { share: 0.15, v0: 0.78, sd: 0.06, T: 1.2,  a: 0.9, b: 6.0, bc: 2.0, tau: 0.25, percep: 1.6,  agg: 0.8, len: 0.26, W: 1 },
    bus:     { share: 0,    v0: 1.05, sd: 0.03, T: 1.0,  a: 0.8, b: 3.5, bc: 1.6, tau: 0.15, percep: 1.8,  agg: 0.8, len: 0.42, W: 20 }
  };
  const KMH = 48;

  /* ---- 유틸 ---------------------------------------------------------------- */
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0; while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * rng());
  }
  function mod2pi(a) { a %= TWO_PI; return a < 0 ? a + TWO_PI : a; }
  const SIDE_ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  function newTile(base) {
    return {
      base, road: false, orig: false, locked: false, crosswalk: false, term: null,
      wide: false, oneway: -1, guide: false, bus: false, rev: false, round: false, signal: false,
      camera: false, bump: false, barricade: false, overpass: false, bridge: null, tunnel: null
    };
  }
  function parseStage(rows) {
    const tiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = rows[y][x];
      let t;
      if (ch === '~') t = newTile('water');
      else if (ch === '^') t = newTile('rock');
      else if (ch === 'P') t = newTile('park');
      else if (ch === 'B') t = newTile('bldg');
      else if (ch === 'H') t = newTile('house');
      else if (ch === '=') t = newTile('water');
      else if (ch === 'C') t = newTile('site');
      else {
        t = newTile('grass');
        if (ch === '#') { t.road = true; t.orig = true; }
        else if (ch === 'L') { t.road = true; t.orig = true; t.locked = true; }
        else if (ch === 'X') { t.road = true; t.orig = true; t.locked = true; t.crosswalk = true; }
        else if (TERMS[ch]) t.term = TERMS[ch];
      }
      if (ch === '=') { t.road = true; t.orig = true; t.locked = true; }
      tiles.push(t);
    }
    return tiles;
  }
  function cloneTiles(tiles) { return tiles.map(t => Object.assign({}, t)); }

  function tileCost(t, o) {
    let c = 0;
    if (t.road && !o.road) c += COST.road;
    if (!t.road && o.road) c += COST.demolish;
    for (const f of FLAGS) if (t[f]) c += COST[f];
    if (t.oneway >= 0) c += COST.oneway;
    if (t.bridge) c += COST.bridge;
    if (t.tunnel) c += COST.tunnel;
    return c;
  }
  function totalCost(tiles, orig) {
    let c = 0;
    for (let i = 0; i < tiles.length; i++) c += tileCost(tiles[i], orig[i]);
    return c;
  }

  /* 타일 t 가 방향 d 축으로 내놓는 접속 포트(레이어) : 0 지상, 1 고가, 2 지하 */
  function ports(t, d) {
    const ax = (d % 2 === 0) ? 'V' : 'H';
    const p = [];
    if (t.bridge === ax) p.push(1);
    if (t.tunnel === ax) p.push(2);
    if (p.length === 0 && (t.road || t.term)) p.push(0);
    return p;
  }

  /* 정적 그래프: 3차원 다층 그래프 G=(V,E),  노드 id = 타일번호*3 + 레이어 */
  function buildGraph(tiles) {
    const N = W * H * 3;
    const adj = new Array(N), nbr = new Array(N);
    for (let i = 0; i < N; i++) { adj[i] = []; nbr[i] = []; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const idx = y * W + x, ta = tiles[idx];
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nidx = ny * W + nx, tb = tiles[nidx];
        if (ta.term && tb.term) continue;
        const pa = ports(ta, d), pb = ports(tb, d);
        for (const la of pa) for (const lb of pb) {
          if (!(la === lb || (!pb.includes(la) && !pa.includes(lb)))) continue;
          const a = idx * 3 + la, b = nidx * 3 + lb;
          if (!nbr[a].includes(b)) nbr[a].push(b);
          // 방향 제약: 일방통행 · 바리케이드
          if (la === 0) { if (ta.barricade) continue; if (ta.oneway >= 0 && ta.oneway !== d) continue; }
          if (lb === 0) { if (tb.barricade) continue; if (tb.oneway >= 0 && tb.oneway === (d + 2) % 4) continue; }
          adj[a].push({ to: b, d });
        }
      }
    }
    const ctrl = new Uint8Array(N);       // 통행 제어가 필요한 지상 교차 노드
    const degree = new Uint8Array(N);
    for (let i = 0; i < N; i += 3) {
      const t = tiles[i / 3];
      let deg = 0;
      for (const b of nbr[i]) { const tb = tiles[(b / 3) | 0]; if (b % 3 === 0 && tb.barricade) continue; deg++; }
      degree[i] = deg;
      if (t.road && !t.barricade && deg >= 3) ctrl[i] = 1;
    }
    return { adj, nbr, ctrl, degree };
  }

  /* 상충점 지수(Conflict Index): 평면 교차 상충점 수의 합 */
  function conflictIndex(tiles) {
    const g = buildGraph(tiles);
    let sum = 0; const list = [];
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; let c = 0;
      if (g.ctrl[i * 3]) {
        const k = g.degree[i * 3];
        if (t.round) c = k >= 4 ? 8 : 6;
        else if (t.signal) c = k >= 4 ? 8 : 3;
        else c = k >= 4 ? 32 : 9;
      }
      if (t.crosswalk && !t.overpass && t.road && !t.barricade) c += 4;
      if (c) { sum += c; list.push({ idx: i, c }); }
    }
    return { sum, list };
  }

  /* ========================================================================== */
  class Sim {
    constructor(tiles, opt) {
      opt = opt || {};
      this.tiles = cloneTiles(tiles);
      this.seed = opt.seed || 1225;
      this.rng = makeRng(this.seed ^ 0x9E3779B9);
      this.dt = DT; this.t = 0; this.done = false;
      this.cars = []; this.nextId = 1;
      const g = buildGraph(this.tiles);
      this.adj = g.adj; this.nbr = g.nbr; this.ctrl = g.ctrl;
      this.N = W * H * 3;
      this.blockedUntil = new Float32Array(this.N);
      this.edgeMap = new Map(); this.boxMap = new Map(); this.apprMap = new Map();
      this.crashes = []; this.accidents = 0;
      this.finished = []; this.arrived = 0;
      this.series = []; this.nextSample = 1;
      this.heat = new Float32Array(W * H);
      this.termNode = {};
      this.cameras = []; this.sig = {};
      for (let i = 0; i < W * H; i++) {
        const t = this.tiles[i];
        if (t.term) this.termNode[t.term.id] = i * 3;
        if (t.camera && t.road) this.cameras.push([i % W + 0.5, ((i / W) | 0) + 0.5]);
        if (t.signal && this.ctrl[i * 3]) {
          const apps = [];
          for (const b of this.nbr[i * 3]) if (this.adj[b].some(e => e.to === i * 3)) apps.push(b);
          this.sig[i * 3] = { apps, axis: this.dirOf(apps[0], i * 3) % 2, since: 0, clearUntil: 0 };
        }
      }
      // 가변차선 그룹
      this.revFav = new Int8Array(W * H); this.revTrans = new Uint8Array(W * H);
      this.revGroups = [];
      const seen = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        if (!this.tiles[i].rev || !this.tiles[i].road || seen[i]) continue;
        const grp = [], st = [i]; seen[i] = 1;
        while (st.length) {
          const k = st.pop(); grp.push(k);
          const x = k % W, y = (k / W) | 0;
          for (let d = 0; d < 4; d++) {
            const nx = x + DX[d], ny = y + DY[d];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const n = ny * W + nx;
            if (this.tiles[n].rev && this.tiles[n].road && !seen[n]) { seen[n] = 1; st.push(n); }
          }
        }
        for (const k of grp) this.revFav[k] = 1;
        this.revGroups.push({ tiles: grp, fav: 1, trans: false, since: 0, phi: 0.5 });
      }
      this.nextRev = 1;
      this.buildDemand();
    }

    /* ---- 수요 생성: 설계와 무관하게 동일(대조군·실험군 공정 비교) ---- */
    buildDemand() {
      const rng = makeRng(this.seed);
      const ev = [];
      for (const f of FLOWS) {
        let t = rng() * 3;
        while (t < DEMAND_END) {
          const rate = (t < PM_START ? f.am : f.pm) * DEMAND_SCALE;
          const r = rng();
          const type = r < TYPES.normal.share ? 'normal' : r < TYPES.normal.share + TYPES.speeder.share ? 'speeder' : 'novice';
          ev.push({ t, from: f.from, to: f.to, type, z: [gauss(rng), gauss(rng), gauss(rng), gauss(rng)] });
          t += (1 / rate) * (0.55 + 0.9 * rng());
        }
      }
      for (const b of BUS_LINES)
        for (let t = b.start; t < b.until; t += b.every)
          ev.push({ t, from: b.from, to: b.to, type: 'bus', z: [gauss(rng), 0, 0, 0] });
      ev.sort((a, b) => a.t - b.t);
      this.demand = ev; this.demandPtr = 0;
      this.pending = { S1: [], S2: [], E1: [], E2: [] };
      this.totalW = 0; this.totalVeh = ev.length;
      this.mix = { normal: 0, speeder: 0, novice: 0, bus: 0 };
      for (const e of ev) { this.totalW += TYPES[e.type].W; this.mix[e.type]++; }
    }

    tileOf(n) { return this.tiles[(n / 3) | 0]; }
    nx(n) { return ((n / 3) | 0) % W + 0.5; }
    ny(n) { return ((((n / 3) | 0) / W) | 0) + 0.5; }
    dirOf(a, b) {
      const ia = (a / 3) | 0, ib = (b / 3) | 0, dx = ib % W - ia % W, dy = ((ib / W) | 0) - ((ia / W) | 0);
      return dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0;
    }

    lanesTile(n, d) {
      const idx = (n / 3) | 0, t = this.tiles[idx];
      if (t.term) return 2;
      if (t.oneway === d) return 2;
      if (t.wide) return 2;
      if (t.rev) return (this.revFav[idx] === ((d === 1 || d === 2) ? 1 : -1) && !this.revTrans[idx]) ? 2 : 1;
      return 1;
    }
    edgeLanes(a, b, d) {
      if (a % 3 !== 0 || b % 3 !== 0) return 1;
      return Math.min(this.lanesTile(a, d), this.lanesTile(b, d));
    }
    edgeOffsets(a, b, lanes) {
      if (a % 3 !== 0 || b % 3 !== 0) return [0.14];
      const ta = this.tileOf(a), tb = this.tileOf(b);
      if (lanes === 1) return [(ta.rev && tb.rev) ? 0.22 : (ta.rev || tb.rev) ? 0.18 : 0.14];
      if ((ta.wide || ta.term) && (tb.wide || tb.term)) return [0.11, 0.33];
      if (ta.rev || tb.rev) return [0.22, 0.0];
      return [0.14, -0.14];
    }
    busEdge(a, b) { return a % 3 === 0 && b % 3 === 0 && this.tileOf(a).bus && this.tileOf(b).bus; }

    /* ---- BPR 혼잡 비용 + A* ------------------------------------------------ */
    edgeCost(a, b, d, car) {
      let vfree = car.v0;
      if (b % 3 === 0 && this.tileOf(b).bump) vfree = Math.min(vfree, BUMP_LIMIT * 1.4);
      const t0 = 1 / vfree;
      const lanes = this.edgeLanes(a, b, d);
      const list = this.edgeMap.get(a * 512 + b);
      let n = 0;
      if (list) {
        if (lanes === 2 && this.busEdge(a, b)) { for (const o of list) if ((o.lane === 1) === (car.type === 'bus')) n++; }
        else n = list.length;
      }
      const c = 1.2 * (lanes === 2 && this.busEdge(a, b) ? 1 : lanes);
      return t0 * (1 + BPR_ALPHA * Math.pow(n / c, BPR_BETA));
    }
    canUse(a, b, d, car) {
      if (car.type !== 'bus' && this.busEdge(a, b) && this.edgeLanes(a, b, d) === 1) return false;
      return true;
    }
    astar(start, goal, car, forbid) {
      const N = this.N, gs = this._gs || (this._gs = new Float32Array(N)), from = this._from || (this._from = new Int16Array(N));
      const closed = this._closed || (this._closed = new Uint8Array(N));
      gs.fill(Infinity); closed.fill(0);
      const gx = this.nx(goal), gy = this.ny(goal), hk = 1 / car.v0;
      const open = [start]; gs[start] = 0; from[start] = -1;
      let expanded = 0;
      while (open.length) {
        let bi = 0, bf = Infinity;
        for (let k = 0; k < open.length; k++) {
          const n = open[k];
          const f = gs[n] + (Math.abs(this.nx(n) - gx) + Math.abs(this.ny(n) - gy)) * hk;
          if (f < bf) { bf = f; bi = k; }
        }
        const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
        if (closed[cur]) continue;
        closed[cur] = 1; expanded++;
        if (cur === goal) break;
        for (const e of this.adj[cur]) {
          const b = e.to;
          if (closed[b]) continue;
          if (cur === start && b === forbid) continue;
          if (b !== goal && this.tileOf(b).term) continue;
          if (this.blockedUntil[b] > this.t && b !== goal) continue;
          if (!this.canUse(cur, b, e.d, car)) continue;
          const g2 = gs[cur] + this.edgeCost(cur, b, e.d, car);
          if (g2 < gs[b]) { gs[b] = g2; from[b] = cur; open.push(b); }
        }
      }
      this.lastExpanded = expanded;
      if (!closed[goal]) return null;
      const path = []; let n = goal;
      while (n !== -1) { path.push(n); n = from[n]; }
      path.reverse();
      return path;
    }

    /* ---- 차량 생성 --------------------------------------------------------- */
    spawn() {
      const t = this.t;
      while (this.demandPtr < this.demand.length && this.demand[this.demandPtr].t <= t) {
        const e = this.demand[this.demandPtr++];
        this.pending[e.from].push(e);
      }
      for (const id in this.pending) {
        const q = this.pending[id];
        if (!q.length) continue;
        const e = q[0], P = TYPES[e.type];
        const start = this.termNode[id], goal = this.termNode[e.to];
        const proto = { v0: P.v0, type: e.type };
        const path = this.astar(start, goal, proto, -1);
        if (!path || path.length < 2) continue;
        const d = this.dirOf(path[0], path[1]);
        const lanes = this.edgeLanes(path[0], path[1], d);
        const list = this.edgeMap.get(path[0] * 512 + path[1]) || [];
        let lane = -1;
        for (let l = 0; l < lanes && lane < 0; l++) {
          let ok = true;
          for (const o of list) if (o.lane === l && o.s < 0.62) { ok = false; break; }
          if (ok) lane = l;
        }
        if (lane < 0) continue;
        q.shift();
        const c = {
          id: this.nextId++, type: e.type, W: P.W, len: P.len,
          v0: Math.max(0.4, P.v0 + P.sd * e.z[0]),
          T: Math.max(0.2, P.T * (1 + 0.12 * e.z[1])),
          a: Math.max(0.4, P.a * (1 + 0.10 * e.z[2])),
          b: P.b, bc: Math.max(1, P.bc * (1 + 0.08 * e.z[3])),
          tau: P.tau, percep: P.percep, agg: P.agg,
          path, i: 0, s: 0.2, v: P.v0 * 0.5, vt: P.v0, nextSample: 0,
          lane, off: this.edgeOffsets(path[0], path[1], lanes)[lane], eLanes: lanes,
          nextLane: 0, nextOff: 0.14, prev: -1, prevOff: 0.14,
          tWant: e.t, tSpawn: t, dest: goal, from: id, to: e.to,
          arrNode: -1, arrEdge: -1, arrT: 0, front: false,
          hesNode: -1, hesStart: -1, hesDur: 0, panicUntil: 0, panicNode: -1,
          crashed: false, crashT: 0, box: -1, boxIn: -1, commit: -1,
          nextPlan: t + 1.5 + this.rng() * 2, x: 0, y: 0, ang: 0, ttc: 99, calm: false, gone: false
        };
        this.planLane(c);
        this.locate(c);
        this.cars.push(c);
        list.push(c); this.edgeMap.set(path[0] * 512 + path[1], list);
      }
    }

    /* ---- 인덱싱 ------------------------------------------------------------ */
    index() {
      const em = this.edgeMap, bm = this.boxMap, am = this.apprMap, t = this.t;
      em.clear(); bm.clear(); am.clear();
      for (const c of this.cars) {
        const A = c.path[c.i], B = c.path[c.i + 1], key = A * 512 + B;
        let l = em.get(key); if (!l) em.set(key, l = []); l.push(c);
        c.box = -1; c.front = false;
        if (c.s >= SB && this.ctrl[B]) { c.box = B; c.boxIn = A; }
        else if (c.s < 1 - SB && c.prev >= 0 && this.ctrl[A]) { c.box = A; c.boxIn = c.prev; }
        if (c.box >= 0) { let b = bm.get(c.box); if (!b) bm.set(c.box, b = []); b.push(c); }
      }
      for (const [key, list] of em) {
        const B = key % 512;
        if (!this.ctrl[B]) continue;
        let best = null;
        for (const c of list) if (c.box < 0 && (!best || c.s > best.s)) best = c;
        // 차선이 둘이면 차선별 선두
        for (const c of list) {
          if (c.box >= 0 || c.crashed) continue;
          let isFront = true;
          for (const o of list) if (o !== c && o.box < 0 && o.lane === c.lane && o.s > c.s) { isFront = false; break; }
          if (!isFront || c.s < 0.35) continue;
          c.front = true;
          if (c.arrNode !== B || c.arrEdge !== key) { c.arrNode = B; c.arrEdge = key; c.arrT = t; }
          let a = am.get(B); if (!a) am.set(B, a = []); a.push(c);
        }
      }
    }

    cwActive(idx) {
      const t = this.tiles[idx];
      if (!t.crosswalk || t.overpass) return false;
      return ((this.t + (idx * 3.7) % CW_CYCLE) % CW_CYCLE) < CW_WALK;
    }

    updateControls() {
      const t = this.t;
      // 감응식 신호등: 접근로별 시분할(TDM)
      for (const key in this.sig) {
        const B = +key, sg = this.sig[key];
        const demand = a => { const l = this.edgeMap.get(a * 512 + B); if (!l) return false; for (const c of l) if (c.s > 0.25 && c.s < SB && !c.crashed) return true; return false; };
        let cur = false, other = false;
        for (const a of sg.apps) { if (!demand(a)) continue; if (this.dirOf(a, B) % 2 === sg.axis) cur = true; else other = true; }
        const el = t - sg.since;
        if (other && ((el > 9) || (el > 2.2 && !cur))) { sg.axis = 1 - sg.axis; sg.since = t; sg.clearUntil = t + 0.5; }
      }
      // 가변차선: 방향별 밀도 비율 Φ 에 따라 중앙 차로 방향 전환
      if (t >= this.nextRev) {
        this.nextRev = t + 0.5;
        for (const g of this.revGroups) {
          let pos = 0, neg = 0, centerBusy = false;
          const set = new Set(g.tiles);
          for (const c of this.cars) {
            const A = c.path[c.i], B = c.path[c.i + 1];
            if (A % 3 || B % 3) continue;
            if (!set.has(A / 3) && !set.has(B / 3)) continue;
            const d = this.dirOf(A, B), sgn = (d === 1 || d === 2) ? 1 : -1;
            if (sgn > 0) pos++; else neg++;
            if (c.lane === 1 && c.eLanes === 2 && set.has(A / 3) && set.has(B / 3)) centerBusy = true;
          }
          g.phi = (pos + neg) ? pos / (pos + neg) : 0.5;
          if (g.trans) {
            if (t - g.since > 2 && !centerBusy) { g.trans = false; for (const k of g.tiles) this.revTrans[k] = 0; }
          } else if (t - g.since > 6) {
            const want = (g.fav > 0 && neg > pos * 1.4 + 1) ? -1 : (g.fav < 0 && pos > neg * 1.4 + 1) ? 1 : g.fav;
            if (want !== g.fav) { g.fav = want; g.trans = true; g.since = t; for (const k of g.tiles) { this.revFav[k] = want; this.revTrans[k] = 1; } }
          }
        }
      }
    }

    /* ---- 차로 선택 --------------------------------------------------------- */
    planLane(c) {
      const B = c.path[c.i + 1], C = c.path[c.i + 2];
      if (C === undefined) { c.nextLane = 0; c.nextOff = 0.14; return; }
      const d = this.dirOf(B, C), lanes = this.edgeLanes(B, C, d);
      const offs = this.edgeOffsets(B, C, lanes);
      let lane = 0;
      if (lanes === 2) {
        if (this.busEdge(B, C)) lane = c.type === 'bus' ? 1 : 0;
        else {
          const list = this.edgeMap.get(B * 512 + C) || [];
          const cur = this.edgeMap.get(c.path[c.i] * 512 + B) || [];
          let best = -1e9;
          for (let l = 0; l < 2; l++) {
            let room = 2;
            for (const o of list) if (o.lane === l) room = Math.min(room, o.s + (o.v < 0.3 ? -0.5 : 0));
            for (const o of cur) if (o !== c && o.lane === l && o.s > c.s) room = Math.min(room, o.s - c.s + (o.v < c.v * 0.7 ? -0.3 : 0.2));
            let score = room;
            if (c.eLanes === 2) {
              if (l === c.lane) score += 0.35;
              else for (const o of cur) if (o !== c && o.lane === l && Math.abs(o.s - c.s) < 0.45) { score -= 10; break; }
            } else if (l === (c.type === 'speeder' ? 0 : 1)) score += 0.1;
            if (score > best) { best = score; lane = l; }
          }
        }
      }
      c.nextLane = lane; c.nextOff = offs[lane];
    }

    guideFactor(A, B) { return (this.tileOf(B).guide || (A % 3 === 0 && this.tileOf(A).guide)) ? 0.2 : 1; }

    outSpace(c, B, C) {
      if (C === undefined) return true;
      const list = this.edgeMap.get(B * 512 + C);
      if (!list) return true;
      for (const o of list) {
        // 교차로 박스를 완전히 빠져나갈 공간이 없으면 진입하지 않는다(꼬리물기 금지)
        if (o.v < 0.25 && o.s < (1 - SB) + 0.09 + (o.len + c.len) / 2) {
          if (o.eLanes === 2 && o.lane !== c.nextLane) continue;
          return false;
        }
      }
      return true;
    }
    hesitating(o) { return o.hesStart >= 0 && this.t - o.hesStart < o.hesDur; }

    /* 회전교차로 내 차량의 현재 각도 θ 와 남은 회전량 */
    roundState(o, B) {
      let A, C, w;
      if (o.path[o.i + 1] === B) { A = o.path[o.i]; C = o.path[o.i + 2]; w = (o.s - SB) / (2 * (1 - SB)); }
      else { A = o.prev; C = o.path[o.i + 1]; w = 0.5 + o.s / (2 * (1 - SB)); }
      const g = this.roundGeom(A, B, C);
      const dist = Math.max(0, w) * g.L;
      let th;
      if (dist < g.L1) th = g.te; else if (dist < g.L1 + g.La) th = g.te - (dist - g.L1) / ROUND_R; else th = g.te - g.sweep;
      return { th, rem: th - (g.te - g.sweep), exiting: dist >= g.L1 + g.La };
    }
    roundGeom(A, B, C) {
      const din = this.dirOf(A, B), dout = C === undefined ? din : this.dirOf(B, C);
      const te = SIDE_ANG[(din + 2) % 4] - ROUND_DELTA, tx = SIDE_ANG[dout] + ROUND_DELTA;
      let sweep = mod2pi(te - tx); if (sweep < 0.05) sweep += TWO_PI;
      const L1 = 0.12, La = ROUND_R * sweep, L3 = 0.12;
      return { te, sweep, L1, La, L3, L: L1 + La + L3, din, dout };
    }

    canEnter(c, A, B) {
      const tb = this.tileOf(B), t = this.t;
      const box = this.boxMap.get(B) || [];
      const C = c.path[c.i + 2];
      const calm = c.calm;
      if (!this.outSpace(c, B, C)) return false;
      if (tb.signal && this.sig[B]) {
        const sg = this.sig[B];
        const din = this.dirOf(A, B);
        if (din % 2 !== sg.axis || t < sg.clearUntil) return false;
        const left = d => d === (din + 3) % 4;
        const myOut = C === undefined ? din : this.dirOf(B, C);
        const myLeft = left(myOut);
        for (const o of box) {
          if (o.boxIn === A) continue;
          const od = this.dirOf(o.boxIn, B);
          if (od !== (din + 2) % 4) return false;                        // 직각 방향 잔류 차량
          const oOutN = o.path[o.i + 1] === B ? o.path[o.i + 2] : o.path[o.i + 1];
          const oOut = oOutN === undefined ? od : this.dirOf(B, oOutN);
          if (myLeft || oOut === (od + 3) % 4 || oOutN === C) return false; // 좌회전·합류 상충
        }
        const wait = this.apprMap.get(B);
        if (wait) for (const o of wait) {
          if (o === c || o.path[o.i] === A) continue;
          const od = this.dirOf(o.path[o.i], B);
          if (od !== (din + 2) % 4 || !this.outSpace(o, B, o.path[o.i + 2])) continue;
          const oOutN = o.path[o.i + 2];
          const oLeft = oOutN !== undefined && this.dirOf(B, oOutN) === (od + 3) % 4;
          const oPrio = oLeft && t - o.arrT > 2.5;
          if (myLeft) {
            const iPrio = t - c.arrT > 2.5;
            if (oLeft) { if (o.arrT < c.arrT || (o.arrT === c.arrT && o.id < c.id)) return false; }
            else if (!(iPrio && (o.v < 0.5 || o.s < 0.45))) return false; // 비보호 좌회전: 대향 직진에 양보
          } else if (oPrio || oOutN === C) { if (oPrio || o.arrT < c.arrT) return false; }
        }
        return true;
      }
      if (tb.round) {
        if (box.length >= 4) return false;
        const te = this.roundGeom(A, B, C).te;
        const others = box.slice();
        const ap = this.apprMap.get(B);
        if (ap) for (const o of ap) if (o !== c && o.commit === B) others.push(o);
        if (c.commit === B) return true;
        for (const o of others) {
          const st = this.roundState(o, B);
          const up = mod2pi(st.th - te);
          if (up < 2.2 && st.rem > up - 0.3) return false;
          if (mod2pi(te - st.th) < 1.5 && !st.exiting) return false;
          if (o.boxIn === A && o.path[o.i + 1] === B) return false;
        }
        return true;
      }
      for (const o of box) if (!this.compatible(c, A, B, C, o)) return false;
      if (c.front && t - c.arrT > 8) return true;                       // 교착 방지: 오래 기다린 선두 차량 우선
      if (c.type === 'speeder' && !calm && c.v > 0.75) return true;     // 난폭 운전: 양보 없이 진입
      const wait = this.apprMap.get(B);
      if (wait) for (const o of wait) {
        if (o === c || o.path[o.i] === A) continue;
        if (this.hesitating(o) || !this.outSpace(o, B, o.path[o.i + 2])) continue;
        if (this.compatible(c, A, B, C, o)) continue;
        if (box.length > 0 && t - o.arrT > 1.5) return false;
        if (o.arrT < c.arrT || (o.arrT === c.arrT && o.id < c.id)) return false;
      }
      return true;
    }
    /* 서로 마주 보는 접근로의 직진·우회전끼리는 상충하지 않는다 */
    compatible(c, A, B, C, o) {
      const oIn = o.path[o.i + 1] === B ? o.path[o.i] : o.boxIn;
      if (oIn === A) return true;
      const din = this.dirOf(A, B), od = this.dirOf(oIn, B);
      if (od !== (din + 2) % 4) return false;
      const oOutN = o.path[o.i + 1] === B ? o.path[o.i + 2] : o.path[o.i + 1];
      if (oOutN === undefined || C === undefined || oOutN === C) return false;
      return this.dirOf(B, C) !== (din + 3) % 4 && this.dirOf(B, oOutN) !== (od + 3) % 4;
    }

    /* ---- 목표 속도 계산 (차량 추종 + 정지선 + 속도 제한) --------------------- */
    target(c) {
      const t = this.t, A = c.path[c.i], B = c.path[c.i + 1], C = c.path[c.i + 2];
      const tA = this.tileOf(A), tB = this.tileOf(B);
      // 과속카메라 단속 구역
      c.calm = false;
      for (const cam of this.cameras) { const dx = cam[0] - c.x, dy = cam[1] - c.y; if (dx * dx + dy * dy < CAM_RADIUS * CAM_RADIUS) { c.calm = true; break; } }
      const calm = c.calm;
      const vmax = calm ? Math.min(c.v0, CAM_LIMIT) : c.v0;
      const agg = calm ? Math.min(c.agg, 1) : c.agg;
      const percep = calm ? Math.max(c.percep, 1.6) : c.percep;
      const T = calm ? Math.max(c.T, 1.0) : c.T;
      const bc = c.bc;
      let vt = vmax;
      const lim = (vl, d) => { const v = d <= 0 ? vl : Math.sqrt(vl * vl + 2 * bc * d); if (v < vt) vt = v; };
      const stop = (d, p) => { if (d <= (p || percep) || c.v < 0.4) { const v = Math.sqrt(2 * bc * Math.max(0, d)); if (v < vt) vt = v; } };

      if (c.panicUntil > t) return -1;                          // 초보 급정거

      // 과속방지턱
      if (A % 3 === 0 && tA.bump && c.s < 0.5) lim(BUMP_LIMIT, 0);
      if (B % 3 === 0 && tB.bump) lim(BUMP_LIMIT, 0.5 - c.s);
      if (C !== undefined && C % 3 === 0 && this.tileOf(C).bump) lim(BUMP_LIMIT, 1.5 - c.s);

      const din = this.dirOf(A, B);
      // 교차로/커브 통과 속도
      const boxLim = (n, d1, d2) => {
        if (n % 3 !== 0) return Infinity;
        const tn = this.tileOf(n);
        if (tn.round && this.ctrl[n]) return 0.9;
        const turn = d1 !== d2;
        if (this.ctrl[n] && !tn.signal) return (turn ? 0.85 : 1.2) * agg;
        return turn ? 1.0 * agg : Infinity;
      };
      if (C !== undefined) lim(boxLim(B, din, this.dirOf(B, C)), SB - c.s);
      if (c.prev >= 0 && c.s < 1 - SB) lim(boxLim(A, this.dirOf(c.prev, A), din), 0);

      // 다음 차로 계획(박스 진입 전까지 갱신)
      if (c.s < SB) this.planLane(c);

      // 통행 제어 노드 진입 판단
      if (this.ctrl[B] && c.s < SB) {
        let ok = this.canEnter(c, A, B);
        const plain = !tB.signal;
        if (c.type === 'novice' && plain) {
          if (c.hesNode !== B) {
            c.hesNode = B; c.hesStart = -1;
            c.hesDur = Math.max(0.3, 1.9 + 0.5 * gauss(this.rng)) * this.guideFactor(A, B) * (tB.round ? 0.6 : 1);
          }
          if (ok && c.front && c.s > 0.4) {                      // 판단 지연 τ_delay
            if (c.hesStart < 0) c.hesStart = t;
            if (t - c.hesStart < c.hesDur) ok = false;
          } else if (c.hesStart >= 0 && t - c.hesStart < c.hesDur) ok = false;
        }
        c.commit = (ok && tB.round && c.s >= 0.5) ? B : -1;
        if (!ok) stop(SB - 0.03 - c.len / 2 - (tB.round ? 0.12 : 0) - c.s, tB.signal ? 1.6 : 0);
      }
      // 횡단보도 보행 신호
      if (B % 3 === 0 && this.cwActive((B / 3) | 0) && c.s <= 0.72) stop(0.70 - c.len / 2 + 0.13 - c.s, 1.6);
      // 사고로 막힌 타일
      if (this.blockedUntil[B] > t && c.s < 0.6) stop(0.55 - c.s, 1.6);

      // 선행 차량 탐색
      let gap = Infinity, vL = 0;
      const inRound = c.box >= 0 && this.tileOf(c.box).round;
      const merge = C !== undefined && c.eLanes === 2 && this.edgeLanes(B, C, this.dirOf(B, C)) === 1 && c.s > 0.3;
      const cur = this.edgeMap.get(A * 512 + B);
      if (cur) for (const o of cur) {
        if (o === c) continue;
        if (!(o.s > c.s || (o.s === c.s && o.id < c.id))) continue;
        if (!(o.lane === c.lane || merge || c.eLanes === 1 || o.eLanes === 1)) continue;
        if (inRound && o.box === c.box) continue;
        const g = o.s - c.s - (o.len + c.len) / 2;
        if (g < gap) { gap = g; vL = o.v; }
      }
      if (C !== undefined) {
        const nl = this.edgeMap.get(B * 512 + C);
        if (nl) for (const o of nl) {
          if (o.eLanes === 2 && o.lane !== c.nextLane) continue;
          if (inRound && o.box === c.box) continue;
          const g = (1 - c.s) + o.s - (o.len + c.len) / 2;
          if (g < gap) { gap = g; vL = o.v; }
        }
        const D = c.path[c.i + 3];
        if (D !== undefined && gap > 1.2) {
          const nl2 = this.edgeMap.get(C * 512 + D);
          if (nl2) for (const o of nl2) {
            if (o.eLanes === 2) continue;
            const g = (2 - c.s) + o.s - (o.len + c.len) / 2;
            if (g < gap) { gap = g; vL = o.v; }
          }
        }
      }
      // 회전교차로 내부 추종
      if (c.box >= 0 && this.tileOf(c.box).round) {
        const me = this.roundState(c, c.box);
        for (const o of this.boxMap.get(c.box)) {
          if (o === c) continue;
          const st = this.roundState(o, c.box);
          const down = mod2pi(me.th - st.th);
          if (down > 2.0 || (down === 0 && o.id > c.id)) continue;
          const v = down < 1.5 ? 0 : o.v; if (v < vt) vt = v;
        }
      }
      if (gap < Infinity) {
        const g = gap - 0.07;
        const dsafe = Math.max(0.15, T * vmax);
        const v1 = vmax * Math.max(0, g / dsafe);               // 단순화 IDM
        const v2 = Math.sqrt(2 * bc * Math.max(0, g)) + 0.8 * vL; // 안전 제동 속도
        vt = Math.min(vt, v1, v2);
        const closing = c.v - vL;
        c.ttc = closing > 0.05 ? Math.max(0, gap) / closing : 99;
      } else c.ttc = 99;
      return vt;
    }

    /* ---- 좌표 계산 --------------------------------------------------------- */
    lanePt(a, b, s, off) {
      const ax = this.nx(a), ay = this.ny(a), dx = this.nx(b) - ax, dy = this.ny(b) - ay;
      return [ax + dx * s - dy * off, ay + dy * s + dx * off];
    }
    curve(P, Q, din, dout, w, node) {
      const tn = this.tileOf(node);
      if (node % 3 === 0 && tn.round && this.ctrl[node]) {
        const cx = this.nx(node), cy = this.ny(node);
        const te = SIDE_ANG[(din + 2) % 4] - ROUND_DELTA, tx = SIDE_ANG[dout] + ROUND_DELTA;
        let sweep = mod2pi(te - tx); if (sweep < 0.05) sweep += TWO_PI;
        const E = [cx + ROUND_R * Math.cos(te), cy + ROUND_R * Math.sin(te)];
        const X = [cx + ROUND_R * Math.cos(te - sweep), cy + ROUND_R * Math.sin(te - sweep)];
        const L1 = 0.12, La = ROUND_R * sweep, L = L1 + La + 0.12, dist = w * L;
        if (dist < L1) { const u = dist / L1; return [P[0] + (E[0] - P[0]) * u, P[1] + (E[1] - P[1]) * u, Math.atan2(E[1] - P[1], E[0] - P[0])]; }
        if (dist < L1 + La) { const th = te - (dist - L1) / ROUND_R; return [cx + ROUND_R * Math.cos(th), cy + ROUND_R * Math.sin(th), th - Math.PI / 2]; }
        const u = (dist - L1 - La) / 0.12; return [X[0] + (Q[0] - X[0]) * u, X[1] + (Q[1] - X[1]) * u, Math.atan2(Q[1] - X[1], Q[0] - X[0])];
      }
      let cx, cy;
      if (din === dout || din === (dout + 2) % 4) { cx = (P[0] + Q[0]) / 2; cy = (P[1] + Q[1]) / 2; }
      else if (din % 2 === 1) { cx = Q[0]; cy = P[1]; } else { cx = P[0]; cy = Q[1]; }
      const u = 1 - w;
      const x = u * u * P[0] + 2 * u * w * cx + w * w * Q[0], y = u * u * P[1] + 2 * u * w * cy + w * w * Q[1];
      const tx = 2 * u * (cx - P[0]) + 2 * w * (Q[0] - cx), ty = 2 * u * (cy - P[1]) + 2 * w * (Q[1] - cy);
      return [x, y, (tx || ty) ? Math.atan2(ty, tx) : SIDE_ANG[dout]];
    }
    locate(c) {
      const A = c.path[c.i], B = c.path[c.i + 1], C = c.path[c.i + 2];
      const din = this.dirOf(A, B);
      let r;
      if (c.s >= SB && C !== undefined) {
        const P = this.lanePt(A, B, SB, c.off), Q = this.lanePt(B, C, 1 - SB, c.nextOff);
        r = this.curve(P, Q, din, this.dirOf(B, C), (c.s - SB) / (2 * (1 - SB)), B);
      } else if (c.s < 1 - SB && c.prev >= 0) {
        const P = this.lanePt(c.prev, A, SB, c.prevOff), Q = this.lanePt(A, B, 1 - SB, c.off);
        r = this.curve(P, Q, this.dirOf(c.prev, A), din, 0.5 + c.s / (2 * (1 - SB)), A);
      } else {
        const p = this.lanePt(A, B, c.s, c.off); r = [p[0], p[1], SIDE_ANG[din]];
      }
      c.x = r[0]; c.y = r[1]; c.ang = r[2];
      c.layer = (c.s < 0.5 ? A : B) % 3;
    }

    /* 같은 간선(또는 연속 간선) 위 앞뒤 관계면 진행거리 차이를, 나란한 다른 차로면 -1, 무관하면 null */
    tandem(a, b) {
      const aA = a.path[a.i], aB = a.path[a.i + 1], bA = b.path[b.i], bB = b.path[b.i + 1];
      if (a.box >= 0 && a.box === b.box && (a.boxIn !== b.boxIn || this.tileOf(a.box).round)) return null;
      if (aA === bA && aB === bB) {
        if (a.lane !== b.lane && a.eLanes === 2 && b.eLanes === 2) return -1;
        return Math.abs(a.s - b.s);
      }
      if (aB === bA && a.path[a.i + 2] === bB) return (b.eLanes === 2 && b.lane !== a.nextLane) ? -1 : 1 - a.s + b.s;
      if (bB === aA && b.path[b.i + 2] === aB) return (a.eLanes === 2 && a.lane !== b.nextLane) ? -1 : 1 - b.s + a.s;
      return null;
    }

    opposing(a, b) {
      const tri = c => c.s >= 0.5 ? [c.path[c.i], c.path[c.i + 1], c.path[c.i + 2]] : [c.prev, c.path[c.i], c.path[c.i + 1]];
      if (a.path[a.i] === b.path[b.i + 1] && a.path[a.i + 1] === b.path[b.i]) return true;
      const p = tri(a), q = tri(b);
      return p[1] === q[1] && p[0] === q[2] && p[2] === q[0];
    }

    /* ---- 사고 판정 --------------------------------------------------------- */
    detectCrashes() {
      const cars = this.cars, n = cars.length, t = this.t;
      for (let i = 0; i < n; i++) {
        const a = cars[i];
        if (a.gone) continue;
        const aTerm = (a.prev < 0 && a.s < 0.4) || (a.i + 2 === a.path.length && a.s > 0.6);
        if (aTerm) continue;
        for (let j = i + 1; j < n; j++) {
          const b = cars[j];
          if (b.gone || (a.crashed && b.crashed) || a.layer !== b.layer) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 > 0.2) continue;
          if ((b.prev < 0 && b.s < 0.4) || (b.i + 2 === b.path.length && b.s > 0.6)) continue;
          const L = (a.len + b.len) / 2;
          const ca = Math.cos(a.ang), sa = Math.sin(a.ang);
          const dot = ca * Math.cos(b.ang) + sa * Math.sin(b.ang);
          let hit;
          const tan = this.tandem(a, b);
          if (tan !== null) hit = tan >= 0 && tan < L * 0.72;          // 같은 경로 앞뒤 차량: 진행거리 기준 추돌
          else if (Math.abs(dot) > 0.9) {
            const lon = Math.abs(dx * ca + dy * sa), lat = Math.abs(-dx * sa + dy * ca);
            hit = lat < 0.1 && lon < L * 0.72;
          } else hit = d2 < (L * 0.62) * (L * 0.62);
          if (!hit) continue;
          if (tan === null && this.opposing(a, b)) continue;                  // 마주 오는 반대 차로
          if (tan === null && a.layer === 0 && Math.max(a.v, b.v) < 1.3) {      // 회전교차로 안의 저속 합류 접촉은 사고로 보지 않음
            const ia = Math.floor(a.y) * W + Math.floor(a.x), ib = Math.floor(b.y) * W + Math.floor(b.x);
            if (ia === ib && this.tiles[ia].round) continue;
          }
          const fresh = !a.crashed && !b.crashed;
          const ttc = Math.min(a.ttc, b.ttc);
          for (const c of [a, b]) if (!c.crashed) {
            c.crashed = true; c.crashT = t; c.v = 0; c.vt = 0;
            const node = c.s < 0.5 ? c.path[c.i] : c.path[c.i + 1];
            if (!this.tileOf(node).term) this.blockedUntil[node] = t + CLEAR_TIME;
          }
          if (fresh) {
            this.accidents++;
            this.crashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t, ttc, types: [a.type, b.type], rear: Math.abs(dot) > 0.9 });
          }
          for (const c of cars) c.nextPlan = Math.min(c.nextPlan, t + 0.2);
        }
      }
    }

    /* ---- 한 스텝 ----------------------------------------------------------- */
    step() {
      if (this.done) return;
      const dt = this.dt; this.t += dt; const t = this.t;
      this.index();
      this.spawn();
      this.updateControls();
      const cars = this.cars;
      for (const c of cars) if (!c.crashed) c._vt = this.target(c);
      for (const c of cars) {
        if (c.crashed) continue;
        if (c._vt < 0) { c.vt = 0; c.v = Math.max(0, c.v - 7 * dt); }
        else {
          if (t >= c.nextSample) { c.vt = c._vt; c.nextSample = t + c.tau; }   // 반응 지연 τ
          const dv = c.vt - c.v;
          c.v = Math.max(0, c.v + Math.max(-c.b * dt, Math.min(c.a * dt, dv)));
        }
        let scale = 1;
        if (c.box >= 0 && this.tileOf(c.box).round) {
          const inPart = c.path[c.i + 1] === c.box;
          const g = this.roundGeom(inPart ? c.path[c.i] : c.prev, c.box, inPart ? c.path[c.i + 2] : c.path[c.i + 1]);
          scale = Math.min(1, 0.6 / g.L);
        }
        c.stopT = c.v < 0.05 ? (c.stopT || 0) + dt : 0;
        const before = c.s;
        c.s += c.v * dt * scale;
        const B = c.path[c.i + 1];
        // 초보 운전자 조향 판단 오류 P_err → 교차로 한가운데 급정거
        if (c.type === 'novice' && before < SB && c.s >= SB && this.ctrl[B] && !this.tileOf(B).signal && c.panicNode !== B) {
          c.panicNode = B;
          const p = 0.3 * this.guideFactor(c.path[c.i], B) * (this.tileOf(B).round ? 0.5 : 1);
          if (this.rng() < p) c.panicUntil = t + 1.3;
        }
        if (c.i + 2 === c.path.length && c.s >= 0.8) {
          c.gone = true; this.arrived++;
          this.finished.push({ W: c.W, dur: t - c.tWant, type: c.type, crashed: false });
          continue;
        }
        if (c.s >= 1) {
          c.prev = c.path[c.i]; c.prevOff = c.off; c.i++; c.s -= 1;
          c.lane = c.nextLane; c.off = c.nextOff;
          const A2 = c.path[c.i], B2 = c.path[c.i + 1];
          c.eLanes = Math.max(c.lane + 1, this.edgeLanes(A2, B2, this.dirOf(A2, B2)));
          this.planLane(c);
        }
        // 동적 경로 재탐색
        if (t >= c.nextPlan && c.s < 0.5 && c.box < 0) {
          c.nextPlan = t + 2.5 + this.rng();
          const Bn = c.path[c.i + 1];
          if (Bn !== c.dest) {
            const np = this.astar(Bn, c.dest, c, c.path[c.i]);
            if (np) { c.path.length = c.i + 1; for (const n of np) c.path.push(n); this.planLane(c); }
          }
        }
        this.locate(c);
      }
      this.detectCrashes();
      // 수습 완료된 사고 차량 제거
      let any = false;
      for (const c of cars) {
        if (c.crashed && !c.gone && t - c.crashT > CLEAR_TIME) {
          c.gone = true;
          this.finished.push({ W: c.W, dur: t - c.tWant + CRASH_PENALTY, type: c.type, crashed: true });
        }
        if (c.gone) any = true;
      }
      if (any) this.cars = cars.filter(c => !c.gone);
      // 히트맵
      const heat = this.heat;
      for (let i = 0; i < heat.length; i++) heat[i] *= 0.97;
      for (const c of this.cars) {
        if (c.layer !== 0) continue;
        const idx = Math.floor(c.y) * W + Math.floor(c.x);
        if (idx >= 0 && idx < heat.length) heat[idx] += 0.03 * (0.25 + 0.75 * (1 - Math.min(1, c.v / c.v0)));
      }
      if (t >= this.nextSample) {
        this.nextSample += 1;
        const m = this.metrics();
        this.series.push({ t: Math.round(t), pc: m.perCapita, veh: m.perVehicle, acc: this.accidents });
      }
      if (t >= SIM_END) this.done = true;
    }

    /* 인당 평균 통행시간  T̄ = Σ W_i·t_i / Σ W_i  (미도착·대기 차량 포함) */
    metrics() {
      const t = this.t;
      let sw = 0, st = 0, n = 0, sn = 0, busT = 0, busN = 0;
      const add = (W, dur, type) => { sw += W; st += W * dur; n++; sn += dur; if (type === 'bus') { busT += dur; busN++; } };
      for (const f of this.finished) add(f.W, f.dur, f.type);
      for (const c of this.cars) add(c.W, t - c.tWant, c.type);
      let waiting = 0;
      for (const id in this.pending) for (const e of this.pending[id]) { add(TYPES[e.type].W, t - e.t, e.type); waiting++; }
      return {
        perCapita: sw ? st / sw : 0, perVehicle: n ? sn / n : 0, busAvg: busN ? busT / busN : 0,
        accidents: this.accidents, arrived: this.arrived, active: this.cars.length, waiting, total: this.totalVeh
      };
    }
    run() { while (!this.done) this.step(); return this.metrics(); }
  }

  const api = {
    W, H, DX, DY, SB, DT, SIM_END, DEMAND_END, PM_START, BUDGET, COST, FLAGS, TYPES, KMH, STAGE1, TERMS,
    CAM_RADIUS, ROUND_R, BPR_ALPHA, BPR_BETA,
    parseStage, cloneTiles, newTile, tileCost, totalCost, buildGraph, conflictIndex, Sim
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlowSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
