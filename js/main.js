/* FLOW LAB — 게임 컨트롤러
 * 관찰(고치기 전) → 설계(흑백 탑뷰) → 실행(컬러 대각 뷰), 편집 도구, 상태 띠, 목표(별), 터치 입력 */
(function () {
  'use strict';
  const F = window.FlowSim, R = window.FlowRender, W = F.W, H = F.H;
  const $ = id => document.getElementById(id);
  const SEED = 1225, PRED_SEED = 7, STORE = 'flowlab.stage1.v3';

  /* 목표: 앞 단계를 달성해야 다음 별을 받는다. 뒤로 갈수록 어렵다. */
  const PURPLE_BUDGET = 1200;
  const GOALS = [
    { text: '평균 이동시간 24초 이하', ok: (m) => m.perCapita <= 24, show: m => m.perCapita.toFixed(1) + '초' },
    { text: '사고 없이', ok: (m) => m.accidents === 0, show: m => m.accidents + '건' },
    { text: '평균 이동시간 20초 이하', ok: (m) => m.perCapita <= 20, show: m => m.perCapita.toFixed(1) + '초' },
    { text: '17초 이하를 예산 $1,200 안에서', purple: true, ok: (m, c) => m.perCapita <= 17 && c <= PURPLE_BUDGET, show: (m, c) => '$' + c.toLocaleString() }
  ];
  const TARGET = 24;
  function grade(m, c) { let n = 0; while (n < GOALS.length && GOALS[n].ok(m, c)) n++; return n; }

  /* ---------- 그림 문자(직접 그린 SVG) ---------- */
  const S = (body, vb) => `<svg viewBox="0 0 ${vb || 32} ${vb || 32}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const ln = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const UI = {
    help: S('<path d="M8.5 9a3.6 3.6 0 1 1 5.2 3.2c-1 .6-1.7 1.3-1.7 2.6" stroke="currentColor" stroke-width="2.4" ' + ln + '/><circle cx="12" cy="18.6" r="1.5" fill="currentColor"/>', 24),
    chart: S('<rect x="3" y="12" width="4.5" height="9" rx="1" fill="currentColor"/><rect x="9.75" y="6" width="4.5" height="15" rx="1" fill="currentColor"/><rect x="16.5" y="3" width="4.5" height="18" rx="1" fill="currentColor"/>', 24),
    rewind: S('<path d="M11 6v12L3 12zM21 6v12l-8-6z" fill="currentColor"/>', 24),
    undo: S('<path d="M8 5L3.5 9.5 8 14" stroke="currentColor" stroke-width="2.4" ' + ln + '/><path d="M4 9.5h10a6 6 0 0 1 0 12h-3" stroke="currentColor" stroke-width="2.4" ' + ln + '/>', 24),
    trash: S('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" stroke="currentColor" stroke-width="2.2" ' + ln + '/>', 24),
    skip: S('<path d="M4 5v14l9-7zM13 5v14l7-7z" fill="currentColor"/><rect x="19.5" y="5" width="2.5" height="14" rx="1" fill="currentColor"/>', 24),
    play: S('<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12.5-7.5a1 1 0 0 0 0-1.8L8.5 3.6A1 1 0 0 0 7 4.5z" fill="currentColor"/>', 24),
    stop: S('<rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/>', 24),
    close: S('<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" ' + ln + '/>', 24),
    lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="2.2" ' + ln + '/>', 24),
    sun: S('<circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="currentColor" stroke-width="2" ' + ln + '/>', 24),
    moon: S('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" fill="currentColor"/>', 24),
    star: S('<path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.3 6 20.6l1.3-6.7-5-4.7 6.8-.8z" fill="currentColor" stroke="#1c1f27" stroke-width="1.4" stroke-linejoin="round"/>', 24)
  };
  const A = '#3a3e4b', K = '#1c1f27', Y = '#ffc928', B = '#1d5fbf', G = '#17a673', Rd = '#e5483f', O = '#f2a93b', Gy = '#8b8f9c';
  const IC = {
    road: S(`<rect x="9" y="2" width="14" height="28" rx="2" fill="${A}"/><path d="M16 5v5M16 13.5v5M16 22v5" stroke="${Y}" stroke-width="2.2"/>`),
    wide: S(`<rect x="4" y="2" width="24" height="28" rx="2" fill="${A}"/><path d="M16 4v24" stroke="${Y}" stroke-width="2"/><path d="M10 5v4M10 12v4M10 19v4M10 26v2M22 5v4M22 12v4M22 19v4M22 26v2" stroke="#fff" stroke-width="1.8"/>`),
    oneway: S(`<rect x="2" y="9" width="28" height="14" rx="3" fill="${B}"/><path d="M8 16h14M18 11.5l5 4.5-5 4.5" stroke="#fff" stroke-width="2.8" ${ln}/>`),
    demolish: S(`<rect x="9" y="2" width="14" height="28" rx="2" fill="${A}" opacity=".35"/><path d="M8 8l16 16M24 8L8 24" stroke="${Rd}" stroke-width="3.6" ${ln}/>`),
    guide: S(`<rect x="3" y="3" width="26" height="26" rx="4" fill="${A}"/><path d="M10 29V19a9 9 0 0 1 9-9h10" stroke="#ff6fa8" stroke-width="3.2" fill="none"/><path d="M18 29v-8a3 3 0 0 1 3-3h8" stroke="#4fd69a" stroke-width="3.2" fill="none"/>`),
    bus: S(`<rect x="6" y="3" width="20" height="22" rx="4" fill="${B}"/><rect x="9" y="7" width="14" height="8" rx="1.5" fill="#d6e8ff"/><circle cx="11" cy="20" r="1.7" fill="${Y}"/><circle cx="21" cy="20" r="1.7" fill="${Y}"/><rect x="8" y="25" width="4.5" height="4" rx="1.2" fill="${K}"/><rect x="19.5" y="25" width="4.5" height="4" rx="1.2" fill="${K}"/>`),
    rev: S(`<path d="M4 11h18M18 6.5l5 4.5-5 4.5" stroke="${G}" stroke-width="3" ${ln}/><path d="M28 21H10M14 16.5L9 21l5 4.5" stroke="${Rd}" stroke-width="3" ${ln}/>`),
    round: S(`<circle cx="16" cy="16" r="14" fill="${B}"/><path d="M16 8.5a7.5 7.5 0 1 1-7.2 5.3" stroke="#fff" stroke-width="3" ${ln}/><path d="M5.6 10.6l3.2 4.4 4.4-3.2" stroke="#fff" stroke-width="3" ${ln}/>`),
    signal: S(`<rect x="10" y="1.5" width="12" height="29" rx="4.5" fill="${K}"/><circle cx="16" cy="8" r="3.1" fill="${Rd}"/><circle cx="16" cy="16" r="3.1" fill="${Y}"/><circle cx="16" cy="24" r="3.1" fill="#35d48a"/>`),
    bridge: S(`<path d="M5 13v13M27 13v13" stroke="${Gy}" stroke-width="3"/><path d="M5 24a11 9 0 0 1 22 0" stroke="${O}" stroke-width="2.8" fill="none"/><path d="M11 13v5M16 13v3M21 13v5" stroke="${O}" stroke-width="2"/><rect x="1.5" y="10" width="29" height="4.5" rx="1.2" fill="${A}"/><path d="M2 29c2.5-2 4.5 1.5 7 0s4.5 1.5 7 0 4.5 1.5 7 0 4.5 1.5 7 0" stroke="#4aa3d8" stroke-width="2.2" ${ln}/>`),
    tunnel: S(`<path d="M2.5 29V16a13.5 13.5 0 0 1 27 0v13z" fill="${Gy}"/><path d="M8 29V17a8 8 0 0 1 16 0v12z" fill="${K}"/><path d="M16 19v3.200M16 25v3" stroke="${Y}" stroke-width="2.2"/>`),
    overpass: S(`<path d="M5.5 15v14M26.5 15v14" stroke="#5d6b8f" stroke-width="3"/><rect x="2" y="12" width="28" height="4" rx="1.2" fill="#5d6b8f"/><circle cx="16" cy="3.8" r="2.3" fill="${K}"/><path d="M16 6.500v3.200M13.2 12l2.8-2.5 2.8 2.5" stroke="${K}" stroke-width="2.2" ${ln}/><path d="M10 22h12" stroke="${A}" stroke-width="2.4" stroke-dasharray="3 2.5"/>`),
    camera: S(`<path d="M12 21v9" stroke="${Gy}" stroke-width="3"/><rect x="3" y="8" width="19" height="13" rx="3" fill="${K}"/><path d="M22 12.500l7-3.500v11l-7-3.500z" fill="${K}"/><circle cx="11.5" cy="14.5" r="3.8" fill="${Rd}"/><circle cx="10.3" cy="13.3" r="1.1" fill="#fff"/>`),
    bump: S(`<path d="M2 24h28" stroke="${A}" stroke-width="5" stroke-linecap="round"/><path d="M6 21.500a10 8.5 0 0 1 20 0z" fill="${Y}"/><path d="M11 15l3.2 6.500M16.5 13.300l3.5 8.2" stroke="${K}" stroke-width="2.6"/>`),
    barricade: S(`<path d="M7 17v12M25 17v12" stroke="${K}" stroke-width="2.8" stroke-linecap="round"/><rect x="2" y="8" width="28" height="9" rx="2" fill="${O}"/><path d="M9 8l-4.5 9M17 8l-4.5 9M25 8l-4.5 9" stroke="#fff" stroke-width="3.4"/><rect x="2" y="8" width="28" height="9" rx="2" fill="none" stroke="${K}" stroke-width="1.6"/>`)
  };
  document.querySelectorAll('i[data-ic]').forEach(el => { el.innerHTML = UI[el.dataset.ic] || ''; });

  /* ---------- 도구 (설명은 일상 언어로) ---------- */
  const TOOLS = [
    { id: 'road', g: 0, nm: '도로', cost: F.COST.road, desc: '빈 땅에 새 길을 냅니다.' },
    { id: 'wide', g: 0, nm: '차선 확장', cost: F.COST.wide, desc: '2칸 이상 이어 깔면 2차로가 되어 느린 차를 앞지를 수 있어요.' },
    { id: 'oneway', g: 0, nm: '일방통행', cost: F.COST.oneway, desc: '한쪽 방향으로만 다니게 합니다. 누를 때마다 방향이 바뀌어요.' },
    { id: 'demolish', g: 0, nm: '철거', cost: F.COST.demolish, desc: '설치한 것은 전액 환불로 회수, 원래 있던 도로는 $50에 철거.' },
    { id: 'guide', g: 1, nm: '유도선', cost: F.COST.guide, desc: '갈림길 바닥에 색 선을 칠해 초보 운전자가 헤매지 않게 합니다.' },
    { id: 'bus', g: 1, nm: '버스 전용', cost: F.COST.bus, desc: '1차로 도로에 이어 칠하면 버스만 다니는 길이 됩니다. 버스엔 20명이 타고 있어요.' },
    { id: 'rev', g: 1, nm: '가변 차선', cost: F.COST.rev, desc: '가운데 차로가 붐비는 방향 쪽으로 자동으로 바뀝니다. 2칸 이상.' },
    { id: 'round', g: 2, nm: '회전교차로', cost: F.COST.round, desc: '멈추지 않고 천천히 돌아 나가는 교차로. 충돌 위험이 크게 줄어요.' },
    { id: 'signal', g: 2, nm: '신호등', cost: F.COST.signal, desc: '차례를 정해 줘서 눈치 싸움과 머뭇거림을 없앱니다.' },
    { id: 'bridge', g: 2, nm: '다리', cost: F.COST.bridge, desc: '강을 건너거나 다른 도로 위로 넘어갑니다. 누를 때마다 방향 전환.' },
    { id: 'tunnel', g: 2, nm: '지하차도', cost: F.COST.tunnel, desc: '바위·공원·도로 밑으로 지나갑니다. 누를 때마다 방향 전환.' },
    { id: 'overpass', g: 2, nm: '육교', cost: F.COST.overpass, desc: '횡단보도 위에 놓으면 차가 보행자를 기다리지 않아도 됩니다.' },
    { id: 'camera', g: 3, nm: '단속 카메라', cost: F.COST.camera, desc: '주변의 과속 차량만 골라 얌전하게 만듭니다.' },
    { id: 'bump', g: 3, nm: '방지턱', cost: F.COST.bump, desc: '싸지만 모든 차가 느려집니다.' },
    { id: 'barricade', g: 3, nm: '통행 차단', cost: F.COST.barricade, desc: '도로를 부수지 않고 막아 둡니다. 잠긴 도로에도 설치 가능.' }
  ];
  const TOOL = {}; TOOLS.forEach(t => TOOL[t.id] = t);

  /* ---------- 상태 ---------- */
  const base = F.parseStage(F.STAGE1);
  let tiles = F.cloneTiles(base), graph, conflicts;
  const baseConf = F.conflictIndex(base).sum;
  let mode = 'before', sim = null, paused = false, speed = 2, acc = 0;
  let tool = 'road', hover = null, tracked = null, undo = [];
  let history = [], best = 0, lastM = null, lastSeries = [], predTimer = 0, predBase = null;

  const baseSim = new F.Sim(base, { seed: SEED }); const baseM = baseSim.run(); const baseSeries = baseSim.series;

  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && s.tiles && s.tiles.length === base.length) { tiles = s.tiles; history = s.history || []; best = s.best || 0; }
  } catch (e) { /* 저장소를 못 써도 게임은 동작 */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ tiles, history, best })); } catch (e) { /* ignore */ } }
  graph = F.buildGraph(tiles); conflicts = F.conflictIndex(tiles);

  /* ---------- 화면 ---------- */
  const wrap = $('stageWrap'), cv = $('map'), ctx = cv.getContext('2d');
  const V3 = window.FlowView3D ? window.FlowView3D.create(wrap) : null;
  let vw = 1, vh = 1, dpr = 1, TS = 64, ox = 0, oy = 0;
  function resize() {
    vw = wrap.clientWidth; vh = wrap.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    TS = Math.min(vw / W, (vh - 150) / H); ox = (vw - TS * W) / 2; oy = 62 + (vh - 150 - TS * H) / 2;
    if (V3) V3.resize(vw, vh, dpr);
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  function rebuild3d() { if (V3) V3.build(sim ? sim.tiles : tiles, sim || graph, { edit: mode === 'edit' }); }

  /* ---------- 편집 규칙 ---------- */
  const cost = () => F.totalCost(tiles, base);
  function clearGround(t) { for (const f of F.FLAGS) t[f] = false; t.oneway = -1; }
  function nbRoad(i, d) {
    const x = i % W + F.DX[d], y = ((i / W) | 0) + F.DY[d];
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const t = tiles[y * W + x]; return t.road || t.term || t.bridge || t.tunnel;
  }
  function check(i, id) {
    const t = tiles[i];
    switch (id) {
      case 'road': if (t.term) return '건물 위에는 놓을 수 없어요'; if (t.road) return '이미 도로가 있어요'; if (t.base === 'bldg') return '건물이 있어서 길을 낼 수 없어요'; if (t.base === 'site') return '공사 구역이라 손댈 수 없어요'; if (t.base !== 'grass') return '여기는 길을 낼 수 없어요. 다리나 지하차도를 써 보세요'; return null;
      case 'wide': if (!t.road) return '도로 위에만 설치할 수 있어요'; if (t.locked) return '잠긴 도로는 넓힐 수 없어요'; return null;
      case 'rev': case 'oneway': case 'guide': case 'bus': case 'bump': case 'barricade': case 'camera': case 'round': case 'signal':
        return t.road ? null : '도로 위에만 설치할 수 있어요';
      case 'overpass': return t.crosswalk && t.road ? null : '횡단보도 위에만 놓을 수 있어요';
      case 'bridge': if (t.term) return '건물 위에는 놓을 수 없어요'; if (!(t.base === 'water' || t.road)) return '다리는 강 위나 도로 위에만 놓을 수 있어요'; return null;
      case 'tunnel': if (t.term) return '건물 밑으로는 뚫을 수 없어요'; if (t.base === 'water') return '강 밑으로는 뚫을 수 없어요'; if (t.base === 'bldg') return '건물 밑으로는 뚫을 수 없어요'; if (t.base === 'site') return '공사 구역이라 손댈 수 없어요'; return null;
      case 'demolish': {
        const o = base[i];
        if (F.tileCost(t, o) > 0 && !(o.road && !t.road)) return null;
        if (t.road && t.locked) return '잠긴 도로는 철거할 수 없어요 (차단은 가능)';
        return t.road ? null : '철거할 것이 없어요';
      }
    }
    return null;
  }
  function apply(i, id, force) {
    const err = check(i, id); if (err) return { err };
    const t = tiles[i], o = base[i], before = Object.assign({}, t);
    let val;
    switch (id) {
      case 'road': t.road = true; val = true; break;
      case 'demolish':
        if (F.tileCost(t, o) > 0 && !(o.road && !t.road)) { const keep = o.road; Object.assign(t, o); t.road = keep; }
        else { t.road = false; clearGround(t); }
        val = true; break;
      case 'oneway': {
        const order = [1, 2, 3, 0];
        if (force !== undefined) t.oneway = force;
        else if (t.oneway < 0) { const pref = order.filter(d => nbRoad(i, d)); t.oneway = pref.length ? pref[0] : 1; }
        else { const k = order.indexOf(t.oneway); t.oneway = k === 3 ? -1 : order[k + 1]; }
        if (t.oneway >= 0) t.rev = false;
        val = t.oneway; break;
      }
      case 'bridge': case 'tunnel': {
        const hasH = graph.nbr[i * 3].some(b => { const bi = (b / 3) | 0; return bi === i - 1 || bi === i + 1; });
        const guess = t.road ? (hasH ? 'V' : 'H') : ((nbRoad(i, 1) || nbRoad(i, 3) || !(nbRoad(i, 0) || nbRoad(i, 2))) ? 'H' : 'V');
        if (force !== undefined) t[id] = force;
        else if (!t[id]) t[id] = guess;
        else if (t[id] === guess) t[id] = guess === 'H' ? 'V' : 'H';
        else t[id] = null;
        val = t[id]; break;
      }
      default:
        t[id] = force !== undefined ? force : !t[id]; val = t[id];
        if (t[id]) {
          if (id === 'round') t.signal = false; if (id === 'signal') t.round = false;
          if (id === 'wide') t.rev = false; if (id === 'rev') { t.wide = false; t.oneway = -1; }
        }
    }
    if (cost() > F.BUDGET) { Object.assign(t, before); return { err: '예산이 모자라요! (총 $3,500)' }; }
    return { val };
  }
  function afterEdit() {
    graph = F.buildGraph(tiles); conflicts = F.conflictIndex(tiles);
    updateBudget(); save(); rebuild3d(); schedulePredict();
  }
  function pushUndo() { undo.push(JSON.stringify(tiles)); if (undo.length > 60) undo.shift(); }

  /* ---------- 모드 ---------- */
  function starRow(n, cls) { return GOALS.map((g, k) => UI.star.replace('<svg', `<svg class="${(k < n ? 'on' : '') + (g.purple ? ' p' : '') + (cls || '')}"`)).join(''); }
  function goalList(el, m, c) {
    let chain = true;
    el.innerHTML = GOALS.map(g => {
      const ok = m ? g.ok(m, c) : false, on = m && chain && ok; if (!ok) chain = false;
      return `<li class="${(on ? 'on' : m ? 'miss' : '') + (g.purple ? ' p' : '')}">${UI.star}<span>${g.text}</span>${m ? `<em>${g.show(m, c)}</em>` : ''}</li>`;
    }).join('');
  }
  function setCaption(html, btn) { $('captionTxt').innerHTML = html || ''; $('captionBtn').style.display = btn ? '' : 'none'; $('caption').style.display = html ? '' : 'none'; }
  function setMode(m) {
    mode = m;
    wrap.classList.toggle('is-edit', m === 'edit'); wrap.classList.toggle('is-play', m !== 'edit');
    $('result').classList.add('hidden'); hideInfo();
    const pb = $('btnPlay'); pb.innerHTML = `<i data-ic>${m === 'edit' ? UI.play : UI.stop}</i>`; pb.classList.toggle('stop', m !== 'edit');
    for (const id of ['btnSkip', 'btnSpeed']) $(id).style.visibility = m === 'edit' ? 'hidden' : 'visible';
    for (const id of ['btnUndo', 'btnReset']) $(id).style.visibility = m === 'edit' ? 'visible' : 'hidden';
    if (m === 'before') setCaption('도심 한복판이 마비됐습니다. 어디가 문제인지 찾아보세요.', true);
    else if (m === 'run') setCaption('');
    rebuild3d();
    if (V3) V3.setView(m === 'edit' ? 'top' : 'iso');
    updateBudget();
  }
  function startBefore() { sim = new F.Sim(base, { seed: SEED }); tracked = null; paused = false; acc = 0; setMode('before'); }
  function startEdit() { sim = null; tracked = null; setMode('edit'); setCaption('도구를 골라 칸을 누르세요'); schedulePredict(); }
  function startRun() { sim = new F.Sim(tiles, { seed: SEED }); tracked = null; paused = false; acc = 0; setMode('run'); }

  function finish() {
    const m = sim.metrics(), isBefore = mode === 'before', c = isBefore ? 0 : cost(), st = isBefore ? 0 : grade(m, c);
    lastM = m; lastSeries = sim.series.slice();
    if (!isBefore) {
      const sig = JSON.stringify(tiles);
      history = history.filter(h => h.sig !== sig);
      history.push({ sig, cost: c, pc: m.perCapita, acc: m.accidents, stars: st, clear: st > 0, arr: m.arrived });
      if (history.length > 12) history.shift();
      if (st > best) best = st;
      save(); $('btnGoals').innerHTML = starRow(best);
    }
    const sg = $('resSign');
    if (isBefore) { sg.className = 'fail'; sg.textContent = '이대로는 안 되겠어요'; }
    else { sg.className = st ? 'clear' : 'fail'; sg.textContent = ['아직 너무 느려요', '길이 뚫렸어요', '안전하게 뚫렸어요', '시원하게 뚫렸어요', '완벽한 설계'][st]; }
    $('resStars').innerHTML = starRow(st);
    goalList($('resGoals'), m, c);
    $('resBody').innerHTML = isBefore
      ? `평균 이동시간 <b>${m.perCapita.toFixed(1)}초</b> · 사고 <b>${m.accidents}건</b> · 도착 <b>${m.arrived}/${m.total}</b>`
      : `고치기 전 ${baseM.perCapita.toFixed(1)}초 → <b>${m.perCapita.toFixed(1)}초</b> · 도착 <b>${m.arrived}/${m.total}</b> · 예산 <b>$${c.toLocaleString()}</b>`;
    $('result').classList.remove('hidden'); setCaption('');
  }

  /* ---------- 상태 띠 ---------- */
  function updateBudget() {
    const c = mode === 'before' ? 0 : cost();
    $('budBig').textContent = '$' + c.toLocaleString();
    $('budget').classList.toggle('tight', c > F.BUDGET * 0.9);
  }
  let lastHud = 0;
  function updateHud(now) {
    if (!sim || now - lastHud < 200) return; lastHud = now;
    const m = sim.metrics();
    let s = 0, n = 0; for (const c of sim.cars) if (!c.crashed) { s += Math.min(1, c.v / c.v0); n++; }
    const flow = n ? s / n : 1, mi = flow > 0.6 ? 0 : flow > 0.38 ? 1 : 2;
    $('lamps').className = 'lamps m' + mi; $('moodTxt').textContent = ['원활', '서행', '정체'][mi];
    $('hudTime').textContent = m.perCapita.toFixed(1);
    $('figTime').className = 'fig ' + (m.perCapita <= TARGET ? 'good' : 'bad');
    $('hudAcc').textContent = m.accidents; $('figAcc').className = 'fig ' + (m.accidents === 0 ? 'good' : 'bad');
    $('hudArr').textContent = m.arrived; $('hudTot').textContent = '/' + m.total;
    $('dayFill').style.width = (sim.t / F.SIM_END * 100) + '%';
  }
  /* 설계 중 예상 결과(다른 난수로 미리 돌려 본 값) */
  function schedulePredict() {
    clearTimeout(predTimer);
    if (mode !== 'edit') return;
    predTimer = setTimeout(() => {
      if (mode !== 'edit') return;
      if (!predBase) predBase = new F.Sim(base, { seed: PRED_SEED }).run();
      if (cost() === 0) { setCaption('도구를 골라 칸을 누르세요'); return; }
      const m = new F.Sim(tiles, { seed: PRED_SEED }).run(), d = m.perCapita - predBase.perCapita;
      setCaption(`이대로 실행하면 약 <b>${m.perCapita.toFixed(0)}초</b> <span class="${d < 0 ? 'good' : 'bad'}">(${d < 0 ? '' : '+'}${d.toFixed(0)}초)</span> · 사고 <b class="${m.accidents === 0 ? 'good' : 'bad'}">${m.accidents}건</b>`);
    }, 250);
  }

  /* ---------- 수치 확인 패널 ---------- */
  function openStats() {
    $('stats').classList.remove('hidden');
    $('vBefore').textContent = baseM.perCapita.toFixed(1) + '초';
    $('aBefore').textContent = `사고 ${baseM.accidents}건 · 도착 ${baseM.arrived}/${baseM.total}`;
    const cur = sim ? sim.metrics() : lastM, series = sim ? sim.series : lastSeries;
    const dEl = $('vDelta').parentElement;
    if (cur && mode !== 'before') {
      const d = cur.perCapita - baseM.perCapita;
      $('vAfter').textContent = cur.perCapita.toFixed(1) + '초'; $('aAfter').textContent = `사고 ${cur.accidents}건 · 도착 ${cur.arrived}/${cur.total}`;
      $('vDelta').textContent = (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + '초'; $('vDeltaPct').textContent = (d / baseM.perCapita * 100).toFixed(0) + '%';
      dEl.className = 'cmp arrow' + (d > 0 ? ' bad' : '');
    } else { $('vAfter').textContent = '–'; $('aAfter').textContent = ''; $('vDelta').textContent = '–'; $('vDeltaPct').textContent = ''; }
    R.lineChart($('chart'), { base: baseSeries, cur: mode === 'before' || !series.length ? baseSeries : series, target: TARGET });
    const pts = [{ cost: 0, pc: baseM.perCapita, base: true }].concat(history.map((h, k) => ({ cost: h.cost, pc: h.pc, clear: h.clear, cur: k === history.length - 1 })));
    R.pareto($('pareto'), { pts, target: TARGET });
    $('hist').innerHTML = history.length ? '<table><tr><th>설계</th><th>예산</th><th>이동시간</th><th>변화</th><th>사고</th><th>결과</th></tr>' +
      history.map((h, k) => `<tr><td>#${k + 1}</td><td>$${h.cost.toLocaleString()}</td><td>${h.pc.toFixed(1)}초</td><td>${(h.pc - baseM.perCapita).toFixed(1)}</td><td>${h.acc}</td><td class="${h.clear ? 'ok' : 'ng'}">${h.clear ? '★'.repeat(Math.min(3, h.stars)) + (h.stars > 3 ? '<span style="color:#8b5cf6">★</span>' : '') : '실패'}</td></tr>`).reverse().join('') + '</table>'
      : '<span style="color:#6f7482">실행한 결과가 여기에 쌓입니다. 서로 다른 설계를 비교해 보세요.</span>';
    const mx = baseSim.mix, tot = mx.normal + mx.speeder + mx.novice, items = [['normal', '일반'], ['speeder', '과속'], ['novice', '초보']];
    $('mixBar').innerHTML = items.map(([k]) => `<div style="width:${mx[k] / tot * 100}%;background:${R.CAR[k]}"></div>`).join('');
    $('mixLegend').innerHTML = items.map(([k, n]) => `<span><i style="background:${R.CAR[k]}"></i>${n} ${(mx[k] / tot * 100).toFixed(0)}%</span>`).join('') + `<span><i style="background:${R.CAR.bus}"></i>버스 ${mx.bus}대</span>`;
    $('conf').innerHTML = `<b>${baseConf}</b> → <b style="color:${conflicts.sum < baseConf ? '#0f7a55' : conflicts.sum > baseConf ? '#e5483f' : 'inherit'}">${conflicts.sum}</b><small>차들이 서로 엇갈리는 지점 수 (낮을수록 안전)</small>`;
    $('statBudget').innerHTML = `<b>$${cost().toLocaleString()}</b> / $${F.BUDGET.toLocaleString()}`;
  }

  /* ---------- 입력 (마우스·터치 공통: Pointer Events) ---------- */
  function tileAt(e) {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let fx, fy;
    if (V3) { const p = V3.pick(px, py); if (!p) return null; fx = p[0]; fy = p[1]; }
    else { fx = (px - ox) / TS; fy = (py - oy) / TS; }
    const x = Math.floor(fx), y = Math.floor(fy);
    if (x < 0 || y < 0 || x >= W || y >= H) return { px, py, out: true };
    return { x, y, i: y * W + x, px, py, fx, fy };
  }
  let toastT = 0;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1700); }
  function setHover(p) {
    hover = (p && !p.out && mode === 'edit') ? { x: p.x, y: p.y, ok: !check(p.i, tool) } : null;
    if (V3) V3.setHover(hover);
  }
  /* 설치: 첫 칸은 토글, 끌면 같은 값으로 이어 칠한다 */
  let stroke = null;
  function place(p) {
    if (!stroke) {
      pushUndo();
      const r = apply(p.i, tool);
      if (r.err) { undo.pop(); toast(r.err); stroke = { dead: true, last: p.i }; return; }
      stroke = { last: p.i, val: r.val }; afterEdit(); return;
    }
    if (stroke.dead || p.i === stroke.last) return;
    stroke.last = p.i;
    const cur = tool === 'oneway' ? tiles[p.i].oneway : tiles[p.i][tool], plain = tool === 'road' || tool === 'demolish';
    if (plain || cur !== stroke.val) { const r = apply(p.i, tool, plain ? undefined : stroke.val); if (r.err) { if (/예산/.test(r.err)) toast(r.err); } else afterEdit(); }
  }
  function pickCar(p) {
    let bestC = null, bd = 1;
    for (const c of sim.cars) {
      let d;
      if (V3) { const q = V3.project(c.x, c.y, V3.carH(sim, c) + .08); d = Math.hypot(q[0] - p.px, q[1] - p.py) / 26; }
      else d = p.out ? 9 : Math.hypot(c.x - p.fx, c.y - p.fy) / 0.3;
      if (d < bd) { bd = d; bestC = c; }
    }
    tracked = bestC;
  }
  const pts = new Map();
  let gest = null;       // { kind:'edit'|'orbit'|'pinch', ... }
  const pinchDist = () => { const a = [...pts.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
  cv.addEventListener('pointerdown', e => {
    hideInfo();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { gest = { kind: 'pinch', d: pinchDist() }; stroke = null; return; }      // 두 손가락: 확대·축소
    const p = tileAt(e);
    if (mode === 'edit') {
      gest = { kind: 'edit', touch: e.pointerType !== 'mouse', first: p };
      if (!gest.touch && p && !p.out) place(p);                 // 마우스는 누르는 즉시, 터치는 손을 떼거나 끌 때 설치
      setHover(p);
    } else gest = { kind: 'orbit', x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, p };
  });
  cv.addEventListener('pointermove', e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gest && gest.kind === 'pinch') { if (pts.size === 2 && V3) { const d = pinchDist(); if (d > 0) { V3.zoom(gest.d / d); gest.d = d; } } return; }
    if (gest && gest.kind === 'orbit') {
      if (Math.abs(e.clientX - gest.x0) + Math.abs(e.clientY - gest.y0) > 6) gest.moved = true;
      if (gest.moved && V3) V3.orbit(e.clientX - gest.x, e.clientY - gest.y);
      gest.x = e.clientX; gest.y = e.clientY; return;
    }
    const p = tileAt(e);
    if (e.pointerType === 'mouse' || gest) setHover(p);
    if (gest && gest.kind === 'edit' && p && !p.out) {
      if (gest.touch && !stroke) { if (!gest.first || gest.first.out || p.i === gest.first.i) return; place(gest.first); }
      place(p);
    }
  });
  function endPointer(e) {
    pts.delete(e.pointerId);
    if (!gest) return;
    if (gest.kind === 'pinch') { if (pts.size === 0) gest = null; return; }
    if (gest.kind === 'edit' && gest.touch && !stroke && e.type === 'pointerup' && gest.first && !gest.first.out) place(gest.first);
    if (gest.kind === 'edit' && gest.touch) setHover(null);
    if (gest.kind === 'orbit' && !gest.moved && sim && gest.p && e.type === 'pointerup') pickCar(gest.p);
    gest = null; stroke = null;
  }
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !gest) setHover(null); });
  cv.addEventListener('wheel', e => { if (V3) { V3.zoom(e.deltaY > 0 ? 1.08 : 0.93); e.preventDefault(); } }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  function doUndo() { if (mode === 'edit' && undo.length) { tiles = JSON.parse(undo.pop()); afterEdit(); } }
  function togglePlay() { if (mode === 'edit') startRun(); else startEdit(); }
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { doUndo(); e.preventDefault(); }
    else if (e.code === 'Space') { togglePlay(); e.preventDefault(); }
    else if (e.key === 'Escape') { $('stats').classList.add('hidden'); $('help').classList.add('hidden'); hideInfo(); }
  });

  /* ---------- 도구 트레이: 아이콘만, 누르면 설명이 뜬다 ---------- */
  function hideInfo() { $('toolInfo').classList.add('hidden'); }
  function showInfo(btn) {
    const T = TOOL[btn.dataset.tool], el = $('toolInfo');
    el.innerHTML = `<em>$${T.cost}</em><b>${T.nm}</b><p>${T.desc}</p>`;
    el.classList.remove('hidden');
    const wr = wrap.getBoundingClientRect(), br = btn.getBoundingClientRect(), tr = $('tray').getBoundingClientRect();
    const cx = br.left + br.width / 2 - wr.left, w = el.offsetWidth, left = Math.max(8, Math.min(vw - w - 8, cx - w / 2));
    el.style.left = left + 'px'; el.style.bottom = (wr.bottom - tr.top + 12) + 'px'; el.style.setProperty('--ax', (cx - left) + 'px');
  }
  function buildTray() {
    let html = '', g = 0;
    for (const t of TOOLS) { if (t.g !== g) { html += '<span class="gap"></span>'; g = t.g; } html += `<button class="tool${t.id === tool ? ' sel' : ''}" data-tool="${t.id}" aria-label="${t.nm}">${IC[t.id]}</button>`; }
    $('tray').innerHTML = html;
    $('tray').querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
      tool = b.dataset.tool;
      $('tray').querySelectorAll('.tool').forEach(x => x.classList.toggle('sel', x === b));
      showInfo(b);
    }));
    $('tray').addEventListener('scroll', hideInfo);
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.tool')) hideInfo(); }, true);

  /* 예시 설계 — 정답 판정용이 아니라 같은 엔진으로 돌려 볼 수 있는 비교용 */
  const at = (t, x, y) => t[y * W + x];
  const PRESETS = [
    t => { at(t, 5, 4).barricade = true; },
    t => { at(t, 5, 4).bus = true; at(t, 6, 4).bus = true; at(t, 2, 4).overpass = true; at(t, 9, 4).overpass = true; },
    t => { at(t, 4, 4).round = true; at(t, 7, 4).round = true; at(t, 2, 4).overpass = true; at(t, 9, 4).overpass = true; }
  ];
  const openHelp = () => { goalList($('helpGoals'), null, 0); $('help').classList.remove('hidden'); };
  $('btnPlay').onclick = togglePlay;
  $('btnBefore').onclick = startBefore;
  $('captionBtn').onclick = startEdit;
  $('btnUndo').onclick = doUndo;
  $('btnReset').onclick = () => { if (mode !== 'edit') return; pushUndo(); tiles = F.cloneTiles(base); afterEdit(); };
  $('btnSpeed').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $('btnSpeed').textContent = '×' + speed; };
  $('btnSkip').onclick = () => { if (sim && !sim.done) { sim.run(); finish(); } };
  $('btnStats').onclick = $('resStats').onclick = openStats;
  $('statsClose').onclick = () => $('stats').classList.add('hidden');
  $('btnHelp').onclick = $('btnGoals').onclick = openHelp;
  $('helpClose').onclick = () => $('help').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m) m.classList.add('hidden'); }));
  $('resEdit').onclick = startEdit;
  $('resClose').onclick = () => $('result').classList.add('hidden');
  $('btnClearHist').onclick = () => { history = []; save(); openStats(); };
  document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    pushUndo(); tiles = F.cloneTiles(base); PRESETS[+b.dataset.preset](tiles); $('stats').classList.add('hidden'); startEdit(); afterEdit();
  });

  /* ---------- 메인 루프 ---------- */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (sim && !sim.done && !paused) {
      acc += dt * speed; let n = 0;
      while (acc >= F.DT && n < 40) { sim.step(); acc -= F.DT; n++; if (sim.done) break; }
      if (n >= 40) acc = 0;
      if (sim.done) finish();
    }
    if (tracked && (tracked.gone || tracked.crashed)) tracked = null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
    if (V3) { V3.update(sim, now); R.overlay3d(ctx, { sim, tracked, now }, V3); }
    else {                                                  // WebGL 없음: 2D 지도로 대체
      ctx.save(); ctx.translate(ox, oy);
      R.draw(ctx, { TS, tiles: sim ? sim.tiles : tiles, graph: sim || graph, sim, mode, hover, now, tracked, theme: mode === 'edit' ? 'blueprint' : 'poly', showHeat: true });
      ctx.restore();
    }
    updateHud(now);
    requestAnimationFrame(frame);
  }

  $('hudGoal').textContent = TARGET; $('btnGoals').innerHTML = starRow(best);
  buildTray(); resize(); startBefore();
  if (V3) V3.setView('iso', true);
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('900 20px "Wanted Sans"'), document.fonts.load('500 13px "Wanted Sans"')]).then(() => { rebuild3d(); resize(); }).catch(() => {});
  requestAnimationFrame(frame);

  window.FlowLab = { V3, get sim() { return sim; }, get tiles() { return tiles; }, get mode() { return mode; }, startRun, startEdit, startBefore, baseM, grade,
    apply: (x, y, id) => { const r = apply(y * W + x, id); afterEdit(); return r; } };
})();
