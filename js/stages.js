/* FLOW LAB — 지역과 미니 스테이지
 * 지역(시골 → 항구 → 도시 → 산)마다 미니 스테이지가 다섯 개씩 있다. 뒤로 갈수록 도구가 하나씩 늘어난다.
 * 돈: 내부값 100 = $100K (도로 한 칸).
 *
 * 맵 기호(12×8)  . 빈 터   # 도로   ~ 물   F 밭   M 풍차   H 집   B 큰 건물   P 공원   C 공사 구역
 *                K 컨테이너   T 숲   ^ 바위(지하차도로만 통과)   L 잠긴 도로   X 횡단보도   = 기존 다리   숫자 = 출발·도착지
 * goals  ['arrive'] 모두 도착 · ['time', 초] 평균 이동시간 · ['noacc'] 무사고 · ['cost', 금액] 예산 · ['best', 초, 금액] 보라색 별
 * sol    추천 해법(힌트 버튼이 이 칸들을 표시한다. 검증에도 쓴다) */
(function (root) {
  'use strict';
  const money = c => (c >= 1000 ? '$' + (c / 1000) + 'M' : c ? '$' + c + 'K' : '$0');
  const sec = m => m.perCapita.toFixed(1) + '초';
  const GOAL = {
    arrive: () => ({ text: '길을 이어 모두 도착', ok: m => m.total > 0 && m.arrived >= m.total * 0.95, show: m => m.arrived + '/' + m.total }),
    time: v => ({ text: '평균 이동시간 ' + v + '초 이하', ok: m => m.perCapita <= v, show: sec }),
    noacc: () => ({ text: '사고 없이', ok: m => m.accidents === 0, show: m => m.accidents + '건' }),
    cost: v => ({ text: money(v) + ' 이하로', ok: (m, c) => c <= v, show: (m, c) => money(c) }),
    best: (v, c) => ({ text: v + '초 이하를 ' + money(c) + ' 안에서', purple: true, ok: (m, cc) => m.perCapita <= v && cc <= c, show: (m, cc) => money(cc) })
  };
  const T = (kind, name) => ({ kind, name });
  const R = (...cells) => cells.map(([x, y]) => [x, y, 'road']);
  const flow2 = (a, b) => [{ from: 'S1', to: 'E1', am: a, pm: a * .3 }, { from: 'E1', to: 'S1', am: b * .2, pm: b }];

  const WORLDS = [
    { id: 'rural', name: '시골', theme: 'rural', stages: [
      { id: 'r1', name: '끊어진 시골길', task: '마을과 장터 사이, 끊어진 길을 이어 주세요',
        rows: ['F.FF....M..F', '..FF.H....FF', '.........F..', '1##..FF.....', '.....FF..##3', '.H......F...', '..FF.~~.F.H.', '..FF.~~.....'],
        terms: { 1: T('home', '마을'), 3: T('market', '장터') }, flows: flow2(.26, .22), mix: [['normal', .5], ['tractor', .25], ['moto', .25]],
        budget: 1500, tools: ['road', 'demolish'], goals: [['arrive'], ['time', 22], ['cost', 1000]],
        sol: R([3, 3], [4, 3], [4, 2], [5, 2], [6, 2], [7, 2], [7, 3], [7, 4], [8, 4]) },
      { id: 'r2', name: '개울 건너기', task: '개울 위에는 다리를 놓아야 건널 수 있어요',
        rows: ['..F....~..F.', '.H.....~....', '.......~..H.', '1###...~.##3', '.......~....', '..FF...~....', '..FF...~....', '.......~....'],
        terms: { 1: T('home', '마을'), 3: T('market', '장터') }, flows: flow2(.26, .22), mix: [['normal', .5], ['tractor', .25], ['moto', .25]],
        budget: 1500, tools: ['road', 'bridge', 'demolish'], goals: [['arrive'], ['time', 20], ['cost', 1100]],
        sol: [...R([4, 3], [5, 3], [6, 3], [8, 3]), [7, 3, 'bridge', 'H']] },
      { id: 'r3', name: '두 마을, 한 장터', task: '마을과 농장, 두 곳 모두 장터까지 이어 주세요',
        rows: ['1##.....F...', '...F....F...', '..FF........', '.........##3', '..FF........', '...F....F...', '2##.....F...', '............'],
        terms: { 1: T('home', '마을'), 2: T('farm', '농장'), 3: T('market', '장터') },
        flows: [{ from: 'S1', to: 'E1', am: .2, pm: .06 }, { from: 'S2', to: 'E1', am: .16, pm: .05 }, { from: 'E1', to: 'S1', am: .04, pm: .17 }, { from: 'E1', to: 'S2', am: .03, pm: .13 }],
        mix: [['normal', .45], ['tractor', .3], ['moto', .25]],
        budget: 1800, tools: ['road', 'demolish'], goals: [['arrive'], ['time', 24], ['cost', 1300]],
        sol: R([3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [3, 6], [4, 6], [4, 5], [4, 4], [5, 3], [6, 3], [7, 3], [8, 3]) },
      { id: 'r4', name: '경운기 뒤에서', task: '느린 경운기 뒤로 줄이 늘어섭니다. 길을 넓혀 앞지르게 해 주세요', observe: true,
        rows: ['F..F....F..F', '....H.......', 'F..........F', '1##########3', '....F..F....', '.H........H.', 'F....F.....F', '............'],
        terms: { 1: T('home', '마을'), 3: T('market', '장터') }, flows: flow2(.75, .6), mix: [['normal', .35], ['tractor', .35], ['moto', .3]],
        budget: 3000, tools: ['wide', 'road', 'demolish'], goals: [['time', 17], ['noacc'], ['time', 15.5]],
        sol: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [x, 3, 'wide']) },
      { id: 'r5', name: '먼 길 돌아가기', task: '장터가 코앞인데 길은 멀리 돌아갑니다. 지름길을 내 주세요', observe: true,
        rows: ['1#########..', '.........#..', '..FFF.H..#..', 'F..FF....#..', '......~~.#..', 'H.....~~.#..', '.........#..', '3#########..'],
        terms: { 1: T('home', '마을'), 3: T('market', '장터') }, flows: flow2(.3, .25), mix: [['normal', .5], ['tractor', .25], ['moto', .25]],
        budget: 1200, tools: ['road', 'demolish'], goals: [['time', 16], ['cost', 800], ['cost', 700]],
        sol: R([0, 1], [0, 2], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6]) }
    ] },
    { id: 'harbor', name: '항구', theme: 'harbor', stages: [
      { id: 'h1', name: '부두 가는 길', task: '창고에서 부두까지, 운하를 건너 길을 이어 주세요',
        rows: ['..KK...~...K', '..KK...~....', '.......~.KK.', '1##....~.KK.', '.......~....', '.KK....~..#3', '.KK....~....', '.......~..K.'],
        terms: { 1: T('factory', '창고'), 3: T('port', '부두') }, flows: flow2(.3, .25), mix: [['normal', .8], ['novice', .2]],
        budget: 2000, tools: ['road', 'bridge', 'demolish'], goals: [['arrive'], ['time', 22], ['cost', 1500]],
        sol: [...R([3, 3], [4, 3], [5, 3], [6, 3], [8, 3], [8, 4], [8, 5], [9, 5]), [7, 3, 'bridge', 'H']] },
      { id: 'h2', name: '터미널 앞 횡단보도', task: '횡단보도 앞에서 차들이 줄을 섭니다. 사람은 위로 건너게 해 주세요', observe: true,
        rows: ['..H.....~.K.', '.P......~...', '....H...~..B', '.H......~...', '1#######=X#3', '....P...~...', '..H.....~.K.', '......H.~...'],
        terms: { 1: T('home', '주택가'), 3: T('office', '여객 터미널') }, flows: flow2(.95, .8), mix: [['normal', .85], ['novice', .15]], cw: [12, 8],
        budget: 2000, tools: ['overpass', 'road', 'bridge', 'demolish'], goals: [['time', 20], ['noacc'], ['cost', 500]],
        sol: [[9, 4, 'overpass']] },
      { id: 'h3', name: '다리 하나에 온 항구가', task: '다리가 하나뿐이라 모두가 한곳으로 몰립니다. 다리를 더 놓아 주세요', observe: true,
        rows: ['....K..~....', '1###...~..#3', '...#...~..#.', '...####=###.', '...#...~..#.', '...#...~..#.', '2###...~..#4', '....K..~....'],
        terms: { 1: T('factory', '창고'), 2: T('home', '주택가'), 3: T('port', '화물 부두'), 4: T('market', '어시장') },
        flows: [{ from: 'S1', to: 'E1', am: .4, pm: .12 }, { from: 'S2', to: 'E2', am: .4, pm: .12 }, { from: 'E1', to: 'S1', am: .06, pm: .34 }, { from: 'E2', to: 'S2', am: .06, pm: .34 }, { from: 'S1', to: 'E2', am: .08, pm: .03 }, { from: 'S2', to: 'E1', am: .08, pm: .03 }],
        mix: [['normal', .75], ['novice', .15], ['speeder', .1]],
        budget: 2600, tools: ['bridge', 'road', 'demolish'], goals: [['time', 22], ['time', 16], ['noacc']],
        sol: [...R([4, 1], [5, 1], [6, 1], [8, 1], [9, 1], [4, 6], [5, 6], [6, 6], [8, 6], [9, 6]), [7, 1, 'bridge', 'H'], [7, 6, 'bridge', 'H']] },
      { id: 'h4', name: '컨테이너 미로', task: '컨테이너 사이로 길을 내어 창고와 두 부두를 이어 주세요',
        rows: ['.KK..K...K.3', '.KK..K.K.K.#', '.....K.K...#', '1##....K.KK.', '...KK....KK.', '.K.KK.KK....', '.K....KK.##4', '....K.......'],
        terms: { 1: T('factory', '창고'), 3: T('port', '북 부두'), 4: T('port', '남 부두') },
        flows: [{ from: 'S1', to: 'E1', am: .2, pm: .06 }, { from: 'S1', to: 'E2', am: .2, pm: .06 }, { from: 'E1', to: 'S1', am: .04, pm: .17 }, { from: 'E2', to: 'S1', am: .04, pm: .17 }],
        mix: [['normal', .8], ['novice', .2]],
        budget: 1800, tools: ['road', 'demolish'], goals: [['arrive'], ['time', 24], ['cost', 1300]],
        sol: R([3, 3], [4, 3], [5, 3], [6, 3], [6, 4], [7, 4], [8, 4], [8, 3], [8, 2], [9, 2], [10, 2], [8, 5], [8, 6]) },
      { id: 'h5', name: '어시장 사거리', task: '사거리에서 서로 눈치만 보다 엉킵니다. 차례를 정해 주세요', observe: true,
        rows: ['..K..2..K...', '.....#......', '.K...#...K..', '1#########3.', '.....#......', '..K..#..K...', '.....4......', '............'],
        terms: { 1: T('home', '주택가'), 2: T('factory', '창고'), 3: T('market', '어시장'), 4: T('port', '부두') },
        flows: [{ from: 'S1', to: 'E1', am: .4, pm: .15 }, { from: 'E1', to: 'S1', am: .1, pm: .35 }, { from: 'S2', to: 'E2', am: .35, pm: .12 }, { from: 'E2', to: 'S2', am: .08, pm: .3 }, { from: 'S1', to: 'E2', am: .08, pm: .03 }, { from: 'S2', to: 'E1', am: .08, pm: .03 }],
        mix: [['normal', .6], ['novice', .25], ['speeder', .15]],
        budget: 1000, tools: ['round', 'signal', 'guide', 'demolish'], goals: [['time', 14], ['noacc'], ['cost', 500]],
        sol: [[5, 3, 'round']] }
    ] },
    { id: 'city', name: '도시', theme: 'town', stages: [
      { id: 'c1', name: '등굣길 횡단보도 둘', task: '횡단보도 두 곳에서 연달아 멈춥니다', observe: true,
        rows: ['..H....B..H.', '.P..........', '....H.....H.', '.H..........', '1##X####X##3', '....P.......', '..H.....H...', '......H.....'],
        terms: { 1: T('home', '주택가'), 3: T('office', '학교') }, flows: flow2(.95, .8), mix: [['normal', .85], ['novice', .15]], cw: [12, 7],
        budget: 1000, tools: ['overpass', 'road', 'demolish'], goals: [['time', 30], ['time', 16], ['noacc']],
        sol: [[3, 4, 'overpass'], [8, 4, 'overpass']] },
      { id: 'c2', name: '눈치 싸움 사거리', task: '신호 없는 사거리에서 사고가 납니다', observe: true,
        rows: ['..H..2..B...', '.....#......', '.H...#...H..', '1#########3.', '.....#......', '..P..#..H...', '.....4......', '............'],
        terms: { 1: T('home', '주택가'), 2: T('factory', '공장'), 3: T('office', '회사'), 4: T('market', '시장') },
        flows: [{ from: 'S1', to: 'E1', am: .45, pm: .15 }, { from: 'E1', to: 'S1', am: .1, pm: .4 }, { from: 'S2', to: 'E2', am: .4, pm: .14 }, { from: 'E2', to: 'S2', am: .1, pm: .35 }, { from: 'S1', to: 'E2', am: .1, pm: .04 }, { from: 'S2', to: 'E1', am: .1, pm: .04 }],
        mix: [['normal', .55], ['novice', .2], ['speeder', .25]],
        budget: 1200, tools: ['round', 'signal', 'guide', 'camera', 'bump', 'demolish'], goals: [['time', 16], ['noacc'], ['cost', 500]],
        sol: [[5, 3, 'round']] },
      { id: 'c3', name: '도심 지름길의 역설', task: '다들 가운데 지름길로만 몰립니다. 멀쩡한 길을 막아 보면 어떨까요', observe: true, locks: true,
        rows: null, budget: 1000, tools: ['barricade', 'overpass', 'road', 'demolish'], goals: [['time', 30], ['noacc'], ['cost', 100]],
        sol: [[5, 4, 'barricade']] },
      { id: 'c4', name: '강 건너 출근', task: '두 동네가 다리 하나와 횡단보도 하나에 매달려 있습니다', observe: true,
        rows: ['..H.....~.H.', '1###....~...', '...#.H..~..B', '...#....~...', '...#####=X#3', '...#....~...', '2###..H.~...', '........~...'],
        terms: { 1: T('home', '윗동네'), 2: T('home', '아랫동네'), 3: T('office', '회사') },
        flows: [{ from: 'S1', to: 'E1', am: .45, pm: .14 }, { from: 'S2', to: 'E1', am: .45, pm: .14 }, { from: 'E1', to: 'S1', am: .06, pm: .38 }, { from: 'E1', to: 'S2', am: .06, pm: .38 }],
        mix: [['normal', .7], ['novice', .2], ['speeder', .1]], cw: [12, 8],
        budget: 1500, tools: ['overpass', 'round', 'signal', 'bridge', 'road', 'demolish'], goals: [['time', 30], ['time', 22], ['cost', 900]],
        sol: [[9, 4, 'overpass'], [3, 4, 'round']] },
      { id: 'c5', name: '완벽한 출근길', task: '도구를 전부 드립니다. 이 동네의 아침을 끝까지 다듬어 보세요', observe: true, locks: true,
        rows: null, budget: 3500, tools: ['road', 'wide', 'oneway', 'demolish', 'guide', 'bus', 'rev', 'round', 'signal', 'bridge', 'tunnel', 'overpass', 'camera', 'bump', 'barricade'],
        goals: [['time', 24], ['noacc'], ['time', 20], ['best', 17, 1200]],
        sol: [[5, 4, 'bus'], [6, 4, 'bus'], [2, 4, 'overpass'], [9, 4, 'overpass']] }
    ] },
    { id: 'mountain', name: '산', theme: 'mountain', stages: [
      { id: 'm1', name: '바위를 뚫고', task: '바위는 밀 수 없습니다. 밑으로 지하차도를 뚫어 주세요',
        rows: ['T..T.^^..T..', '.....^^.....', '..T..^^..T..', '1###.^^.###3', '.....^^.....', '.T...^^...T.', '.....^^.....', '..T..^^..T..'],
        terms: { 1: T('home', '산골 마을'), 3: T('market', '읍내') }, flows: flow2(.26, .22), mix: [['normal', .7], ['tractor', .3]],
        budget: 2200, tools: ['road', 'tunnel', 'demolish'], goals: [['arrive'], ['time', 20], ['cost', 1800]],
        sol: [[4, 3, 'road'], [5, 3, 'tunnel', 'H'], [6, 3, 'tunnel', 'H'], [7, 3, 'road']] },
      { id: 'm2', name: '협곡과 바위', task: '바위와 협곡이 가로막고 있습니다. 싸게 돌아갈지, 비싸게 뚫을지 정하세요',
        rows: ['....^.~.....', '....^.~..T..', '.T....~.....', '1##.^.~..##3', '....^.~.T...', '..T.^.~.....', '....^.~.....', '....^.~.....'],
        terms: { 1: T('home', '산골 마을'), 3: T('market', '읍내') }, flows: flow2(.26, .22), mix: [['normal', .7], ['tractor', .3]],
        budget: 2000, tools: ['road', 'bridge', 'tunnel', 'demolish'], goals: [['arrive'], ['time', 22], ['cost', 1400]],
        sol: [...R([3, 3], [3, 2], [4, 2], [5, 2], [7, 2], [8, 2], [8, 3]), [6, 2, 'bridge', 'H']] },
      { id: 'm3', name: '고갯길 스물한 굽이', task: '산을 빙 돌아가는 길뿐입니다. 산 밑으로 곧장 뚫어 주세요', observe: true,
        rows: ['1#######....', '.......#....', '^^^^^^.#....', '^^^^^^.#....', '.......#....', '.......#....', '.......#....', '3#######....'],
        terms: { 1: T('home', '윗마을'), 3: T('home', '아랫마을') }, flows: flow2(.3, .25), mix: [['normal', .7], ['tractor', .3]],
        budget: 2400, tools: ['road', 'tunnel', 'demolish'], goals: [['time', 16], ['noacc'], ['cost', 2000]],
        sol: [[0, 1, 'road'], [0, 2, 'tunnel', 'V'], [0, 3, 'tunnel', 'V'], [0, 4, 'road'], [0, 5, 'road'], [0, 6, 'road']] },
      { id: 'm4', name: '두 산골과 협곡', task: '산골 두 곳을 협곡 건너 읍내와 이어 주세요',
        rows: ['1##...~..T..', '...T..~.....', '..^^..~.....', '......~..##3', '..^^..~.....', '...T..~.....', '2##...~..T..', '......~.....'],
        terms: { 1: T('home', '윗산골'), 2: T('home', '아랫산골'), 3: T('market', '읍내') },
        flows: [{ from: 'S1', to: 'E1', am: .2, pm: .06 }, { from: 'S2', to: 'E1', am: .16, pm: .05 }, { from: 'E1', to: 'S1', am: .04, pm: .17 }, { from: 'E1', to: 'S2', am: .03, pm: .13 }],
        mix: [['normal', .7], ['tractor', .3]],
        budget: 2400, tools: ['road', 'bridge', 'tunnel', 'demolish'], goals: [['arrive'], ['time', 24], ['cost', 1900]],
        sol: [...R([3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [3, 6], [4, 6], [4, 5], [4, 4], [5, 3], [7, 3], [8, 3]), [6, 3, 'bridge', 'H']] },
      { id: 'm5', name: '스키장 가는 주말', task: '주말이면 느린 트럭 뒤로 줄이 늘어서고, 횡단보도에서 한 번 더 멈춥니다', observe: true,
        rows: ['T..T....T..T', '....^.......', 'T..........T', '1####X#####3', '....T..^....', '.T........T.', 'T....T.....T', '............'],
        terms: { 1: T('home', '읍내'), 3: T('office', '스키장') }, flows: flow2(.8, .65), mix: [['normal', .45], ['tractor', .3], ['moto', .25]], cw: [12, 7],
        budget: 3000, tools: ['wide', 'overpass', 'road', 'demolish'], goals: [['time', 26], ['time', 20], ['cost', 2700]],
        sol: [[5, 3, 'overpass'], ...[1, 2, 3, 4, 6, 7, 8, 9, 10].map(x => [x, 3, 'wide'])] }
    ] }
  ];

  // 평평한 목록으로: 지역 순서대로 번호를 매기고, 터미널·목표를 엔진이 쓰는 꼴로 바꾼다
  const TID = { 1: 'S1', 2: 'S2', 3: 'E1', 4: 'E2' };
  const STAGES = [];
  WORLDS.forEach((w, wi) => w.stages.forEach((s, si) => {
    s.world = w; s.wi = wi; s.si = si; s.no = (wi + 1) + '-' + (si + 1); s.theme = w.theme; s.place = w.name;
    s.blurb = s.task; s.caption = s.task; s.observe = !!s.observe; s.locks = !!s.locks; s.buses = s.buses || []; s.scale = s.scale || 1;
    if (s.terms) for (const k in s.terms) s.terms[k].id = TID[k];
    s.target = (s.goals.find(g => g[0] === 'time') || [0, 0])[1];
    s.goals = s.goals.map(g => GOAL[g[0]](g[1], g[2]));
    STAGES.push(s);
  }));

  const api = { WORLDS, STAGES, SOON: [], won: money };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FlowStages = api;
})(typeof window !== 'undefined' ? window : globalThis);
