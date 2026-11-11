/* FLOW LAB — 효과음
 * 소리 파일 없이 Web Audio 로 그 자리에서 만든다. 첫 터치 뒤에야 소리가 난다(브라우저 정책).
 * 끄고 켜기는 저장된다. */
(function (root) {
  'use strict';
  const KEY = 'flowlab.sound';
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* ignore */ }
  let ac = null, master = null, lastBlip = 0;
  function ctx() {
    if (!on) return null;
    if (!ac) { try { ac = new (root.AudioContext || root.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac.state === 'running' ? ac : null;
  }
  function tone(f, d, type, vol, at, slide) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (at || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || .2, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .03);
  }
  function thud(d, vol, at) {
    const a = ctx(); if (!a) return;
    const n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); src.buffer = buf; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = vol || .4;
    src.connect(f); f.connect(g); g.connect(master); src.start(a.currentTime + (at || 0));
  }
  const S = {
    click() { tone(540, .05, 'triangle', .1); },
    place() { tone(330, .06, 'square', .05); tone(495, .08, 'square', .045, .045); },
    error() { tone(170, .16, 'sawtooth', .06, 0, 120); },
    run() { tone(260, .22, 'triangle', .1, 0, 520); },
    star(k) { tone([659, 880, 1047, 1319][Math.min(3, k)], .32, 'triangle', .16); tone([659, 880, 1047, 1319][Math.min(3, k)] * 2, .2, 'sine', .05, .02); },
    fail() { tone(300, .2, 'triangle', .1, 0, 200); tone(220, .3, 'triangle', .1, .16, 150); },
    stamp() { thud(.16, .7); tone(95, .2, 'sine', .35, 0, 48); },
    mail() { tone(784, .1, 'sine', .12); tone(1175, .18, 'sine', .12, .09); },
    paper() { thud(.07, .16); },
    /* 말소리: 글자가 찍힐 때마다 짧게. 핍은 높고 빠르게, 앵거스는 낮고 둥글게 */
    blip(who) {
      const a = ctx(); if (!a || a.currentTime - lastBlip < .055) return; lastBlip = a.currentTime;
      if (who === 'angus') tone(190 + Math.random() * 50, .06, 'triangle', .07); else if (who === 'note') thud(.03, .05); else tone(560 + Math.random() * 160, .04, 'square', .022);
    },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ } if (on) S.click(); document.dispatchEvent(new CustomEvent('flow-sound', { detail: on })); return on; }
  };
  root.FlowSound = S;

  // 버튼을 누르면 딸깍, 안내 띠(오류)가 뜨면 낮은 소리
  document.addEventListener('pointerdown', () => ctx(), true);
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (!b) return; if (b.id === 'btnPlay') S.run(); else S.click(); }, true);
  document.addEventListener('flow-edit', () => S.place());
  document.addEventListener('flow-result', e => { const n = e.detail.stars; if (e.detail.before) return; if (!n) { S.fail(); return; } for (let k = 0; k < n; k++) setTimeout(() => S.star(k), 250 + k * 260); });
  const watch = (id, cls, fn, show) => { const el = document.getElementById(id); if (!el || !root.MutationObserver) return; let was = el.classList.contains(cls); new MutationObserver(() => { const now = el.classList.contains(cls); if (now !== was) { was = now; if (now === show) fn(); } }).observe(el, { attributes: true, attributeFilter: ['class'] }); };
  root.addEventListener('DOMContentLoaded', () => { watch('toast', 'show', S.error, true); watch('tutEnd', 'hidden', () => { S.paper(); setTimeout(S.stamp, 560); }, false); watch('brief', 'hidden', S.paper, false); });
})(window);
