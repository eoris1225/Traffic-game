/* FLOW LAB — 이야기
 * 줄기: 도로과는 폐지 심사 대상이고, 네 구역을 고쳐 놓아야 살아남는다(대사는 js/script.js 의 story).
 *  - 장면: 핍·앵거스·쪽지가 번갈아 나오는 짧은 대화. 프롤로그, 지역 들머리, 지역 완료.
 *  - 쪽지: 스테이지 안내 카드에 붙는 전임자 K(3-3 까지)와 핍의 메모.
 *  - 편지: 스테이지에서 첫 별을 받으면 주민 편지가 오고 우편함에 봉투로 모인다. 누르면 편지지가 나온다.
 *  - 엔딩: 모든 구역을 끝내면 심사 결과 통지서.
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

  /* 대본의 쪽지·편지는 스테이지 번호('1-1')나 id('r1')로 찾는다.
     보낸 사람은 '—' 로 시작하는 서명 줄에서 읽고, 서명 끝의 '(그림: …)' 같은 그림 설명은 화면에 내지 않는다. */
  const memoOf = s => ST.memo[s.no] || ST.memo[s.id];
  const SKETCH = /\s*\((그림|drawing)\s*:[^)]*\)\s*$/i;
  const signOf = lines => { const l = (lines || []).find(t => /^[—-]/.test(t)); return l ? l.replace(/^[—-]\s*/, '').replace(SKETCH, '') : ''; };
  const mailOf = s => { const m = ST.mail[s.no] || ST.mail[s.id]; if (!m) return null;
    return Object.assign({ from: m.from || signOf(m.ko), fromEn: m.fromEn || signOf(m.en) }, m, { doodle: m.doodle === 'none' ? '' : m.doodle }); };

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
  const busy = () => lines || ['tut', 'tutEnd', 'ask', 'title', 'result', 'letter'].some(id => $(id) && !$(id).classList.contains('hidden')) || !$('ending').classList.contains('hidden');
  function pump() { if (!queue.length || busy()) return; const q = queue.shift(); if (typeof q === 'function') q(); else play(q); }
  setInterval(pump, 400);
  const ask = id => { if (!save.seen[id] && !queue.includes(id) && ST.scenes[id]) queue.push(id); };

  /* ---------- 쪽지(안내 카드) ---------- */
  function memo(stage) {
    const m = memoOf(stage), box = $('briefMemo'); if (!box) return;
    if (!m) { box.style.display = 'none'; return; }
    box.className = 'memo by-' + m[0]; box.style.display = ''; box.innerHTML = '<small>' + ST.memoBy[m[0]] + '</small><p>' + m[1] + '</p>';
  }
  new MutationObserver(() => { if (!$('brief').classList.contains('hidden')) memo(L.stage); }).observe($('brief'), { attributes: true, attributeFilter: ['class'] });

  /* ---------- 편지와 우편함 ---------- */
  const hsh = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  /* 편지에 곁들인 그림. 아이 그림은 크레파스로 삐뚤빼뚤하게(선을 흔드는 필터) */
  const CR = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const DOODLE = {
    potato: `<svg viewBox="0 0 120 90"><g ${CR} stroke="#7a5a3a" stroke-width="3"><path d="M22 52c-6-20 12-36 36-34s44 14 40 34-26 28-46 26-26-10-30-26z" fill="#d9b98a"/><path d="M44 40l3 3M70 34l2 4M62 58l4 1M38 60l3-2"/></g><text x="60" y="88" text-anchor="middle" font-size="13" fill="#7a5a3a">썩지 않은 것</text></svg>`,
    coupon: `<svg viewBox="0 0 150 76"><g transform="rotate(-4 75 38)"><rect x="6" y="8" width="138" height="58" rx="6" fill="#fff3d6" stroke="#b5524a" stroke-width="3" stroke-dasharray="7 5"/><text x="75" y="34" text-anchor="middle" font-size="17" font-weight="700" fill="#b5524a">국밥 한 그릇</text><text x="75" y="54" text-anchor="middle" font-size="12" fill="#b5524a">유효기간: 식기 전까지</text></g></svg>`,
    fish: `<svg viewBox="0 0 150 80"><g ${CR} stroke="#2f4a6b" stroke-width="3.2"><path d="M20 40c20-24 62-26 88-2-26 26-68 24-88 2z" fill="#cfe0ea"/><path d="M106 38l26-18-4 20 6 20z" fill="#cfe0ea"/><circle cx="42" cy="36" r="3.5" fill="#2f4a6b"/><path d="M60 26c6 8 6 20 0 28M74 26c6 8 6 20 0 28M88 30c4 6 4 14 0 20"/></g></svg>`,
    coffee: `<svg viewBox="0 0 110 110"><g fill="none" stroke="#8a5a36" opacity=".5"><circle cx="55" cy="55" r="38" stroke-width="7"/><circle cx="55" cy="55" r="31" stroke-width="1.5" opacity=".6"/><path d="M84 30a38 38 0 0 1 8 14" stroke-width="12" stroke="#fffdf5"/></g></svg>`,
    heart: `<svg viewBox="0 0 90 80"><path d="M45 70C10 46 8 20 26 14c10-3 17 4 19 11 2-7 9-14 19-11 18 6 16 32-19 56z" fill="none" stroke="#c8433c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 26c-5 2-7 8-5 14" fill="none" stroke="#c8433c" stroke-width="3" stroke-linecap="round"/></svg>`,
    tickets: `<svg viewBox="0 0 160 90"><g transform="rotate(7 80 45)"><rect x="24" y="20" width="118" height="46" rx="5" fill="#dfeaf5" stroke="#4f6d94" stroke-width="2.5"/></g><g transform="rotate(-5 80 45)"><rect x="18" y="20" width="118" height="46" rx="5" fill="#fff" stroke="#4f6d94" stroke-width="2.5"/><path d="M104 20v46" stroke="#4f6d94" stroke-width="2" stroke-dasharray="4 4"/><text x="60" y="41" text-anchor="middle" font-size="15" font-weight="700" fill="#4f6d94">리프트 1일권</text><text x="60" y="57" text-anchor="middle" font-size="11" fill="#4f6d94">올라갈 때만 쓰셔도 됨</text><text x="120" y="48" text-anchor="middle" font-size="12" fill="#4f6d94">×2</text></g></svg>`,
    seal: `<svg viewBox="0 0 90 90"><g transform="rotate(-12 45 45)" fill="none" stroke="#c8433c" opacity=".82"><circle cx="45" cy="45" r="36" stroke-width="4"/><circle cx="45" cy="45" r="28" stroke-width="1.5"/><text x="45" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="#c8433c" stroke="none">접수</text><text x="45" y="59" text-anchor="middle" font-size="11" fill="#c8433c" stroke="none">도로과</text></g></svg>`,
    kidBridge: `<svg viewBox="0 0 300 190"><defs><filter id="wob"><feTurbulence baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs><g filter="url(#wob)" ${CR} stroke-width="5">
      <circle cx="252" cy="34" r="17" stroke="#f2b233" fill="#ffe27a"/><path d="M252 6v-4M278 34h8M270 14l6-6M232 14l-6-6M226 36h-8" stroke="#f2b233"/>
      <path d="M40 78h200M58 78v70M222 78v70" stroke="#8a5a36" stroke-width="7"/><path d="M40 78l-22 24v18l-14 28M240 78l22 24v18l14 28" stroke="#8a5a36"/>
      <path d="M40 60h200M60 60v18M100 60v18M140 60v18M180 60v18M220 60v18" stroke="#3f6b55" stroke-width="3.5"/>
      <circle cx="128" cy="30" r="9" stroke="#2f4a6b"/><path d="M128 39v20M128 46l-13-12M128 46l14 4M128 59l-8 18M128 59l9 18" stroke="#2f4a6b" stroke-width="4"/>
      <rect x="28" y="140" width="56" height="24" rx="5" stroke="#c8433c" fill="#f2a9a0"/><circle cx="42" cy="168" r="6" stroke="#2b2622"/><circle cx="72" cy="168" r="6" stroke="#2b2622"/>
      <rect x="112" y="126" width="96" height="38" rx="6" stroke="#3f6b55" fill="#bfe0c8"/><path d="M124 136h16v12h-16zM150 136h16v12h-16zM176 136h16v12h-16z" stroke="#3f6b55" stroke-width="3"/><circle cx="132" cy="168" r="7" stroke="#2b2622"/><circle cx="188" cy="168" r="7" stroke="#2b2622"/>
      <path d="M200 120c6-10 12-10 16-2" stroke="#3f6b55" stroke-width="3.5"/>
      <path d="M6 182c40-6 90 4 140-2s100 4 148-2" stroke="#6f9a5c" stroke-width="4"/></g>
      <text x="146" y="24" font-size="24" fill="#2f4a6b" transform="rotate(-6 150 20)">← 나</text><text x="214" y="112" font-size="21" fill="#3f6b55" transform="rotate(5 214 112)">아저씨</text></svg>`,
    kidClass: `<svg viewBox="0 0 300 200"><defs><filter id="wob2"><feTurbulence baseFrequency=".04" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs><g filter="url(#wob2)" ${CR} stroke-width="5">
      <path d="M8 120l52-80 34 50 30-44 56 74" stroke="#7c8296"/><path d="M48 58l12 10 10-10M112 62l12 8 10-10" stroke="#9aa3b5" stroke-width="3.5"/>
      <ellipse cx="78" cy="150" rx="20" ry="28" stroke="#2b2622" fill="#3a3f4c"/><ellipse cx="78" cy="156" rx="11" ry="18" stroke="#fff" fill="#fff" stroke-width="2"/><path d="M92 136l14 4-13 5" stroke="#f08a2c" fill="#f08a2c" stroke-width="3"/><circle cx="84" cy="134" r="2" stroke="#fff" stroke-width="3"/>
      <path d="M58 126c4-16 34-16 40 0z" stroke="#f2b233" fill="#ffd23f"/><path d="M70 178l-6 8M86 178l6 8" stroke="#f08a2c"/>
      <rect x="150" y="96" width="44" height="50" rx="6" stroke="#8a5a36" fill="#c99a6a"/><path d="M158 146v40M186 146v40" stroke="#8a5a36" stroke-width="6"/><rect x="156" y="70" width="34" height="28" rx="6" stroke="#8a5a36" fill="#c99a6a"/>
      <path d="M160 70l-14-26M160 56l-12 2M152 50l-10-6M186 70l14-26M186 56l12 2M194 50l10-6" stroke="#b08a52" stroke-width="4"/><circle cx="166" cy="82" r="2" stroke="#2b2622" stroke-width="3"/><circle cx="180" cy="82" r="2" stroke="#2b2622" stroke-width="3"/>
      <path d="M150 106h44M150 126h44" stroke="#ff6d1f" stroke-width="7"/>
      <rect x="226" y="140" width="56" height="30" rx="5" stroke="#4f6d94" fill="#cfe0ea"/><circle cx="240" cy="174" r="6" stroke="#2b2622"/><circle cx="268" cy="174" r="6" stroke="#2b2622"/>
      <path d="M6 192c50-6 100 4 150-2s90 4 138-2" stroke="#6f9a5c" stroke-width="4"/></g>
      <text x="30" y="112" font-size="24" fill="#2b2622" transform="rotate(-8 30 112)">펭긴</text><text x="206" y="70" font-size="23" fill="#8a5a36" transform="rotate(6 206 70)">무스</text><text x="232" y="132" font-size="22" fill="#4f6d94">책 차</text></svg>`
  };
  const INK = ['#c8433c', '#2f5fb5', '#3f8a55', '#b0621a', '#7a4fb0'];
  /* 아이 글씨: 글자마다 조금씩 돌리고 올리고, 줄마다 크레파스 색을 바꾼다 */
  const kidText = (t, li) => `<span style="color:${INK[li % INK.length]}">` + [...t].map((ch, k) => ch === ' ' ? ' ' : `<i style="transform:rotate(${((hsh(li * 31 + k) - .5) * 15).toFixed(1)}deg) translateY(${((hsh(li * 17 + k * 3) - .5) * 5).toFixed(1)}px);font-size:${(.92 + hsh(li * 7 + k) * .22).toFixed(2)}em">${ch}</i>`).join('') + '</span>';
  let cur = null, lang = 'ko';
  function paper(s) {
    const m = mailOf(s), lines = (m[lang] || m.ko).map(t => t.replace(SKETCH, ''));
    const body = lines.map((t, k) => { const sign = /^[—-]/.test(t); return `<p class="${k === 0 ? 'head' : sign ? 'sign' : ''}">${m.hand === 'kid' ? kidText(t, k) : t}</p>`; }).join('');
    return `<div class="sheetPaper paper-${m.paper} hand-${m.hand}" lang="${lang}"><i class="postmark">${s.place}<br>${s.no}</i>${body}${m.doodle && DOODLE[m.doodle] ? `<div class="doodle d-${m.doodle}">${DOODLE[m.doodle]}</div>` : ''}</div>`;
  }
  function openLetter(id) {
    const s = STAGES.find(x => x.id === id); if (!s || !save.mail[id]) return;
    cur = s; if (save.mail[id] !== 2) { save.mail[id] = 2; keep(); }
    $('letterPaper').innerHTML = paper(s); $('letterFrom').textContent = (lang === 'en' ? mailOf(s).fromEn : mailOf(s).from) + ' · ' + s.place + ' ' + s.name;
    $('letterLang').textContent = lang === 'ko' ? 'EN' : '한국어'; $('letterLang').title = lang === 'ko' ? '영어 원문 보기' : '한국어로 보기';
    const got = STAGES.filter(x => save.mail[x.id]), k = got.indexOf(s);
    $('letterPrev').style.visibility = k > 0 ? '' : 'hidden'; $('letterNext').style.visibility = k < got.length - 1 ? '' : 'hidden';
    const L2 = $('letter'); L2.classList.remove('hidden'); const pp = $('letterPaper'); pp.classList.remove('in'); void pp.offsetWidth; pp.classList.add('in'); snd('paper');
  }
  const step = d => { const got = STAGES.filter(x => save.mail[x.id]), k = got.indexOf(cur) + d; if (got[k]) openLetter(got[k].id); };
  $('letterPrev').onclick = e => { e.stopPropagation(); step(-1); }; $('letterNext').onclick = e => { e.stopPropagation(); step(1); };
  $('letterLang').onclick = e => { e.stopPropagation(); lang = lang === 'ko' ? 'en' : 'ko'; openLetter(cur.id); };
  const closeLetter = () => { $('letter').classList.add('hidden'); if (!$('mail').classList.contains('hidden')) openMail(); refresh(); };
  $('letterClose').onclick = closeLetter; $('letter').addEventListener('pointerdown', e => { if (e.target === $('letter')) closeLetter(); });
  const envelope = s => { const m = mailOf(s), got = save.mail[s.id];
    return got ? `<button class="env env-${m.paper}${got !== 2 ? ' unread' : ''}" data-letter="${s.id}"><i class="stampette">${s.no}</i><small>보낸 사람</small><b class="hand-${m.hand === 'type' ? 'type' : m.hand}">${m.from}</b><span>${s.place} · ${s.name}</span></button>`
               : `<div class="env locked"><i class="stampette">${s.no}</i><span>${ST.mailLocked}</span></div>`; };
  function openMail() {
    $('mailHead').textContent = ST.mailTitle + '  ' + mailCount() + ' / ' + STAGES.length;
    $('mailList').innerHTML = WORLDS.map((w, wi) => `<h3><b>${wi + 1}</b>${w.name}</h3><div class="envRow">` + w.stages.map(envelope).join('') + '</div>').join('');
    $('stageSel').classList.add('hidden'); $('mail').classList.remove('hidden');
  }
  $('mailList').addEventListener('click', e => { const b = e.target.closest('[data-letter]'); if (b) openLetter(b.dataset.letter); });
  $('resMail').addEventListener('click', e => { const b = e.target.closest('[data-letter]'); if (b) openLetter(b.dataset.letter); });
  $('btnMail').onclick = openMail; $('mailClose').onclick = () => $('mail').classList.add('hidden');
  $('mail').addEventListener('pointerdown', e => { if (e.target === $('mail')) $('mail').classList.add('hidden'); });
  window.addEventListener('keydown', e => { if ($('letter').classList.contains('hidden')) return; if (e.key === 'Escape') closeLetter(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); }, true);

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
    { if (!save.mail[s.id]) save.mail[s.id] = 1; keep(); $('resMail').innerHTML = '<em>' + ST.mailNew + '</em>' + envelope(s).replace('class="env ', 'class="env fresh '); snd('mail'); refresh(); }
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
  $('sceneSkip').textContent = ST.ending.skip || '건너뛰기';
  refresh();
  window.FlowStory = { play, ending, openMail, get save() { return save; } };
})();
