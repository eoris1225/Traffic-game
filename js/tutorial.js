/* FLOW LAB — 시작 화면과 튜토리얼
 * 현장 주임 핍이 관리자(플레이어)를 찾아다니다가, 화면의 요소를 하나씩 짚어 가며 첫 출근길을 함께 고친다.
 * 게임 상태는 FlowLab 을 들여다보기만 하고(폴링), 실습 단계는 플레이어의 실제 조작으로 넘어간다. */
(function () {
  'use strict';
  const L = window.FlowLab; if (!L) return;
  const $ = id => document.getElementById(id), body = document.body, V3 = L.V3, wrap = $('stageWrap');
  const DONE = 'flowlab.tutorial.v1';
  const pip = window.FlowPenguin ? window.FlowPenguin.make() : null;
  let done = false; try { done = localStorage.getItem(DONE) === '1'; } catch (e) { /* ignore */ }
  const setDone = () => { done = true; try { localStorage.setItem(DONE, '1'); } catch (e) { /* ignore */ } };
  const face = (img, pose) => { if (pip) img.src = pip[pose] || pip.talk; img.style.display = pip ? '' : 'none'; };
  const resultUp = () => !$('result').classList.contains('hidden');
  const shortcut = () => L.tiles[4 * 12 + 5].barricade || L.tiles[4 * 12 + 6].barricade;
  const tool = id => document.querySelector('.tool[data-tool="' + id + '"]');
  const tools = (...ids) => () => ids.map(tool);
  const shown = el => el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';

  /* 대사 속 {이름} 은 실제 버튼 그림으로 바뀐다 */
  const chip = k => {
    if (k.startsWith('t:')) return `<i class="kb tool">${L.IC[k.slice(2)]}</i>`;
    if (k === 'speed') return '<i class="kb">×2</i>';
    if (k === 'q' || k === 'bang' || k === 'stuck' || k === 'cam') return `<i class="bub ${k}">${{ q: '?', bang: '!', stuck: '···', cam: '' }[k]}</i>`;
    return `<i class="kb ${k}">${L.UI[k] || ''}</i>`;
  };
  const parse = text => { const out = []; text.split(/(\{[^}]+\})/).forEach(p => { if (p[0] === '{') out.push(chip(p.slice(1, -1))); else for (const ch of p) out.push(ch); }); return out; };

  /* 넘기는 법 — say(기본): 눌러서 · auto: 잠깐 뒤 저절로 · wait: 조건이 참이 되면(스포트라이트 안만 조작 가능)
   * spot: 어둡게 하고 남겨 둘 요소(들) 또는 칸 [x, y] */
  const STEPS = [
    { pose: 'search', at: 'L', text: '관리자님!', auto: 1400 },
    { pose: 'search', at: 'R', text: '관리자님—!', auto: 1400 },
    { pose: 'call', at: 'C', text: '관리자니이이임—!!', auto: 1900 },
    { pose: 'found', text: '아, 거기 계셨군요. 저는 당신을 42분 동안 찾고 있었습니다. 근무 시간으로 쳐 주시면 좋겠습니다.', enter: () => body.classList.remove('pre') },
    { pose: 'talk', text: '핍입니다. 도로과 현장 주임이고, 펭귄입니다. 두 번째 사실은 인사 기록에 없으니 모른 척해 주세요.' },
    { pose: 'think', text: '오늘부터 이 동네 도로는 당신 책임이라고 들었습니다. 축하와 유감을 동시에 전합니다.' },
    // ── 1. 관찰
    { pose: 'worry', text: '저것을 보십시오. 매일 아침 8시의 풍경입니다. 저는 더 이상 이것을 "출근"이라고 부르지 않기로 했습니다.' },
    { pose: 'point', spot: () => $('lamps').parentElement, text: '아래 띠가 현황판입니다. 왼쪽 신호등은 지금 흐름이 어떤지 알려 줍니다. 초록이면 원활. 저는 초록을 본 지 꽤 됐습니다.' },
    { pose: 'point', spot: () => $('figTime'), text: '이 숫자가 평균 이동시간입니다. 모든 사람이 목적지까지 걸린 시간의 평균이죠. 24초 아래로 내리는 것이 우리의 소박한 꿈입니다.' },
    { pose: 'think', spot: () => $('figAcc'), text: '이쪽은 사고 건수입니다. 0이 가장 아름다운 숫자입니다. 보고서를 쓰지 않아도 되니까요.' },
    { pose: 'talk', text: '도로가 붉게 물들면 그곳이 막힌 곳입니다. 차 위의 표시도 읽어 두세요. {q} 초보가 머뭇거림, {bang} 급정거, {stuck} 오래 갇힘. 대체로 좋은 소식은 아닙니다.' },
    { pose: 'talk', text: '차를 누르면 그 차가 어디로 가려는지 보입니다. 화면을 끌면 시점이 돌고, 휠이나 두 손가락으로 확대됩니다. 구경은 무료입니다.' },
    { pose: 'think', spot: () => [$('btnSpeed'), $('btnSkip')], text: '지켜보기 지루하면 {speed}로 배속을 바꾸고, {skip}으로 결과까지 건너뛰세요. 인생에도 이런 버튼이 있으면 좋았을 텐데요.' },
    { pose: 'point', spot: () => (shown($('captionBtn')) ? $('captionBtn') : $('resEdit')), text: '충분히 절망하셨다면 「도로 고치기」를 눌러 주세요.', wait: () => L.mode === 'edit' },
    // ── 2. 설계
    { pose: 'talk', text: '여기가 설계 화면입니다. 위에서 내려다본 동네죠. 흑백인 것은 제 기분 탓이 아니라 연출입니다.' },
    { pose: 'point', spot: () => $('budget'), text: '이 표지판이 예산입니다. 총 $3,500. 시청이 우리에게 허락한 전부입니다. 증액 요청서는 제가 이미 세 번 반려당했습니다.' },
    { pose: 'point', spot: () => $('tray'), text: '아래가 도구함입니다. 누르면 이름과 가격, 설명이 뜹니다. 네 묶음으로 나뉘어 있으니 하나씩 소개하겠습니다. 금방 끝납니다. 아마도.' },
    { pose: 'talk', spot: tools('road', 'wide', 'oneway', 'demolish'), text: '첫째, 길 그 자체. {t:road} 도로, {t:wide} 차선 확장, {t:oneway} 일방통행, {t:demolish} 철거. 풀밭·텃밭·주차장 같은 빈 터에는 길을 낼 수 있고, 집과 건물은 안 됩니다. 사람이 살거든요.' },
    { pose: 'talk', spot: tools('guide', 'bus', 'rev'), text: '둘째, 노면에 칠하는 것들. {t:guide} 유도선, {t:bus} 버스 전용, {t:rev} 가변 차선. 버스 한 대에는 20명이 타고 있습니다. 그들도 출근 중이라는 점을 기억해 주세요.' },
    { pose: 'talk', spot: tools('round', 'signal', 'bridge', 'tunnel', 'overpass'), text: '셋째, 비싼 것들. {t:round} 회전교차로, {t:signal} 신호등, {t:bridge} 다리, {t:tunnel} 지하차도, {t:overpass} 육교. 강은 다리로만 건널 수 있습니다. 차는 헤엄을 못 치니까요.' },
    { pose: 'think', spot: tools('camera', 'bump', 'barricade'), text: '넷째, 운전자의 자유를 조금 빼앗는 것들. {t:camera} 단속 카메라, {t:bump} 방지턱, {t:barricade} 통행 차단. 유감스럽게도, 의외로 자주 정답입니다.' },
    { pose: 'talk', text: '빨간 테두리 도로는 잠긴 도로입니다. 넓히거나 철거할 수 없습니다. 이유는 묻지 마세요. 저도 물어봤습니다.' },
    { pose: 'point', spot: () => tool('barricade'), text: '실습입니다. {t:barricade} 통행 차단을 골라 주세요.', wait: () => !!document.querySelector('.tool.sel[data-tool="barricade"]') || shortcut() || L.mode !== 'edit' },
    { pose: 'point', spot: [5, 4], text: '그리고 표시된 지름길 칸을 눌러 막아 주세요. 네, 멀쩡한 길을 막는 겁니다. 저를 믿어 보세요. 이번 한 번만.', wait: () => shortcut() || L.mode !== 'edit' },
    { pose: 'found', spot: () => $('caption'), text: '위에 예상 결과가 떴습니다. 다른 날 아침을 미리 돌려 본 추정치라, 실제와는 조금 다를 수 있습니다. 일기예보 정도로 믿으세요.' },
    { pose: 'talk', text: '같은 도구로 같은 칸을 다시 누르면 전액 환불됩니다. 영수증도 필요 없습니다. 이 도시에서 가장 관대한 제도입니다.' },
    { pose: 'think', spot: () => [$('btnUndo'), $('btnReset')], text: '실수는 {undo}로 되돌리고, 전부 갈아엎고 싶으면 {trash}을 누르세요. 저는 월요일마다 두 번째 버튼을 생각합니다.' },
    { pose: 'point', spot: () => $('btnPlay'), text: '이제 {play}를 눌러 같은 아침을 다시 돌려 봅시다.', wait: () => L.mode === 'run' || resultUp() },
    // ── 3. 실행과 결과
    { pose: 'talk', text: '같은 차들이 같은 시각에 다시 출발합니다. 달라진 것은 도로뿐이죠. 공정한 실험입니다.' },
    { pose: 'think', text: '길을 하나 막았는데 전체가 빨라집니다. 모두가 지름길로 몰려 횡단보도 두 곳을 다 지나던 게 문제였거든요. 학자들은 "브라에스 역설"이라 부르고, 저는 "월요일"이라 부릅니다.' },
    { pose: 'talk', spot: () => $('btnSkip'), text: '결과가 나올 때까지 기다리죠. 급하시면 {skip}.', wait: resultUp },
    { pose: 'cheer', spot: () => document.querySelector('#result .card'), text: '결과표입니다. 별은 순서대로 받습니다. {star} 24초 이하, {star} 무사고, {star} 20초 이하. 마지막 보라색 별은 17초 이하를 $1,200 안에. 그건… 제 월급으로는 상상이 안 되는 경지입니다.' },
    { pose: 'talk', spot: () => $('btnStats'), text: '{chart} 수치 확인에는 그래프와 지난 설계 기록이 쌓입니다. 숫자를 좋아하신다면 거기서 주무셔도 됩니다.', enter: () => $('result').classList.add('hidden') },
    { pose: 'talk', spot: () => [$('btnHelp'), $('btnBefore')], text: '{rewind}로 고치기 전 아침을 다시 볼 수 있고, {help}에서 저를 다시 부를 수 있습니다. 가능하면 근무 시간 중에 불러 주세요.' },
    // ── 마무리
    { pose: 'found', text: '이것으로 인수인계를 마칩니다. 서류상으로는 3주짜리 교육이지만, 우리 둘 다 그럴 시간은 없죠.' },
    { pose: 'talk', text: '정답은 하나가 아닙니다. 막아도 되고, 넓혀도 되고, 다리를 놓아도 됩니다. 숫자가 내려가면 그게 옳은 겁니다. 이 일의 드문 장점이죠.' },
    { pose: 'cheer', text: '그럼 저는 물러가겠습니다. 생선 먹을 시간이라서요. 행운을 빕니다, 관리자님. 진심입니다. …대체로.' }
  ];

  const tut = $('tut'), txt = $('tutText'), mark = $('tutMark'), poly = mark.querySelector('polygon'), spot = $('tutSpot');
  let idx = -1, step = null, segs = [], shownN = 0, typeT = 0, autoT = 0, running = false, hole = null;

  const typing = () => step && shownN < segs.length;
  function paint() { txt.innerHTML = segs.slice(0, shownN).join(''); }
  function tick() {
    shownN = Math.min(segs.length, shownN + 1); paint();
    const ch = segs[shownN - 1];
    if (typing()) typeT = setTimeout(tick, ch.length > 1 ? 140 : /[!?.…—,]/.test(ch) ? 120 : 24);
    else { tut.classList.add('ready'); if (step.auto) autoT = setTimeout(next, step.auto); }
  }
  function show(k) {
    clearTimeout(typeT); clearTimeout(autoT);
    idx = k; step = STEPS[k];
    if (!step) return finale();
    if (step.enter) step.enter();
    tut.className = 'at-' + (step.at || 'talk') + (step.wait ? ' waiting' : '') + (step.auto ? ' auto' : '');
    face($('tutPip'), step.pose);
    const im = $('tutPip'); im.classList.remove('pop'); void im.offsetWidth; im.classList.add('pop');
    const t = tool('barricade'); if (step.spot && t && t.scrollIntoView && step.wait) t.scrollIntoView({ block: 'nearest', inline: 'center' });
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
    tut.className = 'hidden'; mark.style.display = 'none'; spot.style.display = 'none'; $('tutEnd').classList.add('hidden'); body.classList.remove('pre');
    if (finished) setDone();
  }
  /* 마무리: 인수인계서에 도장이 찍히고, "업무 시작" 으로 설계 화면에 내려 준다 */
  function finale() {
    step = null; hole = null; tut.className = 'hidden'; spot.style.display = 'none'; mark.style.display = 'none';
    face($('endPip'), 'cheer');
    $('endList').innerHTML = ['{rewind} 먼저 지켜본다. 막히는 데는 이유가 있다', '{t:road} 고친다. 더 놓는 것만이 답은 아니다', '{play} 다시 돌려 본다. 숫자가 내려가면 옳다'].map(t => '<li>' + parse(t).join('') + '</li>').join('');
    $('tutEnd').classList.remove('hidden'); setDone();
  }
  function start() {
    $('title').classList.add('hidden'); $('help').classList.add('hidden'); $('tutEnd').classList.add('hidden');
    body.classList.add('pre'); running = true;
    L.startBefore(); if (V3) V3.setView('iso');
    show(0);
  }
  function play() {                                            // 튜토리얼 없이 바로
    $('title').classList.add('hidden'); body.classList.remove('pre');
    L.startBefore(); if (V3) V3.setView('iso');
  }

  /* 스포트라이트 자리(무대 기준 사각형) 계산 */
  function rectOf(target) {
    const wr = wrap.getBoundingClientRect();
    if (Array.isArray(target) && typeof target[0] === 'number') {
      if (!V3 || L.mode !== 'edit') return null;
      const [x, y] = target, c = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(p => V3.project(p[0], p[1], .02));
      poly.setAttribute('points', c.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')); mark.style.display = 'block';
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
        mark.style.display = 'none';
        hole = step.spot ? rectOf(typeof step.spot === 'function' ? step.spot() : step.spot) : null;
        if (hole) {
          spot.style.display = 'block'; spot.style.left = hole[0] + 'px'; spot.style.top = hole[1] + 'px'; spot.style.width = hole[2] + 'px'; spot.style.height = hole[3] + 'px';
          tut.classList.toggle('dock-top', hole[1] > wrap.clientHeight - hole[1] - hole[3]);   // 빈 자리가 넓은 쪽에 선다
        } else { spot.style.display = 'none'; tut.classList.remove('dock-top'); }
      }
    }
    requestAnimationFrame(loop);
  }

  /* 실습 단계에서는 스포트라이트 안(과 건너뛰기)만 눌린다 */
  const guard = e => {
    if (!running || !step || !step.wait || e.target.id === 'tutSkip') return;
    const wr = wrap.getBoundingClientRect(), x = e.clientX - wr.left, y = e.clientY - wr.top;
    if (hole && x >= hole[0] && x <= hole[0] + hole[2] && y >= hole[1] && y <= hole[1] + hole[3]) return;
    e.stopPropagation(); e.preventDefault();
  };
  for (const ev of ['pointerdown', 'mousedown', 'click', 'touchstart']) document.addEventListener(ev, guard, true);

  tut.addEventListener('click', e => { if (e.target.id !== 'tutSkip') advance(); });
  $('tutSkip').addEventListener('click', () => end(true));
  $('endGo').addEventListener('click', () => { end(true); $('result').classList.add('hidden'); L.startEdit(); });
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
  $('tStart').textContent = done ? '이어서 하기' : '출근하기';
  $('tAlt').textContent = done ? '튜토리얼 다시 보기' : '튜토리얼 없이 시작';
  face($('tPip'), 'found');
  body.classList.add('pre'); $('title').classList.remove('hidden');
  if (V3) V3.look(6, 4.7, 14, -0.55, 0.52);
  requestAnimationFrame(loop);
  window.FlowTutorial = { start, end, show, get step() { return idx; }, get count() { return STEPS.length; } };
})();
