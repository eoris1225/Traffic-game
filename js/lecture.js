/* FLOW LAB — 핍의 설명회
 * 플레이어가 "이건 어디다 쓰죠?" 를 고르면 핍이 발표봉과 자료판을 들고 나와 예시 그림으로 설명한다.
 * 예시 그림은 사진이 아니라, 게임의 2D 도면 렌더러로 작은 장면을 실시간으로 그린 것이다(차가 실제로 움직인다). */
(function () {
  'use strict';
  const L = window.FlowLab, F = window.FlowSim, R = window.FlowRender; if (!L) return;
  const $ = id => document.getElementById(id), SC = window.PIP_SCRIPT;
  const imgs = window.FlowPenguin ? window.FlowPenguin.make() : null;
  const face = (img, pose) => { if (imgs) img.src = imgs[pose] || imgs.talk; img.style.display = imgs ? '' : 'none'; };

  /* 대사 속 {이름} 은 실제 버튼 그림으로 바뀐다 */
  const chip = k => {
    if (k.startsWith('t:')) return `<i class="kb tool">${L.IC[k.slice(2)]}</i>`;
    if (k === 'speed') return '<i class="kb">×2</i>';
    if (k === 'q' || k === 'bang' || k === 'stuck' || k === 'cam') return `<i class="bub ${k}">${{ q: '?', bang: '!', stuck: '···', cam: '' }[k]}</i>`;
    return `<i class="kb ${k}">${L.UI[k] || ''}</i>`;
  };
  const parse = text => { const out = []; text.split(/(\{[^}]+\})/).forEach(p => { if (p[0] === '{') out.push(chip(p.slice(1, -1))); else for (const ch of p) out.push(ch); }); return out; };
  window.FlowPip = { imgs, face, chip, parse };
  $('askClose').textContent = SC.ask.close;

  /* ---------- 장면 만들기 ---------- */
  const W = F.W, H = F.H, VW = 5, VH = 3;                     // 자료판에는 왼쪽 위 5×3 칸만 보인다
  function scene(build) {
    const tiles = []; for (let i = 0; i < W * H; i++) tiles.push(F.newTile('grass'));
    const at = (x, y) => tiles[y * W + x], cars = [], heat = new Float32Array(W * H), sc = { tiles, cars, heat, cw: false, mode: 'run', marks: [], sigAxis: 1 };
    const api = {
      at, sc,
      road(x0, y0, x1, y1, o) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Object.assign(at(x, y), { road: true }, o || {}); },
      base(x, y, b) { at(x, y).base = b; },
      /* 차: path 를 따라 달린다. stop 이면 그 자리에 서 있다(브레이크등) */
      car(type, path, o) { cars.push(Object.assign({ type, path, v: 1, ph: 0 }, o || {})); },
      queue(type, x0, y, n, dir, o) { for (let k = 0; k < n; k++) cars.push(Object.assign({ type: Array.isArray(type) ? type[k % type.length] : type, stop: [x0 - dir * k * .36, y], ang: dir > 0 ? 0 : Math.PI }, o || {})); },
      heat(x, y, h) { heat[y * W + x] = h * 2.6; },
      ring(x, y, r) { sc.marks.push({ k: 'ring', x, y, r: r || .5 }); },
      note(x, y, text, good) { sc.marks.push({ k: 'note', x, y, text, good }); }
    };
    build(api); sc.graph = F.buildGraph(tiles); return sc;
  }
  const E = y => [[-.6, y + .64], [5.6, y + .64]], Wd = y => [[5.6, y + .36], [-.6, y + .36]];      // 동쪽행 / 서쪽행 차로
  const S = x => [[x + .36, -.6], [x + .36, 3.6]], N = x => [[x + .64, 3.6], [x + .64, -.6]];
  const row = a => a.road(0, 1, 4, 1), cross = a => { a.road(0, 1, 4, 1); a.road(2, 0, 2, 2); };
  const flow = (a, n) => { for (let k = 0; k < (n || 3); k++) { a.car(['normal', 'normal', 'speeder'][k % 3], E(1), { ph: k / (n || 3), v: 1.1 }); if (k < 2) a.car('normal', Wd(1), { ph: k / 2 + .2, v: 1 }); } };

  /* ---------- 설명 자료 ---------- */
  const T = (id, nm) => ({ id, nm, icon: '{t:' + id + '}', cost: (c => (c >= 1000 ? '$' + c / 1000 + 'M' : '$' + c + 'K'))(F.COST[id]) });
  const TOPICS = [
    Object.assign(T('road', '도로'), { slides: [
      { s: a => { a.road(0, 1, 1, 1); a.road(3, 1, 4, 1); a.queue('normal', 1.2, 1.64, 3, 1); a.note(2.5, .55, '끊긴 길'); a.ring(2.5, 1.5, .55); } },
      { s: a => { row(a); flow(a); a.note(2.5, .55, '이어짐!', true); } },
      { s: a => { cross(a); flow(a, 4); a.car('normal', S(2), { ph: .3 }); a.car('novice', N(2), { ph: .7, v: .7 }); a.note(2.5, 2.8, '길 ↑  = 차 ↑'); } }] }),
    Object.assign(T('wide', '차선 확장'), { slides: [
      { s: a => { row(a); a.queue(['novice', 'normal', 'normal', 'speeder'], 3.3, 1.64, 4, 1); a.note(3.3, .55, '느린 차 한 대'); a.ring(3.3, 1.64, .34); for (let x = 0; x < 4; x++) a.heat(x, 1, .8); } },
      { s: a => { a.road(0, 1, 4, 1, { wide: true }); a.car('novice', [[-.6, 1.83], [5.6, 1.83]], { v: .6 }); a.car('normal', [[-.6, 1.61], [5.6, 1.61]], { v: 1.3 }); a.car('speeder', [[-.6, 1.61], [5.6, 1.61]], { v: 1.6, ph: .5 }); a.car('normal', [[5.6, 1.39], [-.6, 1.39]], { ph: .4 }); a.note(2.5, .5, '앞지르기 가능', true); } }] }),
    Object.assign(T('oneway', '일방통행'), { slides: [
      { s: a => { a.road(0, 1, 4, 1, { oneway: 1 }); a.car('normal', [[-.6, 1.64], [5.6, 1.64]], { v: 1.2 }); a.car('speeder', [[-.6, 1.36], [5.6, 1.36]], { v: 1.5, ph: .4 }); a.car('normal', [[-.6, 1.36], [5.6, 1.36]], { v: 1.2, ph: .8 }); a.note(2.5, .5, '한 방향, 두 줄', true); } },
      { s: a => { a.road(0, 1, 4, 1, { oneway: 1 }); a.queue('normal', 4.2, 1.36, 1, -1); a.car('normal', [[-.6, 1.64], [5.6, 1.64]], { v: 1.2 }); a.note(3.9, .55, '역주행 불가'); a.ring(4.2, 1.36, .34); } }] }),
    Object.assign(T('demolish', '철거'), { slides: [
      { s: a => { cross(a); a.at(2, 0).road = false; a.note(2.5, .5, '여기 길이 있었음'); a.ring(2.5, .5, .45); flow(a); } },
      { s: a => { row(a); a.sc.mode = 'edit'; for (let x = 0; x < 5; x++) a.at(x, 1).locked = true; a.note(2.5, .5, '잠긴 도로는 철거 불가'); } }] }),
    Object.assign(T('guide', '유도선'), { slides: [
      { s: a => { cross(a); a.queue('novice', 1.55, 1.64, 1, 1, { mark: '?' }); a.queue('normal', 1.19, 1.64, 2, 1); a.note(1.6, .5, '어느 쪽이더라…'); } },
      { s: a => { cross(a); a.at(2, 1).guide = true; a.at(1, 1).guide = true; a.car('novice', E(1), { v: .8 }); a.car('normal', E(1), { v: .8, ph: .5 }); a.car('normal', S(2), { ph: .2 }); a.note(2.5, 2.8, '색을 따라가면 됨', true); } }] }),
    Object.assign(T('bus', '버스 전용'), { slides: [
      { s: a => { row(a); a.queue(['normal', 'normal', 'bus', 'normal'], 3.6, 1.64, 4, 1, { gap: .42 }); for (let x = 0; x < 5; x++) a.heat(x, 1, .9); a.note(2.75, .55, '20명이 갇혀 있음'); a.ring(2.8, 1.64, .36); } },
      { s: a => { a.road(0, 1, 4, 1, { bus: true }); a.car('bus', E(1), { v: 1 }); a.car('bus', Wd(1), { v: 1, ph: .5 }); a.note(2.5, .5, '버스만 통과', true); } }] }),
    Object.assign(T('rev', '가변 차선'), { slides: [
      { s: a => { a.road(0, 1, 4, 1, { rev: true }); a.car('normal', [[-.6, 1.72], [5.6, 1.72]], { v: 1.1 }); a.car('normal', [[-.6, 1.5], [5.6, 1.5]], { v: 1.3, ph: .35 }); a.car('speeder', [[-.6, 1.5], [5.6, 1.5]], { v: 1.3, ph: .8 }); a.car('normal', [[5.6, 1.28], [-.6, 1.28]], { ph: .5 }); a.note(2.5, .45, '아침: 가운데 → 회사 쪽', true); } },
      { s: a => { a.road(0, 1, 4, 1, { rev: true }); a.sc.fav = -1; a.car('normal', [[5.6, 1.28], [-.6, 1.28]], { v: 1.1 }); a.car('normal', [[5.6, 1.5], [-.6, 1.5]], { v: 1.3, ph: .4 }); a.car('normal', [[-.6, 1.72], [5.6, 1.72]], { ph: .5 }); a.note(2.5, .45, '저녁: 가운데 → 집 쪽', true); } }] }),
    Object.assign(T('round', '회전교차로'), { slides: [
      { s: a => { cross(a); a.queue('normal', 1.55, 1.64, 2, 1); a.queue('normal', 2.36, .55, 1, 0, { ang: Math.PI / 2 }); a.queue('speeder', 3.45, 1.36, 1, -1); a.queue('novice', 2.64, 2.45, 1, 0, { ang: -Math.PI / 2, mark: '?' }); a.note(2.5, .2, ''); a.note(.9, .5, '눈치 싸움'); a.ring(2.5, 1.5, .5); } },
      { s: a => { cross(a); a.at(2, 1).round = true; const c = []; for (let k = 0; k <= 16; k++) { const th = -k / 16 * Math.PI * 2; c.push([2.5 + Math.cos(th) * .27, 1.5 + Math.sin(th) * .27]); } for (let k = 0; k < 3; k++) a.car(['normal', 'speeder', 'novice'][k], c, { ph: k / 3, v: .5 }); a.car('normal', [[-.6, 1.64], [2.1, 1.64]], { v: .8 }); a.car('normal', [[2.9, 1.64], [5.6, 1.64]], { v: .8, ph: .5 }); a.note(2.5, 2.8, '멈추지 않고 돈다', true); } }] }),
    Object.assign(T('signal', '신호등'), { slides: [
      { s: a => { cross(a); a.at(2, 1).signal = true; a.car('normal', E(1), { v: 1.1 }); a.car('normal', E(1), { v: 1.1, ph: .45 }); a.car('speeder', Wd(1), { ph: .3 }); a.queue('normal', 2.36, .52, 1, 0, { ang: Math.PI / 2 }); a.queue('novice', 2.64, 2.48, 1, 0, { ang: -Math.PI / 2 }); a.note(3.8, .5, '차례가 정해짐', true); } },
      { s: a => { cross(a); a.at(2, 1).signal = true; a.sc.sigAxis = 0; a.car('normal', S(2), { v: 1.1 }); a.car('normal', N(2), { v: 1.1, ph: .5 }); a.queue('normal', 1.52, 1.64, 3, 1); a.queue('normal', 3.48, 1.36, 2, -1); a.note(1, .5, '한쪽은 반드시 선다'); } }] }),
    Object.assign(T('bridge', '다리'), { slides: [
      { s: a => { a.road(0, 1, 1, 1); a.road(3, 1, 4, 1); for (let y = 0; y < 3; y++) a.base(2, y, 'water'); a.queue('normal', 1.3, 1.64, 2, 1); a.note(2.5, .4, '차는 헤엄을 못 침'); } },
      { s: a => { a.road(0, 1, 1, 1); a.road(3, 1, 4, 1); for (let y = 0; y < 3; y++) a.base(2, y, 'water'); a.at(2, 1).bridge = 'H'; a.car('normal', E(1), { v: 1.1, layer: [1.6, 3.4, 1] }); a.car('normal', Wd(1), { v: 1.1, ph: .4, layer: [1.6, 3.4, 1] }); a.note(2.5, .4, '다리로 건넘', true); } },
      { s: a => { cross(a); a.at(2, 1).bridge = 'V'; flow(a); a.car('normal', S(2), { layer: [.6, 2.4, 1] }); a.car('speeder', N(2), { ph: .5, layer: [.6, 2.4, 1] }); a.note(3.9, .5, '만나지 않고 지나감', true); } }] }),
    Object.assign(T('tunnel', '지하차도'), { slides: [
      { s: a => { a.road(0, 1, 1, 1); a.road(3, 1, 4, 1); a.base(2, 1, 'park'); a.base(2, 0, 'park'); a.base(2, 2, 'park'); a.queue('normal', 1.3, 1.64, 2, 1); a.note(2.5, .2, ''); a.note(3.9, .5, '공원은 밀 수 없음'); } },
      { s: a => { a.road(0, 1, 1, 1); a.road(3, 1, 4, 1); a.base(2, 1, 'park'); a.base(2, 0, 'park'); a.base(2, 2, 'park'); a.at(2, 1).tunnel = 'H'; a.car('normal', E(1), { v: 1.1, layer: [1.6, 3.4, 2] }); a.car('normal', Wd(1), { v: 1.1, ph: .5, layer: [1.6, 3.4, 2] }); a.note(3.9, .5, '밑으로 지나감', true); } }] }),
    Object.assign(T('overpass', '육교'), { slides: [
      { s: a => { row(a); a.at(2, 1).crosswalk = true; a.sc.cw = true; a.queue(['normal', 'bus', 'normal'], 1.55, 1.64, 3, 1, { gap: .42 }); a.queue('normal', 3.45, 1.36, 2, -1); for (let x = 0; x < 2; x++) a.heat(x, 1, .9); a.note(2.5, .5, '12초 중 8초는 보행 신호'); } },
      { s: a => { row(a); a.at(2, 1).crosswalk = true; a.at(2, 1).overpass = true; flow(a, 4); a.note(2.5, .5, '사람은 위로, 차는 아래로', true); } }] }),
    Object.assign(T('camera', '단속 카메라'), { slides: [
      { s: a => { row(a); a.car('speeder', E(1), { v: 2.2 }); a.queue('normal', 3.9, 1.64, 1, 1); a.note(2.2, .5, '과속 → 급정거 → 사고'); } },
      { s: a => { row(a); a.at(2, 1).camera = true; a.car('speeder', E(1), { v: .95 }); a.car('normal', E(1), { v: .95, ph: .5 }); a.note(2.5, 2.75, '원 안에서는 얌전해짐', true); } }] }),
    Object.assign(T('bump', '방지턱'), { slides: [
      { s: a => { row(a); a.at(2, 1).bump = true; a.car('normal', E(1), { v: .55 }); a.car('speeder', E(1), { v: .55, ph: .33 }); a.car('novice', E(1), { v: .55, ph: .66 }); a.note(2.5, .5, '모두가 느려짐'); } },
      { s: a => { cross(a); a.at(1, 1).bump = true; a.car('speeder', E(1), { v: .6 }); a.car('normal', S(2), { ph: .4 }); a.note(1.5, .5, '사고 잦은 곳 앞에만', true); } }] }),
    Object.assign(T('barricade', '통행 차단'), { slides: [
      { s: a => { a.road(0, 0, 4, 0); a.road(0, 2, 4, 2); a.road(2, 1, 2, 1); a.car('normal', [[-.6, .64], [2.36, .64], [2.36, 2.64], [5.6, 2.64]], { v: 1 }); a.car('normal', [[-.6, .64], [2.36, .64], [2.36, 2.64], [5.6, 2.64]], { v: 1, ph: .33 }); a.car('speeder', [[-.6, .64], [2.36, .64], [2.36, 2.64], [5.6, 2.64]], { v: 1, ph: .66 }); a.heat(2, 1, 1); a.heat(1, 0, .8); a.heat(3, 2, .8); a.heat(2, 0, .9); a.heat(2, 2, .9); a.note(3.7, 1.5, '모두가 지름길로'); } },
      { s: a => { a.road(0, 0, 4, 0); a.road(0, 2, 4, 2); a.road(2, 1, 2, 1); a.at(2, 1).barricade = true; a.car('normal', E(0), { v: 1.2 }); a.car('normal', E(0), { v: 1.2, ph: .5 }); a.car('normal', E(2), { v: 1.2, ph: .25 }); a.car('speeder', E(2), { v: 1.2, ph: .75 }); a.note(3.7, 1.5, '나뉘어서 흐름', true); } }] }),
    { id: 'marks', nm: '차 위의 표시', icon: '{bang}', cost: '읽는 법', slides: [
      { s: a => { cross(a); a.queue('novice', 1.55, 1.64, 1, 1, { mark: '?' }); a.queue('normal', 1.19, 1.64, 1, 1, { mark: '!' }); a.queue('normal', .83, 1.64, 1, 1, { mark: '···' }); for (let x = 0; x < 2; x++) a.heat(x, 1, 1); a.heat(2, 1, .5); } },
      { s: a => { row(a); a.car('normal', E(1), { v: 1.2 }); a.car('speeder', E(1), { v: 1.2, ph: .3 }); a.car('novice', E(1), { v: 1.2, ph: .6 }); a.car('bus', Wd(1), { v: 1 }); a.note(2.5, .5, '파랑 일반 · 빨강 과속 · 노랑 초보 · 초록 버스'); } }] },
    { id: 'stars', nm: '별과 목표', icon: '{star}', cost: '4단계', slides: [
      { poster: [['★', '평균 이동시간 24초 이하'], ['★', '사고 없이'], ['★', '평균 이동시간 20초 이하'], ['p', '17초 이하를 $1,200 안에']] },
      { poster: [['$', '예산은 스테이지마다 다릅니다'], ['↺', '같은 도구로 다시 누르면 전액 환불'], ['~', '위쪽 "예상" 은 다른 날 아침의 추정치']] }] }
  ];
  const TOPIC = {}; TOPICS.forEach(t => TOPIC[t.id] = t);

  /* ---------- 자료판 그리기 ---------- */
  const cv = $('askCanvas'), ctx = cv.getContext('2d'), TS = cv.width / VW;
  const BUBC = { '?': ['#ffc928', '#1c1f27'], '!': ['#e5483f', '#fff'], '···': ['#1c1f27', '#fff'] };
  function along(path, u) {                                    // 꺾은선 위의 위치와 방향
    let tot = 0; const seg = [];
    for (let k = 0; k < path.length - 1; k++) { const l = Math.hypot(path[k + 1][0] - path[k][0], path[k + 1][1] - path[k][1]); seg.push(l); tot += l; }
    let d = (u % 1) * tot, k = 0; while (k < seg.length - 1 && d > seg[k]) d -= seg[k++];
    const A = path[k], B = path[k + 1], f = d / seg[k];
    return { x: A[0] + (B[0] - A[0]) * f, y: A[1] + (B[1] - A[1]) * f, ang: Math.atan2(B[1] - A[1], B[0] - A[0]), tot };
  }
  function drawScene(sc, now) {
    const t = now / 1000, cars = sc.cars.map((c, id) => {
      const len = c.type === 'bus' ? .42 : .26;
      if (c.stop) return { id, type: c.type, x: c.stop[0] - (c.gap ? (c.gap - .36) * id : 0), y: c.stop[1], ang: c.ang || 0, v: .3, vt: 0, v0: 1, len, layer: 0, mark: c.mark };
      const tot = along(c.path, 0).tot, p = along(c.path, c.ph + t * c.v / tot);
      return { id, type: c.type, x: p.x, y: p.y, ang: p.ang, v: c.v, vt: c.v, v0: 1, len, layer: c.layer && p.x > c.layer[0] && p.x < c.layer[1] && p.y > -1 ? c.layer[2] : 0 };
    });
    const fav = sc.fav || 1, sim = { t, cars, heat: sc.heat, N: 0, blockedUntil: [], crashes: [], revFav: { length: 0 }, revTrans: {}, sig: {}, cwActive: () => sc.cw };
    sim.revFav = new Int8Array(W * H).fill(fav); sim.revTrans = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (sc.tiles[i].signal) sim.sig[i * 3] = { axis: sc.sigAxis, clearUntil: 0 };
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cv.width, cv.height); ctx.clip();
    R.draw(ctx, { TS, tiles: sc.tiles, graph: sc.graph, sim, mode: sc.mode, now, theme: 'blueprint', showHeat: true });
    ctx.restore();
    // 차 위 표시
    for (const c of cars) if (c.mark) {
      const b = BUBC[c.mark], x = c.x * TS, y = c.y * TS - 26 - Math.abs(Math.sin(t * 3 + c.id)) * 4;
      ctx.fillStyle = '#1c1f27'; ctx.beginPath(); ctx.arc(x, y + 2, 13, 0, 7); ctx.fill();
      ctx.fillStyle = b[0]; ctx.strokeStyle = '#1c1f27'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b[1]; ctx.font = '900 ' + (c.mark.length > 1 ? 12 : 17) + 'px "Wanted Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.mark, x, y + 1);
    }
    // 핍이 유성펜으로 적어 넣은 것들
    for (const m of sc.marks) {
      if (m.k === 'ring') {
        ctx.strokeStyle = '#ffc928'; ctx.lineWidth = 5; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.ellipse(m.x * TS, m.y * TS, m.r * TS, m.r * TS * .92, -.1, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      } else if (m.text) {
        ctx.save(); ctx.translate(m.x * TS, m.y * TS); ctx.rotate(-.035);
        ctx.font = '900 21px "Wanted Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(m.text).width + 26;
        ctx.fillStyle = '#1c1f27'; ctx.fillRect(-w / 2 + 3, -15, w, 36);
        ctx.fillStyle = m.good ? '#7dffc0' : '#fff3c4'; ctx.fillRect(-w / 2, -18, w, 36);
        ctx.fillStyle = '#1c1f27'; ctx.fillText(m.text, 0, 1); ctx.restore();
      }
    }
  }
  function drawPoster(rows) {
    ctx.fillStyle = '#474c78'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = '#6d73a8'; ctx.lineWidth = 1; for (let x = 0; x <= cv.width; x += TS / 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke(); } for (let y = 0; y <= cv.height; y += TS / 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke(); }
    const h = cv.height / (rows.length + 1);
    rows.forEach((r, k) => {
      const y = h * (k + 1);
      ctx.font = '900 40px "Wanted Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = r[0] === 'p' ? '#b58bff' : '#ffc928'; ctx.fillText(r[0] === 'p' ? '★' : r[0], 70, y + 2);
      ctx.font = '800 25px "Wanted Sans",sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#eef3ff'; ctx.fillText(r[1], 120, y + 2);
    });
  }

  /* ---------- 진행 ---------- */
  const ask = $('ask'), txt = $('askText');
  let topic = null, si = 0, sc = null, segs = [], shownN = 0, typeT = 0, open = false;
  const typing = () => shownN < segs.length;
  const paint = () => { txt.innerHTML = segs.slice(0, shownN).join(''); ask.classList.toggle('ready', !typing()); };
  function tick() { shownN = Math.min(segs.length, shownN + 1); paint(); if (typing()) { const ch = segs[shownN - 1]; typeT = setTimeout(tick, ch.length > 1 ? 140 : /[!?.…—,]/.test(ch) ? 110 : 22); } }
  function slide(k) {
    clearTimeout(typeT); si = k; const s = topic.slides[k];
    sc = s.s ? scene(s.s) : null; if (s.poster) drawPoster(s.poster);
    $('askPage').textContent = (k + 1) + ' / ' + topic.slides.length;
    const im = $('askPip'); face(im, k % 2 ? 'teach2' : 'teach'); im.classList.remove('pop'); void im.offsetWidth; im.classList.add('pop');
    segs = parse((SC.topics[topic.id] || [])[k] || '…'); shownN = 0; paint(); tick();
  }
  function show(id) {
    topic = TOPIC[id]; if (!topic) return;
    $('help').classList.add('hidden'); $('toolInfo').classList.add('hidden');
    $('askTitle').innerHTML = parse(topic.icon).join('') + '<b>' + topic.nm + '</b><em>' + topic.cost + '</em>';
    ask.classList.remove('hidden'); open = true; slide(0);
  }
  function close() { open = false; clearTimeout(typeT); ask.classList.add('hidden'); }
  function advance() {
    if (!open) return;
    if (typing()) { clearTimeout(typeT); shownN = segs.length; paint(); return; }
    if (si + 1 < topic.slides.length) slide(si + 1); else close();
  }
  (function loop(now) { if (open && sc) drawScene(sc, now); requestAnimationFrame(loop); })(0);

  ask.addEventListener('click', e => { if (e.target.id === 'askClose') close(); else advance(); });
  window.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); advance(); }
  }, true);
  // 물어보는 곳 ①: 도구 설명 풍선의 버튼  ②: ? 창의 목록
  $('toolInfo').addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (b) show(b.dataset.ask); });
  $('askList').innerHTML = TOPICS.map(t => `<button data-ask="${t.id}">${parse(t.icon).join('')}${t.nm}</button>`).join('');
  $('askList').addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (b) show(b.dataset.ask); });
  window.FlowLecture = { show, close, TOPICS, get open() { return open; } };
})();
