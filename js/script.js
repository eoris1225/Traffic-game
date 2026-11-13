/* FLOW LAB — 대본
 * 게임 안의 말은 전부 이 파일에 있습니다. 여기만 고치면 게임에 그대로 반영됩니다.
 * 자리마다 맥락·발화자·분량은 docs/script-brief.md 에 있습니다.
 *
 * 고칠 때 지켜야 할 것
 *  - 따옴표 '…' 안의 글만 고치세요. 왼쪽의 이름(call1, found, road …)과 쉼표·괄호는 그대로 둡니다.
 *  - 글 안에 작은따옴표를 쓰려면 \' 로 적습니다. 큰따옴표 " 는 그냥 써도 됩니다.
 *  - {…} 는 버튼 그림으로 바뀝니다. 지우거나 옮겨도 되지만 철자는 그대로 두세요.
 *      화면 버튼: {help} ?  {chart} 수치  {rewind} 다시보기  {undo} 되돌리기  {trash} 초기화  {skip} 건너뛰기  {play} 실행  {speed} 배속  {star} 별
 *      도구:      {t:road} {t:wide} {t:oneway} {t:demolish} {t:guide} {t:bus} {t:rev} {t:round} {t:signal} {t:bridge} {t:tunnel} {t:overpass} {t:camera} {t:bump} {t:barricade}
 *      차 위 표시: {q} {bang} {stuck} {cam}
 *  - 설명회(topics)는 한 줄이 그림 한 장입니다. 줄 수를 바꾸면 그림과 어긋나니 줄 수는 유지해 주세요.
 *  - 쪽지(memo)와 편지(mail)는 스테이지 번호('1-1' … '4-6')로 찾습니다.
 *  - 편지의 보낸 사람은 '—' 로 시작하는 서명 줄에서 가져옵니다. 서명 끝의 '(그림: …)' 은 그림 설명이라 화면에는 나오지 않습니다.
 *  - 호칭: 플레이어는 '소장님', 핍은 '핍 주임', 앵거스는 직급이 올라도 '소장'이 되지 않습니다(플레이어와 겹쳐서 '현장 감독').
 */
window.PIP_SCRIPT = {
  // 3-1. 이름표·시작 화면
  name: '핍',
  role: '도로과 현장주임',

  title: {
    small: '군청 도로과 · 인사 발령',
    line1: '매일 아침, 이 마을의 도로는 멈춰 섭니다.',
    line2: '그리고 오늘부터, 그 도로는 당신 담당입니다.',
    start: '출근하기',
    resume: '업무 계속',
    skipTutorial: '인수인계 건너뛰기',
    replayTutorial: '인수인계 다시 보기'
  },

  // 3-2. 처음 튜토리얼 — 1-1 시골
  tutorial: {
    call1: '소장님?',
    call2: '신임 소장님?',
    call3: '소—장—니—임!',
    found: '여기 계셨군요. 찾는 데 정확히 42분 걸렸습니다. 근무일지에는 현장 답사로 적어 두겠습니다.',
    intro: '도로과 현장주임 핍입니다. 오늘부터 소장님의 현장 안내를 맡았습니다.',
    look: '첫 현장입니다. 마을과 시장을 잇는 도로가 중간에 끊겨 있죠. 덕분에 아무도 시장에 가지 못하고 있습니다.',
    tray: '아래는 도구함입니다. 오늘은 도로와 철거뿐이군요. 쓰임새가 막막할 땐 오른쪽의 {help} 버튼으로 저를 부르십시오.',
    pick: '우선 도구함에서 {t:road} 도구를 골라 보시죠.',
    first: '이제 바닥에 표시된 칸을 눌러 도로를 놓아 보십시오.',
    draw: '표시를 따라 시장까지 이어 주십시오. 끌면 여러 칸이 한 번에 깔리고, 잘못 놓은 칸은 다시 누르면 지워집니다.',
    run: '나쁘지 않군요. {play} 버튼을 눌러 주민들이 정말 시장에 닿는지 보죠.',
    hud: '아래쪽 상태 띠를 보십시오. 큰 숫자가 평균 통행 시간이고, 낮을수록 좋습니다. 옆에는 사고와 도착 수가 찍히죠.',
    wait: '끝까지 지켜보셔도 좋고, 바쁘시다면 {speed} 버튼이나 {skip} 버튼으로 넘기셔도 됩니다.',
    result: '결과표입니다. 목표는 위에서부터 순서대로 달성되고, 그때마다 별이 붙습니다. 첫날부터 통과라니 별일이군요.',
    help: '나머지는 현장에서 부딪히며 익히시게 될 겁니다. 도구가 낯설 땐 {help} 버튼을 누르십시오. 도구가 늘면 목록도 늘어납니다.',
    bye: '그럼 저는 구내식당 고등어가 식기 전에 가 보겠습니다. 행운을 빕니다, 소장님. 이번 주만은 버텨 주십시오.'
  },

  // 3-3. 인수인계서
  end: {
    form: '양식 제RD-04호 · 업무 인수인계서',
    title: '인수인계 완료',
    body1: '귀하를 본 관할구 <b>도로과 소장</b>으로 임명함.',
    body2: '금일부로 관내의 <b class="all">모든 교통 민원</b>은 귀하의 책상으로 접수됨. 건투를 빔.',
    list: [
      '{rewind} 정체를 살필 것. 막히는 데는 다 이유가 있음.',
      '{t:road} 길을 손볼 것. 도로가 많다고 능사는 아님.',
      '{play} 소통을 확인할 것. 숫자가 줄었다면 정답임.'
    ],
    stamp1: '인수',
    stamp2: '완료',
    button: '업무 개시'
  },

  // 3-4. 「핍에게 묻기」 글자
  ask: {
    button: '이건 어디에 쓰나요?',
    buttonSub: '핍 주임에게 묻기',
    heading: '현장 강의',
    close: '숙지 완료',
    skip: '건너뛰기'
  },

  // 3-5. 앵거스
  moose: {
    name: '앵거스',
    ranks: ['농장 청년', '현장 인부', '현장 기사', '현장 감독'],
    first: '저, 실— 실례합니다! 저희 농장 길도 시장에 이어 주실 수 있을까요? 감자에서 싹이 나려고 해서요!',
    hello: {
      1: '소장님! 놓아 주신 길 덕분에 항구 현장에 취직했어요! 보세요, 노란 안전모도 받았어요!',
      2: '저 이제 정식 현장 기사예요! 어머니가 제 사진을 냉장고 한가운데에 붙여 놓으셨어요!',
      3: '제가 현장 감독이 됐지 뭐예요! 저도 안 믿겨요! 그래도 가끔은 밭 냄새가 그리워요.'
    },
    cheer: [
      // 0. 농장 청년
      [
        '정말 고맙습니다! 감자를 한 알도 안 남기고 다 팔았어요!',
        '오늘 아침엔 제가 직접 수레에 짐을 실었어요! 하나도 안 굴러떨어졌어요!',
        '어머니가 소장님은 찐 감자랑 으깬 감자 중에 뭘 좋아하시는지 여쭤보래요!'
      ],
      // 1. 현장 인부
      [
        '굉장해요, 소장님! 부두 형님들이 다 같이 만세를 불렀어요!',
        '오전 내내 신호봉을 들고 서 있었어요! 제 인생 최고의 날이에요!',
        '바닷바람이 그렇게 불었는데 안전모가 한 번도 안 벗겨졌어요!'
      ],
      // 2. 현장 기사
      [
        '깔끔한 흐름이네요, 소장님! 저도 서류판에 열심히 적어 뒀어요!',
        '오늘은 도면을 거꾸로 안 보고 제대로 읽었어요! 어, 대체로는요!',
        '시험 붙었다고 식당 아주머니가 소시지를 하나 더 주셨어요!'
      ],
      // 3. 현장 감독
      [
        '훌륭한 설계입니다, 소장님. 월간 보고서에 바로 올리겠습니다!',
        '작업반이 도면대로 정확히 시공했습니다! 차 한 잔 마시고 나서요!',
        '아까 근엄한 감독 목소리를 내 봤는데 산양이 비웃고 갔어요.'
      ]
    ],
    sorry: [
      '괜찮아요! 전 제 삽 위에 아스팔트를 부은 적도 있는걸요!',
      '아깝네요! 원래 다음 판이 제일 운이 좋은 법이에요!',
      '그럴 수도 있죠! 전 화요일 내내 지도를 거꾸로 들고 다녔어요!'
    ]
  },

  // 3-6. 이야기
  story: {
    worlds: [
      '끊어진 시골길과 전혀 서두르지 않는 트랙터들.',
      '배는 정시에 오는데 트럭만 늦는 외다리 항구.',
      '교차로와 지름길, 아침 식사 전 민원 아홉 건.',
      '깎아지른 바위와 깊은 협곡, 우회로조차 없는 산길.'
    ],

    scenes: {
      prologue: [
        ['pip', 'found', '첫 시도에 별을 따내셨군요. 머그잔을 꺼내시기 전에 말씀드릴 것이 있습니다.'],
        ['pip', 'worry', '연말에 군청에서 부서 폐지 심사를 엽니다. 공식 사유는 “업무 실효성 의심 및 기능 중복”이죠.'],
        ['pip', 'think', '그전까지 네 관할구의 아침 출근길을 고치지 못하면 도로과는 폐지됩니다. 그리고 저는 주차단속과로 갑니다.'],
        ['pip', 'talk', '소장님은 올해 네 번째 소장님이십니다. 앞의 두 분은 언급하지 않겠습니다. 세 번째 분은 K라고 불렸죠.'],
        ['note', 'K의 수첩에서', '교통은 단순한 산수다. 차가 밀리는 곳에는 길을 하나 더 깔면 된다. 아스팔트가 충분하면 모든 게 해결된다.'],
        ['pip', 'point', 'K가 남긴 메모가 한 무더기입니다. 앞으로 현장 카드마다 하나씩 붙여 두겠습니다. 이상입니다.']
      ],
      world1: [
        ['pip', 'talk', '항구 관할구입니다. 컨테이너선은 분 단위로 정확히 들어오지만, 그 짐을 실어 나르는 트럭들은 그렇지 못하죠.'],
        ['pip', 'think', 'K는 지난봄 여기에 다리를 딱 하나 놓고는, 항구 문제가 해결됐다며 아주 긴 휴가를 떠났습니다.']
      ],
      world2: [
        ['pip', 'worry', '시내 관할구입니다. 민원의 열에 아홉이 여기서 나오죠. 이곳 운전자들은 전부 자기만 출근하는 줄 압니다.'],
        ['pip', 'think', 'K가 사표를 낸 곳도 바로 이곳 3-3 현장이었습니다. 길을 더 깔았더니 정체가 두 배가 되자, 그냥 나가 버렸죠.'],
        ['angus', 'cheer', '소장님은 거뜬하실 거예요! 감자 수레랑 생선 트럭도 길들이셨는데 시내쯤이야 아무것도 아니죠!']
      ],
      world3: [
        ['pip', 'talk', '마지막 관할구, 산악 지대입니다. 폐지 심사도 며칠 남지 않았군요. 협곡 아래는 가급적 보지 마십시오.'],
        ['angus', 'cheer', '자, 산악 도로의 핵심 역량을 도출합시다! …죄송해요, 아까 쓰레기통에서 경영학 소책자를 주워서요.']
      ],
      clear0: [
        ['angus', 'cheer', '소장님! 마을 감자가 정오도 되기 전에 시장에서 전부 팔렸어요! 싹 난 게 하나도 없대요!'],
        ['pip', 'found', '시골 통행 시간이 38퍼센트 줄었습니다. 보고서를 스테이플러로 찍다가 하마터면 희망을 품을 뻔했군요.'],
        ['angus', 'shy', '저, 핍 주임님? 항구 현장에서 인부를 뽑는다는데, 저도 지원해 봐도 될까요?'],
        ['pip', 'talk', '지원서는 내 책상에 두고 가게. 11년 근무하면서 추천서를 써 보는 건 처음이군.']
      ],
      clear1: [
        ['pip', 'found', '부두부터 정문까지 정시에 움직입니다. 세관 직원들도 이제 전화기 너머로 한숨을 쉬지 않는군요.'],
        ['pip', 'cheer', '무엇보다 부두 노동자들이 답례로 싱싱한 청어 한 상자를 보내왔습니다. 11년 만의 첫 성과급입니다.'],
        ['angus', 'cheer', '그리고 저 어젯밤에 본 현장 기사 시험에 2점 차로 붙었어요! 이제 시내로 가요, 소장님!']
      ],
      clear2: [
        ['pip', 'found', '3-3을 넘어 시내 전체를 정리하셨군요. K는 끝내 저 교차로를 넘지 못했습니다.'],
        ['pip', 'think', '5월부터 맨 아래 서랍에 날짜를 비워 둔 사직서를 넣어 두었습니다만, 방금 그 서랍을 닫았습니다.'],
        ['note', 'K가 보낸 엽서', '누군가 3-3을 풀었다더군요. 길을 더 깔 게 아니라 하나를 막는 거였다니, 참 오래도 걸렸습니다. 저는 지금 교차로 없는 바닷가 외길에 삽니다.']
      ],
      clear3: [
        ['pip', 'worry', '소장님. 심사 결과가 나왔습니다.'],
        ['pip', 'think', '……'],
        ['pip', 'found', '폐지 기각, 예산 동결. 이 군청에서는 대승리에 해당합니다.'],
        ['angus', 'cheer', '살아남았어요! 어머니께 전화해야지—기사 붙이시려면 더 큰 냉장고가 필요하겠어요!'],
        ['pip', 'cheer', '첫날 아침 소장님을 찾느라 쓴 42분은, 올해 제 근무일지에서 가장 보람찬 42분이었습니다.'],
        ['pip', 'talk', '방금 한 말은 공식 회의록에서 빼 주십시오. 이상입니다.']
      ]
    },

    memo: {
      '1-1': ['k', '부임 첫날이다. 길이 반쯤 끊겨 있을 뿐이다. 나라도 틀릴 리가 없다.'],
      '1-2': ['k', '개울이 길을 두 동강 냈다. 아스팔트는 물에 가라앉는 모양이다. 다리를 놓자.'],
      '1-3': ['k', '마을은 둘이고 시장은 하나다. 양쪽 길을 가운데로 잇기만 하면 된다. 단순한 산수다.'],
      '1-4': ['k', '느림보 트랙터 한 대가 온 마을을 막고 있다. 차선을 넓혀서 뒤차들을 보내자.'],
      '1-5': ['k', '시장이 바로 옆인데 옛길이 밭 세 개를 돌아간다. 가로질러 곧장 잇자.'],
      '1-6': ['k', '끊긴 길, 개울, 트랙터가 한꺼번에 나왔다. 예산만 넉넉하면 못 덮을 게 없다.'],
      '2-1': ['k', '운하 이쪽은 창고, 저쪽은 부두다. 다리 하나만 걸치면 끝날 일이다.'],
      '2-2': ['k', '10초마다 건너는 보행자 때문에 트럭이 줄을 선다. 사람을 위로 보내자.'],
      '2-3': ['k', '온 항구 차들이 다리 하나로 몰린다. 옆에 하나 더 놓자. 둘이면 두 배로 빠르다.'],
      '2-4': ['k', '항만청에서 컨테이너는 절대 못 치운단다. 그 사이로 길을 실처럼 꿰어 보자.'],
      '2-5': ['k', '네 갈래 길에서 서로 먼저 가라고 양보하다 아무도 못 간다. 규칙을 주든가, 돌리자.'],
      '2-6': ['k', '횡단보도, 막힌 교차로, 동떨어진 부두까지 총출동이다. 다리와 신호등을 쏟아붓자.'],
      '3-1': ['k', '학교 앞 횡단보도가 둘이라 차도 두 번 멈춘다. 보행자들을 길 위로 올려 보내자.'],
      '3-2': ['k', '아홉 시도 안 돼서 사고가 세 건이다. 과속차를 잡든가 교차로를 뜯어고치자.'],
      '3-3': ['k', '모두가 가운데 지름길로만 몰린다. 차선을 늘렸더니 더 막힌다. 도무지 모르겠다. 그만둔다.'],
      '3-4': ['pip', 'K의 메모는 여기까지입니다. 두 동네가 다리 하나에 매달려 있으니 정리가 필요하겠군요.'],
      '3-5': ['pip', '아까와 같은 동네지만, 이번엔 군청에서 통행 차단을 못 쓰게 했습니다. 다른 숙제죠.'],
      '3-6': ['pip', '창고의 도구가 전부 나왔고 보라색 별도 걸려 있습니다. 서두르지 마십시오.'],
      '4-1': ['pip', '산악 화강암은 군청 공문으로도 못 치웁니다. 위로 못 가면 아래로 뚫으십시오.'],
      '4-2': ['pip', '협곡을 넘는 싸고 긴 길이냐, 바위를 뚫는 비싸고 짧은 길이냐. 예산과 타협하십시오.'],
      '4-3': ['pip', '굽이 스물한 개를 돌아갈지, 산 밑으로 곧장 뚫을지 고르십시오. 운전자들이 어지럽답니다.'],
      '4-4': ['pip', '협곡 너머 두 산골 마을을 눈이 내리기 전에 읍내와 이어 주셔야 합니다.'],
      '4-5': ['pip', '스키장 가는 길에 목재 트럭과 횡단보도가 겹쳤습니다. 주말 운전자들에게 추월할 숨통을 틔워 주시죠.'],
      '4-6': ['pip', '스키장 개장일이자 폐지 심사 전 마지막 현장입니다. 모든 문제가 한자리에 모였군요.']
    },

    /* 편지: 영어 원문(en)과 번역(ko). 한 칸 = 한 문단. 첫 칸은 인사, '—' 로 시작하는 칸은 서명.
       hand 글씨: pen 어른 손글씨 · casual 편한 손글씨 · kid 아이 글씨 · type 타자
       paper: lined 줄 노트 · grid 모눈 · plain 흰 종이 · kraft 누런 종이 · official 공문 · crayon 도화지 · postcard 엽서
       doodle: potato coupon fish coffee heart tickets seal kidBridge kidClass none */
    mail: {
      '1-1': {
        hand: 'pen', paper: 'lined', doodle: 'none',
        en: [
          'Dear Roads Manager,',
          'Since the lane was joined up, our morning drive to market takes twelve minutes less.',
          'The Village Committee has voted to spend those twelve minutes holding a daily meeting on how best to use the twelve minutes saved.',
          '— H. Clegg, Chair of the Parish Meeting Committee'
        ],
        ko: [
          '도로과 소장님께,',
          '끊어진 마을 길을 이어 주신 덕분에 아침 장 보러 가는 길이 정확히 12분 줄었습니다.',
          '이에 마을 위원회는 매일 아침 그 12분 동안, 절약된 12분을 어떻게 쓸지 논의하는 회의를 열기로 가결했습니다.',
          '— 마을 회의 위원회 위원장 H. 클레그 드림'
        ]
      },
      '1-2': {
        hand: 'pen', paper: 'kraft', doodle: 'none',
        en: [
          'To the Roads Office,',
          'For forty years my rice cakes went cold waiting by that stream. Today they reached the stalls still warm, and customers thought I had changed the recipe.',
          'I left a tin by your door. The sweet ones are for you. The salted ones wrapped in kelp are for the penguin.',
          '— Mrs Potts, The Old Mill'
        ],
        ko: [
          '도로과 사무실 앞,',
          '사십 년 동안 개울가에서 기다리느라 내 떡이 다 식어 빠졌었지. 오늘은 김이 모락모락 나는 채로 장에 닿아서, 손님들이 비법을 바꿨냐고 묻더군.',
          '문 앞에 찬합 하나 두고 왔네. 단것은 소장 양반 먹고, 다시마로 싼 짭짤한 건 그 펭귄 주임 주게나.',
          '— 옛 방앗간 포츠 할멈'
        ]
      },
      '1-3': {
        hand: 'pen', paper: 'lined', doodle: 'potato',
        en: [
          'Dear Manager,',
          'Thank you kindly for bringing the road out to our farm gate. Our Angus sold the whole barrow of earlies before ten and came home grinning from antler to antler.',
          'I have sent a sack of Maris Pipers round to the depot.',
          '— Martha MacMoose',
          'P.S. If you see Angus on site, please make sure he eats a proper lunch.'
        ],
        ko: [
          '소장님께,',
          '저희 농장 대문 앞까지 길을 내어 주셔서 정말 고맙습니다. 우리 앵거스가 열 시도 되기 전에 햇감자 한 수레를 다 팔고, 뿔 끝까지 웃으며 돌아왔답니다.',
          '사무실로 감자 한 포대 보냈습니다.',
          '— 마사 맥무스 올림',
          '추신. 현장에서 앵거스를 보시거든 점심은 꼭 챙겨 먹으라고 일러 주세요.'
        ]
      },
      '1-4': {
        hand: 'casual', paper: 'grid', doodle: 'none',
        en: [
          'Morning,',
          'Thirty years I have driven that road at eleven miles an hour with twenty cars leaning on their horns behind my trailer.',
          'Since you widened the stretch, they all slip past without a sound. Heard a skylark over the engine today. Strange, that.',
          '— Ted (Red Tractor)'
        ],
        ko: [
          '수고하십니다.',
          '삼십 년 동안 그 길을 시속 18킬로미터로 다녔습니다. 늘 제 트레일러 뒤에서 차 스무 대가 경적을 눌러 댔지요.',
          '길을 넓혀 주신 뒤로는 다들 소리 없이 스쳐 지나갑니다. 오늘은 엔진 소리 너머로 종달새 소리를 들었습니다. 묘하더군요.',
          '— 테드 (빨간 트랙터)'
        ]
      },
      '1-5': {
        hand: 'pen', paper: 'kraft', doodle: 'coupon',
        en: [
          'Dear Manager,',
          'Before your shortcut opened, the morning crowd arrived too late for hot broth. Today we scraped the bottom of the cauldron by half past nine.',
          'The regulars voted to name the lane after you, though nobody knew your surname, so the sign says "The Manager\'s Cut". One soup voucher enclosed.',
          '— Turnip & Kettle Soup Stall'
        ],
        ko: [
          '소장님께,',
          '지름길이 뚫리기 전엔 손님들이 늘 국물이 식은 뒤에야 도착했지요. 오늘은 아홉 시 반에 벌써 가마솥 바닥을 긁었답니다.',
          '단골들이 그 길에 소장님 이름을 붙이자고 투표를 했는데, 아무도 성함을 몰라서 “소장님 지름길”이라고 써 붙였습니다. 국밥 쿠폰 한 장 동봉합니다.',
          '— 순무와 가마솥 국밥집'
        ]
      },
      '1-6': {
        hand: 'type', paper: 'official', doodle: 'seal',
        en: [
          'MEMORANDUM: RURAL MARKET COMMITTEE',
          'We write to record that Annual Market Day concluded with zero tractor collisions and every stall open by eight.',
          'In full candour, the Committee had assumed the Roads Department was abolished in 2019. Please accept our apologies and a jar of pickled onions.',
          '— Office of the Clerk of the Market'
        ],
        ko: [
          '공문: 향촌 정기시장 위원회',
          '금년도 정기 장날이 트랙터 접촉 사고 0건, 전 점포 08시 정각 개장으로 무사히 종료되었음을 기록으로 남깁니다.',
          '솔직히 말씀드리면 본 위원회는 도로과가 2019년에 이미 폐지된 줄로 알고 있었습니다. 사과의 뜻으로 양파절임 한 병을 보냅니다.',
          '— 시장 서기국'
        ]
      },
      '2-1': {
        hand: 'pen', paper: 'lined', doodle: 'none',
        en: [
          'Dear Roads Department,',
          'Now the lorries cross straight from the warehouse to the quay, we locked the shed before dark for the first time in four years.',
          'I got home before supper and was introduced to our family dog. Apparently we have had him since Easter.',
          '— A. Finch, Chief Warehouseman'
        ],
        ko: [
          '도로과 귀중.',
          '트럭들이 창고에서 부두로 곧장 건너가게 된 덕분에, 4년 만에 처음으로 해가 지기 전에 창고 문을 잠갔습니다.',
          '저녁 식사 전에 집에 들어가서 우리 집 개와 정식으로 인사를 나눴습니다. 알고 보니 부활절부터 키우고 있었다더군요.',
          '— 수석 창고지기 A. 핀치'
        ]
      },
      '2-2': {
        hand: 'pen', paper: 'grid', doodle: 'none',
        en: [
          'To Whom It May Concern,',
          'Since the footbridge went up outside the ferry terminal, angry shouting at Ticket Window 2 has dropped from thirty-four incidents a morning to two.',
          'One was a man on the wrong pier. The other had his pasty stolen on the footbridge stairs by the large gull with the bent toe.',
          '— Beryl, Ticket Window 2'
        ],
        ko: [
          '담당자분께,',
          '여객 터미널 앞에 육교가 생긴 뒤로, 2번 매표소에서 아침마다 고성이 오가는 횟수가 서른네 건에서 두 건으로 줄었습니다.',
          '한 명은 부두를 잘못 찾은 손님이었고, 다른 한 명은 육교 계단에서 발가락 휜 큰 갈매기한테 고기파이를 뺏긴 분이었습니다.',
          '— 2번 매표소 베릴'
        ]
      },
      '2-3': {
        hand: 'casual', paper: 'plain', doodle: 'none',
        en: [
          'Alright Manager,',
          'Used to be I sat on the only bridge in port for half an hour staring at the rust. Now there is a second bridge and I roll straight over.',
          'Only problem is I lose three minutes every morning trying to decide which bridge has the better view of the tugs. Spoilt for choice.',
          '— Big Kev, Haulage Unit 9'
        ],
        ko: [
          '반갑소, 소장 양반.',
          '예전엔 항구에 하나뿐인 다리 위에서 삼십 분씩 서서 녹슨 난간만 구경했었지. 다리가 하나 더 생기니 그냥 쌩하고 건너간다오.',
          '흠이라면 매일 아침 어느 다리가 예인선 구경하기에 경치가 더 좋은지 고르느라 3분을 까먹는다는 거지. 행복한 고민이구먼.',
          '— 수송 9반 덩치 케브'
        ]
      },
      '2-4': {
        hand: 'pen', paper: 'lined', doodle: 'none',
        en: [
          'Hello down there,',
          'From forty metres up in Crane Cab 3, your new lane between the container stacks looks like a grey shoelace threaded through Lego.',
          'Nobody down on the tarmac ever asks the crane driver for his opinion, so I am writing to say the corners are very tidy.',
          '— Terry, Gantry Crane No. 3'
        ],
        ko: [
          '아래쪽 분들, 안녕하신가.',
          '40미터 위 3호 크레인 조종석에서 내려다보니, 컨테이너 더미 사이로 새로 낸 길이 꼭 레고 사이로 꿴 회색 운동화 끈 같더군.',
          '땅바닥 사람들은 아무도 크레인 기사한테 의견을 안 물어보길래 편지로 적네만, 모퉁이 마감이 아주 깔끔하더구먼.',
          '— 3호 갠트리 크레인 테리'
        ]
      },
      '2-5': {
        hand: 'pen', paper: 'kraft', doodle: 'fish',
        en: [
          'Dear Roads Office,',
          'Until today our vans sat at the fish market crossroads politely waving each other on while the haddock warmed up in the back.',
          'This morning every box reached the cold store still glistening. We have left a crate of fresh mackerel by the yard gate, addressed to the penguin.',
          '— Harbour Fishmongers\' Association'
        ],
        ko: [
          '도로과 앞.',
          '어제까지만 해도 어시장 사거리에서 서로 먼저 가라고 손짓하며 양보하는 사이에, 짐칸의 대구들이 미지근하게 데워지곤 했습니다.',
          '오늘 아침엔 생선 상자마다 윤기가 좌르르한 채로 냉동 창고에 들어갔습니다. 정문 옆에 펭귄 주임님 앞으로 싱싱한 고등어 한 상자 두고 갑니다.',
          '— 항구 어물전 상인회'
        ]
      },
      '2-6': {
        hand: 'type', paper: 'official', doodle: 'seal',
        en: [
          'FROM THE DESK OF THE HARBOUR MASTER',
          'For the first morning in port records, all six cargo sailings departed on the tide with not a single container left on the cobbles.',
          'Footnote for accuracy: port records only go back to Tuesday week, when the old ledger fell in the basin. It remains impressive.',
          '— Capt. R. Dunnett, Harbour Master'
        ],
        ko: [
          '항만청장 서한',
          '항구 기록 사상 처음으로, 오전 화물선 여섯 척이 컨테이너를 단 하나도 부두에 남기지 않고 물때에 맞춰 출항했습니다.',
          '정확성을 위한 각주: 이전 장부가 지지난주 화요일 바다에 빠지는 바람에 기록이 그때부터만 남아 있습니다. 그렇더라도 훌륭한 성과입니다.',
          '— 항만청장 R. 더넷 선장'
        ]
      },
      '3-1': {
        hand: 'kid', paper: 'crayon', doodle: 'kidBridge',
        en: [
          'Dear Rode Bilder,',
          'I went over the big high fotbridge today and I saw the top of the skool bus. It is very dusty up there.',
          'Now I cant say the cars made me late for sums and Miss says being late is my own falt now. That is not fair.',
          '— Toby age 7 (drawing: me on the footbridge, and the bus)',
          'PS is the pengwin reel'
        ],
        ko: [
          '도로 아저씨깨',
          '오늘 놉고 큰 육교로 건너가다가 학꾜 버쓰 지붕을 봐써요. 위에는 먼지가 엄청 만아써요.',
          '이제 차 때문에 산수 시가네 지각햇다고 핑게 못 대요. 선생님이 이제 지각하면 다 내 타시래요. 불공평해요.',
          '— 7살 토비 (그림: 육교 위에 서 있는 나와 버스)',
          '추신. 팽귄 진짜 이써요?'
        ]
      },
      '3-2': {
        hand: 'casual', paper: 'plain', doodle: 'none',
        en: [
          'Dear Manager,',
          'Before you sorted out that crossroads, I towed three dented hatchbacks out of the postbox every week before ten o\'clock.',
          'Since Monday my winch has not turned once and I have been forced to tidy my spanners. Brilliant roadwork. I am very annoyed with you.',
          '— Stan\'s Recovery & Tow'
        ],
        ko: [
          '소장 양반께.',
          '그 사거리를 손보시기 전엔 매주 열 시도 되기 전에 우체통에 박힌 소형차를 세 대씩은 끌어냈었소.',
          '월요일부턴 견인줄을 한 번도 못 감아 봐서 할 일 없이 스패너만 닦고 있소. 기가 막힌 공사로구먼. 아주 심통이 나오.',
          '— 스탠 견인 공업사'
        ]
      },
      '3-3': {
        hand: 'type', paper: 'plain', doodle: 'none',
        en: [
          'SIR OR MADAM,',
          'I write to protest the closure of the central shortcut. Blocking a perfectly serviceable street to speed up traffic is an insult to common sense.',
          'The fact that I reached my desk eleven minutes early today is an unrelated coincidence which I refuse to acknowledge.',
          '— G. Pargeter (Ratepayer)'
        ],
        ko: [
          '귀 부서에 고함.',
          '중앙 지름길 폐쇄 조치에 강력히 항의합니다. 멀쩡한 도로를 막아서 교통을 빠르게 한다는 발상은 상식에 대한 모독입니다.',
          '오늘 아침 본인이 평소보다 11분 일찍 책상에 도착한 것은 이와 전혀 무관한 우연의 일치이며, 본인은 이를 인정하지 않겠습니다.',
          '— 납세자 G. 파제터'
        ]
      },
      '3-4': {
        hand: 'pen', paper: 'lined', doodle: 'coffee',
        en: [
          'Dear Roads Department,',
          'For three winters I have drunk my morning coffee through a plastic lid while sitting in second gear on the river bridge.',
          'Today I arrived early enough to drink it from an actual cup while sitting on a chair. I am trying not to exaggerate how much this has changed my life.',
          '— Clare, Accounts (3rd Floor)'
        ],
        ko: [
          '도로과 분들께,',
          '지난 세 번의 겨울 동안 저는 늘 강변 다리 위에서 2단 기어를 넣은 채, 플라스틱 뚜껑 구멍으로 아침 커피를 마셨습니다.',
          '오늘은 일찍 도착해서 의자에 앉아 진짜 머그잔으로 커피를 마셨어요. 이 일이 제 삶을 얼마나 바꿨는지 과장하지 않으려 애쓰는 중입니다.',
          '— 3층 경리과 클레어'
        ]
      },
      '3-5': {
        hand: 'pen', paper: 'lined', doodle: 'none',
        en: [
          'Dear Manager,',
          'For nine years I stood at that junction in my yellow waistcoat blowing a pea whistle whenever the buses locked mirrors.',
          'Your new layout runs itself without a single peep from me. I still bring a folding stool down on Wednesdays, just to watch the roundabout work.',
          '— Arthur (Former Volunteer Traffic Warden)'
        ],
        ko: [
          '소장님께,',
          '구 년 동안 노란 조끼를 입고 그 사거리에 서서, 버스들이 백미러를 부딪칠 때마다 호루라기를 불었습니다.',
          '새로 고쳐 놓으신 길은 제가 호루라기를 한 번도 안 불어도 알아서 돌아가더군요. 그래도 수요일마다 접이식 의자를 들고 나가 회전교차로가 도는 걸 구경합니다.',
          '— 아서 (전직 교통정리 자원봉사자)'
        ]
      },
      '3-6': {
        hand: 'type', paper: 'official', doodle: 'seal',
        en: [
          'OFFICE OF THE MAYOR · TOWN HALL',
          'His Worship the Mayor arrived at Chambers fourteen minutes early this morning and inquired who had fixed the avenue.',
          'Upon being told the Roads Department still existed, he expressed warm astonishment and authorised one custard cream each from the civic tin.',
          '— Private Secretary to the Mayor'
        ],
        ko: [
          '읍장 비서실 · 읍사무소',
          '오늘 아침 읍장님께서 집무실에 14분 일찍 도착하시어, 누가 대로를 고쳤는지 물으셨습니다.',
          '도로과가 아직 존재한다는 보고를 받으신 읍장님께서는 따뜻한 놀라움을 표하시며, 읍사무소 다과함에서 커스터드 크림 비스킷을 한 사람당 하나씩 지급하라고 지시하셨습니다.',
          '— 읍장 수행비서관'
        ]
      },
      '4-1': {
        hand: 'pen', paper: 'plain', doodle: 'none',
        en: [
          'Dear Manager,',
          'Before the tunnel went under the ridge, the dispensary van from the valley hospital had to crawl over the rock pass in first gear.',
          'This evening the insulin and the winter inhalers arrived with forty minutes to spare. From everyone in the hilltop houses, thank you.',
          '— E. Vance, Hilltop Pharmacy'
        ],
        ko: [
          '소장님께,',
          '능선 아래로 터널이 뚫리기 전에는, 계곡 병원에서 오는 약품 차량이 1단 기어로 바위 고개를 기어 올라와야 했습니다.',
          '오늘 저녁에는 인슐린과 겨울철 흡입기가 40분이나 일찍 도착했습니다. 산꼭대기 집 주민들을 대표해 진심으로 감사드립니다.',
          '— 산마루 약국 E. 밴스'
        ]
      },
      '4-2': {
        hand: 'casual', paper: 'grid', doodle: 'none',
        en: [
          'Afternoon Manager,',
          'Your new crossing over the gorge has shaved twelve minutes off the Number 42 mountain bus, putting me dreadfully ahead of the timetable.',
          'So now I stop in the middle of the bridge for two minutes and let the passengers take photos of the drop. Keep that from the inspector.',
          '— Ravi, Bus 42'
        ],
        ko: [
          '안녕하십니까, 소장님.',
          '협곡 위로 새 다리를 놓아 주신 덕에 42번 산악버스 운행 시간이 12분이나 줄어서, 시간표보다 한참 일찍 도착해 버립니다.',
          '그래서 요즘은 다리 한가운데에 2분간 차를 세우고 승객들이 절벽 사진을 찍게 해 드립니다. 감독관 양반한테는 비밀로 해 주십시오.',
          '— 42번 버스 기사 라비'
        ]
      },
      '4-3': {
        hand: 'pen', paper: 'lined', doodle: 'heart',
        en: [
          'Dear Roads Manager,',
          'When it took twenty-one hairpin bends in the mist to get from Upper Crag to Lower Crag, we only saw each other at the autumn sheep fair.',
          'Now the tunnel goes straight through, it takes four minutes in a small car. We are getting married in May and have saved two slices of cake for you and Mr Pip.',
          '— Nora & Callum'
        ],
        ko: [
          '도로과 소장님께,',
          '윗바위 마을에서 아랫바위 마을까지 안개 속 굽이 스물한 개를 돌아가야 했을 땐, 저희 둘은 가을 양 시장이 열릴 때만 만날 수 있었습니다.',
          '터널이 곧장 뚫린 지금은 작은 차로 4분이면 갑니다. 저희 오는 5월에 결혼합니다. 소장님과 핍 주임님 몫으로 케이크 두 조각을 남겨 두겠습니다.',
          '— 노라 & 칼럼 드림'
        ]
      },
      '4-4': {
        hand: 'kid', paper: 'crayon', doodle: 'kidClass',
        en: [
          'Dear Road Manajer,',
          'There are 7 of us in Class 1 and the libary van came across the big gorj before dinnertime today!',
          'I got a book about Wales but Mr Evans says we have to give the books BACK next Friday becos the van comes every week now. That is unfare.',
          '— Class 1, Mountain School (drawing: penguin, moose, book van)'
        ],
        ko: [
          '도로 소장님깨',
          '우리 산골학교 1반은 전부 7명인데 오늘 점심시간도 되기 저네 큰 협곡을 건너서 도서간 트럭이 와써요!',
          '나는 고래 책을 빌렷는데 에반스 선생님이 이제 트럭이 매주 오니까 다음 주 금요일에 책을 돌려조야 한대요. 너무 치사해요!!',
          '— 산골학교 1반 일동 (그림: 펭귄과 무스와 책 트럭)'
        ]
      },
      '4-5': {
        hand: 'pen', paper: 'plain', doodle: 'tickets',
        en: [
          'Dear Roads Department,',
          'For the first weekend since the ski lodge opened, the queue for the chairlift was longer than the queue behind the timber lorries on the hill.',
          'We enclose two complimentary day passes. Our instructor notes that your foreman may not require the chairlift on the way down.',
          '— Pine Peak Ski Resort'
        ],
        ko: [
          '도로과 앞.',
          '스키장이 문을 연 이래 처음으로, 주말 리프트 대기 줄이 언덕길 목재 트럭 뒤의 정체 줄보다 길어졌습니다.',
          '감사의 뜻으로 주간 리프트권 두 장을 동봉합니다. 저희 강사 말로는, 현장주임님께서는 내려오실 때 굳이 리프트가 필요 없으실 거라더군요.',
          '— 솔봉우리 스키 리조트'
        ]
      },
      '4-6': {
        hand: 'pen', paper: 'postcard', doodle: 'none',
        en: [
          'Hello Four,',
          'Pip sent me the cuttings from the mountain opening. When I had your desk, I laid eleven extra roads and brought the town to a standstill. You fixed it by taking one away.',
          'I live by the sea now, at the end of a lane with only one destination. Leave a mackerel on Pip\'s desk for me.',
          '— K'
        ],
        ko: [
          '네 번째 소장님께,',
          '핍이 산악 도로 개통 기사를 오려 보내 주더군요. 내가 그 책상에 앉았을 땐 길을 열한 개나 더 깔아서 온 마을을 멈춰 세웠는데, 당신은 길을 하나 없애서 고쳐 냈군요.',
          '나는 지금 바닷가에 삽니다. 목적지가 단 하나뿐인 외길 끝이지요. 내 대신 핍의 책상에 고등어 한 마리 올려 두어 주십시오.',
          '— K'
        ]
      }
    },

    ending: {
      form: '군청 감사실 문서 제AR-99호 · 심사 의결서',
      title: '폐지안 기각',
      body: '도로과의 존속을 의결함.<br>연간 예산은 현행 수준으로 동결함.<br>현 소장은 유임하고, 핍 주임의 주차단속과 전출은 면제함.',
      rows: [
        '획득한 별',
        '받은 편지',
        '줄인 통행 시간 합계'
      ],
      perfect: '모든 별이 기록되었습니다. 감사실에서 오타를 의심해 손으로 다시 세는 중입니다.',
      more: '아직 받지 못한 별이 남아 있습니다. 다음 폐지 심사는 12개월 뒤입니다.',
      thanks: '끝까지 함께해 주셔서 고맙습니다.',
      stamp1: '존속',
      stamp2: '가결',
      button: '업무 복귀',
      skip: '건너뛰기',
      share: '기록 공유',
      shared: '복사했습니다. 겸손하게 자랑하십시오.'
    },

    mailTitle: '우편함',
    mailNew: '편지가 왔습니다',
    mailOpen: '편지 읽기',
    mailLocked: '아직 오지 않은 편지',
    memoBy: {
      k: 'K의 메모',
      pip: '핍의 메모'
    }
  },

  // 3-7. 핍의 현장 강의 (topics) — 한 줄 = 그림 한 장
  topics: {
    road: [
      '{t:road} 도구입니다. 길이 들판 한가운데서 끊기면 차들도 거기서 멈추죠. 이런 걸 소리 내어 설명하자니 조금 민망하군요.',
      '빈 땅에 아스팔트를 깔아 두 지점을 잇습니다. 예전에 군청 측량사가 우겼던 것과 달리, 집이나 건물 위로는 깔 수 없습니다.',
      '한 가지 경고를 드리죠. 새 도로는 새 교통량을 부릅니다. 모든 곳을 다 이어 놓으면 온 마을 차들이 한가운데서 만날 겁니다.'
    ],
    wide: [
      '1차로에서는 맨 앞차가 모두의 속도를 정합니다. 조심성 많은 초보 운전자가 앞장서면, 뒤따르는 스무 명은 도로 위에서 늙어 가죠.',
      '{t:wide} 도구를 두 칸 이상 이어 깔면 2차로가 됩니다. 빠른 차는 앞지르고 느린 차는 제 속도로 가니, 양쪽 다 평화를 찾죠.'
    ],
    oneway: [
      '{t:oneway} 도구는 도로를 한 방향으로만 달리는 2차로로 바꿉니다. 칸을 다시 누르면 화살표가 돌아가죠.',
      '반대편에서 오던 차들은 어쩔 수 없이 먼 길을 돌아가야 합니다. 그 운전자들의 항의 편지는 제 책상으로 오게 되겠죠.'
    ],
    demolish: [
      '{t:demolish} 도구로 도로를 걷어 냅니다. 소장님이 직접 놓은 시설은 전액 환불되지만, 원래 있던 군청 도로를 파내는 데는 예산이 듭니다.',
      '빨간 테두리 도로는 보호 구간이라 철거할 수 없습니다. 사유는 군청 문서고에 적혀 있다는데, 그 문서를 본 사람은 아무도 없죠.'
    ],
    guide: [
      '노란 초보 운전 차량은 갈림길 앞에서 한참 망설입니다. 어느 쪽인지 떠올리는 동안 뒤차들도 전부 멈춰 서죠.',
      '바닥에 {t:guide} 유도선을 칠해 주십시오. 분홍색은 왼쪽, 초록색은 오른쪽입니다. 아무리 당황한 초보라도 바닥 색깔은 읽습니다.'
    ],
    bus: [
      '버스 한 대에는 승객 스무 명이 타고 있습니다. 평균 통행 시간은 차가 아니라 사람 수로 세기 때문에, 버스가 늦으면 아침 전체가 무너지죠.',
      '1차로 도로를 따라 {t:bus} 차로를 칠하면 버스만 다닐 수 있습니다. 승용차들은 돌아가야 하지만, 원래 그러라고 만든 겁니다.'
    ],
    rev: [
      '{t:rev} 도구를 쓰면 가운데 차로가 붐비는 쪽으로 알아서 방향을 바꿉니다. 아침엔 출근길로, 저녁엔 퇴근길로 열리는 식이죠.',
      '두 칸 이상 이어서 깔아야 하고, 일방통행이나 차선 확장과는 한 길에 같이 쓸 수 없습니다. 아스팔트에도 나름의 규칙이 있으니까요.'
    ],
    round: [
      '신호 없는 사거리에서는 네 방향 차들이 예의 바르게 눈치싸움을 벌입니다. 그러다 꼭 두 대가 동시에 인내심을 잃고 부딪히죠.',
      '가운데에 {t:round} 회전교차로를 놓으면 아무도 멈추지 않고 빙글 돌아 빠져나갑니다. 영국인들이 제대로 만든 몇 안 되는 발명품이죠.'
    ],
    signal: [
      '세 갈래 이상의 길이 만나는 곳에 {t:signal} 신호등을 세우면 순서가 엄격히 정해집니다. 눈치싸움도 망설임도 없죠. 공정한 군청식 기다림만 있을 뿐입니다.',
      '다만 한쪽이 달리는 동안 다른 쪽은 반드시 멈춰 서야 한다는 점은 기억하십시오. 질서에는 늘 대가가 따릅니다, 소장님.'
    ],
    bridge: [
      '자동차는 헤엄을 못 치고, 아스팔트는 물에 가라앉습니다. 도로가 물을 만나면 아침 출근길도 거기서 끝나죠.',
      '물 위 칸에 {t:bridge} 다리를 놓아 건너십시오. 누를 때마다 방향이 바뀌고, 세 번째로 누르면 전액 환불되며 철거됩니다.',
      '다른 도로 위에 다리를 놓으면 고가도로가 됩니다. 두 길이 만나지 않고 엇갈려 지나가니, 교차로 자체가 사라지는 셈이죠.'
    ],
    tunnel: [
      '공원과 산악 바위는 밀어 버릴 수 없습니다. 절반은 법 때문이고, 나머지 절반은 저 공원 벤치가 제가 혼자 점심을 먹는 자리이기 때문이죠.',
      '{t:tunnel} 도구를 쓰면 땅 밑으로 곧장 지나갑니다. 비용은 만만치 않지만 위쪽 풍경은 그대로 남습니다.'
    ],
    overpass: [
      '횡단보도에서는 12초 중 8초가 보행자 몫입니다. 나머지 시간만 차가 다니니 정체가 시작될 수밖에요.',
      '횡단보도에 {t:overpass} 육교를 세우면 사람은 위로 걷고 차는 아래로 멈추지 않고 달립니다. 다리가 짧은 펭귄에겐 계단이 좀 가혹합니다만.'
    ],
    camera: [
      '빨간 차는 과속 운전자입니다. 앞차와의 안전거리를 가벼운 조언 정도로 여기는 분들이죠. 그러다 뒤늦게 브레이크를 밟고 사고를 냅니다.',
      '길가에 {t:camera} 단속 카메라를 세우면 원 안의 과속 차들이 모범 시민으로 돌변합니다. 다른 차량은 아무 영향 없이 지나가죠.'
    ],
    bump: [
      '{t:bump} 과속방지턱은 싸지만, 그 위를 지나는 모든 차의 속도를 떨어뜨립니다. 모범 운전자와 버스까지 전부요.',
      '속도를 줄여야 사고를 막을 수 있는 위험한 교차로 바로 앞에만 아껴서 놓으십시오.'
    ],
    barricade: [
      '가운데에 지름길이 있으면 모든 운전자가 그리로 몰립니다. 결국 지름길이 제일 느린 길이 되어 버리죠.',
      '{t:barricade} 도구는 도로를 부수지 않고 통행만 막습니다. 보호 도로도 막을 수 있죠. 때로는 길 하나를 닫는 것이 마을 전체를 빠르게 합니다.'
    ],
    marks: [
      '차 지붕 위 말풍선을 보십시오. {q} 표시는 망설임, {bang} 표시는 급정거, {stuck} 표시는 한참 갇혀 있다는 뜻입니다. 도로가 붉을수록 정체가 심하죠.',
      '파란색은 일반 차량, 빨간색은 과속, 노란색은 초보, 초록색은 버스입니다. 아무 차나 눌러 보면 어디로 가는지 보입니다.'
    ],
    stars: [
      '별 목표는 위에서부터 순서대로만 인정됩니다. 첫 번째를 놓치면 아래 목표를 채워도 소용없죠. 관료주의의 정수입니다.',
      '예산도 살피십시오. 터널 하나 값이 대략 제 11년 치 봉급입니다. 오늘 지은 시설은 같은 도구로 다시 누르면 전액 환불됩니다.'
    ]
  }
};
