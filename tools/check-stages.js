/* 스테이지 검증: 손대지 않으면 별이 없고, 추천 해법은 별을 전부 받는지 확인한다.
 *   node tools/check-stages.js          전체
 *   node tools/check-stages.js c5 m6    일부만
 * need 가 있는 스테이지(지역 최종)는 해법에서 그 도구를 하나씩 빼 보고, 빼면 별이 줄어드는지도 본다. */
const F = require('../js/sim.js'), FS = require('../js/stages.js');
const W = F.W, only = process.argv.slice(2);
function build(st, sol) {
  const base = st.rows ? F.parseStage(st.rows, st.terms, !st.locks) : F.parseStage(F.STAGE1);
  const tiles = F.cloneTiles(base);
  for (const [x, y, id, o] of sol) { const t = tiles[y * W + x]; if (id === 'road') t.road = true; else if (id === 'bridge' || id === 'tunnel') t[id] = o || 'H'; else if (id === 'oneway') t.oneway = o; else t[id] = true; }
  return { base, tiles };
}
function run(st, sol, seed) {
  const { base, tiles } = build(st, sol), m = new F.Sim(tiles, { seed: seed || 1225, stage: st.rows ? st : null }).run(), c = F.totalCost(tiles, base);
  let n = 0; while (n < st.goals.length && st.goals[n].ok(m, c)) n++;
  return { stars: n, pc: m.perCapita, acc: m.accidents, arr: m.arrived + '/' + m.total, cost: c };
}
let bad = 0;
for (const st of FS.STAGES) {
  if (only.length && !only.includes(st.id)) continue;
  const a = run(st, []), b = run(st, st.sol || []), max = st.goals.length;
  const line = r => `${r.stars}★ ${r.pc.toFixed(1)}s acc${r.acc} ${r.arr} ${FS.won(r.cost)}`;
  let note = '';
  if (a.stars > 0) { note += '  !! 손대지 않아도 별'; bad++; }
  if (b.stars < max) { note += '  !! 해법이 별을 다 못 받음'; bad++; }
  if (b.cost > st.budget) { note += '  !! 해법이 예산 초과'; bad++; }
  console.log(`${st.no} ${st.id.padEnd(3)} ${st.name.padEnd(14)} 그대로 ${line(a).padEnd(34)} 해법 ${line(b)} / ${max}★${note}`);
  for (const tool of st.need || []) {
    const r = run(st, st.sol.filter(s => s[2] !== tool));
    const ok = r.stars < max; if (!ok) bad++;
    console.log(`      − ${tool.padEnd(9)} ${line(r)} ${ok ? '' : ' !! 이 도구 없이도 별을 다 받음'}`);
  }
}
console.log(bad ? `\n문제 ${bad}건` : '\n모두 통과');
process.exit(bad ? 1 : 0);
