/* FLOW LAB — 시작 화면과 튜토리얼
 * 현장 주임 핍이 관리자(플레이어)를 찾아다니다가, 첫 출근길을 함께 고쳐 본다.
 * 게임 상태는 FlowLab 을 들여다보기만 하고(폴링), 진행은 플레이어의 실제 조작으로 넘어간다. */
(function () {
  'use strict';
  const L = window.FlowLab; if (!L) return;
  const $ = id => document.getElementById(id), body = document.body, V3 = L.V3;
  const DONE = 'flowlab.tutorial.v1';
  const pip = window.FlowPenguin ? window.FlowPenguin.make() : null;
  let done = false; try { done = localStorage.getItem(DONE) === '1'; } catch (e) { /* ignore */ }
  const setDone = () => { done = true; try { localStorage.setItem(DONE, '1'); } catch (e) { /* ignore */ } };
  const face = (img, pose) => { if (pip) img.src = pip[pose] || pip.talk; img.style.display = pip ? '' : 'none'; };
  const resultUp = () => !$('result').classList.contains('hidden');
  const shortcut = () => L.tiles[4 * 12 + 5].barricade || L.tiles[4 * 12 + 6].barricade;

  /* say: 눌러서 넘김 · auto: 잠깐 뒤 저절로 넘김 · wait: 조건이 참이 되면 넘김(그동안 게임 조작 가능) */
  const STEPS = [
    { pose: 'search', at: 'L', text: '관리자님!', auto: 1500 },
    { pose: 'search', at: 'R', text: '관리자님—!', auto: 1500 },
    { pose: 'call', at: 'C', text: '관리자니이이임—!!', auto: 2000 },
    { pose: 'found', text: '아, 여기 계셨군요! 한참 찾았습니다.', enter: () => body.classList.remove('pre') },
    { pose: 'talk', text: '도로과 현장 주임 핍입니다. 오늘부터 이 동네 도로는 관리자님 담당이라고 들었습니다.' },
    { pose: 'worry', text: '부임 첫날부터 죄송하지만… 저 꼴 좀 보시겠어요? 매일 아침 8시면 저렇습니다.' },
    { pose: 'point', text: '도로가 붉게 물든 곳이 막힌 곳입니다. 차 위의 ?, ! 는 운전자가 당황했다는 뜻이고요.' },
    { pose: 'talk', text: '충분히 보셨으면 위쪽 「도로 고치기」를 눌러 주세요.', glow: () => $('captionBtn'), wait: () => L.mode === 'edit' },
    { pose: 'point', text: '여기가 설계 화면입니다. 아래에서 도구를 고르고 칸을 누르면 설치, 같은 도구로 다시 누르면 전액 환불입니다.' },
    { pose: 'think', text: '연습 삼아 하나만 해 보죠. 맨 오른쪽 「통행 차단」을 골라, 표시한 지름길 칸을 막아 주세요.', glow: () => document.querySelector('.tool[data-tool="barricade"]'), mark: [5, 4], wait: () => shortcut() || L.mode === 'run' },
    { pose: 'found', text: '좋습니다. 이제 오른쪽 위 ▶ 를 눌러 같은 아침을 다시 돌려 보죠.', glow: () => $('btnPlay'), wait: () => L.mode === 'run' || resultUp() },
    { pose: 'talk', text: '길을 하나 막았는데 전체가 빨라집니다. 다들 지름길로 몰려서 횡단보도 두 곳을 전부 지나던 게 문제였거든요.' },
    { pose: 'think', text: '결과가 나올 때까지 지켜보죠. 급하시면 위쪽 ⏭ 로 건너뛰셔도 됩니다.', glow: () => $('btnSkip'), wait: resultUp },
    { pose: 'cheer', text: '보셨죠? 사고 없이, 더 빠르게, 더 싸게 — 남은 별은 관리자님 몫입니다.' },
    { pose: 'talk', text: '빈 터에는 길을, 강에는 다리를. 막히면 왼쪽 위 ? 에서 저를 다시 부르세요. 그럼, 수고하십시오!' }
  ];

  const tut = $('tut'), txt = $('tutText'), mark = $('tutMark'), poly = mark.querySelector('polygon');
  let idx = -1, step = null, shown = 0, typeT = 0, autoT = 0, glowEl = null, running = false;

  function clearGlow() { if (glowEl) glowEl.classList.remove('tut-glow'); glowEl = null; }
  function typing() { return step && shown < step.text.length; }
  function tick() {
    shown = Math.min(step.text.length, shown + 1); txt.textContent = step.text.slice(0, shown);
    if (typing()) typeT = setTimeout(tick, /[!?.…—,]/.test(step.text[shown - 1]) ? 110 : 26);
    else { tut.classList.add('ready'); if (step.auto) autoT = setTimeout(next, step.auto); }
  }
  function show(k) {
    clearTimeout(typeT); clearTimeout(autoT); clearGlow();
    idx = k; step = STEPS[k];
    if (!step) return end(true);
    if (step.enter) step.enter();
    tut.className = 'at-' + (step.at || 'talk') + (step.wait ? ' waiting' : '') + (step.auto ? ' auto' : '');
    face($('tutPip'), step.pose);
    const im = $('tutPip'); im.classList.remove('pop'); void im.offsetWidth; im.classList.add('pop');
    shown = 0; txt.textContent = ''; tick();
    if (step.glow) { glowEl = step.glow(); if (glowEl) { glowEl.classList.add('tut-glow'); if (glowEl.scrollIntoView && glowEl.classList.contains('tool')) glowEl.scrollIntoView({ block: 'nearest', inline: 'center' }); } }
  }
  function next() { show(idx + 1); }
  function advance() {                                         // 화면을 누르거나 Space/Enter
    if (!running || !step || step.auto) return;
    if (typing()) { clearTimeout(typeT); shown = step.text.length; txt.textContent = step.text; tut.classList.add('ready'); return; }
    if (!step.wait) next();
  }
  function end(finished) {
    running = false; step = null; clearTimeout(typeT); clearTimeout(autoT); clearGlow();
    tut.className = 'hidden'; mark.style.display = 'none'; body.classList.remove('pre');
    if (finished) setDone();
  }
  function start() {
    $('title').classList.add('hidden'); $('help').classList.add('hidden');
    body.classList.add('pre'); running = true;
    L.startBefore(); if (V3) V3.setView('iso');
    show(0);
  }
  function play() {                                            // 튜토리얼 없이 바로
    $('title').classList.add('hidden'); body.classList.remove('pre');
    L.startBefore(); if (V3) V3.setView('iso');
  }

  /* 매 프레임: 기다리는 조건 확인, 표시 칸을 화면 좌표로 옮기기, 시작 화면에서는 카메라를 천천히 돌린다 */
  let t0 = performance.now();
  function loop(now) {
    if (!$('title').classList.contains('hidden') && V3) V3.orbit(Math.cos((now - t0) / 9000) * .22, 0);
    if (running && step) {
      if (step.wait && step.wait()) next();
      if (step && step.mark && V3 && L.mode === 'edit') {
        const [x, y] = step.mark, p = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(c => V3.project(c[0], c[1], .02).map(v => v.toFixed(1)).join(','));
        poly.setAttribute('points', p.join(' ')); mark.style.display = 'block';
      } else mark.style.display = 'none';
    }
    requestAnimationFrame(loop);
  }

  tut.addEventListener('click', e => { if (e.target.id !== 'tutSkip') advance(); });
  $('tutSkip').addEventListener('click', () => end(true));
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' && e.key !== 'Enter') return;
    if (!$('title').classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); done ? play() : start(); }
    else if (running && step && !step.wait) { e.preventDefault(); e.stopImmediatePropagation(); advance(); }
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
  window.FlowTutorial = { start, end, get step() { return idx; } };
})();
