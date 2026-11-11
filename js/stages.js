/* FLOW LAB — 스테이지 정의
 * 맵(12×8), 출발·도착지, 교통량, 쓸 수 있는 도구, 목표를 스테이지마다 따로 둔다.
 * 뒤로 갈수록 도구와 규칙이 하나씩 늘어난다. 돈: 내부값 100 = $100K (도로 한 칸).
 *
 * 맵 기호  . 빈 터   # 도로   ~ 강·연못   F 밭   M 풍차   H 집   B 큰 건물   P 공원   C 공사 구역
 *          L 잠긴 도로   X 횡단보도   = 기존 다리   숫자 = 출발·도착지 */
(function (root) {
  'use strict';
  const sec = m => m.perCapita.toFixed(1) + '초';
  const won = c => (c >= 1000 ? '$' + (c / 1000) + 'M' : '$' + c + 'K');
  const arrivedAll = m => m.total > 0 && m.arrived >= m.total * 0.95;

  const STAGES = [
    {
      id: 'village', no: 1, name: '끊어진 시골길', place: '시골 마을', theme: 'rural',
      blurb: '마을에서 장터까지 길을 이어 주세요.',
      rows: [
        'F.FF....M..F',
        '..FF.H....FF',
        '.........F..',
        '1##..FF.....',
        '.....FF..##3',
        '.H......F...',
        '..FF.~~.F.H.',
        '..FF.~~.....'
      ],
      terms: { '1': { id: 'S1', kind: 'home', name: '마을' }, '3': { id: 'E1', kind: 'market', name: '장터' } },
      flows: [{ from: 'S1', to: 'E1', am: 0.26, pm: 0.08 }, { from: 'E1', to: 'S1', am: 0.05, pm: 0.22 }],
      buses: [], scale: 1, mix: [['normal', 0.5], ['tractor', 0.25], ['moto', 0.25]],
      budget: 1500, locks: false, observe: false,
      tools: ['road', 'demolish'],
      caption: '마을과 장터 사이, 끊어진 길을 이어 주세요',
      target: 22,
      goals: [
        { text: '길을 이어 모두 장터에 도착', ok: m => arrivedAll(m), show: m => m.arrived + '/' + m.total },
        { text: '평균 이동시간 22초 이하', ok: m => m.perCapita <= 22, show: sec },
        { text: '$1M 이하로 잇기', ok: (m, c) => c <= 1000, show: (m, c) => won(c) }
      ]
    },
    {
      id: 'school', no: 2, name: '등굣길 횡단보도', place: '강변 읍내', theme: 'town',
      blurb: '횡단보도 하나에 온 동네가 줄을 섭니다.',
      rows: [
        '..H.....~.H.',
        '.P......~...',
        '....H...~..B',
        '.H......~...',
        '1#######=X#3',
        '....P...~...',
        '..H.....~.H.',
        '......H.~...'
      ],
      terms: { '1': { id: 'S1', kind: 'home', name: '주택가' }, '3': { id: 'E1', kind: 'office', name: '학교' } },
      flows: [{ from: 'S1', to: 'E1', am: 0.95, pm: 0.28 }, { from: 'E1', to: 'S1', am: 0.12, pm: 0.80 }],
      buses: [], scale: 1, mix: [['normal', 0.85], ['novice', 0.15]], cw: [12, 8],
      budget: 2000, locks: false, observe: true,
      tools: ['road', 'demolish', 'bridge', 'overpass'],
      caption: '횡단보도 앞에서 차들이 줄을 섭니다. 지켜본 뒤 고쳐 보세요.',
      target: 20,
      goals: [
        { text: '평균 이동시간 20초 이하', ok: m => m.perCapita <= 20, show: sec },
        { text: '사고 없이', ok: m => m.accidents === 0, show: m => m.accidents + '건' },
        { text: '$500K 이하로 해결', ok: (m, c) => c <= 500, show: (m, c) => won(c) }
      ]
    },
    {
      id: 'shortcut', no: 3, name: '도심 지름길의 역설', place: '강변 도심', theme: 'town',
      blurb: '다들 가장 짧은 길로 갑니다. 그래서 막힙니다.',
      rows: null,                                   // 엔진의 기본 맵(F.STAGE1)과 교통량을 그대로 쓴다
      budget: 3500, locks: true, observe: true,
      tools: ['road', 'wide', 'oneway', 'demolish', 'guide', 'bus', 'rev', 'round', 'signal', 'bridge', 'tunnel', 'overpass', 'camera', 'bump', 'barricade'],
      caption: '오전 8시. 아무도 움직이지 못합니다. 어디서 엉키는지 지켜보세요.',
      target: 30,
      goals: [
        { text: '평균 이동시간 30초 이하', ok: m => m.perCapita <= 30, show: sec },
        { text: '사고 없이', ok: m => m.accidents === 0, show: m => m.accidents + '건' },
        { text: '평균 이동시간 20초 이하', ok: m => m.perCapita <= 20, show: sec },
        { text: '17초 이하를 $1.2M 안에서', purple: true, ok: (m, c) => m.perCapita <= 17 && c <= 1200, show: (m, c) => won(c) }
      ],
      presets: [
        { name: '지름길 폐쇄', set: [[5, 4, 'barricade']] },
        { name: '버스 전용 지름길 + 육교', set: [[5, 4, 'bus'], [6, 4, 'bus'], [2, 4, 'overpass'], [9, 4, 'overpass']] },
        { name: '회전교차로 + 육교', set: [[4, 4, 'round'], [7, 4, 'round'], [2, 4, 'overpass'], [9, 4, 'overpass']] }
      ]
    }
  ];
  const SOON = [{ no: 4, name: '항구 도시', place: '컨테이너 부두' }, { no: 5, name: '산길', place: '고개 너머 마을' }];

  const api = { STAGES, SOON, won };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FlowStages = api;
})(typeof window !== 'undefined' ? window : globalThis);
