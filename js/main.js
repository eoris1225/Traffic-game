/* FLOW LAB — 게임 컨트롤러
 * 관찰(개선 전) → 설계(흑백 탑뷰) → 실행(컬러 대각 뷰) 루프, 편집 도구, HUD, 수치 확인 패널 */
(function () {
  'use strict';
  const F = window.FlowSim, R = window.FlowRender, W = F.W, H = F.H;
  const $ = id => document.getElementById(id);
  const TARGET = 24, ACC_LIMIT = 1, STAR2 = 21, STAR3 = 17;
  const SEED = 1225, PRED_SEED = 7, STORE = 'flowlab.stage1.v2';

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
  const GROUPS = ['도로', '차선', '교차로 · 입체', '안전'];
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
  let tool = 'road', hover = null, tracked = null, undo = [], drag = null, orbit = null;
  let history = [], lastM = null, lastSeries = [], predTimer = 0, predBase = null;

  const baseSim = new F.Sim(base, { seed: SEED }); const baseM = baseSim.run(); const baseSeries = baseSim.series;

  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && s.tiles && s.tiles.length === base.length) { tiles = s.tiles; history = s.history || []; }
  } catch (e) { /* 저장소를 못 써도 게임은 동작 */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ tiles, history })); } catch (e) { /* ignore */ } }
  graph = F.buildGraph(tiles); conflicts = F.conflictIndex(tiles);

  /* ---------- 화면 ---------- */
  const wrap = $('stageWrap'), cv = $('map'), ctx = cv.getContext('2d');
  const V3 = window.FlowView3D ? window.FlowView3D.create(wrap) : null;
  let vw = 1, vh = 1, dpr = 1, TS = 64, ox = 0, oy = 0;
  function resize() {
    vw = wrap.clientWidth; vh = wrap.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    TS = Math.min(vw / W, (vh - 170) / H); ox = (vw - TS * W) / 2; oy = 62 + (vh - 170 - TS * H) / 2;
    if (V3) V3.resize(vw, vh, dpr);
  }
  window.addEventListener('resize', resize);
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
      case 'road': if (t.term) return '건물 위에는 놓을 수 없어요'; if (t.road) return '이미 도로가 있어요'; if (t.base !== 'grass') return '여기는 길을 낼 수 없어요 — 다리나 지하차도를 써 보세요'; return null;
      case 'wide': if (!t.road) return '도로 위에만 설치할 수 있어요'; if (t.locked) return '잠긴 도로는 넓힐 수 없어요'; return null;
      case 'rev': case 'oneway': case 'guide': case 'bus': case 'bump': case 'barricade': case 'camera': case 'round': case 'signal':
        return t.road ? null : '도로 위에만 설치할 수 있어요';
      case 'overpass': return t.crosswalk && t.road ? null : '횡단보도 위에만 놓을 수 있어요';
      case 'bridge': if (t.term) return '건물 위에는 놓을 수 없어요'; if (!(t.base === 'water' || t.road)) return '다리는 강 위나 도로 위에만 놓을 수 있어요'; return null;
      case 'tunnel': if (t.term) return '건물 밑으로는 뚫을 수 없어요'; if (t.base === 'water') return '강 밑으로는 뚫을 수 없어요'; return null;
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
  function setMode(m) {
    mode = m;
    wrap.classList.toggle('is-edit', m === 'edit'); wrap.classList.toggle('is-play', m !== 'edit');
    $('result').classList.add('hidden');
    const pb = $('btnPlay'); pb.innerHTML = `<i data-ic>${m === 'edit' ? UI.play : UI.stop}</i>`; pb.classList.toggle('stop', m !== 'edit');
    $('btnSkip').style.visibility = m === 'edit' ? 'hidden' : 'visible';
    $('btnSpeed').style.visibility = m === 'edit' ? 'hidden' : 'visible';
    $('btnUndo').style.visibility = $('btnReset').style.visibility = m === 'edit' ? 'visible' : 'hidden';
    $('forecast').classList.toggle('hidden', m !== 'edit');
    const bn = $('banner');
    if (m === 'before') { bn.classList.remove('hidden'); $('bannerTxt').textContent = '다들 가운데 지름길로만 몰려 출근길이 점점 막힙니다. 지켜본 뒤 도로를 고쳐 보세요.'; }
    else bn.classList.add('hidden');
    rebuild3d();
    if (V3) V3.setView(m === 'edit' ? 'top' : 'iso');
    updateBudget();
  }
  function startBefore() { sim = new F.Sim(base, { seed: SEED }); tracked = null; paused = false; acc = 0; setMode('before'); }
  function startEdit() { sim = null; tracked = null; setMode('edit'); schedulePredict(); }
  function startRun() { sim = new F.Sim(tiles, { seed: SEED }); tracked = null; paused = false; acc = 0; setMode('run'); }

  function stars(m) {
    if (!(m.perCapita <= TARGET && m.accidents <= ACC_LIMIT)) return 0;
    if (m.perCapita <= STAR3 && m.accidents === 0) return 3;
    if (m.perCapita <= STAR2 && m.accidents === 0) return 2;
    return 1;
  }
  function finish() {
    const m = sim.metrics(), isBefore = mode === 'before', c = isBefore ? 0 : cost(), st = isBefore ? 0 : stars(m);
    lastM = m; lastSeries = sim.series.slice();
    if (!isBefore) {
      const sig = JSON.stringify(tiles);
      history = history.filter(h => h.sig !== sig);
      history.push({ sig, cost: c, pc: m.perCapita, acc: m.accidents, stars: st, clear: st > 0, arr: m.arrived });
      if (history.length > 12) history.shift();
      save();
    }
    const sg = $('resSign');
    if (isBefore) { sg.className = 'fail'; sg.textContent = '이대로는 안 되겠어요'; }
    else { sg.className = st ? 'clear' : 'fail'; sg.textContent = st ? '통행 원활!' : (m.accidents > ACC_LIMIT ? '사고가 너무 많아요' : '아직 너무 느려요'); }
    $('resStars').innerHTML = isBefore ? '' : [1, 2, 3].map(k => UI.star.replace('<svg', `<svg class="${k <= st ? 'on' : ''}"`)).join('');
    $('resStars').style.display = isBefore ? 'none' : '';
    $('resBody').innerHTML = isBefore
      ? `<dt>평균 이동시간</dt><dd>${m.perCapita.toFixed(1)}초</dd><dt>사고</dt><dd>${m.accidents}건</dd><div class="note">목표는 ${TARGET}초 이하 · 사고 ${ACC_LIMIT}건 이하</div>`
      : `<dt>평균 이동시간</dt><dd><s>${baseM.perCapita.toFixed(1)}초</s>${m.perCapita.toFixed(1)}초</dd><dt>사고</dt><dd><s>${baseM.accidents}건</s>${m.accidents}건</dd><dt>도착</dt><dd>${m.arrived} / ${m.total}대</dd><dt>사용 예산</dt><dd>$${c.toLocaleString()}</dd>` +
        (st === 1 ? `<div class="note">별 2개 ${STAR2}초 이하·무사고 · 별 3개 ${STAR3}초 이하·무사고</div>` : st === 2 ? `<div class="note">별 3개는 ${STAR3}초 이하·무사고</div>` : '');
    $('result').classList.remove('hidden');
    $('banner').classList.add('hidden');
  }

  /* ---------- HUD ---------- */
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
    $('chipMood').className = 'plate mood m' + mi; $('moodTxt').textContent = ['원활', '서행', '정체'][mi];
    $('hudTime').textContent = m.perCapita.toFixed(1);
    $('chipTime').className = 'plate stat ' + (m.perCapita <= TARGET ? 'good' : 'bad');
    $('goalFill').style.width = Math.min(100, m.perCapita / TARGET * 60) + '%';
    $('hudAcc').textContent = m.accidents; $('chipAcc').className = 'plate stat ' + (m.accidents <= ACC_LIMIT ? 'good' : 'bad');
    $('hudArr').textContent = m.arrived; $('hudTot').textContent = '/' + m.total;
    $('dayFill').style.width = (sim.t / F.SIM_END * 100) + '%';
  }
  /* 설계 중 예상 결과(다른 난수로 미리 돌려 본 값) */
  function schedulePredict() {
    clearTimeout(predTimer);
    if (mode !== 'edit') return;
    predTimer = setTimeout(() => {
      if (!predBase) predBase = new F.Sim(base, { seed: PRED_SEED }).run();
      const el = $('forecast');
      if (cost() === 0) { el.innerHTML = '도구를 골라 도로를 고친 뒤 실행해 보세요'; return; }
      const m = new F.Sim(tiles, { seed: PRED_SEED }).run(), d = m.perCapita - predBase.perCapita;
      el.innerHTML = `<span class="cap">이대로 실행하면</span>약 <b>${m.perCapita.toFixed(0)}초</b> <span class="${d < 0 ? 'good' : 'bad'}">${d < 0 ? '' : '+'}${d.toFixed(0)}초</span> · 사고 <b class="${m.accidents <= ACC_LIMIT ? 'good' : 'bad'}">${m.accidents}</b>건`;
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
      history.map((h, k) => `<tr><td>#${k + 1}</td><td>$${h.cost.toLocaleString()}</td><td>${h.pc.toFixed(1)}초</td><td>${(h.pc - baseM.perCapita).toFixed(1)}</td><td>${h.acc}</td><td class="${h.clear ? 'ok' : 'ng'}">${h.clear ? '★'.repeat(h.stars) : '실패'}</td></tr>`).reverse().join('') + '</table>'
      : '<span style="color:#6f7482">실행한 결과가 여기에 쌓입니다. 서로 다른 설계를 비교해 보세요.</span>';
    const mx = baseSim.mix, tot = mx.normal + mx.speeder + mx.novice, items = [['normal', '일반'], ['speeder', '과속'], ['novice', '초보']];
    $('mixBar').innerHTML = items.map(([k]) => `<div style="width:${mx[k] / tot * 100}%;background:${R.CAR[k]}"></div>`).join('');
    $('mixLegend').innerHTML = items.map(([k, n]) => `<span><i style="background:${R.CAR[k]}"></i>${n} ${(mx[k] / tot * 100).toFixed(0)}%</span>`).join('') + `<span><i style="background:${R.CAR.bus}"></i>버스 ${mx.bus}대</span>`;
    $('conf').innerHTML = `<b>${baseConf}</b> → <b style="color:${conflicts.sum < baseConf ? '#0f7a55' : conflicts.sum > baseConf ? '#e5483f' : 'inherit'}">${conflicts.sum}</b><small>차들이 서로 엇갈리는 지점 수 (낮을수록 안전)</small>`;
    $('statBudget').innerHTML = `<b>$${cost().toLocaleString()}</b> / $${F.BUDGET.toLocaleString()}`;
  }

  /* ---------- 입력 ---------- */
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
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600); }
  function showTip(p) {
    const tip = $('tip');
    if (mode !== 'edit' || !p || p.out || drag) { tip.style.display = 'none'; return; }
    const T = TOOL[tool], err = check(p.i, tool), t = tiles[p.i], here = [];
    if (t.term) here.push(t.term.name);
    if (t.locked) here.push('잠긴 도로'); if (t.crosswalk) here.push('횡단보도');
    TOOLS.forEach(k => { if (k.id !== 'road' && k.id !== 'demolish' && (k.id === 'oneway' ? t.oneway >= 0 : t[k.id])) here.push(k.nm); });
    tip.innerHTML = `<span class="cost">$${T.cost}</span><b>${T.nm}</b><br>${err ? `<span class="bad">${err}</span>` : T.desc}` + (here.length ? `<br><span class="here">${here.join(' · ')}</span>` : '');
    tip.style.display = 'block';
    tip.style.left = Math.min(vw - 262, p.px + 16) + 'px'; tip.style.top = Math.min(vh - 190, p.py + 16) + 'px';
  }
  function setHover(p) {
    hover = (p && !p.out && mode === 'edit') ? { x: p.x, y: p.y, ok: !check(p.i, tool) } : null;
    if (V3) V3.setHover(hover);
  }
  cv.addEventListener('mousemove', e => {
    if (orbit) {
      if (Math.abs(e.clientX - orbit.x0) + Math.abs(e.clientY - orbit.y0) > 4) orbit.moved = true;
      if (orbit.moved && V3) V3.orbit(e.clientX - orbit.x, e.clientY - orbit.y);
      orbit.x = e.clientX; orbit.y = e.clientY; return;
    }
    const p = tileAt(e); setHover(p); showTip(p);
    if (drag && mode === 'edit' && p && !p.out && p.i !== drag.last) {
      drag.last = p.i;
      const cur = tool === 'oneway' ? tiles[p.i].oneway : tiles[p.i][tool], plain = tool === 'road' || tool === 'demolish';
      if (plain || cur !== drag.val) { const r = apply(p.i, tool, plain ? undefined : drag.val); if (r.err) { if (/예산/.test(r.err)) toast(r.err); } else afterEdit(); }
    }
  });
  cv.addEventListener('mouseleave', () => { setHover(null); showTip(null); });
  cv.addEventListener('mousedown', e => {
    const p = tileAt(e);
    if (mode !== 'edit') { orbit = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, p }; return; }
    if (!p || p.out) return;
    pushUndo();
    const r = apply(p.i, tool);
    if (r.err) { undo.pop(); toast(r.err); return; }
    drag = { last: p.i, val: r.val }; showTip(null);
    afterEdit();
  });
  window.addEventListener('mouseup', () => {
    drag = null;
    if (orbit && !orbit.moved && sim && orbit.p) {            // 클릭: 차량 선택
      let best = null, bd = 1; const p = orbit.p;
      for (const c of sim.cars) {
        let d;
        if (V3) { const q = V3.project(c.x, c.y, V3.carH(sim, c) + .08); d = Math.hypot(q[0] - p.px, q[1] - p.py) / 24; }
        else d = p.out ? 9 : Math.hypot(c.x - p.fx, c.y - p.fy) / 0.3;
        if (d < bd) { bd = d; best = c; }
      }
      tracked = best;
    }
    orbit = null;
  });
  cv.addEventListener('wheel', e => { if (V3) { V3.zoom(e.deltaY > 0 ? 1.08 : 0.93); e.preventDefault(); } }, { passive: false });
  function doUndo() { if (mode === 'edit' && undo.length) { tiles = JSON.parse(undo.pop()); afterEdit(); } }
  function togglePlay() { if (mode === 'edit') startRun(); else startEdit(); }
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { doUndo(); e.preventDefault(); }
    else if (e.code === 'Space') { togglePlay(); e.preventDefault(); }
    else if (e.key === 'Escape') { $('stats').classList.add('hidden'); $('help').classList.add('hidden'); }
  });

  /* ---------- 툴바 · 버튼 ---------- */
  function buildToolbar() {
    $('toolbar').innerHTML = GROUPS.map((g, gi) => `<div class="grp"><h4>${g}</h4><div class="row">` +
      TOOLS.filter(t => t.g === gi).map(t => `<button class="tool${t.id === tool ? ' sel' : ''}" data-tool="${t.id}"><span class="pr">$${t.cost}</span><span class="ic">${IC[t.id]}</span><span class="nm">${t.nm}</span></button>`).join('') + '</div></div>').join('');
    $('toolbar').querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
      tool = b.dataset.tool;
      $('toolbar').querySelectorAll('.tool').forEach(x => x.classList.toggle('sel', x === b));
    }));
  }
  /* 예시 설계 — 정답 판정용이 아니라 같은 엔진으로 돌려 볼 수 있는 비교용 */
  const at = (t, x, y) => t[y * W + x];
  const PRESETS = [
    t => { at(t, 5, 4).barricade = true; },
    t => { at(t, 5, 4).bus = true; at(t, 6, 4).bus = true; at(t, 2, 4).overpass = true; at(t, 9, 4).overpass = true; },
    t => { at(t, 4, 4).round = true; at(t, 7, 4).round = true; at(t, 2, 4).overpass = true; at(t, 9, 4).overpass = true; }
  ];
  $('btnPlay').onclick = togglePlay;
  $('btnBefore').onclick = startBefore;
  $('bannerBtn').onclick = startEdit;
  $('btnUndo').onclick = doUndo;
  $('btnReset').onclick = () => { if (mode !== 'edit') return; pushUndo(); tiles = F.cloneTiles(base); afterEdit(); };
  $('btnSpeed').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $('btnSpeed').textContent = '×' + speed; };
  $('btnSkip').onclick = () => { if (sim && !sim.done) { sim.run(); finish(); } };
  $('btnStats').onclick = $('resStats').onclick = openStats;
  $('statsClose').onclick = () => $('stats').classList.add('hidden');
  $('btnHelp').onclick = () => $('help').classList.remove('hidden');
  $('helpClose').onclick = () => $('help').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('mousedown', e => { if (e.target === m) m.classList.add('hidden'); }));
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

  $('hudGoal').textContent = TARGET;
  buildToolbar(); resize(); startBefore();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('900 20px "Wanted Sans"'), document.fonts.load('500 13px "Wanted Sans"')]).then(() => { rebuild3d(); resize(); }).catch(() => {});
  if (V3) V3.setView('iso', true);
  requestAnimationFrame(frame);

  window.FlowLab = { V3, get sim() { return sim; }, get tiles() { return tiles; }, get mode() { return mode; }, startRun, startEdit, startBefore, baseM,
    apply: (x, y, id) => { const r = apply(y * W + x, id); afterEdit(); return r; } };
})();
