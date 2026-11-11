/* FLOW LAB — 이야기
 * 줄기: 도로과는 폐지 심사 대상이고, 네 구역을 고쳐 놓아야 살아남는다(대사는 js/script.js 의 story).
 *  - 장면: 핍·앵거스·쪽지가 번갈아 나오는 짧은 대화. 프롤로그, 지역 들머리, 지역 완료.
 *  - 쪽지: 스테이지 안내 카드에 붙는 전임자 K(3-3 까지)와 핍의 메모.
 *  - 엽서: 스테이지에서 첫 별을 받으면 주민 엽서가 오고 우편함에 모인다.
 *  - 엔딩: 스무 구역을 모두 끝내면 심사 결과 통지서.
 * 게임 본체는 건드리지 않고 이벤트(flow-stage / flow-clear / flow-result)만 듣는다. */
(function () {
  'use strict';
  const L = window.FlowLab, SC = window.PIP_SCRIPT, ST = SC && SC.story, FS = window.FlowStages; if (!L || !ST) return;
  const $ = id => document.getElementById(id), P = window.FlowPip, M = window.FlowMoose, snd = k => window.FlowSound && window.FlowSound[k] && window.FlowSound[k]();
  const KEY = 'flowlab.story.v1';
  let save = { seen: {}, mail: {}, best: {} }; try { save = Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ignore */ }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  const STAGES = FS.STAGES, WORLDS = FS.WORLDS;
  const stars = id => L.progress[id] || 0, cleared = () => STAGES.filter(s => stars(s.id) > 0).length;
  const starSum = () => STAGES.reduce((a, s) => a + stars(s.id), 0), starMax = STAGES.reduce((a, s) => a + s.goals.length, 0);
  const mailCount = () => STAGES.filter(s => save.mail[s.id]).length;
  // 다른 기기·이전 판에서 이미 별을 받은 스테이지의 엽서는 조용히 채워 둔다
  STAGES.forEach(s => { if (stars(s.id) > 0 && !save.mail[s.id]) save.mail[s.id] = 1; });

  /* ---------- 장면 재생 ---------- */
  const el = $('scene'), txt = $('sceneText');
  let lines = null, li = 0, segs = [], n = 0, tt = 0, after = null, who = 'pip';
  const typing = () => n < segs.length;
  const paint = () => { txt.innerHTML = segs.slice(0, n).join(''); el.classList.toggle('ready', !typing()); };
  function tick() { n = Math.min(segs.length, n + 1); paint(); if (window.FlowSound && n % 2) window.FlowSound.blip(who); if (typing()) { const ch = segs[n - 1]; tt = setTimeout(tick, ch.length > 1 ? 140 : /[!?.…—,]/.test(ch) ? 120 : 26); } }
  function line(k) {
    clearTimeout(tt); li = k; const [w, pose, text] = lines[k]; who = w;
    el.className = 'who-' + w; const img = $('sceneImg');
    if (w === 'note') { img.style.display = 'none'; $('sceneName').textContent = pose; snd('paper'); }
    else {
      const src = w === 'angus' ? (M && M.image(M.rankOf(L.progress), pose)) : (P.imgs && (P.imgs[pose] || P.imgs.talk));
      img.style.display = src ? '' : 'none'; if (src) img.src = src;
      img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop');
      $('sceneName').innerHTML = w === 'angus' ? SC.moose.name + ' <small>' + (SC.moose.ranks[M ? M.rankOf(L.progress) : 0] || '') + '</small>' : SC.name + ' <small>' + SC.role + '</small>';
    }
    segs = P.parse(text); n = 0; paint(); tick();
  }
  function play(id, then) {
    const sc = ST.scenes[id]; if (!sc || !sc.length) { if (then) then(); return; }
    save.seen[id] = 1; keep(); lines = sc; after = then || null; line(0);
  }
  function stop() { clearTimeout(tt); lines = null; el.className = 'hidden'; const f = after; after = null; if (f) f(); else pump(); }
  function advance() { if (!lines) return; if (typing()) { clearTimeout(tt); n = segs.length; paint(); return; } if (li + 1 < lines.length) line(li + 1); else stop(); }
  el.addEventListener('click', e => { if (e.target.id === 'sceneSkip') stop(); else advance(); });
  window.addEventListener('keydown', e => {
    if (!lines && $('ending').classList.contains('hidden')) return;
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); if (lines) advance(); else $('endingGo').click(); }
    else if (e.key === 'Escape' && lines) stop();
  }, true);

  /* 장면은 다른 창(튜토리얼·설명회·시작 화면)이 떠 있는 동안에는 기다렸다가 나온다 */
  const queue = [];
  const busy = () => lines || ['tut', 'tutEnd', 'ask', 'title', 'result'].some(id => $(id) && !$(id).classList.contains('hidden')) || !$('ending').classList.contains('hidden');
  function pump() { if (!queue.length || busy()) return; const q = queue.shift(); if (typeof q === 'function') q(); else play(q); }
  setInterval(pump, 400);
  const ask = id => { if (!save.seen[id] && !queue.includes(id) && ST.scenes[id]) queue.push(id); };

  /* ---------- 쪽지(안내 카드) ---------- */
  function memo(stage) {
    const m = ST.memo[stage.id], box = $('briefMemo'); if (!box) return;
    if (!m) { box.style.display = 'none'; return; }
    box.className = 'memo by-' + m[0]; box.style.display = ''; box.innerHTML = '<small>' + ST.memoBy[m[0]] + '</small><p>' + m[1] + '</p>';
  }
  new MutationObserver(() => { if (!$('brief').classList.contains('hidden')) memo(L.stage); }).observe($('brief'), { attributes: true, attributeFilter: ['class'] });

  /* ---------- 엽서와 우편함 ---------- */
  const card = (s, fresh) => { const m = ST.mail[s.id]; return `<div class="post${fresh ? ' fresh' : ''}"><i class="stampette">${s.no}</i><small>${m[0]} · ${s.place} ${s.name}</small><p>${m[1]}</p></div>`; };
  function openMail() {
    $('mailHead').textContent = ST.mailTitle + '  ' + mailCount() + ' / ' + STAGES.length;
    $('mailList').innerHTML = WORLDS.map((w, wi) => `<h3><b>${wi + 1}</b>${w.name}</h3><div class="postRow">` + w.stages.map(s => save.mail[s.id] ? card(s) : `<div class="post locked"><i class="stampette">${s.no}</i><p>${ST.mailLocked}</p></div>`).join('') + '</div>').join('');
    $('stageSel').classList.add('hidden'); $('mail').classList.remove('hidden');
  }
  $('btnMail').onclick = openMail; $('mailClose').onclick = () => $('mail').classList.add('hidden');
  $('mail').addEventListener('pointerdown', e => { if (e.target === $('mail')) $('mail').classList.add('hidden'); });

  /* ---------- 머리글·스테이지 선택 화면의 진행도 ---------- */
  function refresh() {
    $('btnMail').innerHTML = ST.mailTitle + ' <b>' + mailCount() + '/' + STAGES.length + '</b>';
    $('selStars').innerHTML = P.chip('star') + '<b>' + starSum() + '</b> / ' + starMax;
    document.querySelectorAll('#stageList .wSec h3').forEach((h, wi) => { if (!h.querySelector('small') && ST.worlds[wi]) h.insertAdjacentHTML('beforeend', '<small>' + ST.worlds[wi] + '</small>'); });
    const t = $('tProg'); if (t) { t.innerHTML = cleared() ? P.chip('star') + starSum() + ' / ' + starMax + ' · ' + cleared() + '구역 완료' : ''; t.style.display = cleared() ? '' : 'none'; }
  }
  new MutationObserver(refresh).observe($('stageList'), { childList: true });

  /* ---------- 엔딩 ---------- */
  function ending() {
    const E = ST.ending, saved = STAGES.reduce((a, s) => a + (save.best[s.id] || 0), 0);
    $('endingForm').textContent = E.form; $('endingTitle').textContent = E.title; $('endingBody').innerHTML = E.body;
    $('endingRows').innerHTML = [[E.rows[0], starSum() + ' / ' + starMax], [E.rows[1], mailCount() + ' / ' + STAGES.length], [E.rows[2], saved.toFixed(0) + '초']].map(r => `<li><span>${r[0]}</span><b>${r[1]}</b></li>`).join('');
    $('endingNote').textContent = starSum() >= starMax ? E.perfect : E.more; $('endingThanks').textContent = E.thanks;
    $('endingStamp').innerHTML = E.stamp1 + (E.stamp2 ? '<br>' + E.stamp2 : ''); $('endingGo').textContent = E.button;
    const a = $('endingPip'), b = $('endingMoose'), ps = P.imgs && P.imgs.cheer, ms = M && M.image(3, 'cheer');
    a.style.display = ps ? '' : 'none'; if (ps) a.src = ps; b.style.display = ms ? '' : 'none'; if (ms) b.src = ms;
    $('result').classList.add('hidden'); $('ending').classList.remove('hidden'); save.seen.ending = 1; keep();
    snd('paper'); setTimeout(() => snd('stamp'), 620); setTimeout(() => { for (let k = 0; k < 4; k++) setTimeout(() => window.FlowSound && window.FlowSound.star(k), k * 200); }, 1000);
  }
  $('endingGo').onclick = () => { $('ending').classList.add('hidden'); L.openStages(); };

  /* ---------- 결과 공유 ---------- */
  let last = null;
  $('resShare').onclick = () => {
    if (!last) return; const s = STAGES.find(x => x.id === last.id), goals = s.goals.length;
    const text = `FLOW LAB ${s.no} ${s.name}\n${'★'.repeat(last.stars)}${'☆'.repeat(goals - last.stars)}  ${last.pc.toFixed(1)}초 · ${FS.won(last.cost)}\n${location.protocol === 'file:' ? '' : location.href}`.trim();
    const done = () => { $('resShare').textContent = ST.ending.shared; setTimeout(() => { $('resShare').textContent = ST.ending.share; }, 2200); };
    if (navigator.share) navigator.share({ text }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {}); else done();
  };

  /* ---------- 게임 본체의 신호 ---------- */
  document.addEventListener('flow-stage', e => { const s = STAGES[e.detail]; if (s && s.si === 0 && s.wi > 0) ask('world' + s.wi); });
  document.addEventListener('flow-result', e => {
    const d = e.detail; $('resMail').innerHTML = ''; $('resShare').style.display = d.before || !d.stars ? 'none' : ''; $('resShare').textContent = ST.ending.share;
    if (d.before) return; last = d;
    if (d.stars > 0) { const gain = Math.max(0, d.base - d.pc); if (gain > (save.best[d.id] || 0)) { save.best[d.id] = gain; keep(); } }
  });
  document.addEventListener('flow-clear', e => {
    const s = STAGES.find(x => x.id === e.detail); if (!s) return;
    { save.mail[s.id] = 1; keep(); $('resMail').innerHTML = '<em>' + ST.mailNew + '</em>' + card(s, true); snd('mail'); refresh(); }
    if (s.id === 'r1') ask('prologue');
    if (WORLDS[s.wi].stages.every(x => stars(x.id) > 0)) {
      ask('clear' + s.wi);
      if (cleared() === STAGES.length && !save.seen.ending) queue.push(ending);
    }
  });

  /* 소리 켜기 / 끄기: 머리글(넓은 화면)과 시작 화면(좁은 화면) 두 곳 */
  const sndLabel = () => { const on = !window.FlowSound || window.FlowSound.on; document.querySelectorAll('.snd').forEach(b => { b.textContent = on ? '소리 켜짐' : '소리 꺼짐'; b.classList.toggle('off', !on); }); };
  document.querySelectorAll('.snd').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (window.FlowSound) window.FlowSound.toggle(); sndLabel(); }));
  sndLabel();
  $('sceneSkip').textContent = ST.ending.skip;
  refresh();
  window.FlowStory = { play, ending, openMail, get save() { return save; } };
})();
