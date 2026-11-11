/* FLOW LAB — 캔버스 렌더러 (탑뷰 타일 맵 + 차량 + 오버레이) */
(function (root) {
  'use strict';
  const F = root.FlowSim, W = F.W, H = F.H, DX = F.DX, DY = F.DY;
  const BASE = {
    rockBg: '#1a2032',
    grassA: '#0d162e', grassB: '#0f1a35', grid: '#17224a',
    water: '#0b2a55', waterHi: '#1d59a8', rock: '#2a3040', rockHi: '#454d63',
    park: '#0e2f25', tree: '#1f7a55', road: '#262d42', roadEdge: '#3b4666', mark: '#8792b3',
    lock: '#ff4d6d', cyan: '#3ef0ff', green: '#36f1a0', orange: '#ffa63d', pink: '#ff5fa2',
    red: '#ff4d6d', yellow: '#ffd84a', blue: '#4da3ff', white: '#eef3ff'
  };
  const THEMES = {
    // 설계 모드: 청사진(블루프린트) 느낌의 2D 도면
    blueprint: { grassA: '#474c78', grassB: '#4a4f7d', grid: '#6d73a8', water: '#35568f', road: '#252945', roadEdge: '#a3a9dc', rockBg: '#3a3e63', rock: '#5d6190', rockHi: '#7c81b3', park: '#3d6a63', tree: '#58a58c' },
    // 3D 지면 텍스처용
    poly: { grassA: '#86bf6b', grassB: '#8cc671', grid: 'rgba(0,0,0,0)', water: '#4f8fc0', road: '#4b4f5e', roadEdge: '#e4dcc6', rockBg: '#9aa08f', park: '#74b360' }
  };
  let C = BASE;
  const CAR = { normal: '#4da3ff', speeder: '#ff4d5e', novice: '#ffd84a', bus: '#36f1a0' };
  const TERM = {
    home: { c: '#4da3ff', label: '주거단지' }, factory: { c: '#b58bff', label: '산업단지' },
    office: { c: '#ffa63d', label: '오피스' }, port: { c: '#36e0c8', label: '물류항' }
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function heatColor(h, a) {
    h = Math.max(0, Math.min(1, h));
    let r, g, b;
    if (h < 0.5) { const u = h / 0.5; r = 54 + (255 - 54) * u; g = 241 + (166 - 241) * u; b = 160 + (61 - 160) * u; }
    else { const u = (h - 0.5) / 0.5; r = 255; g = 166 + (60 - 166) * u; b = 61 + (90 - 61) * u; }
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  }
  function roadW(t) { return t.wide ? 0.9 : t.rev ? 0.74 : 0.58; }
  function arrow(ctx, x, y, ang, len, head) {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey);
    ctx.lineTo(ex - Math.cos(ang - 0.5) * head, ey - Math.sin(ang - 0.5) * head);
    ctx.lineTo(ex - Math.cos(ang + 0.5) * head, ey - Math.sin(ang + 0.5) * head);
    ctx.closePath(); ctx.fill();
  }
  const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  function draw(ctx, st) {
    const TS = st.TS, tiles = st.tiles, g = st.graph, sim = st.sim, now = st.now / 1000;
    const simT = sim ? sim.t : 0;
    const G = !!st.groundOnly;
    C = st.theme ? Object.assign({}, BASE, THEMES[st.theme]) : BASE;
    ctx.save();
    ctx.scale(TS, TS);
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';

    /* ---------- 지형 ---------- */
    if (G) ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (G) break;
      const t = tiles[y * W + x];
      ctx.fillStyle = (x + y) % 2 ? C.grassA : C.grassB;
      ctx.fillRect(x, y, 1, 1);
      if (t.base === 'water' && G) ctx.clearRect(x, y, 1, 1);
      else if (t.base === 'water') {
        ctx.fillStyle = C.water; ctx.fillRect(x, y, 1, 1);
        ctx.strokeStyle = 'rgba(62,160,255,.35)'; ctx.lineWidth = 0.025;
        for (let k = 0; k < 3; k++) {
          const yy = y + 0.2 + k * 0.3, ph = now * 0.8 + x * 1.3 + k;
          ctx.beginPath();
          for (let u = 0; u <= 1.001; u += 0.1) { const py = yy + Math.sin(ph + u * 6) * 0.03; if (u === 0) ctx.moveTo(x + u, py); else ctx.lineTo(x + u, py); }
          ctx.stroke();
        }
      } else if (t.base === 'rock') {
        ctx.fillStyle = C.rockBg; ctx.fillRect(x, y, 1, 1);
        if (G) continue;
        const pts = [[.12, .7, .34, .2, .58, .72], [.42, .82, .68, .3, .92, .82], [.2, .9, .36, .62, .52, .9]];
        pts.forEach((p, i) => {
          ctx.fillStyle = i === 1 ? C.rockHi : C.rock;
          ctx.beginPath(); ctx.moveTo(x + p[0], y + p[1]); ctx.lineTo(x + p[2], y + p[3]); ctx.lineTo(x + p[4], y + p[5]); ctx.closePath(); ctx.fill();
        });
      } else if (t.base === 'park') {
        ctx.fillStyle = C.park; rr(ctx, x + .04, y + .04, .92, .92, .12); ctx.fill();
        if (G) continue;
        [[.28, .3, .15], [.68, .36, .18], [.4, .7, .17], [.76, .76, .11]].forEach(p => {
          ctx.fillStyle = C.tree; ctx.beginPath(); ctx.arc(x + p[0], y + p[1], p[2], 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(54,241,160,.35)'; ctx.beginPath(); ctx.arc(x + p[0] - .03, y + p[1] - .03, p[2] * .5, 0, 7); ctx.fill();
        });
      }
    }
    ctx.strokeStyle = G ? 'rgba(0,0,0,0)' : C.grid; ctx.lineWidth = 0.012;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y++) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    /* 연결 방향 계산 */
    const arms = i => { const a = [false, false, false, false]; for (const b of g.nbr[i * 3]) { const bi = (b / 3) | 0; const dx = bi % W - i % W, dy = ((bi / W) | 0) - ((i / W) | 0); a[dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0] = true; } return a; };

    /* ---------- 지하차도 (지면 아래 점선 튜브) ---------- */
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.tunnel) continue;
      const x = i % W, y = (i / W) | 0;
      ctx.save(); ctx.translate(x + .5, y + .5); if (t.tunnel === 'V') ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(8,10,20,.85)'; ctx.fillRect(-.5, -.24, 1, .48);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 0.03; ctx.setLineDash([0.1, 0.07]);
      ctx.beginPath(); ctx.moveTo(-.5, -.24); ctx.lineTo(.5, -.24); ctx.moveTo(-.5, .24); ctx.lineTo(.5, .24); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    // 지하 주행 차량
    if (sim) for (const c of sim.cars) if (c.layer === 2) drawCar(ctx, c, st, 0.45);

    /* ---------- 지상 도로 ---------- */
    const drawRoadShape = (i, grow, style) => {
      const t = tiles[i], x = i % W + .5, y = ((i / W) | 0) + .5, w = roadW(t) + grow, a = arms(i);
      ctx.fillStyle = style;
      const n = a.filter(Boolean).length;
      rr(ctx, x - w / 2, y - w / 2, w, w, n <= 1 ? w * .3 : w * .18); ctx.fill();
      for (let d = 0; d < 4; d++) if (a[d]) {
        if (d === 0) ctx.fillRect(x - w / 2, y - .5, w, .5);
        else if (d === 1) ctx.fillRect(x, y - w / 2, .5, w);
        else if (d === 2) ctx.fillRect(x - w / 2, y, w, .5);
        else ctx.fillRect(x - .5, y - w / 2, .5, w);
      }
    };
    for (let i = 0; i < W * H; i++) { const t = tiles[i]; if (t.road) drawRoadShape(i, 0.07, (t.locked && (!G || st.mode === 'edit')) ? 'rgba(255,77,109,.85)' : C.roadEdge); }
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.road) continue;
      if (t.base === 'water' && !G) {                 // 기존 교량 그림자
        const x = i % W, y = (i / W) | 0;
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + .5 + roadW(t) / 2 + .03, 1, .08);
      }
      drawRoadShape(i, 0, C.road);
    }
    /* 혼잡도 히트맵 */
    if (sim && st.showHeat) for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.road) continue;
      const h = sim.heat[i] / 2.6; if (h < 0.04) continue;
      drawRoadShape(i, -0.04, heatColor(h, 0.16 + 0.34 * Math.min(1, h)));
    }

    /* 노면 표시 */
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.road) continue;
      const x = i % W + .5, y = ((i / W) | 0) + .5, a = arms(i), n = a.filter(Boolean).length, w = roadW(t);
      const isJ = g.ctrl[i * 3];
      const inner = isJ ? (t.round ? .4 : .3) : 0.0;
      for (let d = 0; d < 4; d++) {
        if (!a[d]) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ANG[d]);           // +x = 바깥쪽
        // 버스 전용차선
        if (t.bus) {
          ctx.fillStyle = 'rgba(48,120,255,.6)';
          const bw = t.wide ? .2 : .2, off = t.wide ? .33 : t.oneway >= 0 ? .14 : .14;
          ctx.fillRect(inner, -off - bw / 2, .5 - inner, bw);
          if (t.wide || t.oneway < 0) ctx.fillRect(inner, off - bw / 2, .5 - inner, bw);
        }
        // 색깔 유도선
        if (t.guide) {
          ctx.lineWidth = 0.05; ctx.strokeStyle = C.pink;
          ctx.beginPath(); ctx.moveTo(.5, -.14); ctx.lineTo(inner, -.14); ctx.stroke();
          ctx.strokeStyle = C.green;
          ctx.beginPath(); ctx.moveTo(inner, .14); ctx.lineTo(.5, .14); ctx.stroke();
        }
        // 차선
        ctx.lineWidth = 0.022;
        if (t.oneway >= 0) {
          ctx.strokeStyle = 'rgba(238,243,255,.55)'; ctx.setLineDash([.09, .09]);
          ctx.beginPath(); ctx.moveTo(inner, 0); ctx.lineTo(.5, 0); ctx.stroke(); ctx.setLineDash([]);
        } else if (t.rev) {
          const fav = sim ? sim.revFav[i] : 1, tr = sim ? sim.revTrans[i] : 0;
          ctx.fillStyle = tr ? 'rgba(255,216,74,.28)' : 'rgba(62,240,255,.16)';
          ctx.fillRect(inner, -.11, .5 - inner, .22);
          ctx.strokeStyle = C.yellow; ctx.setLineDash([.08, .06]);
          ctx.beginPath(); ctx.moveTo(inner, -.11); ctx.lineTo(.5, -.11); ctx.moveTo(inner, .11); ctx.lineTo(.5, .11); ctx.stroke(); ctx.setLineDash([]);
          // 중앙 차로 진행 방향 화살표
          const outward = (d === 1 || d === 2) ? fav > 0 : fav < 0;
          ctx.fillStyle = ctx.strokeStyle = tr ? C.yellow : C.cyan; ctx.lineWidth = 0.03;
          if (outward) arrow(ctx, inner + .08, 0, 0, .2, .08); else arrow(ctx, .46, 0, Math.PI, .2, .08);
        } else {
          ctx.strokeStyle = t.wide ? C.yellow : 'rgba(255,216,74,.7)';
          if (t.wide) {
            ctx.beginPath(); ctx.moveTo(inner, 0); ctx.lineTo(.5, 0); ctx.stroke();
            ctx.strokeStyle = 'rgba(238,243,255,.5)'; ctx.setLineDash([.09, .09]);
            ctx.beginPath(); ctx.moveTo(inner, -.22); ctx.lineTo(.5, -.22); ctx.moveTo(inner, .22); ctx.lineTo(.5, .22); ctx.stroke(); ctx.setLineDash([]);
          } else {
            ctx.setLineDash([.1, .08]);
            ctx.beginPath(); ctx.moveTo(inner, 0); ctx.lineTo(.5, 0); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        // 정지선
        if (isJ && !t.round) {
          ctx.strokeStyle = 'rgba(238,243,255,.75)'; ctx.lineWidth = 0.03;
          ctx.beginPath(); ctx.moveTo(inner + .01, -w / 2 + .03); ctx.lineTo(inner + .01, 0); ctx.stroke();
        }
        ctx.restore();
      }
      // 교차로 내부 유도선(곡선)
      if (t.guide && isJ && !t.round) {
        ctx.lineWidth = 0.04;
        for (let d1 = 0; d1 < 4; d1++) for (let d2 = 0; d2 < 4; d2++) {
          if (d1 === d2 || !a[d1] || !a[d2]) continue;
          const din = (d1 + 2) % 4;                    // d1 쪽에서 들어와 d2 로 나감
          const p = [x + DX[d1] * .3 - (-DY[din]) * -.14, y + DY[d1] * .3 - DX[din] * -.14];
          const P = [x + DX[d1] * .3 + (-DY[din]) * .14, y + DY[d1] * .3 + DX[din] * .14];
          const Q = [x + DX[d2] * .3 + (-DY[d2]) * .14, y + DY[d2] * .3 + DX[d2] * .14];
          const left = d2 === (din + 3) % 4;
          ctx.strokeStyle = left ? 'rgba(255,95,162,.9)' : 'rgba(54,241,160,.75)';
          ctx.beginPath(); ctx.moveTo(P[0], P[1]);
          if (din === d2) ctx.lineTo(Q[0], Q[1]);
          else ctx.quadraticCurveTo(din % 2 === 1 ? Q[0] : P[0], din % 2 === 1 ? P[1] : Q[1], Q[0], Q[1]);
          ctx.stroke(); void p;
        }
      }
      // 일방통행 화살표
      if (t.oneway >= 0) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ANG[t.oneway]);
        ctx.fillStyle = ctx.strokeStyle = C.white; ctx.lineWidth = 0.05;
        arrow(ctx, -.2, 0, 0, .4, .13);
        ctx.restore();
      }
      // 회전교차로
      if (t.round) {
        ctx.fillStyle = C.road; ctx.beginPath(); ctx.arc(x, y, .42, 0, 7); ctx.fill();
        ctx.strokeStyle = C.roadEdge; ctx.lineWidth = .03; ctx.beginPath(); ctx.arc(x, y, .42, 0, 7); ctx.stroke();
        if (t.guide) { ctx.strokeStyle = C.pink; ctx.lineWidth = .04; ctx.beginPath(); ctx.arc(x, y, .25, 0, 7); ctx.stroke(); }
        ctx.fillStyle = '#12402f'; ctx.beginPath(); ctx.arc(x, y, .13, 0, 7); ctx.fill();
        ctx.strokeStyle = C.green; ctx.lineWidth = .025; ctx.beginPath(); ctx.arc(x, y, .13, 0, 7); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle = 'rgba(238,243,255,.8)'; ctx.lineWidth = .025;
        for (let k = 0; k < 3; k++) {
          const th = k * 2.094 - now * 0.6;
          const px = x + Math.cos(th) * .31, py = y + Math.sin(th) * .31;
          arrow(ctx, px, py, th - Math.PI / 2, .1, .07);
        }
      }
      // 횡단보도
      if (t.crosswalk) {
        const vert = a[0] || a[2];                     // 도로가 세로 방향이면 줄무늬는 가로로 배열
        ctx.save(); ctx.translate(x, y); if (!vert) ctx.rotate(Math.PI / 2);
        const active = sim ? sim.cwActive(i) : false;
        if (!t.overpass) {
          ctx.fillStyle = active ? 'rgba(255,255,255,.95)' : 'rgba(238,243,255,.6)';
          for (let k = -3; k <= 3; k++) ctx.fillRect(k * .08 - .025, -.1, .05, .2);
          if (active) {                                // 보행자
            const ph = ((simT + (i * 3.7) % 13) % 13) / 4;
            for (let k = 0; k < 3; k++) {
              const px = -.4 + ((ph * (0.9 + k * .12) + k * .22) % 1) * .8 * (k % 2 ? -1 : 1) + (k % 2 ? .8 : 0);
              ctx.fillStyle = k % 2 ? C.pink : C.cyan;
              ctx.beginPath(); ctx.arc(px, -.05 + k * .05, .035, 0, 7); ctx.fill();
            }
            ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(-.4, -.2, .04, 0, 7); ctx.fill();
          }
        }
        ctx.restore();
      }
      // 과속방지턱
      if (t.bump) {
        const vert = a[0] || a[2];
        ctx.save(); ctx.translate(x, y); if (vert && !(a[1] || a[3])) ctx.rotate(Math.PI / 2);
        ctx.translate(isJ ? .36 : 0, 0);
        ctx.fillStyle = C.yellow; ctx.fillRect(-.05, -w / 2 + .02, .1, w - .04);
        ctx.fillStyle = '#1a1a1a';
        for (let k = 0; k < 5; k++) ctx.fillRect(-.05, -w / 2 + .05 + k * (w - .08) / 5, .1, (w - .08) / 10);
        ctx.restore();
      }
      // 잠금 표시
      if (t.locked && st.mode === 'edit' && !G) {
        ctx.fillStyle = 'rgba(255,77,109,.9)';
        rr(ctx, x + .26, y - .44, .16, .13, .02); ctx.fill();
        ctx.strokeStyle = 'rgba(255,77,109,.9)'; ctx.lineWidth = .03;
        ctx.beginPath(); ctx.arc(x + .34, y - .44, .045, Math.PI, 0); ctx.stroke();
      }
    }

    /* 터미널(출발지/도착지) */
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.term) continue;
      const x = i % W, y = (i / W) | 0, T = TERM[t.term.kind], a = arms(i);
      ctx.fillStyle = C.road;
      for (let d = 0; d < 4; d++) if (a[d]) {
        if (d === 0) ctx.fillRect(x + .21, y, .58, .5); else if (d === 1) ctx.fillRect(x + .5, y + .21, .5, .58);
        else if (d === 2) ctx.fillRect(x + .21, y + .5, .58, .5); else ctx.fillRect(x, y + .21, .5, .58);
      }
      if (G) continue;
      ctx.shadowColor = T.c; ctx.shadowBlur = 14;
      ctx.fillStyle = '#0c1228'; rr(ctx, x + .1, y + .1, .8, .8, .14); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = T.c; ctx.lineWidth = .04; rr(ctx, x + .1, y + .1, .8, .8, .14); ctx.stroke();
      ctx.fillStyle = T.c; ctx.globalAlpha = .75;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        const lit = ((i * 7 + r * 3 + c * 5 + Math.floor(now / 2)) % 5) !== 0;
        ctx.globalAlpha = lit ? .8 : .2; ctx.fillRect(x + .2 + c * .16, y + .5 + r * .14, .1, .08);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = T.c; ctx.font = '800 0.26px "Wanted Sans",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t.term.id, x + .5, y + .32);
    }

    if (G) { ctx.restore(); return; }
    /* ---------- 지상 차량 ---------- */
    if (sim) {
      for (const c of sim.cars) if (c.layer === 0) drawCar(ctx, c, st, 1);
    }

    /* 지상 시설물 (바리케이드·육교·신호등·카메라) */
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.road) continue;
      const x = i % W + .5, y = ((i / W) | 0) + .5, a = arms(i), w = roadW(t);
      if (t.barricade) {
        const vert = (a[0] || a[2]) && !(a[1] || a[3]);
        ctx.save(); ctx.translate(x, y); if (!vert) ctx.rotate(Math.PI / 2);
        ctx.fillStyle = 'rgba(255,166,61,.18)'; ctx.fillRect(-.36, -.36, .72, .72);
        for (let k = 0; k < 2; k++) {
          const yy = -.1 + k * .2;
          ctx.fillStyle = C.orange; ctx.fillRect(-.34, yy - .045, .68, .09);
          ctx.fillStyle = C.white; for (let s = 0; s < 4; s++) ctx.fillRect(-.3 + s * .17, yy - .045, .07, .09);
        }
        ctx.fillStyle = (Math.floor(now * 2) % 2) ? C.red : '#5a1a26';
        ctx.beginPath(); ctx.arc(-.34, -.2, .04, 0, 7); ctx.arc(.34, -.2, .04, 0, 7); ctx.fill();
        ctx.restore();
      }
      if (t.crosswalk && t.overpass) {
        const vert = a[0] || a[2];
        ctx.save(); ctx.translate(x, y); if (!vert) ctx.rotate(Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-.47, -.06, .94, .2);
        ctx.fillStyle = '#5b6a94'; ctx.fillRect(-.47, -.1, .94, .2);
        ctx.strokeStyle = C.cyan; ctx.lineWidth = .02; ctx.strokeRect(-.47, -.1, .94, .2);
        ctx.fillStyle = '#8fa0cf'; for (let k = 0; k < 4; k++) { ctx.fillRect(-.47, -.1 - k * .035 - .03, .07, .025); ctx.fillRect(.4, .1 + k * .035 + .005, .07, .025); }
        for (let k = 0; k < 3; k++) {
          const px = -.4 + ((now * .22 + k * .37) % 1) * .8;
          ctx.fillStyle = k % 2 ? C.pink : C.cyan; ctx.beginPath(); ctx.arc(k % 2 ? -px : px, -.03 + k * .03, .032, 0, 7); ctx.fill();
        }
        ctx.restore();
      }
      if (t.signal && g.ctrl[i * 3]) {
        const sg = sim && sim.sig[i * 3];
        for (let d = 0; d < 4; d++) if (a[d]) {
          const green = sg ? ((d % 2) === sg.axis && sim.t >= sg.clearUntil) : false;
          const px = x + DX[d] * .34 + (-DY[(d + 2) % 4]) * (w / 2 + .02), py = y + DY[d] * .34 + DX[(d + 2) % 4] * (w / 2 + .02);
          ctx.fillStyle = '#0a0d18'; rr(ctx, px - .05, py - .05, .1, .1, .02); ctx.fill();
          ctx.shadowColor = green ? C.green : C.red; ctx.shadowBlur = 8;
          ctx.fillStyle = sg ? (green ? C.green : C.red) : C.yellow;
          ctx.beginPath(); ctx.arc(px, py, .033, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }
      }
      if (t.camera) {
        const sweep = now * 1.4 + i;
        const grad = ctx.createRadialGradient(x, y, .1, x, y, F.CAM_RADIUS);
        grad.addColorStop(0, 'rgba(255,77,109,.20)'); grad.addColorStop(1, 'rgba(255,77,109,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, F.CAM_RADIUS, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,77,109,.45)'; ctx.lineWidth = .015; ctx.setLineDash([.08, .08]);
        ctx.beginPath(); ctx.arc(x, y, F.CAM_RADIUS, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,77,109,.16)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, F.CAM_RADIUS, sweep, sweep + .6); ctx.closePath(); ctx.fill();
        const cx = x + .33, cy = y - .33;
        ctx.fillStyle = '#0a0d18'; rr(ctx, cx - .1, cy - .07, .2, .14, .03); ctx.fill();
        ctx.strokeStyle = C.red; ctx.lineWidth = .02; rr(ctx, cx - .1, cy - .07, .2, .14, .03); ctx.stroke();
        ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, .04, 0, 7); ctx.fill();
      }
    }

    /* ---------- 고가 다리 ---------- */
    for (let i = 0; i < W * H; i++) {
      const t = tiles[i]; if (!t.bridge) continue;
      const x = i % W, y = (i / W) | 0;
      ctx.save(); ctx.translate(x + .5, y + .5); if (t.bridge === 'V') ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-.5, -.22, 1, .6);
      ctx.fillStyle = '#343c58'; ctx.fillRect(-.5, -.3, 1, .6);
      ctx.strokeStyle = C.cyan; ctx.lineWidth = .03;
      ctx.beginPath(); ctx.moveTo(-.5, -.3); ctx.lineTo(.5, -.3); ctx.moveTo(-.5, .3); ctx.lineTo(.5, .3); ctx.stroke();
      ctx.strokeStyle = 'rgba(62,240,255,.45)'; ctx.lineWidth = .02;                      // 트러스
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const x0 = -.5 + k * .25; ctx.moveTo(x0, -.3); ctx.lineTo(x0 + .125, -.38); ctx.lineTo(x0 + .25, -.3); ctx.moveTo(x0, .3); ctx.lineTo(x0 + .125, .38); ctx.lineTo(x0 + .25, .3); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,216,74,.7)'; ctx.setLineDash([.1, .08]);
      ctx.beginPath(); ctx.moveTo(-.5, 0); ctx.lineTo(.5, 0); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    if (sim) for (const c of sim.cars) if (c.layer === 1) drawCar(ctx, c, st, 1);

    /* ---------- 오버레이 ---------- */
    // 상충점 표시(설계 모드)
    if (st.mode === 'edit' && st.conflicts) for (const cf of st.conflicts.list) {
      const x = cf.idx % W + .5, y = ((cf.idx / W) | 0) + .5;
      const col = cf.c >= 9 ? C.red : cf.c >= 6 ? C.orange : C.yellow;
      ctx.strokeStyle = col; ctx.lineWidth = .025; ctx.setLineDash([.06, .05]);
      ctx.beginPath(); ctx.arc(x, y, .46 + Math.sin(now * 3) * .015, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#0a0d18'; rr(ctx, x - .49, y + .3, .34, .18, .05); ctx.fill();
      ctx.fillStyle = col; ctx.font = '700 0.14px "Wanted Sans",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('×' + cf.c, x - .32, y + .395);
    }
    if (sim) {
      // 사고로 막힌 타일
      for (let n = 0; n < sim.N; n++) if (sim.blockedUntil[n] > sim.t) {
        const i = (n / 3) | 0, x = i % W, y = (i / W) | 0;
        ctx.fillStyle = 'rgba(255,40,70,' + (0.14 + 0.08 * Math.sin(now * 8)) + ')'; ctx.fillRect(x, y, 1, 1);
        ctx.strokeStyle = C.red; ctx.lineWidth = .03; ctx.strokeRect(x + .02, y + .02, .96, .96);
      }
      // 추적 차량의 A* 경로
      const tr = st.tracked;
      if (tr && !tr.gone && st.showPath) {
        ctx.strokeStyle = C.cyan; ctx.lineWidth = .05; ctx.setLineDash([.12, .1]); ctx.lineDashOffset = -now * .6;
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(tr.x, tr.y);
        for (let k = tr.i + 1; k < tr.path.length; k++) ctx.lineTo(sim.nx(tr.path[k]), sim.ny(tr.path[k]));
        ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
        const dn = tr.path[tr.path.length - 1];
        ctx.strokeStyle = C.cyan; ctx.lineWidth = .03; ctx.beginPath(); ctx.arc(sim.nx(dn), sim.ny(dn), .46, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(tr.x, tr.y, .2, 0, 7); ctx.stroke();
        label(ctx, tr.x, tr.y - .3, 'A* 경로 · ' + (tr.v * F.KMH).toFixed(0) + 'km/h', C.cyan);
      }
      // 사고 이펙트
      for (const cr of sim.crashes) {
        const age = sim.t - cr.t; if (age > 10.5) continue;
        const pulse = 1 + Math.sin(now * 10) * .08;
        ctx.save(); ctx.translate(cr.x, cr.y);
        for (let k = 0; k < 4; k++) {                 // 연기
          const u = ((now * .5 + k * .25) % 1);
          ctx.fillStyle = `rgba(70,70,85,${0.5 * (1 - u)})`;
          ctx.beginPath(); ctx.arc(Math.sin(k * 2.1) * .08 + u * .1, -u * .55, .07 + u * .1, 0, 7); ctx.fill();
        }
        const R = (age < .5 ? .2 + age * .5 : .3) * pulse;
        ctx.fillStyle = C.orange; ctx.shadowColor = C.orange; ctx.shadowBlur = 18;
        ctx.beginPath();
        for (let k = 0; k < 16; k++) { const r = k % 2 ? R * .5 : R, th = k * Math.PI / 8 + now; ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, R * .35, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();
        label(ctx, cr.x, cr.y - .48, (cr.rear ? '추돌' : '측면 충돌') + ' · TTC ' + Math.min(cr.ttc, 0.3).toFixed(1) + 's↓', C.red);
        if (Math.floor(now * 3) % 2) { ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(cr.x + .38, cr.y - .3, .05, 0, 7); ctx.fill(); }
      }
    }
    // 호버/도구 미리보기
    if (st.hover && st.mode === 'edit') {
      const hx = st.hover.x, hy = st.hover.y;
      ctx.strokeStyle = st.hover.ok ? C.cyan : C.red; ctx.lineWidth = .04;
      ctx.fillStyle = st.hover.ok ? 'rgba(62,240,255,.12)' : 'rgba(255,77,109,.14)';
      rr(ctx, hx + .03, hy + .03, .94, .94, .1); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function label(ctx, x, y, text, col) {
    ctx.font = '700 0.15px "Wanted Sans",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + .14;
    ctx.fillStyle = 'rgba(6,9,20,.88)'; rr(ctx, x - w / 2, y - .11, w, .22, .06); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = .015; rr(ctx, x - w / 2, y - .11, w, .22, .06); ctx.stroke();
    ctx.fillStyle = col; ctx.fillText(text, x, y + .005);
  }

  function drawCar(ctx, c, st, alpha) {
    const col = CAR[c.type], L = c.len, Wd = c.type === 'bus' ? .15 : .12;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(c.x, c.y); ctx.rotate(c.ang + (c.crashed ? (c.id % 2 ? .5 : -.4) : 0));
    if (c.type === 'speeder' && !c.crashed && c.v > 1.3) {       // 속도 잔상
      const gr = ctx.createLinearGradient(-L / 2 - .35, 0, -L / 2, 0);
      gr.addColorStop(0, 'rgba(255,77,94,0)'); gr.addColorStop(1, 'rgba(255,77,94,.55)');
      ctx.fillStyle = gr; ctx.fillRect(-L / 2 - .35, -Wd / 2, .35, Wd);
    }
    ctx.shadowColor = col; ctx.shadowBlur = c.crashed ? 0 : 8;
    ctx.fillStyle = c.crashed ? '#5a3038' : col;
    rr(ctx, -L / 2, -Wd / 2, L, Wd, .035); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6,10,24,.75)';
    if (c.type === 'bus') { for (let k = 0; k < 4; k++) ctx.fillRect(-L / 2 + .04 + k * .09, -Wd / 2 + .025, .06, Wd - .05); }
    else ctx.fillRect(L / 2 - .11, -Wd / 2 + .02, .05, Wd - .04);
    if (c.type === 'novice') { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-L / 2 + .03, -.025, .05, .05); }
    if (!c.crashed && c.vt < c.v - .15) { ctx.fillStyle = '#ff2a2a'; ctx.fillRect(-L / 2 - .012, -Wd / 2, .025, .035); ctx.fillRect(-L / 2 - .012, Wd / 2 - .035, .025, .035); }
    ctx.restore();
    if (c.crashed || alpha < 1) return;
    if (st.showVec && c.v > .15) {                               // 속도 벡터
      ctx.strokeStyle = ctx.fillStyle = col; ctx.globalAlpha = .7; ctx.lineWidth = .018;
      const len = c.v * .22;
      arrow(ctx, c.x + Math.cos(c.ang) * (L / 2 + .02), c.y + Math.sin(c.ang) * (L / 2 + .02), c.ang, len, .05);
      ctx.globalAlpha = 1;
    }
    if (!st.devLabels) return;
    if (c.calm && c.type === 'speeder') label(ctx, c.x, c.y - .22, '감속! ' + (c.v0 * F.KMH).toFixed(0) + '→' + (Math.min(c.v, 1.3) * F.KMH).toFixed(0) + 'km/h', C.red);
    else if (c.panicUntil > st.sim.t) label(ctx, c.x, c.y - .22, '급정거!', C.yellow);
    else if (c.hesStart >= 0 && st.sim.t - c.hesStart < c.hesDur && c.v < .1) label(ctx, c.x, c.y - .22, '머뭇… τ=' + c.hesDur.toFixed(1) + 's', C.yellow);
    else if (c.ttc < 0.5 && c.v > .5) label(ctx, c.x, c.y - .22, 'TTC ' + c.ttc.toFixed(1) + 's', C.orange);
  }

  /* ---------- 3D 뷰 위에 겹쳐 그리는 말풍선 ---------- */
  const BUB = { q: ['#ffc928', '#1c1f27', '?'], bang: ['#e5483f', '#fff', '!'], stuck: ['#1c1f27', '#fff', '···'], cam: ['#1d5fbf', '#fff', ''] };
  function bubble(ctx, x, y, kind) {
    const b = BUB[kind];
    ctx.fillStyle = '#1c1f27'; ctx.beginPath(); ctx.arc(x, y + 2, 11, 0, 7); ctx.fill();          // 단단한 그림자
    ctx.fillStyle = b[0]; ctx.strokeStyle = '#1c1f27'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = b[1];
    if (kind === 'cam') { rr(ctx, x - 5.5, y - 3, 8, 6.5, 1.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 2.5, y - .5); ctx.lineTo(x + 6, y - 2.5); ctx.lineTo(x + 6, y + 3); ctx.lineTo(x + 2.5, y + 1); ctx.fill(); return; }
    ctx.font = '900 ' + (kind === 'stuck' ? 11 : 15) + 'px "Wanted Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b[2], x, y + (kind === 'stuck' ? -1 : 1));
  }
  function pill(ctx, x, y, text, col, dark) {
    ctx.font = '800 12px "Wanted Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 18;
    ctx.fillStyle = '#1c1f27'; rr(ctx, x - w / 2, y - 9, w, 23, 6); ctx.fill();
    ctx.fillStyle = dark ? col : '#f6f3ea'; ctx.strokeStyle = '#1c1f27'; ctx.lineWidth = 2; rr(ctx, x - w / 2, y - 12, w, 23, 6); ctx.fill(); ctx.stroke();
    if (!dark) { ctx.fillStyle = col; ctx.fillRect(x - w / 2 + 5, y - 6, 4, 11); }
    ctx.fillStyle = dark ? '#fff' : '#1c1f27'; ctx.fillText(text, x + (dark ? 0 : 3), y);
  }
  const TYPE_NAME = { normal: '일반 운전자', speeder: '과속 운전자', novice: '초보 운전자', bus: '버스 (승객 20명)' };
  function overlay3d(ctx, st, V) {
    const sim = st.sim; if (!sim) return;
    const tr = st.tracked;
    if (tr && !tr.gone) {                                   // 클릭한 차량의 예정 경로
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.setLineDash([2, 9]); ctx.lineCap = 'round'; ctx.lineDashOffset = -st.now / 40;
      ctx.beginPath();
      let p = V.project(tr.x, tr.y, V.carH(sim, tr) + .1); ctx.moveTo(p[0], p[1]);
      for (let k = tr.i + 1; k < tr.path.length; k++) { p = V.project(sim.nx(tr.path[k]), sim.ny(tr.path[k]), V.nodeH(tr.path[k]) + .1); ctx.lineTo(p[0], p[1]); }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
      p = V.project(tr.x, tr.y, V.carH(sim, tr) + .5);
      const dest = sim.tileOf(tr.dest).term;
      pill(ctx, p[0], p[1], TYPE_NAME[tr.type] + ' → ' + (dest ? dest.name : ''), CAR[tr.type]);
    }
    for (const c of sim.cars) {
      if (c.crashed || c === tr || c.layer === 2) continue;
      let e = null;
      if (c.panicUntil > sim.t) e = 'bang';
      else if (c.hesStart >= 0 && sim.t - c.hesStart < c.hesDur && c.v < .1) e = 'q';
      else if (c.calm && c.type === 'speeder') e = 'cam';
      else if (c.stopT > 6) e = 'stuck';
      if (!e) continue;
      const p = V.project(c.x, c.y, V.carH(sim, c) + .42); bubble(ctx, p[0], p[1], e);
    }
    for (const cr of sim.crashes) {
      if (sim.t - cr.t > 10.5) continue;
      const p = V.project(cr.x, cr.y, .95);
      pill(ctx, p[0], p[1], '사고 · 통제 중', '#e5483f', true);
    }
  }

  /* ---------- 대시보드 차트 ---------- */
  function lineChart(cv, d) {
    const ctx = cv.getContext('2d'), Wp = cv.width, Hp = cv.height;
    ctx.clearRect(0, 0, Wp, Hp);
    const L = 50, R = 14, T = 14, B = 34, pw = Wp - L - R, ph = Hp - T - B;
    let ymax = 50;
    for (const s of d.base) ymax = Math.max(ymax, s.pc);
    for (const s of d.cur) ymax = Math.max(ymax, s.pc);
    ymax = Math.ceil(ymax / 10) * 10;
    const X = t => L + t / F.SIM_END * pw, Y = v => T + ph - v / ymax * ph;
    ctx.font = '20px "Wanted Sans",system-ui,sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,216,74,.06)'; ctx.fillRect(X(F.PM_START), T, X(F.DEMAND_END) - X(F.PM_START), ph);
    ctx.strokeStyle = '#1c2850'; ctx.lineWidth = 1; ctx.fillStyle = '#8492bd'; ctx.textAlign = 'right';
    for (let v = 0; v <= ymax; v += 10) { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke(); ctx.fillText(v, L - 8, Y(v)); }
    ctx.textAlign = 'center';
    for (let t = 0; t <= F.SIM_END; t += 30) ctx.fillText(t + 's', X(t), Hp - 14);
    ctx.fillStyle = 'rgba(255,216,74,.7)'; ctx.fillText('퇴근 시간대', (X(F.PM_START) + X(F.DEMAND_END)) / 2, T + 12);
    ctx.fillStyle = 'rgba(132,146,189,.8)'; ctx.fillText('출근 시간대', (X(0) + X(F.PM_START)) / 2, T + 12);
    // 목표선
    ctx.strokeStyle = '#36f1a0'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L, Y(d.target)); ctx.lineTo(L + pw, Y(d.target)); ctx.stroke(); ctx.setLineDash([]);
    const path = (arr, col, dash, lw) => {
      if (!arr.length) return;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.lineJoin = 'round';
      ctx.beginPath(); arr.forEach((s, k) => { if (k) ctx.lineTo(X(s.t), Y(s.pc)); else ctx.moveTo(X(s.t), Y(s.pc)); }); ctx.stroke(); ctx.setLineDash([]);
    };
    const marks = (arr, col) => { let prev = 0; for (const s of arr) { if (s.acc > prev) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(s.t), Y(s.pc), 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#070b17'; ctx.lineWidth = 2; ctx.stroke(); } prev = s.acc; } };
    path(d.base, '#ff7d92', [7, 5], 3); marks(d.base, '#ffa63d');
    if (d.cur !== d.base) {
      ctx.shadowColor = '#3ef0ff'; ctx.shadowBlur = 12; path(d.cur, '#3ef0ff', [], 4); ctx.shadowBlur = 0; marks(d.cur, '#ffa63d');
      const last = d.cur[d.cur.length - 1];
      if (last) { ctx.fillStyle = '#3ef0ff'; ctx.beginPath(); ctx.arc(X(last.t), Y(last.pc), 7, 0, 7); ctx.fill(); }
    }
  }

  function pareto(cv, d) {
    const ctx = cv.getContext('2d'), Wp = cv.width, Hp = cv.height;
    ctx.clearRect(0, 0, Wp, Hp);
    const L = 50, R = 44, T = 12, B = 34, pw = Wp - L - R, ph = Hp - T - B;
    let ymax = 50; for (const p of d.pts) ymax = Math.max(ymax, p.pc);
    ymax = Math.ceil(ymax / 10) * 10;
    const X = c => L + c / F.BUDGET * pw, Y = v => T + ph - v / ymax * ph;
    ctx.font = '20px "Wanted Sans",system-ui,sans-serif'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#1c2850'; ctx.lineWidth = 1; ctx.fillStyle = '#8492bd'; ctx.textAlign = 'right';
    for (let v = 0; v <= ymax; v += 10) { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke(); ctx.fillText(v, L - 8, Y(v)); }
    ctx.textAlign = 'center';
    for (let c = 0; c <= F.BUDGET; c += 500) ctx.fillText('$' + c, X(c), Hp - 14);
    ctx.fillStyle = 'rgba(54,241,160,.07)'; ctx.fillRect(L, Y(d.target), pw, Y(0) - Y(d.target));
    ctx.strokeStyle = '#36f1a0'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L, Y(d.target)); ctx.lineTo(L + pw, Y(d.target)); ctx.stroke(); ctx.setLineDash([]);
    // 파레토 전선: 지배되지 않는 점
    const sorted = d.pts.slice().sort((a, b) => a.cost - b.cost || a.pc - b.pc);
    const front = []; let best = Infinity;
    for (const p of sorted) if (p.pc < best - 1e-9) { front.push(p); best = p.pc; }
    if (front.length > 1) {
      ctx.strokeStyle = 'rgba(255,95,162,.9)'; ctx.lineWidth = 3; ctx.beginPath();
      front.forEach((p, k) => { if (k) { ctx.lineTo(X(p.cost), Y(front[k - 1].pc)); ctx.lineTo(X(p.cost), Y(p.pc)); } else ctx.moveTo(X(p.cost), Y(p.pc)); });
      ctx.stroke();
    }
    d.pts.forEach((p, k) => {
      const col = p.base ? '#ff7d92' : p.clear ? '#36f1a0' : '#ffa63d';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(X(p.cost), Y(p.pc), p.cur ? 10 : 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (p.cur) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#dfe7ff'; ctx.textAlign = X(p.cost) > Wp - 90 ? 'right' : 'left';
      ctx.fillText(p.base ? '개선 전' : '#' + k, X(p.cost) + (X(p.cost) > Wp - 90 ? -12 : 12), Y(p.pc) - 14);
    });
  }

  root.FlowRender = { draw, overlay3d, lineChart, pareto, CAR, heatColor };
})(window);
