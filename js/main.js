/* FLOW LAB — 게임 컨트롤러 (관찰 → 설계 → 재실행 루프, 편집 도구, 대시보드) */
(function () {
  'use strict';
  const F = window.FlowSim, R = window.FlowRender, W = F.W, H = F.H;
  const $ = id => document.getElementById(id);
  const TARGET = 30, ACC_LIMIT = 1, SEED = 1225, PRED_SEED = 7, STORE = 'flowlab.stage1.v1';

  /* ---------- 도구 정의 ---------- */
  const TOOLS = [
    { id: 'road', g: 0, ic: '🛣️', nm: '일반 도로', cost: F.COST.road, desc: '빈 땅에 도로를 놓습니다. 4방향이 만나면 상충점 32개짜리 평면 교차로가 됩니다.' },
    { id: 'wide', g: 0, ic: '➕', nm: '차선 확장', cost: F.COST.wide, desc: '연속 2칸 이상 깔면 방향별 2차로. BPR 용량 c 가 2배가 되고 느린 차를 추월할 수 있습니다. 잠금 도로는 불가.' },
    { id: 'oneway', g: 0, ic: '🪧', nm: '일방통행', cost: F.COST.oneway, desc: '한 방향 전용(2차로)으로 전환. 클릭할 때마다 방향이 바뀝니다. 반대 방향은 우회해야 합니다.' },
    { id: 'demolish', g: 0, ic: '🗑️', nm: '철거', cost: F.COST.demolish, desc: '내가 설치한 시설은 전액 환불 회수, 기존 일반 도로는 $50 에 철거. 잠금 도로(🔒)는 철거 불가.' },
    { id: 'guide', g: 1, ic: '🎨', nm: '색깔 유도선', cost: F.COST.guide, desc: '교차로(또는 진입 타일)에 칠하면 초보 운전자의 판단 지연 τ 와 조향 오류 P_err 가 ×0.2 로 줄어듭니다.' },
    { id: 'bus', g: 1, ic: '🚌', nm: '버스 전용차선', cost: F.COST.bus, desc: '2차로 구간에서는 한 차로가 버스 전용, 1차로 구간에서는 버스만 통행. 버스는 승객 20명(W=20).' },
    { id: 'rev', g: 1, ic: '↔️', nm: '가변 차선', cost: F.COST.rev, desc: '연속 2칸 이상: 3차로 중 가운데 차로가 교통량 비율 Φ 에 따라 방향을 자동 전환. 잠금 도로에도 가능.' },
    { id: 'round', g: 2, ic: '🔄', nm: '회전교차로', cost: F.COST.round, desc: '상충점 32→8. 신호 대기 없이 저속 회전 진입, 양보 규칙으로 합류합니다.' },
    { id: 'signal', g: 2, ic: '🚦', nm: '신호등', cost: F.COST.signal, desc: '감응식 신호(축별 시분할). 초보의 머뭇거림이 사라지고 통행권이 명확해집니다.' },
    { id: 'bridge', g: 2, ic: '🌉', nm: '고가 다리', cost: F.COST.bridge, desc: '강 위 또는 기존 도로 위(z=+1)로 통과. 아래 도로와 간섭 0. 클릭마다 가로/세로 전환.' },
    { id: 'tunnel', g: 2, ic: '🚇', nm: '지하차도', cost: F.COST.tunnel, desc: '암반·공원·도로 아래(z=−1)를 관통. 클릭마다 가로/세로 전환. 강 밑은 불가.' },
    { id: 'overpass', g: 2, ic: '🪜', nm: '육교', cost: F.COST.overpass, desc: '횡단보도 위에 설치하면 보행 신호로 인한 차량 정지가 사라집니다.' },
    { id: 'camera', g: 3, ic: '📷', nm: '과속카메라', cost: F.COST.camera, desc: '반경 2.2타일 안의 과속 차량만 제한속도로 감속시키고 양보·안전거리를 지키게 합니다.' },
    { id: 'bump', g: 3, ic: '〰️', nm: '과속방지턱', cost: F.COST.bump, desc: '값싸게 모든 차량을 강제 감속. 버스와 일반 차량까지 느려지는 부작용이 있습니다.' },
    { id: 'barricade', g: 3, ic: '🚧', nm: '바리케이드', cost: F.COST.barricade, desc: '도로를 철거하지 않고 폐쇄(Cost=∞). 잠금 도로에도 설치 가능 — 브라에스 역설 실험용.' }
  ];
  const GROUPS = ['도로 / 확장', '차선 / 유도선', '교차 / 입체 시설', '안전 / 통제'];
  const TOOL = {}; TOOLS.forEach(t => TOOL[t.id] = t);

  /* ---------- 상태 ---------- */
  const base = F.parseStage(F.STAGE1);
  let tiles = F.cloneTiles(base);
  let graph = F.buildGraph(tiles);
  let conflicts = F.conflictIndex(tiles);
  const baseConf = F.conflictIndex(base).sum;
  let mode = 'before', sim = null, paused = false, speed = 2, acc = 0;
  let tool = 'road', hover = null, tracked = null, undo = [];
  let history = [], lastResult = null, predTimer = 0, predBase = null;
  let drag = null, orbit = null;
  const V3 = window.FlowView3D ? window.FlowView3D.create($('stageWrap')) : null;
  let use3d = !!V3;

  // 대조군(개선 전) 기록은 로드 시 한 번 끝까지 계산해 둔다
  const baseSim = new F.Sim(base, { seed: SEED }); const baseM = baseSim.run();
  const baseSeries = baseSim.series;

  try {
    const s = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && s.tiles && s.tiles.length === base.length) { tiles = s.tiles; history = s.history || []; }
  } catch (e) { /* 저장소를 못 써도 게임은 동작 */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ tiles, history })); } catch (e) { /* ignore */ } }

  /* ---------- 캔버스 ---------- */
  const cv = $('map'), ctx = cv.getContext('2d');
  let TS = 64, dpr = 1;
  function resize() {
    const wrap = $('stageWrap'), w = wrap.clientWidth;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    TS = w / W;
    cv.width = Math.round(w * dpr); cv.height = Math.round(TS * H * dpr);
    cv.style.height = (TS * H) + 'px';
    if (V3) V3.resize(w, TS * H, dpr);
  }
  window.addEventListener('resize', resize);

  /* ---------- 편집 ---------- */
  function cost() { return F.totalCost(tiles, base); }
  function clearGround(t) { for (const f of F.FLAGS) t[f] = false; t.oneway = -1; }
  function neighborsRoad(i, d) {
    const x = i % W + F.DX[d], y = ((i / W) | 0) + F.DY[d];
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const t = tiles[y * W + x]; return t.road || t.term || t.bridge || t.tunnel;
  }
  /* 도구 적용: 성공 시 null, 실패 시 사유 문자열. force 가 있으면 그 값으로 설정(드래그) */
  function check(i, id) {
    const t = tiles[i];
    switch (id) {
      case 'road': if (t.term) return '건물 위에는 설치할 수 없습니다'; if (t.road) return '이미 도로가 있습니다'; if (t.base !== 'grass') return '설치 불가 지형 — 다리·지하차도로 우회하세요'; return null;
      case 'wide': if (!t.road) return '도로 위에만 설치'; if (t.locked) return '잠금 도로는 확장할 수 없습니다'; return null;
      case 'rev': case 'oneway': case 'guide': case 'bus': case 'bump': case 'barricade': case 'camera': case 'round': case 'signal':
        return t.road ? null : '도로 위에만 설치';
      case 'overpass': return t.crosswalk && t.road ? null : '횡단보도 위에만 설치';
      case 'bridge': if (t.term) return '건물 위에는 설치할 수 없습니다'; if (!(t.base === 'water' || t.road)) return '다리는 강 위 또는 기존 도로 위에만'; return null;
      case 'tunnel': if (t.term) return '건물 아래에는 설치할 수 없습니다'; if (t.base === 'water') return '강 밑으로는 지하차도를 뚫을 수 없습니다'; return null;
      case 'demolish': {
        const o = base[i];
        if (F.tileCost(t, o) > 0 && !(o.road && !t.road)) return null;
        if (t.road && t.locked) return '잠금 도로(기존 도시계획 구역)는 철거할 수 없습니다';
        if (t.road) return null;
        return '철거할 것이 없습니다';
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
        if (F.tileCost(t, o) > 0 && !(o.road && !t.road)) { const keepRoad = o.road; Object.assign(t, o); t.road = keepRoad; }
        else { t.road = false; clearGround(t); }
        val = true; break;
      case 'oneway': {
        if (force !== undefined) t.oneway = force;
        else {
          const order = [1, 2, 3, 0];
          if (t.oneway < 0) { const pref = order.filter(d => neighborsRoad(i, d)); t.oneway = pref.length ? pref[0] : 1; }
          else { const k = order.indexOf(t.oneway); t.oneway = k === 3 ? -1 : order[k + 1]; }
        }
        if (t.oneway >= 0) t.rev = false;
        val = t.oneway; break;
      }
      case 'bridge': case 'tunnel': {
        const hasH = graph.nbr[i * 3].some(b => { const bi = (b / 3) | 0; return bi === i - 1 || bi === i + 1; });
        const guess = t.road ? (hasH ? 'V' : 'H') : ((neighborsRoad(i, 1) || neighborsRoad(i, 3) || !(neighborsRoad(i, 0) || neighborsRoad(i, 2))) ? 'H' : 'V');
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
    if (cost() > F.BUDGET) { Object.assign(t, before); return { err: '예산 초과! (총예산 $3,500)' }; }
    return { val };
  }
  function afterEdit() {
    graph = F.buildGraph(tiles); conflicts = F.conflictIndex(tiles);
    updateBudget(); updateConf(); save(); schedulePredict();
  }
  function pushUndo() { undo.push(JSON.stringify(tiles)); if (undo.length > 60) undo.shift(); }

  /* ---------- 모드 전환 ---------- */
  function setMode(m) {
    mode = m;
    const b = $('modeBadge');
    b.className = 'badge' + (m === 'edit' ? ' edit' : m === 'run' ? ' run' : '');
    b.textContent = m === 'before' ? '● 개선 전 (대조군)' : m === 'edit' ? '✏️ 설계 도면' : '▶ 개선 후 (실험군)';
    $('result').classList.add('hidden');
    $('toolbar').style.opacity = m === 'edit' ? 1 : .55;
    $('predCard').style.display = m === 'edit' ? '' : 'none';
    applyView();
    $('afterLbl').textContent = m === 'before' ? '현재 실행 (개선 전)' : '개선 후 (실험군)';
  }
  function applyView() {
    const on3d = use3d && mode !== 'edit' && !!sim;
    if (V3) V3.show(on3d);
    const w = $('stageWrap'); w.classList.toggle('sky', on3d); w.classList.toggle('blueprint', mode === 'edit');
    $('btnView').textContent = use3d ? '🧊 3D' : '🗺️ 2D';
    $('btnView').style.display = V3 ? '' : 'none';
  }
  function build3d() { if (V3 && sim) V3.build(sim.tiles, sim); }
  function startBefore() { sim = new F.Sim(base, { seed: SEED }); build3d(); tracked = null; paused = false; acc = 0; setMode('before'); }
  function startEdit() { sim = null; tracked = null; setMode('edit'); updateLive(true); schedulePredict(); }
  function startRun() { sim = new F.Sim(tiles, { seed: SEED }); build3d(); tracked = null; paused = false; acc = 0; setMode('run'); }
  function finish() {
    const m = sim.metrics(), c = mode === 'before' ? 0 : cost();
    const res = judge(m, c);
    lastResult = res;
    if (mode === 'run') {
      const sig = JSON.stringify(tiles);
      history = history.filter(h => h.sig !== sig);
      history.push({ sig, cost: c, pc: m.perCapita, acc: m.accidents, rank: res.rank, clear: res.clear, bus: m.busAvg, arr: m.arrived });
      if (history.length > 12) history.shift();
      save();
    }
    showResult(res, m, c);
    updateHist();
  }
  function judge(m, c) {
    const clear = m.perCapita <= TARGET && m.accidents <= ACC_LIMIT;
    let rank = 'F';
    if (clear) rank = (m.perCapita <= 16 && m.accidents === 0) ? 'S' : (m.perCapita <= 23 && m.accidents === 0) ? 'A' : 'B';
    return { clear, rank, pc: m.perCapita, acc: m.accidents, cost: c };
  }
  function showResult(res, m, c) {
    const t = $('resTitle'), isBefore = mode === 'before';
    if (isBefore) { t.className = 'fail'; t.textContent = m.accidents >= 2 ? 'SIMULATION FAILED' : 'TIME OVER'; }
    else { t.className = res.clear ? 'clear' : 'fail'; t.textContent = res.clear ? 'STAGE CLEAR' : (m.accidents > ACC_LIMIT ? 'SIMULATION FAILED' : 'TIME OVER'); }
    $('resRank').textContent = isBefore ? '' : (res.clear ? 'RANK ' + res.rank : '');
    const d = m.perCapita - baseM.perCapita;
    let body = isBefore
      ? `기존 도로망 기록: 인당 평균 통행시간 <b>${m.perCapita.toFixed(1)}초</b> · 사고 <b>${m.accidents}건</b><br>도착 ${m.arrived}/${m.total}대 — 목표는 <b>${TARGET}초 이하 · 사고 ${ACC_LIMIT}건 이하</b>입니다.<br>설계 모드에서 예산 $3,500 으로 도로망을 고쳐 보세요.`
      : `인당 평균 통행시간 <b>${baseM.perCapita.toFixed(1)}초 → ${m.perCapita.toFixed(1)}초</b> (ΔT ${d >= 0 ? '+' : ''}${d.toFixed(1)}초)<br>사고 <b>${baseM.accidents}건 → ${m.accidents}건</b> · 버스 평균 ${m.busAvg.toFixed(1)}초 · 도착 ${m.arrived}/${m.total}대<br>사용 예산 <b>$${c.toLocaleString()}</b> / $3,500`;
    if (!isBefore && !res.clear) body += '<br>' + (m.accidents > ACC_LIMIT ? `대형 교통사고 발생 — 사고 ${m.accidents}건 (허용 ${ACC_LIMIT}건)` : '') + (m.perCapita > TARGET ? ` 목표 시간 ${TARGET}초 초과` : '');
    $('resBody').innerHTML = body;
    $('result').classList.remove('hidden');
    const rb = $('rankBadge'); rb.className = 'rank ' + (isBefore ? 'F' : res.rank); rb.textContent = isBefore ? 'F' : res.rank;
  }

  /* ---------- 대시보드 ---------- */
  function updateBudget() {
    const c = cost();
    $('budUsed').textContent = '$' + c.toLocaleString();
    $('budLeft').textContent = '(잔액 $' + (F.BUDGET - c).toLocaleString() + ')';
    $('budFill').style.width = (c / F.BUDGET * 100) + '%';
    $('budBig').textContent = '$' + c.toLocaleString();
  }
  function updateConf() {
    const now = conflicts.sum, col = now < baseConf ? 'var(--green)' : now > baseConf ? 'var(--red)' : 'var(--txt)';
    $('conf').innerHTML = `<b style="color:#ff7d92">${baseConf}</b><span class="to">→</span><b style="color:${col}">${now}</b><br><span class="lbl">평면 교차 상충점 합계 · 4지 32 / 3지 9 / 회전 8·6</span>`;
  }
  function updateMix() {
    const mx = baseSim.mix, tot = mx.normal + mx.speeder + mx.novice;
    const items = [['normal', '일반'], ['speeder', '과속'], ['novice', '초보']];
    $('mixBar').innerHTML = items.map(([k]) => `<div style="width:${mx[k] / tot * 100}%;background:${R.CAR[k]}"></div>`).join('');
    $('mixLegend').innerHTML = items.map(([k, n]) => `<span><i style="background:${R.CAR[k]}"></i>${n} ${(mx[k] / tot * 100).toFixed(0)}%</span>`).join('') +
      `<span><i style="background:${R.CAR.bus}"></i>버스 ${mx.bus}대 (W=20)</span>`;
  }
  let lastDash = 0;
  function updateLive(force) {
    const now = performance.now();
    if (!force && now - lastDash < 200) return; lastDash = now;
    $('vBefore').textContent = baseM.perCapita.toFixed(1) + 's';
    $('aBefore').textContent = `사고 ${baseM.accidents}건 · 도착 ${baseM.arrived}/${baseM.total}`;
    let cur = null, series = [];
    if (sim) { cur = sim.metrics(); series = sim.series; }
    else if (lastResult && mode === 'edit' && history.length) { const h = history[history.length - 1]; cur = { perCapita: h.pc, accidents: h.acc, arrived: h.arr, total: baseM.total }; }
    const dEl = $('vDelta').parentElement;
    if (cur) {
      $('vAfter').textContent = cur.perCapita.toFixed(1) + 's';
      $('aAfter').textContent = `사고 ${cur.accidents}건 · 도착 ${cur.arrived}/${cur.total}`;
      if (sim && !sim.done) { $('vDelta').textContent = '진행 중…'; $('vDeltaPct').textContent = ''; dEl.className = 'cmp arrow'; }
      else {
        const d = cur.perCapita - baseM.perCapita;
        $('vDelta').textContent = 'ΔT ' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + 's';
        $('vDeltaPct').textContent = (d / baseM.perCapita * 100).toFixed(0) + '%';
        dEl.className = 'cmp arrow' + (d > 0 ? ' bad' : '');
      }
    } else { $('vAfter').textContent = '–'; $('aAfter').textContent = '사고 –'; $('vDelta').textContent = 'ΔT –'; $('vDeltaPct').textContent = ''; }
    R.lineChart($('chart'), { base: baseSeries, cur: mode === 'before' ? (sim ? sim.series : baseSeries) : series, target: TARGET });
    const t = sim ? sim.t : 0;
    $('clockTxt').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    $('clockFill').style.width = (t / F.SIM_END * 100) + '%';
    $('clockPm').style.left = (F.PM_START / F.SIM_END * 100) + '%';
    $('phaseTxt').textContent = !sim ? '정지' : t < F.PM_START ? '출근 (서→동)' : t < F.DEMAND_END ? '퇴근 (동→서)' : '잔여 처리';
  }
  function updateHist() {
    const pts = [{ cost: 0, pc: baseM.perCapita, base: true }].concat(history.map((h, k) => ({ cost: h.cost, pc: h.pc, clear: h.clear, cur: k === history.length - 1 })));
    R.pareto($('pareto'), { pts, target: TARGET });
    if (!history.length) { $('hist').innerHTML = '<span class="lbl">재실행 결과가 여기에 쌓입니다. 서로 다른 빌드를 비교해 보세요.</span>'; return; }
    $('hist').innerHTML = '<table><tr><th>빌드</th><th>예산</th><th>T̄</th><th>ΔT</th><th>사고</th><th>등급</th></tr>' +
      history.map((h, k) => `<tr><td>#${k + 1}</td><td>$${h.cost.toLocaleString()}</td><td>${h.pc.toFixed(1)}s</td><td>${(h.pc - baseM.perCapita).toFixed(1)}</td><td>${h.acc}</td><td class="${h.clear ? 'ok' : 'ng'}">${h.clear ? h.rank : 'FAIL'}</td></tr>`).reverse().join('') + '</table>';
  }
  /* 설계 변경 시 다른 난수 시드로 미리 돌려 본 예상치 */
  function schedulePredict() {
    clearTimeout(predTimer);
    if (mode !== 'edit') return;
    predTimer = setTimeout(() => {
      if (!predBase) predBase = new F.Sim(base, { seed: PRED_SEED }).run();
      const c = cost();
      if (c === 0) { $('pred').innerHTML = '<span class="dim">아직 변경 사항이 없습니다. 하단 도구로 도로를 수정해 보세요.</span>'; return; }
      const m = new F.Sim(tiles, { seed: PRED_SEED }).run();
      const d = m.perCapita - predBase.perCapita, good = d < 0;
      $('pred').innerHTML = `예상 통행시간 <b>${m.perCapita.toFixed(1)}s</b> <b class="${good ? 'good' : 'bad'}">ΔT ${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}s</b>` +
        ` · 예상 사고 <b class="${m.accidents <= ACC_LIMIT ? 'good' : 'bad'}">${m.accidents}건</b><br><span class="dim">버스 ${m.busAvg.toFixed(1)}s · 도착 ${m.arrived}/${m.total}대 · 실제 결과는 ▶ 재실행으로 검증</span>`;
    }, 220);
  }

  /* ---------- 입력 ---------- */
  function tileAt(e) {
    const r = cv.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return { x, y, i: y * W + x, px: e.clientX - r.left, py: e.clientY - r.top, fx: (e.clientX - r.left) / r.width * W, fy: (e.clientY - r.top) / r.height * H };
  }
  let toastT = 0;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600); }
  function showTip(p) {
    const tip = $('tip');
    if (mode !== 'edit' || !p) { tip.style.display = 'none'; return; }
    const T = TOOL[tool], err = check(p.i, tool), t = tiles[p.i];
    const here = [];
    if (t.term) here.push(t.term.id + ' ' + t.term.name);
    if (t.locked) here.push('🔒 잠금 도로'); if (t.crosswalk) here.push('횡단보도');
    TOOLS.forEach(k => { if (k.id !== 'road' && k.id !== 'demolish' && (k.id === 'oneway' ? t.oneway >= 0 : t[k.id])) here.push(k.nm); });
    tip.innerHTML = `<b>${T.ic} ${T.nm}</b> <span class="cost">$${T.cost}</span><br>${err ? `<span class="bad">✕ ${err}</span>` : T.desc}` + (here.length ? `<br><span style="color:#8492bd">이 타일: ${here.join(' · ')}</span>` : '');
    tip.style.display = 'block';
    const wrap = $('stageWrap').getBoundingClientRect();
    tip.style.left = Math.min(wrap.width - 270, p.px + 16) + 'px';
    tip.style.top = Math.min(wrap.height - 90, p.py + 16) + 'px';
  }
  cv.addEventListener('mousemove', e => {
    if (orbit) {
      const dx = e.clientX - orbit.x, dy = e.clientY - orbit.y;
      if (Math.abs(e.clientX - orbit.x0) + Math.abs(e.clientY - orbit.y0) > 4) orbit.moved = true;
      if (orbit.moved && V3 && use3d) V3.orbit(dx, dy);
      orbit.x = e.clientX; orbit.y = e.clientY; return;
    }
    const p = tileAt(e);
    if (!p) { hover = null; showTip(null); return; }
    hover = { x: p.x, y: p.y, ok: mode === 'edit' && !check(p.i, tool) };
    showTip(p);
    if (drag && mode === 'edit' && p.i !== drag.last) {
      drag.last = p.i;
      const cur = tool === 'oneway' ? tiles[p.i].oneway : tiles[p.i][tool];
      if (tool === 'road' || tool === 'demolish' || cur !== drag.val) {
        const r = apply(p.i, tool, (tool === 'road' || tool === 'demolish') ? undefined : drag.val);
        if (r.err) { if (/예산/.test(r.err)) toast(r.err); } else afterEdit();
      }
    }
  });
  cv.addEventListener('mouseleave', () => { hover = null; showTip(null); });
  cv.addEventListener('mousedown', e => {
    const p = tileAt(e); if (!p) return;
    if (mode !== 'edit') { orbit = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, p }; return; }
    pushUndo();
    const r = apply(p.i, tool);
    if (r.err) { undo.pop(); toast(r.err); return; }
    drag = { last: p.i, val: r.val };
    afterEdit();
  });
  window.addEventListener('mouseup', () => {
    drag = null;
    if (orbit && !orbit.moved && sim) {                    // 클릭: 차량 추적 선택
      let best = null, bd = 1e9; const p = orbit.p, on3d = V3 && use3d;
      for (const c of sim.cars) {
        let d;
        if (on3d) { const q = V3.project(c.x, c.y, V3.carH(sim, c) + .08); d = Math.hypot(q[0] - p.px, q[1] - p.py) / 22; }
        else d = Math.hypot(c.x - p.fx, c.y - p.fy) / 0.25;
        if (d < 1 && d < bd) { bd = d; best = c; }
      }
      if (best) tracked = best;
    }
    orbit = null;
  });
  cv.addEventListener('wheel', e => { if (V3 && use3d && mode !== 'edit') { V3.zoom(e.deltaY > 0 ? 1.08 : 0.93); e.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (mode === 'edit' && undo.length) { tiles = JSON.parse(undo.pop()); afterEdit(); }
      e.preventDefault();
    } else if (e.key.toLowerCase() === 'v') { $('btnView').click();
    } else if (e.code === 'Space') { paused = !paused; $('btnPause').textContent = paused ? '▶' : '⏸'; e.preventDefault(); }
  });

  /* ---------- 툴바 ---------- */
  function buildToolbar() {
    $('toolbar').innerHTML = GROUPS.map((g, gi) => `<div class="grp"><h4><b>${gi + 1}</b>${g}</h4><div class="tools">` +
      TOOLS.filter(t => t.g === gi).map(t => `<button class="tool${t.id === tool ? ' sel' : ''}" data-tool="${t.id}" title="${t.desc}"><span class="ic">${t.ic}</span><span class="nm">${t.nm}</span><span class="pr">$${t.cost}</span></button>`).join('') + '</div></div>').join('');
    $('toolbar').querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => {
      tool = b.dataset.tool;
      $('toolbar').querySelectorAll('.tool').forEach(x => x.classList.toggle('sel', x === b));
      if (mode !== 'edit') startEdit();
    }));
  }

  /* ---------- 예시 빌드 (정답 좌표 판정은 없음 — 같은 엔진으로 돌려 본 3가지 설계 예) ---------- */
  const at = (t, x, y) => t[y * W + x];
  const PRESETS = [
    t => { [[6, 4], [10, 4]].forEach(([x, y]) => { at(t, x, y).round = true; at(t, x, y).guide = true; }); },
    t => { [[3, 4], [6, 4], [10, 4]].forEach(([x, y]) => { at(t, x, y).round = true; at(t, x, y).guide = true; }); at(t, 3, 3).overpass = true; at(t, 9, 4).overpass = true; at(t, 4, 4).camera = true; at(t, 9, 4).camera = true; },
    t => { at(t, 7, 1).bridge = 'H'; at(t, 8, 1).bridge = 'H'; at(t, 9, 1).road = true;[[3, 4], [6, 4], [10, 4]].forEach(([x, y]) => { at(t, x, y).round = true; }); }
  ];

  /* ---------- 버튼 ---------- */
  $('btnBefore').onclick = startBefore;
  $('btnEdit').onclick = startEdit;
  $('btnRun').onclick = startRun;
  $('btnPause').onclick = () => { paused = !paused; $('btnPause').textContent = paused ? '▶' : '⏸'; };
  $('btnSkip').onclick = () => { if (sim && !sim.done) { sim.run(); updateLive(true); finish(); } };
  $('speedSeg').querySelectorAll('button').forEach(b => b.onclick = () => { speed = +b.dataset.sp; $('speedSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
  $('btnView').onclick = () => { use3d = V3 ? !use3d : false; applyView(); };
  $('resEdit').onclick = startEdit;
  $('resClose').onclick = () => $('result').classList.add('hidden');
  $('btnReset').onclick = () => { pushUndo(); tiles = F.cloneTiles(base); startEdit(); afterEdit(); };
  $('btnClearHist').onclick = () => { history = []; save(); updateHist(); };
  document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    pushUndo(); tiles = F.cloneTiles(base); PRESETS[+b.dataset.preset](tiles); startEdit(); afterEdit();
  });

  /* ---------- 메인 루프 ---------- */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (sim && !sim.done && !paused) {
      acc += dt * speed;
      let n = 0;
      while (acc >= F.DT && n < 40) { sim.step(); acc -= F.DT; n++; if (sim.done) break; }
      if (n >= 40) acc = 0;
      if (sim.done) { updateLive(true); finish(); }
    }
    if (sim && (!tracked || tracked.gone || tracked.crashed)) {
      tracked = null;
      for (const c of sim.cars) if (!c.crashed && c.type !== 'bus' && c.prev >= 0 && (!tracked || c.path.length - c.i > tracked.path.length - tracked.i)) tracked = c;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (V3 && use3d && sim && mode !== 'edit') {
      V3.update(sim, now);
      R.overlay3d(ctx, { sim, tracked, now }, V3);
    } else R.draw(ctx, { TS, tiles: sim ? sim.tiles : tiles, graph: sim ? sim : graph, sim, mode, hover, now, tracked, conflicts, theme: mode === 'edit' ? 'blueprint' : null, showHeat: true, showVec: true, showPath: true });
    if (sim) updateLive();
    requestAnimationFrame(frame);
  }

  buildToolbar(); resize(); updateBudget(); updateConf(); updateMix(); updateHist(); $('goalT').textContent = TARGET;
  startBefore(); updateLive(true);
  requestAnimationFrame(frame);

  // 자동화 테스트·디버깅용 핸들
  window.FlowLab = { V3, get sim() { return sim; }, get tiles() { return tiles; }, startRun, startEdit, startBefore, setTool: id => { tool = id; }, apply: (x, y, id) => { const r = apply(y * W + x, id); afterEdit(); return r; }, baseM };
})();
