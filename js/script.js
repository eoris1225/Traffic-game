/* FLOW LAB — 핍의 대본
 * 핍이 하는 말은 전부 이 파일에 있습니다. 여기만 고치면 게임에 그대로 반영됩니다.
 *
 * 고칠 때 지켜야 할 것
 *  - 따옴표 '…' 안의 글만 고치세요. 왼쪽의 이름(call1, found, road …)과 쉼표·괄호는 그대로 둡니다.
 *  - 글 안에 작은따옴표를 쓰려면 \' 로 적습니다. 큰따옴표 " 는 그냥 써도 됩니다.
 *  - {…} 는 버튼 그림으로 바뀝니다. 지우거나 옮겨도 되지만 철자는 그대로 두세요.
 *      화면 버튼: {help} ?  {chart} 수치  {rewind} 다시보기  {undo} 되돌리기  {trash} 초기화  {skip} 건너뛰기  {play} 실행  {speed} 배속  {star} 별
 *      도구:      {t:road} {t:wide} {t:oneway} {t:demolish} {t:guide} {t:bus} {t:rev} {t:round} {t:signal} {t:bridge} {t:tunnel} {t:overpass} {t:camera} {t:bump} {t:barricade}
 *      차 위 표시: {q} {bang} {stuck} {cam}
 *  - 설명회(topics)는 한 줄이 그림 한 장입니다. 줄 수를 바꾸면 그림과 어긋나니 줄 수는 유지해 주세요.
 *  - 돈은 달러입니다(도로 한 칸 $100K). 스테이지마다 예산이 다르니 대사에는 구체적인 총액을 적지 않는 편이 안전합니다.
 */
window.PIP_SCRIPT = {
  name: '핍',
  role: '도로과 현장 주임',

  /* ── 시작 화면 ── */
  title: {
    small: '도로과 · 제1구역',
    line1: '매일 아침 8시에 멈춰 서는 동네가 있습니다.',
    line2: '오늘부터 그 도로는 당신 담당입니다.',
    start: '출근하기',                 // 처음 왔을 때
    resume: '이어서 하기',             // 튜토리얼을 끝낸 뒤
    skipTutorial: '튜토리얼 없이 시작',
    replayTutorial: '튜토리얼 다시 보기'
  },

  /* ── 처음 튜토리얼: 1스테이지(시골길 잇기)에서 진행됩니다. 위에서 아래 순서로 나옵니다 ── */
  tutorial: {
    call1: '관리자님!',                                  // 화면 왼쪽에서 고개를 내밀며
    call2: '관리자님—!',                                 // 오른쪽에서
    call3: '관리자니이이임—!!',                          // 가운데서 크게
    found: '아, 여기 계셨군요. 한참 찾았습니다. 이것도 다 업무 시간으로 쳐 주시는 거죠?',
    intro: '도로과 현장 주임 핍입니다. 오늘부터 관리자님의 현장 안내를 맡았습니다.',
    look: '첫 현장은 시골 마을입니다. 보시다시피 마을에서 장터로 가는 길이 중간에 끊겨 있습니다. 솔직히 저걸 도로라고 부르기도 민망하죠.',
    tray: '아래에 있는 게 도구함입니다. 오늘은 두 가지뿐입니다. 길을 놓는 것과 치우는 것. 버튼에 손가락을 올리고 있으면 이름과 가격이 보입니다.',   // 도구함을 강조
    pick: '일단 간단하게 하나만 해 보죠. {t:road} 도로를 골라 주세요.',                                                 // 도로 도구를 강조, 고르면 넘어감
    first: '좋습니다. 이제 노랗게 표시된 칸을 눌러 보세요. 길이 한 칸 놓입니다.',                                       // 첫 칸을 강조, 놓으면 넘어감
    draw: '그렇게 하시면 됩니다. 같은 식으로 표시된 칸을 따라 장터 쪽 길까지 이어 주세요. 끌면 한 번에 그려집니다. 잘못 놓은 칸은 다시 누르면 사라지고요.',   // 남은 칸들을 강조, 이어지면 넘어감
    run: '좋습니다. 이제 {play} 버튼을 눌러 마을 사람들이 정말 장터까지 가는지 돌려 보죠.',                             // 실행 버튼을 강조
    hud: '아래 숫자를 봐 주세요. 가운데가 시민들의 평균 이동시간입니다. 낮을수록 좋습니다. 그 옆은 사고 건수와 도착한 차량 수고요.',   // 상태 띠를 강조
    wait: '시뮬레이션이 끝날 때까지 잠시 지켜보죠. 바로 결과를 보시려면 {skip} 버튼을 누르셔도 됩니다.',                 // 건너뛰기 버튼을 강조
    result: '결과표입니다. 목표를 달성할 때마다 위에서부터 순서대로 별을 받게 됩니다.',                                 // 결과 카드를 강조
    help: '나머지는 직접 부딪혀 보면서 익히시는 게 빠를 겁니다. 막히는 게 생기면 언제든 옆의 {help} 버튼을 눌러 저를 불러 주세요. 도구가 늘면 목록도 늘어납니다.',  // 옆의 ? 버튼을 강조
    bye: '그럼 전 이만 가 보겠습니다. 슬슬 생선 챙겨 먹을 시간이라서요. 행운을 빕니다, 관리자님. 진심입니다. …대체로.'
  },

  /* ── 무스 청년 앵거스: 시골 1-3 에서 처음 나오고, 플레이어 덕에 지역을 넘어갈 때마다 승진합니다.
        스테이지를 설명하지는 않습니다. 안내 카드와 결과 카드에 한마디씩만 합니다 ── */
  moose: {
    name: '앵거스',
    ranks: ['농장 청년', '현장 보조', '현장 기사', '현장 소장'],          // 시골 → 항구 → 도시 → 산
    first: '저, 저기요. 농장에서 온 앵거스라고 합니다. 저희 농장도 장터에 좀 이어 주시면 안 될까요? 감자가 썩어 가서요.',   // 1-3 안내 카드
    hello: [                                                                  // 각 지역 첫 스테이지 안내 카드 (승진 소식)
      '',
      '관리자님 덕에 길이 뚫려서, 저 항구 공사장에 취직했어요! 조끼는 그대로지만 안전모가 생겼습니다.',
      '저 정식 기사가 됐어요. 형광 조끼도 받았습니다. 어머니가 사진을 냉장고에 붙여 두셨대요.',
      '믿기지 않으시겠지만 제가 소장이래요. 흰 안전모입니다. 아직도 가끔 밭 냄새가 그립긴 해요.'
    ],
    cheer: [                                                                  // 별을 받았을 때 (직급별 여러 줄 중 하나)
      ['우와, 진짜 이어졌어요! 감사합니다, 정말로요.', '감자가 제때 장에 가겠어요. 고맙습니다!', '이렇게 금방 되는 거였군요…'],
      ['역시 관리자님이세요. 저도 옆에서 삽은 들었습니다!', '부두 형님들이 박수 쳤어요. 저한테는 아니지만요.', '오늘은 야근 안 해도 되겠어요!'],
      ['깔끔합니다. 제가 다 뿌듯하네요.', '이제 저도 도면이 좀 보여요. 조금요.', '출근길이 조용하니 현장도 조용합니다.'],
      ['완벽합니다. 소장으로서 보증합니다. 농담이에요, 관리자님 덕이죠.', '산 아랫마을에서 감자를 보내왔어요. 나눠 드릴게요.', '여기까지 올 줄은 몰랐어요. 다 관리자님 덕분입니다.']
    ],
    sorry: ['괜찮아요, 저도 처음엔 울타리를 거꾸로 쳤어요.', '한 번만 더 해 봐요. 제가 응원할게요!', '음… 저는 잘 모르지만, 조금만 바꾸면 될 것 같아요.']   // 별을 못 받았을 때
  },

  /* ── 이야기 ──
        줄기: 도로과는 올해 말 "폐지 심사" 대상입니다. 네 구역(시골·항구·도시·산)의 길을 고쳐 놓아야 살아남습니다.
        관리자(플레이어)는 올해 네 번째 관리자. 전임자 K 는 "길은 놓을수록 좋다"고 믿다가 도시 3-3 에서 그만뒀습니다.
        장면(scenes)은 [누가, 표정, 대사] 한 줄씩. 누가: 'pip' 핍 · 'angus' 앵거스 · 'note' 쪽지(표정 자리에 쪽지 제목)
        핍 표정: talk think worry found cheer point · 앵거스 표정: shy cheer ── */
  story: {
    worlds: [                          // 스테이지 선택 화면, 지역 이름 옆 한 줄
      '감자와 경운기의 땅. 길이 군데군데 끊겨 있다',
      '컨테이너는 정시에 도착한다. 트럭이 문제다',
      '이 도시 민원의 9할이 태어나는 곳',
      '바위는 민원을 넣지 않는다. 그 점은 존중할 만하다'
    ],
    scenes: {
      // 1-1 에서 첫 별을 받은 뒤
      prologue: [
        ['pip', 'think', '잘하셨습니다. …그래서 이제야 말씀드리는 건데요.'],
        ['pip', 'worry', '도로과는 올해 말 폐지 심사를 받습니다. 시청 표현으로는 "성과가 불분명한 부서"라더군요.'],
        ['pip', 'talk', '시골, 항구, 도시, 산. 심사 전까지 네 구역의 길을 고쳐 놓으면 살아남습니다. 못 고치면 저는 주차 단속과로 갑니다. 펭귄에게 딱지 끊는 일을 시키겠다는 겁니다.'],
        ['pip', 'think', '참고로 관리자님은 올해 네 번째 관리자십니다. 앞의 세 분에 대해서는… 묻지 않으시는 편이 좋습니다.'],
        ['note', '전임자의 메모', '길은 놓을수록 좋다. 반드시.  — K'],
        ['pip', 'talk', '전임자가 지도마다 메모를 남겨 뒀습니다. 스테이지 안내 카드에 붙여 두겠습니다. 믿을지 말지는 알아서 하시고요.']
      ],
      // 각 지역의 첫 스테이지를 처음 열 때 (world1 = 항구, world2 = 도시, world3 = 산)
      world1: [
        ['pip', 'talk', '항구입니다. 컨테이너는 정시에 도착합니다. 그걸 실은 트럭이 문제죠.'],
        ['pip', 'think', '전임자는 여기에 다리를 하나 놓고 휴가를 갔습니다. 휴가는 길었습니다. 아직 안 끝났으니까요.']
      ],
      world2: [
        ['pip', 'worry', '도시입니다. 민원의 9할이 여기서 나옵니다. 나머지 1할도 여기서 나오는데, 접수가 안 됐을 뿐입니다.'],
        ['pip', 'think', '전임자가 그만둔 곳이 이 구역의 3-3입니다. 길을 열한 개 더 놓고도 더 막히자, 책상에 사직서만 두고 갔죠.'],
        ['angus', 'cheer', '저는 관리자님이 넘으실 거라고 믿어요! 근거는 없지만요!']
      ],
      world3: [
        ['pip', 'talk', '산입니다. 마지막 구역이고, 심사가 코앞입니다. 공기가 좋군요. 좋은 점은 그게 전부입니다.'],
        ['angus', 'shy', '소장으로서 한 말씀 드리자면… 아니에요, 그냥 잘 부탁드립니다!']
      ],
      // 지역의 모든 스테이지에서 별을 받았을 때 (clear0 = 시골 … clear3 = 산)
      clear0: [
        ['angus', 'cheer', '관리자님! 감자가… 감자가 전부 팔렸어요!'],
        ['pip', 'found', '시골 구역, 완료로 보고하겠습니다. 이제 한 구역… 아니, 세 구역 남았군요. 희망을 가질 뻔했습니다.'],
        ['angus', 'shy', '저, 항구 공사장에서 사람을 뽑는대요. 지원해 봐도 될까요?'],
        ['pip', 'talk', '추천서를 써 드리죠. 제 인생 첫 추천서입니다. 마지막일 수도 있고요.']
      ],
      clear1: [
        ['pip', 'found', '항구가 제시간에 움직입니다. 부두 노조에서 감사의 뜻으로 생선을 보내왔습니다.'],
        ['pip', 'think', '이 직장에서 처음 받아 본 성과급입니다. 냉장 보관이 필요하다는 점만 빼면 완벽합니다.'],
        ['angus', 'cheer', '저 기사 시험에 붙었어요! 다음 구역에서 뵙겠습니다!']
      ],
      clear2: [
        ['pip', 'think', '3-3을 넘기셨군요. 전임자가 끝내 못 넘은 곳입니다.'],
        ['pip', 'talk', '길을 막아서 푸는 사람은 처음 봤습니다. 사직서 서랍은 닫아 두겠습니다. 당분간은.'],
        ['note', '엽서 한 장', '소식 들었습니다. 막는 거였군요. 저는 요즘 길이 하나뿐인 바닷가 마을에 삽니다. 막힐 일이 없어 좋습니다.  — K']
      ],
      clear3: [
        ['pip', 'worry', '관리자님. 심사 결과가 나왔습니다.'],
        ['pip', 'think', '……'],
        ['pip', 'cheer', '존속입니다. 예산은 동결이고요. 이 도시에서 그건 대성공이라는 뜻입니다.'],
        ['angus', 'cheer', '해냈어요! 어머니께 전화드려야겠어요! 냉장고에 붙일 게 또 생겼다고요!'],
        ['pip', 'talk', '42분 동안 찾아다닌 보람이 있었습니다. …이 말은 기록에 남기지 말아 주세요.']
      ]
    },
    /* 스테이지 안내 카드에 붙는 쪽지. 3-3 까지는 전임자 K, 그 뒤로는 핍 */
    memoBy: { k: '전임자의 메모', pip: '핍의 쪽지' },
    memo: {
      r1: ['k', '첫 출근. 길이 끊겨 있다. 이으면 되겠지. 쉬운 직장이다.'],
      r2: ['k', '개울에 도로를 놓으려다 장화만 잃었다. 다리라는 도구가 따로 있더라.'],
      r3: ['k', '농장 청년이 감자를 들고 찾아왔다. 길 두 개를 끝까지 따로 놓을 필요는 없을 것 같다.'],
      r4: ['k', '경운기를 앞지르려다 내가 논에 빠졌다. 길이 넓었다면.'],
      r5: ['k', '지도로 보면 장터가 코앞이다. 다들 왜 돌아가는 거지?'],
      r6: ['k', '장날이다. 길은 끊겼고 개울은 불었고 경운기는 느리다. 한꺼번에 오지 말라고 했는데.'],
      h1: ['k', '운하는 개울보다 넓다. 다리 값도 그렇다.'],
      h2: ['k', '횡단보도 앞에서 40분을 기다렸다. 사람이 위로 다니면 안 되나.'],
      h3: ['k', '다리가 하나면 모두가 그 다리에 선다. 당연한 걸 석 달 만에 알았다.'],
      h4: ['k', '컨테이너는 옮길 수 없다고 한다. 물어보기 전에 이미 밀어 봤다.'],
      h5: ['k', '사거리에서 네 대가 서로 양보하다 해가 졌다.'],
      h6: ['k', '사거리, 횡단보도, 닿지 않는 부두. 문제가 셋이면 휴가도 사흘은 써야 한다.'],
      c1: ['k', '횡단보도가 둘이면 기다림도 두 번이다.'],
      c2: ['k', '빨간 차들이 문제다. 아니, 사거리가 문제인가. 둘 다인가.'],
      c3: ['k', '길을 열한 개 더 놓았다. 더 막힌다. 이해할 수 없다. 길은 놓을수록 좋은 것 아니었나.'],
      c4: ['pip', '전임자의 메모는 3-3에서 끊깁니다. 여기부터는 지도에 낙서가 없습니다. 깨끗해서 좋군요.'],
      c6: ['pip', '같은 동네입니다. 이번에는 막지 말고 풀어 보시죠. 전임자는 이쪽도 못 했습니다만.'],
      c5: ['pip', '도구를 전부 드립니다. 시청이 우리를 믿는 건지 포기한 건지는 저도 모릅니다.'],
      m1: ['pip', '바위는 밀 수 없습니다. 대신 민원도 넣지 않습니다. 공정한 거래입니다.'],
      m2: ['pip', '돌아가면 싸고, 뚫으면 빠릅니다. 인생의 대부분이 그렇습니다.'],
      m3: ['pip', '고갯길 이름이 "스물한 굽이"입니다. 직접 세어 본 직원은 멀미로 퇴사했습니다.'],
      m4: ['pip', '산골 두 곳 모두 심사 위원의 고향이라는 소문이 있습니다. 부담 갖지 마세요.'],
      m5: ['pip', '주말마다 이렇습니다. 스키는 내려오는 데 3분, 가는 데 세 시간이죠.'],
      m6: ['pip', '마지막 지도입니다. 끝나면 심사입니다. 긴장하지 마세요. 긴장은 제가 하겠습니다.']
    },
    /* 스테이지에서 첫 별을 받으면 도착하는 주민 편지. 우편함에서 봉투를 누르면 편지지가 나옵니다.
       영어로 먼저 쓰고(en) 한국어로 옮겼습니다(ko). 편지 화면의 EN 버튼으로 원문을 볼 수 있습니다.
       한 줄 = 한 문단. '—' 로 시작하는 줄은 서명입니다.
       hand 글씨: pen 어른 손글씨 · casual 편한 손글씨 · kid 아이 글씨(삐뚤빼뚤, 맞춤법 틀림은 일부러) · type 타자
       paper 편지지: lined 줄 노트 · grid 모눈 · plain 흰 종이 · kraft 누런 종이 · official 공문 · crayon 도화지 · postcard 엽서
       doodle 그림: potato coupon fish coffee heart tickets seal kidBridge kidClass (없으면 '') */
    mailTitle: '우편함',
    mailNew: '편지가 도착했습니다',
    mailOpen: '열어 보기',
    mailLocked: '아직 오지 않은 편지',
    mail: {
      r1: { from: '마을 이장', fromEn: 'The Village Head', hand: 'pen', paper: 'lined', doodle: '',
        en: ['Dear Manager,', 'The road to market used to take twenty minutes. It now takes two.', 'We held a village meeting to decide what to do with the other eighteen. The meeting took forty.', 'Still. Thank you.', '— The Village Head'],
        ko: ['관리자님께.', '장터까지 20분 걸리던 길이 이제 2분입니다.', '남는 18분을 어디에 쓸지 정하려고 마을 회의를 열었습니다. 회의는 40분 걸렸습니다.', '그래도, 고맙습니다.', '— 마을 이장 드림'] },
      r2: { from: '방앗간 할머니', fromEn: 'Gran at the mill', hand: 'pen', paper: 'kraft', doodle: '',
        en: ['To the new road person,', 'The bridge means my rice cakes arrive warm. Forty years I have sent them cold, and nobody dared say a word.', 'I have sent a tray. There is one for the penguin too. Tell him to chew properly.', '— Gran at the mill'],
        ko: ['새로 오신 도로 양반께.', '다리가 생겨서 떡이 따뜻할 때 도착합니다. 사십 년을 식은 떡으로 보냈는데, 아무도 말을 못 했더군요.', '한 판 보냅니다. 펭귄 몫도 넣었으니 꼭꼭 씹어 먹으라고 전해 주세요.', '— 방앗간 할머니'] },
      r3: { from: '앵거스의 어머니', fromEn: 'Angus\'s mother', hand: 'pen', paper: 'lined', doodle: 'potato',
        en: ['Dear Sir or Madam,', 'My boy tells me he walked into your office holding a potato. I am sorry. He means well. He has always meant well, which is most of the trouble.', 'Please accept a sack. They arrived unspoiled, which is your doing.', '— Angus\'s mother', 'P.S. Is he eating?'],
        ko: ['관리자님 귀하.', '우리 애가 감자를 든 채로 사무실에 들어갔다고 들었습니다. 죄송합니다. 나쁜 뜻은 없는 아이입니다. 늘 나쁜 뜻이 없었고, 대체로 그게 문제였지요.', '감자 한 자루 보냅니다. 썩지 않고 도착했으니 다 관리자님 덕입니다.', '— 앵거스 엄마', '추신. 애는 밥은 먹고 다니나요?'] },
      r4: { from: '경운기 운전사', fromEn: 'Tractor, the blue one', hand: 'casual', paper: 'grid', doodle: '',
        en: ['Manager —', 'Nobody honks at me any more.', 'Thirty years on that road, and today I heard the radio for the first time. Turns out I don\'t like the radio. But it\'s having the choice that matters.', '— Tractor, the blue one'],
        ko: ['관리자 양반.', '이제 아무도 나한테 경적을 안 울려요.', '그 길을 삼십 년 다녔는데 오늘 처음으로 라디오 소리를 들었습니다. 들어 보니 라디오는 별로더군요. 그래도 고를 수 있다는 게 중요한 거지요.', '— 파란 경운기 모는 사람'] },
      r5: { from: '장터 국밥집', fromEn: 'The soup shop by the market', hand: 'pen', paper: 'kraft', doodle: 'coupon',
        en: ['To the Roads Department,', 'Lunch trade has doubled since the shortcut.', 'A motion was raised to name it after you. It was defeated, nine to two. I was one of the two. The other was the penguin, who I am told does not live here.', 'Enclosed: one soup, redeemable.', '— The soup shop by the market'],
        ko: ['도로과 앞.', '지름길이 난 뒤로 점심 손님이 두 배가 됐습니다.', '그 길에 관리자님 이름을 붙이자는 안건이 올라왔는데 9대 2로 부결됐습니다. 찬성 둘 중 하나는 저고, 다른 하나는 펭귄인데, 듣자 하니 이 동네 주민이 아니라더군요.', '국밥 한 그릇 쿠폰을 동봉합니다.', '— 장터 옆 국밥집'] },
      r6: { from: '장터 운영위원회', fromEn: 'Market Committee', hand: 'type', paper: 'official', doodle: 'seal',
        en: ['NOTICE', 'Market Day went ahead as planned.', 'Attendance: everyone. Complaints received regarding traffic: none. Complaints regarding the price of onions: several, forwarded elsewhere.', 'The Committee thanks the Roads Department, which it had assumed was closed.', '— Market Committee'],
        ko: ['알림', '장날이 예정대로 열렸습니다.', '참석: 전원. 교통 관련 민원: 없음. 양파 값 관련 민원: 다수(타 부서로 이첩).', '본 위원회는 도로과에 감사를 표합니다. 솔직히 없어진 부서인 줄 알았습니다.', '— 장터 운영위원회'] },
      h1: { from: '창고 관리인', fromEn: 'Warehouse 4', hand: 'pen', paper: 'lined', doodle: '',
        en: ['Manager,', 'The lorries leave on time now. So do I.', 'I have not been home before dark since the winter the canal froze, in my father\'s day. My wife asked who I was. We are getting reacquainted.', '— Warehouse 4'],
        ko: ['관리자님.', '이제 트럭이 제시간에 나갑니다. 저도 그렇습니다.', '해 지기 전에 집에 간 건 아버지 때 운하가 얼었던 겨울 이후 처음입니다. 아내가 누구시냐고 묻더군요. 다시 친해지는 중입니다.', '— 4번 창고 관리인'] },
      h2: { from: '터미널 매표원', fromEn: 'Window 2', hand: 'pen', paper: 'grid', doodle: '',
        en: ['To whom it may concern,', 'Fewer people miss the ferry. The ticket office is very quiet.', 'I used to be shouted at eleven times a day. I counted. Yesterday it was twice, and one of those was a seagull.', 'I am not complaining. I just wanted to tell someone.', '— Window 2'],
        ko: ['담당자께.', '배를 놓치는 손님이 줄었습니다. 매표소가 아주 조용합니다.', '전에는 하루에 열한 번씩 고함을 들었습니다. 세어 봤습니다. 어제는 두 번이었고, 그중 한 번은 갈매기였습니다.', '불만은 아닙니다. 누구한테든 말하고 싶었을 뿐입니다.', '— 2번 창구'] },
      h3: { from: '화물차 기사', fromEn: 'Lorry 17', hand: 'casual', paper: 'plain', doodle: '',
        en: ['Boss,', 'Three bridges. Three!', 'I sat at the junction for a full minute this morning deciding which one to take. Nobody behind me. Nobody honking. Just me and a decision.', 'It\'s a lot. But I\'ll manage.', '— Lorry 17'],
        ko: ['관리자님.', '다리가 세 개입니다. 세 개요!', '오늘 아침엔 어느 다리로 갈지 정하느라 갈림길에 1분을 서 있었습니다. 뒤에 아무도 없었습니다. 경적도 없었고요. 저와 선택뿐이었습니다.', '벅차긴 한데, 해 보겠습니다.', '— 17번 화물차'] },
      h4: { from: '크레인 기사', fromEn: 'Crane 2', hand: 'pen', paper: 'lined', doodle: '',
        en: ['Dear Manager,', 'I work forty metres up. I see everything and nobody asks my opinion.', 'So here it is, unasked: your road through the containers is a tidy bit of work. I look at it every day. Some mornings it\'s better than the sea.', '— Crane 2'],
        ko: ['관리자님께.', '저는 지상 40미터에서 일합니다. 전부 다 보이는데 아무도 제 의견은 묻지 않습니다.', '그래서 묻지도 않은 의견을 드립니다. 컨테이너 사이로 낸 그 길, 솜씨가 깔끔합니다. 매일 내려다봅니다. 어떤 아침엔 바다보다 낫습니다.', '— 2번 크레인'] },
      h5: { from: '어시장 상인회', fromEn: 'Fishmongers\' Association', hand: 'pen', paper: 'kraft', doodle: 'fish',
        en: ['To the Roads Department,', 'The crossroads no longer spoils our fish.', 'We are sending a crate of mackerel. It is addressed to your penguin colleague. We feel he will know what to do with it.', '— Fishmongers\' Association'],
        ko: ['도로과 귀중.', '이제 사거리에서 생선이 상하지 않습니다.', '고등어 한 상자를 보냅니다. 받는 사람은 펭귄 직원분으로 적었습니다. 어떻게 처리할지는 그분이 잘 아실 것 같아서요.', '— 어시장 상인회'] },
      h6: { from: '항만 소장', fromEn: 'Harbour Master', hand: 'type', paper: 'official', doodle: 'seal',
        en: ['HARBOUR OFFICE', 'All sailings departed on time today.', 'This has not happened since records began. Records began in March.', 'Even so.', '— Harbour Master'],
        ko: ['항만 사무소', '금일 전 선박이 정시에 출항하였습니다.', '기록을 시작한 이래 처음 있는 일입니다. 기록은 지난 3월에 시작했습니다.', '그렇더라도.', '— 항만 소장'] },
      c1: { from: '초등학교 3학년 민준', fromEn: 'Minjun, age 9', hand: 'kid', paper: 'crayon', doodle: 'kidBridge',
        en: ['dear rode manager', 'the bridge is very hi. the cars look like toys. i waved and a bus waved back (the driver not the bus)', 'but now if i am late it is MY fault. mum says so. this is not fair', 'from Minjun age 9', 'ps. is the pengwin real'],
        ko: ['도로 관리자님께', '육교는 엄청 높아요. 위에서 보면 차가 장난감 가타요. 손을 흔들었더니 버스가 같이 흔들어 줬어요 (버스 말고 아저씨가요)', '근데 이제 지각하면 제 잘못이래요. 엄마가 그랬어요. 이건 불공평해요', '민준 올림 (9살)', '추신. 펭긴 아저씨는 진짜예요?'] },
      c2: { from: '견인차 기사', fromEn: 'Tow truck, the yellow one', hand: 'casual', paper: 'plain', doodle: '',
        en: ['Manager,', 'Business is down sixty percent since you fixed that crossroads.', 'Congratulations. I mean that. I also don\'t.', '— Tow truck (the yellow one you won\'t be seeing)'],
        ko: ['관리자님.', '그 사거리를 고치신 뒤로 일감이 6할 줄었습니다.', '축하드립니다. 진심입니다. 진심이 아니기도 합니다.', '— 견인차 (이제 못 보실 노란 차)'] },
      c3: { from: '걱정 많은 시민', fromEn: 'A Concerned Citizen', hand: 'type', paper: 'plain', doodle: '',
        en: ['Sir or Madam,', 'You closed a road and traffic improved. I do not believe this. I have a degree.', 'I did arrive at work eight minutes early today. I spent them being suspicious.', '— A Concerned Citizen'],
        ko: ['관계자 귀하.', '길을 막았더니 교통이 나아졌다고요. 저는 믿지 않습니다. 저는 학위가 있는 사람입니다.', '다만 오늘 회사에 8분 일찍 도착하긴 했습니다. 그 8분은 의심하는 데 썼습니다.', '— 걱정 많은 시민'] },
      c4: { from: '6층 창가 자리 회사원', fromEn: 'Floor 6, by the window', hand: 'pen', paper: 'lined', doodle: 'coffee',
        en: ['Dear Manager,', 'I had time for a coffee this morning. Sitting down. In a cup that wasn\'t paper.', 'It would be an exaggeration to say you have changed my life. I would like to exaggerate. You have changed my life.', '— Floor 6, by the window'],
        ko: ['관리자님께.', '오늘 아침엔 커피 마실 시간이 있었습니다. 앉아서요. 종이컵이 아닌 잔으로요.', '인생이 바뀌었다고 하면 과장입니다. 하지만 과장하고 싶습니다. 인생이 바뀌었습니다.', '— 6층 창가 자리'] },
      c6: { from: '호루라기 부는 사람', fromEn: 'The man with the whistle', hand: 'pen', paper: 'lined', doodle: '',
        en: ['Manager,', 'I have directed traffic at that junction with a whistle for eleven years. Nobody has needed me since Tuesday.', 'I still come. I stand by the roundabout and watch it go round. It is very calming. I recommend it.', '— The man with the whistle'],
        ko: ['관리자님.', '저는 그 갈림길에서 호루라기 하나로 11년 동안 교통정리를 했습니다. 화요일부터는 아무도 저를 찾지 않습니다.', '그래도 나갑니다. 회전교차로 옆에 서서 차들이 도는 걸 봅니다. 마음이 아주 편안해집니다. 권해 드립니다.', '— 호루라기 부는 사람'] },
      c5: { from: '시장 비서실', fromEn: 'Office of the Mayor', hand: 'type', paper: 'official', doodle: 'seal',
        en: ['OFFICE OF THE MAYOR', 'The Mayor has been informed of the improvement to the morning commute.', 'The Mayor\'s response was: "We still have a Roads Department?"', 'This is meant warmly.', '— Private Secretary'],
        ko: ['시장 비서실', '시장님께 출근길 개선 건을 보고드렸습니다.', '시장님께서는 "도로과가 아직 있었나?"라고 하셨습니다.', '좋은 뜻으로 하신 말씀입니다.', '— 비서실장'] },
      m1: { from: '언덕 위 약국', fromEn: 'The pharmacy, top of the hill', hand: 'pen', paper: 'plain', doodle: '',
        en: ['Dear Manager,', 'The hospital in town is forty minutes closer than it was.', 'I have nothing clever to add to that. Thank you.', '— The pharmacy, top of the hill'],
        ko: ['관리자님께.', '읍내 병원이 전보다 40분 가까워졌습니다.', '여기에 재치 있는 말을 보탤 생각은 없습니다. 고맙습니다.', '— 언덕 위 약국'] },
      m2: { from: '4번 버스 기사', fromEn: 'Route 4', hand: 'casual', paper: 'grid', doodle: '',
        en: ['Manager,', 'Passengers keep asking me to stop on the gorge bridge for photographs. This is against the timetable.', 'I stop anyway. It\'s a good bridge.', '— Route 4'],
        ko: ['관리자님.', '승객들이 협곡 다리 위에서 사진 찍게 세워 달라고 합니다. 운행 시간표에 어긋나는 일입니다.', '그래도 세웁니다. 좋은 다리니까요.', '— 4번 버스'] },
      m3: { from: '윗마을 셋째 집', fromEn: 'Upper village, third house', hand: 'pen', paper: 'lined', doodle: 'heart',
        en: ['Dear Manager,', 'The lower village is now fifteen minutes away. It used to be an hour and a quarter, and a person can talk themselves out of a great deal in an hour and a quarter.', 'We are getting married next month. I can\'t prove the tunnel did it.', 'You\'re invited.', '— Upper village, third house'],
        ko: ['관리자님께.', '이제 아랫마을이 15분 거리입니다. 전에는 한 시간 십오 분이 걸렸는데, 사람은 한 시간 십오 분이면 웬만한 마음은 접게 됩니다.', '저희 다음 달에 결혼합니다. 터널 덕분인지는 증명할 수 없습니다.', '꼭 와 주세요.', '— 윗마을 셋째 집'] },
      m4: { from: '산골 분교 1학년', fromEn: 'Class 1 (all 7 of us)', hand: 'kid', paper: 'crayon', doodle: 'kidClass',
        en: ['DEAR ROAD PEPLE', 'the liberry van comes in 2 days now!! befor it was 2 weeks', 'teacher says we have to give the books BACK. nobody told us that part', 'we drew you. the tall one is the moos', 'from Class 1 (all 7 of us)'],
        ko: ['도로과 아저씨 아줌마께', '이제 도서관 차가 이틀 만에 와요!! 전에는 2주 걸렸어요', '근데 선생님이 책을 다시 돌려조야 한대요. 그 얘기는 아무도 안 해 줬어요', '그림 그렸어요. 키 큰 게 무스 아저씨예요', '1학년 전부 (7명) 올림'] },
      m5: { from: '스키장 지배인', fromEn: 'Resort Manager', hand: 'pen', paper: 'plain', doodle: 'tickets',
        en: ['Dear Manager,', 'The queue for the lift is now longer than the queue for the road. From where I sit this is excellent news.', 'Two lift passes enclosed. I understand one of you is a penguin and may not need the lift going down.', '— Resort Manager'],
        ko: ['관리자님께.', '이제 리프트 줄이 도로 줄보다 깁니다. 제 입장에서는 더없이 좋은 소식입니다.', '리프트권 두 장을 동봉합니다. 한 분은 펭귄이시라 내려올 때는 리프트가 필요 없으실 것 같습니다만.', '— 스키장 지배인'] },
      m6: { from: 'K', fromEn: 'K', hand: 'pen', paper: 'postcard', doodle: '',
        en: ['Manager —', 'I heard they kept the department.', 'I put eleven roads into that city and it only got worse. You took one away. I have thought about that most days since, on a beach, where there is one road and it goes to the shop.', 'I was wrong about roads. I may have been right about beaches.', '— K'],
        ko: ['관리자님께.', '도로과가 살아남았다고 들었습니다.', '저는 그 도시에 길을 열한 개 놓았고 상황은 나빠지기만 했습니다. 당신은 하나를 뺐지요. 그 뒤로 거의 매일 그 생각을 합니다. 바닷가에서요. 여기는 길이 하나뿐이고, 그 길은 가게로 갑니다.', '길에 대해서는 제가 틀렸습니다. 바닷가에 대해서는 맞았던 것 같습니다.', '— K'] }
    },
    /* 모든 구역을 끝냈을 때 */
    ending: {
      form: '시청 감사실 · 부서 존폐 심사 결과 통지서',
      title: '판정: 존속',
      body: '도로과는 계속 존재함. 예산은 동결함.<br>관리자는 유임함. 현장 주임은 주차 단속과로 가지 않음.',
      rows: ['받은 별', '도착한 편지', '줄인 평균 이동시간 (전 구역 합계)'],
      perfect: '별을 전부 받으셨습니다. 감사실에서 재검토를 요청했습니다. 믿기지 않는다고요.',
      more: '아직 받지 않은 별이 남아 있습니다. 심사는 내년에도 있습니다.',
      stamp1: '존속',
      stamp2: '',
      thanks: '끝까지 해 주셔서 고맙습니다.',
      button: '계속 일하기',
      skip: '건너뛰기',
      share: '결과 공유',
      shared: '복사했습니다. 붙여 넣어 자랑하세요'
    }
  },

  /* ── 튜토리얼 마지막에 뜨는 인수인계서 ── */
  end: {
    form: '도로과 서식 제7호 · 업무 인수인계서',
    title: '인수인계 완료',
    body1: '위 사람을 <b>제1구역 도로 관리자</b>로 임명함.',
    body2: '금일부로 이 구역에서 발생하는 <b class="all">모든 민원</b>은 위 관리자가 전담함.',
    list: [
      '{rewind} 먼저 지켜본다. 막히는 데는 다 이유가 있다',
      '{t:road} 원인을 고친다. 길을 더 까는 것만이 답은 아니다',
      '{play} 다시 돌려 본다. 숫자가 줄어들면 성공이다'
    ],
    stamp1: '인계',
    stamp2: '완료',
    button: '업무 시작'
  },

  /* ── 설명회 화면의 글자 ── */
  ask: {
    button: '이건 어디다 쓰죠?',
    buttonSub: '핍에게 물어보기',
    heading: '설명회',
    close: '그만 듣기',
    skip: '건너뛰기'
  },

  /* ── 설명회 대사: 한 줄 = 그림 한 장 ── */
  topics: {
    // 도로
    road: [
      '가장 기본적인 일반 도로입니다. 굳이 설명이 필요할까 싶지만, 매뉴얼에 항목이 있더군요.',
      '빈 땅에 깔면 길이 이어집니다. 풀밭이나 텃밭, 주차장에는 놓을 수 있지만 집과 건물은 밀어낼 수 없습니다.',
      '다만 새 길을 뚫으면 그만큼 차들이 새로 몰려듭니다. 꼭 필요한 곳인지 한 번 더 생각해 보고 깔아 주세요.'
    ],
    // 차선 확장
    wide: [
      '1차로 도로에서는 맨 앞 차의 속도가 곧 전체의 속도입니다. 느긋한 초보 운전자 한 명이 뒤차 수십 대를 거느리고 다니죠.',
      '{t:wide}을 2칸 이상 이어서 깔면 2차로로 넓어집니다. 빠른 차는 앞지르고, 느린 차는 마음의 평화를 얻습니다.'
    ],
    // 일방통행
    oneway: [
      '차들이 한쪽 방향으로만 달리게 만듭니다. 대신 2차로처럼 두 줄로 넉넉하게 빠지죠. 누를 때마다 방향이 바뀝니다.',
      '반대편에서 오던 차들은 다른 우회로를 찾아야 합니다. 덕분에 생기는 항의 민원은… 제가 알아서 처리하겠습니다.'
    ],
    // 철거
    demolish: [
      '직접 설치한 시설은 같은 도구로 다시 누르면 전액 환불됩니다. 하지만 원래 있던 도로를 부술 땐 철거비 $50K가 듭니다.',
      '참고로 빨간 테두리가 쳐진 보호 도로는 철거할 수 없습니다. 시에서 지정한 구간이라 저도 손 못 대거든요.'
    ],
    // 유도선
    guide: [
      '초보 운전자는 갈림길 앞에서 생각에 잠깁니다. 긴 생각입니다. 뒤차들도 함께 잠기죠.',
      '{t:guide}을 깔면 바닥에 분홍색 좌회전 선과 초록색 우회전 선이 그려집니다. 초보들도 색깔만 보고 멈칫하지 않고 지나갈 수 있어요.'
    ],
    // 버스 전용
    bus: [
      '버스 한 대에는 승객 20명이 타고 있습니다. 평균 이동시간은 사람 수 기준이라, 버스 한 대가 막히면 승용차 스무 대가 막힌 셈이 됩니다.',
      '1차로 도로에 {t:bus}을 이어 칠하면 버스만 다닐 수 있는 전용차로가 됩니다. 일반 승용차는 다른 길로 돌아가게 되죠.'
    ],
    // 가변 차선
    rev: [
      '혼잡한 방향에 맞춰 가운데 차로의 방향이 알아서 바뀝니다. 아침엔 출근길 쪽으로, 저녁엔 퇴근길 쪽으로 열리죠.',
      '2칸 이상 이어서 깔아야 작동하고, 일방통행이나 차선 확장과는 겹쳐서 쓸 수 없습니다.'
    ],
    // 회전교차로
    round: [
      '신호 없는 사거리에선 차들이 서로 눈치만 보다 엉키기 십상입니다. 양보하려다 멈추고, 먼저 가려다 부딪히거든요.',
      '{t:round}를 두면 한 방향으로 천천히 돌면서 빠져나가 사고 위험이 크게 줄어듭니다. 영국에서 유독 사랑받는 데는 다 이유가 있죠.'
    ],
    // 신호등
    signal: [
      '신호등은 차례를 정해 줍니다. 눈치 싸움도, 머뭇거림도 없습니다. 기다림만 있죠. 공평한 기다림.',
      '대신 한쪽이 달리는 동안 다른 쪽은 무조건 서야 합니다. 길이 세 갈래 이상 만나는 교차로에만 설치할 수 있습니다.'
    ],
    // 다리
    bridge: [
      '강 위에는 일반 도로를 놓을 수 없습니다. 당연한 말 같지만, 예전에 그냥 밀어붙여 본 전임자가 있어서 말씀드립니다.',
      '강 위에는 {t:bridge}를 놓아 주세요. 한 번 더 누르면 방향이 바뀌고, 세 번째 누르면 전액 환불되며 회수됩니다.',
      '기존 도로 위에 놓으면 고가도로가 됩니다. 두 길이 서로 부딪히지 않고 위아래로 교차하니 정체와 사고를 한 번에 잡을 수 있죠.'
    ],
    // 지하차도
    tunnel: [
      '공원입니다. 밀어 버릴 수 없습니다. 시민들이 사랑하거든요. 저도 점심을 거기서 먹습니다. 혼자서요.',
      '{t:tunnel}를 쓰면 공원이나 바위, 다른 도로 밑을 통과해 길을 낼 수 있습니다. 비용은 꽤 들지만 지상 풍경은 그대로 지켜 주죠.'
    ],
    // 육교
    overpass: [
      '횡단보도에서는 보행자가 건너는 동안 차들이 꼼짝없이 서 있어야 합니다. 이 동네 정체의 상당수가 여기서 시작되죠.',
      '{t:overpass}를 놓으면 보행자는 위로 건너고 차는 멈추지 않고 달립니다. 계단이 좀 높긴 합니다. 저처럼 다리가 짧은 입장에선 특히요.'
    ],
    // 단속 카메라
    camera: [
      '빨간 차는 과속 운전자입니다. 앞차와의 거리를 "의견"이라고 생각하는 분들이죠. 사고의 대부분이 이분들입니다.',
      '{t:camera}를 설치하면 주변의 과속 차량만 콕 집어 속도를 줄이게 만듭니다. 일반 차량의 흐름은 방해하지 않으니 꽤 합리적이죠.'
    ],
    // 방지턱
    bump: [
      '$100K로 설치할 수 있는 저렴한 감속 시설입니다. 다만 과속 차량뿐 아니라 지나가는 모든 차가 다 같이 느려진다는 단점이 있죠.',
      '아무 데나 깔면 오히려 정체만 심해집니다. 사고가 잦은 교차로 직전처럼 꼭 속도를 줄여야 하는 곳에만 써 주세요.'
    ],
    // 통행 차단
    barricade: [
      '지름길이 있으면 모든 운전자가 그쪽으로만 몰립니다. 결국 지름길이 제일 막히는 길이 되어 버리죠.',
      '{t:barricade}은 도로를 부수지 않고 통행만 막아 교통량을 분산시킵니다. 철거가 불가능한 잠긴 도로에도 쓸 수 있는 유용한 도구예요.'
    ],
    // 차 위의 표시
    marks: [
      '차 위에 뜨는 {q}는 초보 운전자의 머뭇거림, {bang}는 급정거, {stuck}는 병목에 갇혔다는 표시입니다. 도로 색이 붉을수록 정체가 심한 구간이고요.',
      '차량 색깔로도 성향을 알 수 있습니다. 파랑은 일반, 빨강은 과속, 노랑은 초보, 초록은 버스입니다. 주행 중에 차를 누르면 이동 경로도 보여요.'
    ],
    // 별과 목표
    stars: [
      '별은 첫 번째 목표부터 순서대로 달성해야 받을 수 있습니다. 앞 단계 조건을 놓치면 다음 조건을 채워도 인정되지 않으니 주의하세요.',
      '배정된 예산은 수백만 달러입니다. 제 월급도 이만큼이면 좋을 텐데요. 참고로 설치한 도구는 다시 누르면 전액 환불됩니다.'
    ]
  }
};
