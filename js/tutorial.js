/* FLOW LAB — 시작 화면과 튜토리얼
 * 현장 주임 핍이 관리자(플레이어)를 찾아다니다가, 화면의 요소를 하나씩 짚어 가며 첫 출근길을 함께 고친다.
 * 게임 상태는 FlowLab 을 들여다보기만 하고(폴링), 실습 단계는 플레이어의 실제 조작으로 넘어간다. */
(function () {
  'use strict';
  const L = window.FlowLab; if (!L) return;
  const $ = id => document.getElementById(id), body = document.body, V3 = L.V3, wrap = $('stageWrap');
  const DONE = 'flowlab.tutorial.v1';
  const P = window.FlowPip, face = P.face, parse = P.parse, SC = window.PIP_SCRIPT, T = SC.tutorial;
  let done = false; try { done = localStorage.getItem(DONE) === '1'; } catch (e) { /* ignore */ }
  const setDone = () => { done = true; try { localStorage.setItem(DONE, '1'); } catch (e) { /* ignore */ } };
  const resultUp = () => !$('result').classList.contains('hidden');
  const tool = id => document.querySelector('.tool[data-tool="' + id + '"]');
  const shown = el => el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  const INTRO = 'flowlab.intro.';

  /* 대사는 js/script.js 에 있다.  넘기는 법 — say(기본): 눌러서 · auto: 잠깐 뒤 저절로 · wait: 조건이 참이 되면(스포트라이트 안만 조작 가능)
   * spot: 어둡게 하고 남겨 둘 요소(들) 또는 칸 [x, y].  튜토리얼은 1스테이지(시골길 잇기)에서 진행된다. */
  const ROUTE = [[3, 3], [4, 3], [4, 2], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4], [8, 4]];          // 안내용 추천 경로(다른 길로 이어도 된다)
  const roadAt = c => !!L.tiles[c[1] * 12 + c[0]].road;
  const STEPS = [
    { pose: 'search', at: 'L', text: T.call1, auto: 1400 },
    { pose: 'search', at: 'R', text: T.call2, auto: 1400 },
    { pose: 'call', at: 'C', text: T.call3, auto: 1900 },
    { pose: 'found', text: T.found, enter: () => body.classList.remove('pre') },
    { pose: 'talk', text: T.intro },
    { pose: 'worry', text: T.look },
    { pose: 'point', spot: () => $('tray'), text: T.tray },
    { pose: 'point', spot: () => tool('road'), text: T.pick, wait: () => !!document.querySelector('.tool.sel[data-tool="road"]') },
    { pose: 'think', spot: ROUTE[0], text: T.first, wait: () => roadAt(ROUTE[0]) || L.connected() || L.mode !== 'edit' },
    { pose: 'think', spot: { cells: ROUTE }, free: true, text: T.draw, wait: () => L.connected() || L.mode !== 'edit' },
    { pose: 'found', spot: () => $('btnPlay'), text: T.run, wait: () => L.mode === 'run' || resultUp() },
    { pose: 'point', noDim: true, spot: () => $('hud'), text: T.hud },
    { pose: 'talk', noDim: true, spot: () => [$('btnSpeed'), $('btnSkip')], text: T.wait, wait: resultUp },
    { pose: 'cheer', spot: () => document.querySelector('#result .card'), text: T.result },
    { pose: 'talk', guide: true, spot: () => $('guideBtn'), text: T.help, enter: () => $('result').classList.add('hidden') },
    { pose: 'cheer', text: T.bye }
  ];
  let seq = STEPS, markBox = null;

  const tut = $('tut'), txt = $('tutText'), mark = $('tutMark'), poly = mark.querySelector('polygon'), spot = $('tutSpot');
  let idx = -1, step = null, segs = [], shownN = 0, typeT = 0, autoT = 0, running = false, hole = null;

  const typing = () => step && shownN < segs.length;
  function paint() { txt.innerHTML = segs.slice(0, shownN).join(''); }
  function tick() {
    if (window.FlowSound && shownN % 2 === 0) window.FlowSound.blip('pip');
    shownN = Math.min(segs.length, shownN + 1); paint();
    const ch = segs[shownN - 1];
    if (typing()) typeT = setTimeout(tick, ch.length > 1 ? 140 : /[!?.…—,]/.test(ch) ? 120 : 24);
    else { tut.classList.add('ready'); if (step.auto) autoT = setTimeout(next, step.auto); }
  }
  function show(k) {
    clearTimeout(typeT); clearTimeout(autoT);
    idx = k; step = seq[k];
    if (!step) return seq === STEPS ? finale() : end(false);
    if (step.enter) step.enter();
    body.classList.add('tutoring'); body.classList.toggle('tut-guide', !!step.guide);   // 튜토리얼 중에는 옆의 ? 를 숨긴다(그 버튼을 소개할 때만 보인다)
    $('toolInfo').classList.add('hidden');                      // 도구 설명 창이 핍의 말풍선과 겹치지 않게
    tut.className = 'at-' + (step.at || 'talk') + (step.wait ? ' waiting' : '') + (step.auto ? ' auto' : '');
    face($('tutPip'), step.pose);
    const im = $('tutPip'); im.classList.remove('pop'); void im.offsetWidth; im.classList.add('pop');
    if (step.spot && L.mode === 'edit') { const t = tool('road'), tr = $('tray'); if (t && tr.scrollWidth > tr.clientWidth) tr.scrollLeft = t.offsetLeft - tr.clientWidth / 2; }   // 좁은 화면: 도구함만 옆으로 민다
    segs = parse(step.text); shownN = 0; paint(); tick();
  }
  function next() { show(idx + 1); }
  function advance() {                                         // 화면을 누르거나 Space/Enter
    if (!running || !step || step.auto) return;
    if (typing()) { clearTimeout(typeT); shownN = segs.length; paint(); tut.classList.add('ready'); return; }
    if (!step.wait) next();
  }
  function end(finished) {
    running = false; step = null; hole = null; clearTimeout(typeT); clearTimeout(autoT);
    tut.className = 'hidden'; mark.style.display = 'none'; spot.style.display = 'none'; $('tutEnd').classList.add('hidden'); body.classList.remove('pre'); body.classList.remove('tutoring', 'tut-guide');
    if (finished) setDone();
  }
  /* 마무리: 인수인계서에 도장이 찍히고, "업무 시작" 으로 설계 화면에 내려 준다 */
  function finale() {
    step = null; hole = null; tut.className = 'hidden'; spot.style.display = 'none'; mark.style.display = 'none';
    face($('endPip'), 'cheer');
    $('endList').innerHTML = SC.end.list.map(t => '<li>' + parse(t).join('') + '</li>').join('');
    $('tutEnd').classList.remove('hidden'); setDone();
  }
  function start() {
    $('title').classList.add('hidden'); $('help').classList.add('hidden'); $('tutEnd').classList.add('hidden'); $('stageSel').classList.add('hidden');
    body.classList.add('pre'); running = true; seq = STEPS;
    L.loadStage(0, true);                                        // 1스테이지를 처음 상태로
    tool('demolish') && tool('demolish').click(); $('toolInfo').classList.add('hidden');   // 도로 도구를 직접 고르게 하려고 다른 도구를 잡아 둔다
    show(0);
  }
  function play() {                                            // 튜토리얼 없이: 스테이지를 고른다
    $('title').classList.add('hidden'); body.classList.remove('pre');
    L.openStages();
  }
  /* 스테이지에 처음 들어갈 때의 짧은 안내 */
  function brief(id) {
    const lines = (SC.stages || {})[id]; if (!lines || !lines.length || running) return;
    try { if (localStorage.getItem(INTRO + id) === '1') return; localStorage.setItem(INTRO + id, '1'); } catch (e) { /* ignore */ }
    seq = lines.map((text, k) => ({ pose: k === lines.length - 1 ? 'point' : k ? 'think' : 'talk', text }));
    running = true; show(0);
  }

  /* 스포트라이트 자리(무대 기준 사각형) 계산 */
  function rectOf(target) {
    const wr = wrap.getBoundingClientRect();
    if (target && target.cells) {                                // 여러 칸: 아직 길이 없는 칸만 노랗게 표시
      if (!V3 || L.mode !== 'edit') return null;
      const todo = target.cells.filter(c => !roadAt(c)); let html = '', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of todo) {
        const c = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(p => V3.project(p[0], p[1], .02));
        html += '<polygon points="' + c.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
        for (const q of c) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
      }
      mark.innerHTML = html; mark.style.display = todo.length ? 'block' : 'none';
      markBox = todo.length ? [x0, y0, x1 - x0, y1 - y0] : null;
      return null;                                               // 어둡게 가리지 않는다(지도 전체를 쓸 수 있게)
    }
    if (Array.isArray(target) && typeof target[0] === 'number') {
      if (!V3 || L.mode !== 'edit') return null;
      const [x, y] = target, c = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(p => V3.project(p[0], p[1], .02));
      mark.innerHTML = '<polygon points="' + c.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>'; mark.style.display = 'block';
      const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
      return [Math.min(...xs) - 10, Math.min(...ys) - 10, Math.max(...xs) - Math.min(...xs) + 20, Math.max(...ys) - Math.min(...ys) + 20];
    }
    const els = (Array.isArray(target) ? target : [target]).filter(shown);
    if (!els.length) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const el of els) { const r = el.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return [x0 - wr.left - 7, y0 - wr.top - 7, x1 - x0 + 14, y1 - y0 + 14];
  }
  /* 매 프레임: 기다리는 조건 확인, 스포트라이트 위치 갱신, 시작 화면에서는 카메라를 천천히 돌린다 */
  const t0 = performance.now();
  function loop(now) {
    if (!$('title').classList.contains('hidden') && V3) V3.orbit(Math.cos((now - t0) / 9000) * .22, 0);
    if (running && step) {
      if (step.wait && step.wait()) next();
      if (step) {
        mark.style.display = 'none'; markBox = null;
        hole = step.spot ? rectOf(typeof step.spot === 'function' ? step.spot() : step.spot) : null;
        spot.classList.toggle('nodim', !!step.noDim);             // 지켜봐야 하는 단계에서는 화면을 어둡게 하지 않고 테두리만 친다
        if (hole) { spot.style.display = 'block'; spot.style.left = hole[0] + 'px'; spot.style.top = hole[1] + 'px'; spot.style.width = hole[2] + 'px'; spot.style.height = hole[3] + 'px'; }
        else spot.style.display = 'none';
        // 말풍선은 가리켜야 할 곳을 덮지 않게, 위아래 중 빈 자리가 넓은 쪽에 선다
        const box = hole || markBox, onMap = !!markBox || (Array.isArray(step.spot) && typeof step.spot[0] === 'number');
        if (box) tut.classList.toggle('dock-top', box[1] - 60 > wrap.clientHeight - 90 - box[1] - box[3]); else tut.classList.remove('dock-top');
        tut.classList.toggle('tight', onMap);
      }
    }
    requestAnimationFrame(loop);
  }

  /* 실습 단계에서는 스포트라이트 안(과 건너뛰기)만 눌린다 */
  const guard = e => {
    if (!running || !step || !step.wait || e.target.id === 'tutSkip') return;
    const wr = wrap.getBoundingClientRect(), x = e.clientX - wr.left, y = e.clientY - wr.top;
    if (step.free && e.target.closest && (e.target.closest('#map') || e.target.closest('#tray') || e.target.closest('#btnUndo'))) return;
    if (hole && x >= hole[0] && x <= hole[0] + hole[2] && y >= hole[1] && y <= hole[1] + hole[3]) return;
    e.stopPropagation(); e.preventDefault();
  };
  for (const ev of ['pointerdown', 'mousedown', 'click', 'touchstart']) document.addEventListener(ev, guard, true);

  tut.addEventListener('click', e => { if (e.target.id !== 'tutSkip') advance(); });
  $('tutSkip').addEventListener('click', () => end(true));
  $('endGo').addEventListener('click', () => { end(true); $('result').classList.remove('hidden'); });
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' && e.key !== 'Enter') return;
    const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (!$('title').classList.contains('hidden')) { stop(); done ? play() : start(); }
    else if (!$('tutEnd').classList.contains('hidden')) { stop(); $('endGo').click(); }
    else if (running && step) { stop(); if (!step.wait) advance(); }
  }, true);
  $('tStart').addEventListener('click', () => (done ? play() : start()));
  $('tAlt').addEventListener('click', () => (done ? start() : (setDone(), play())));
  $('helpTut').addEventListener('click', start);

  // 시작 화면
  $('tStart').textContent = done ? SC.title.resume : SC.title.start;
  $('tAlt').textContent = done ? SC.title.replayTutorial : SC.title.skipTutorial;
  $('tSmall').textContent = SC.title.small; $('tLine').innerHTML = SC.title.line1 + '<br>' + SC.title.line2;
  document.querySelectorAll('.pipName').forEach(el => { el.innerHTML = SC.name + ' <small>' + SC.role + '</small>'; });
  $('tutSkip').textContent = SC.ask.skip;
  $('endForm').textContent = SC.end.form; $('endTitle').textContent = SC.end.title; $('endBody').innerHTML = SC.end.body1 + '<br>' + SC.end.body2;
  $('endStamp').innerHTML = SC.end.stamp1 + '<br>' + SC.end.stamp2; $('endGo').textContent = SC.end.button;
  body.classList.add('pre'); $('title').classList.remove('hidden');
  if (V3) { V3.setView('iso', true); V3.look(6, 4.7, 14, -0.55, 0.52); }
  requestAnimationFrame(loop);
  window.FlowTutorial = { start, end, show, get step() { return idx; }, get count() { return STEPS.length; } };
})();

/* 화면 밀림 방지: 가려진 버튼에 초점이 가면 브라우저가 무대나 문서를 스크롤해 버린다. 그럴 일이 없도록 되돌려 놓는다. */
(function () {
  const wrap = document.getElementById('stageWrap'), app = document.getElementById('app');
  const fix = () => { if (wrap.scrollTop || wrap.scrollLeft) { wrap.scrollTop = 0; wrap.scrollLeft = 0; } if (app.scrollTop) app.scrollTop = 0; if (window.scrollY || window.scrollX) window.scrollTo(0, 0); };
  wrap.addEventListener('scroll', fix); window.addEventListener('scroll', fix); document.addEventListener('focusin', () => setTimeout(fix, 0));
})();
