import { classRules, expandedTactile } from "./class-rules.js";
import { defaultGuardianLegend } from "./guardian.js";
import {
  extraQuizzes,
  defaultQuizContexts,
  residentThemes,
} from "./learning.js";
export const sources = [
  {
    id: "geumsan",
    sourceTitle: "진주시 금산면 소개",
    sourceUrl: "https://www.jinju.go.kr/00135/01113/01668.web",
    sourceYear: null,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "시설원예 농산물과 지역 특징을 원문에서 확인해 주세요.",
    kind: "지역 사실",
  },
  {
    id: "lake",
    sourceTitle: "진주관광 금호지 소개",
    sourceUrl:
      "https://www.jinju.go.kr/02232/02830/02248.web?amode=view&cpage=2&idx=56",
    sourceYear: null,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "금호지 장소 정보와 용 전설. 전해지는 이야기를 역사적 사실과 구분해 주세요.",
    kind: "장소·전설",
  },
  {
    id: "mountain",
    sourceTitle: "진주시 월아산 국사봉 소개",
    sourceUrl: "https://www.jinju.go.kr/here/03630.web?amode=view&idx=613",
    sourceYear: null,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "월아산 이름과 전설은 원문을 확인한 뒤 학생용 문장으로 작성해 주세요.",
    kind: "지명·전설",
  },
  {
    id: "festival",
    sourceTitle: "한국관광공사 진주남강유등축제 소개",
    sourceUrl:
      "https://korean.visitkorea.or.kr/kfes/detail/fstvlDetail.do?fstvlCntntsId=aebdd924-73cd-4187-be5e-ba29ccf19c49",
    sourceYear: null,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "남강과 진주남강유등축제를 원문에서 확인해 주세요.",
    kind: "지역 문화",
  },
  {
    id: "survey",
    sourceTitle: "국립생태원 2025년 외래생물 전국 서식 실태조사, 인쇄 151쪽",
    sourceUrl:
      "https://www.nie.re.kr/nie/cmmn/file/fileDown.do?atchFileId=47a2de54f9f7404d9c67624f557d5e13&fileSn=1",
    sourceYear: 2025,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "제공된 자료의 금호지 남생이 기록을 원문·조사연도와 대조해 주세요. 현재 개체 수는 추정하지 않습니다.",
    kind: "생태 관찰 기록",
  },
  {
    id: "tactile",
    sourceTitle: "장애인등편의법 시행규칙 별표 1 · 점자블록",
    sourceUrl:
      "https://www.law.go.kr/법령/장애인ㆍ노인ㆍ임산부등의편의증진보장에관한법률시행규칙",
    sourceYear: null,
    checkedAt: null,
    reviewStatus: "검토 필요",
    text: "점형은 주의·경고, 선형은 방향 안내를 위한 블록입니다. 이 게임은 단순한 직선 연결 퍼즐이며 실제 설계·시공 기준이 아닙니다.",
    kind: "시설 안내 초안",
  },
];
export const defaults = {
  classRules,
  guardianLegend: defaultGuardianLegend,
  quizRoutingVersion: 2,
  schoolName: "금호초등학교",
  className: "4학년 마을탐험반",
  meetingDate: "2026-10-23",
  topic: "누구나 편안한 우리 마을",
  meeting: {
    roles: "길 관찰팀 · 주택가 정리팀 · 호수 기록팀",
    promise: "생물은 만지지 않고, 위험한 물건은 어른에게 알려요.",
    period: "우리 반이 정한 활동 주간",
  },
  agendas: [
    {
      id: "a-path",
      title: "길을 막은 물건과 끊긴 점자블록",
      problem: "안내 길이 끊기고 물건에 가려져 있어요.",
      action: "불편을 기록하고 어른·담당 기관에 알리기",
      quest: "path",
    },
    {
      id: "a-trash",
      title: "주택가에 버려진 쓰레기",
      problem: "길가에 쓰레기가 남아 있어요.",
      action: "안전한 쓰레기를 줍고 분류하기",
      quest: "trash",
    },
    {
      id: "a-lake",
      title: "금호지 주변 생물 보호",
      problem: "쉬는 공간에 쓰레기가 있어요.",
      action: "관찰하고 전문가와 함께 돌보기",
      quest: "lake",
    },
  ],
  dialogues: {
    otter: {
      name: "물결 · 수달 주민",
      story:
        "안녕! 나는 이야기 듣기를 좋아하는 가상의 수달 주민 물결이야. 도서관에서 우리 지역 자료를 함께 살펴보자.",
      before:
        "길의 안내 블록이 끊어졌어. 불편한 곳을 살펴보고 어른에게 알려 주겠니?",
      during: "위에 놓인 물건부터 옮기고, 블록의 모양과 방향을 확인해 보자.",
      after: "안내 길이 이어졌네! 평소에도 점자블록 위에 물건을 놓지 말자.",
    },
    turtle: {
      name: "느루 · 남생이 주민",
      story:
        "나는 가상의 남생이 느루야. 실제 생물은 거리를 두고 관찰해 줘. 내 등장이 실제 서식의 증거는 아니야.",
      before: "호숫가 쉼터를 함께 돌봐 줄래? 생물 관리는 전문가에게 맡기자.",
      during: "쓰레기는 분류하고, 전문가가 지정한 연습 표본만 인계해 줘.",
      after: "호수가 깨끗해졌어! 실제 생물은 잡거나 옮기지 말고 관찰·기록하자.",
    },
    crane: {
      name: "다온 · 학 사서",
      story:
        "도서관에 온 걸 환영해. 사실, 전설, 관찰 기록은 서로 달라. 출처와 확인한 날짜를 함께 살펴보자.",
      before: "책장에는 읽을거리와 우리 반 생태 도감이 있어.",
      during: "새로 알게 된 것을 학교에서 돌아볼 수 있어.",
      after: "네 기록이 우리 반의 배움이 되었구나!",
    },
    house: {
      name: "주택가 생활 게시판",
      story: "모두가 함께 쓰는 길이 깨끗하면 좋겠어.",
      before: "세 가지 쓰레기를 가방에 담고 알맞은 수거함에 넣어 줄래?",
      during: "가방을 열어 분류해 보자. 같은 물건은 한 번만 주울 수 있어.",
      after: "고마워! 우리가 함께 쓰는 길이 환해졌어.",
    },
    postman: {
      name: "마을 우체통",
      story:
        "말하기 어려운 생각도 편지에 담을 수 있어. 이 우체통은 게임 속에서만 편지를 받아.",
      before: "누구에게 어떤 마음을 전하고 싶니?",
      during: "초안을 저장하고 천천히 고쳐도 괜찮아.",
      after: "게임 속 편지를 잘 받았어! 실제 발송은 선생님과 확인하자.",
    },
  },
  quizzes: [
    {
      id: "q-path",
      question: "점자블록 위에 물건이 있으면?",
      options: [
        "길을 찾는 데 방해가 돼요",
        "더 안전해져요",
        "아무 영향이 없어요",
      ],
      answer: 0,
      explanation:
        "안내 길을 막지 않고, 불편한 곳은 어른과 담당 기관에 알려요.",
      place: "학교 앞",
      difficulty: "쉬움",
      sourceTitle: "게임 제작 생활 안전 예시",
      sourceUrl: "",
      sourceYear: 2026,
      checkedAt: "2026-10-23",
      reviewStatus: "검토 완료",
      kind: "상황 판단",
    },
    {
      id: "q-wild",
      question: "야생 생물을 발견했어요. 어떻게 할까요?",
      options: [
        "집으로 데려와요",
        "거리를 두고 관찰·기록해요",
        "먹이를 던져요",
      ],
      answer: 1,
      explanation:
        "서식지를 방해하지 않고 관찰해요. 도움이 필요하면 어른이나 관리 기관에 알려요.",
      place: "금호지",
      difficulty: "쉬움",
      sourceTitle: "게임 제작 생태 행동 예시",
      sourceUrl: "",
      sourceYear: 2026,
      checkedAt: "2026-10-23",
      reviewStatus: "검토 완료",
      kind: "상황 판단",
    },
    {
      id: "q-legend",
      question: "전해 내려오는 용 이야기는?",
      options: ["오늘의 관찰 기록", "과학 실험 결과", "전해지는 전설"],
      answer: 2,
      explanation: "전설은 전해지는 이야기예요. 역사적 사실과 구분해요.",
      place: "숲길",
      difficulty: "쉬움",
      sourceTitle: "게임 제작 자료 읽기 예시",
      sourceUrl: "",
      sourceYear: 2026,
      checkedAt: "2026-10-23",
      reviewStatus: "검토 완료",
      kind: "자료 구분",
    },
    {
      id: "q-river",
      question: "진주남강유등축제와 관련 있는 강은?",
      options: ["남강", "한강", "금강"],
      answer: 0,
      explanation: "원문 확인 후 해설을 확정해 주세요.",
      place: "광장",
      difficulty: "쉬움",
      ...sources[3],
      id: "q-river",
    },
    {
      id: "q-crop",
      question: "금산면 시설원예 농산물로 소개된 것은?",
      options: ["파프리카", "커피", "카카오"],
      answer: 0,
      explanation: "원문 확인 후 해설을 확정해 주세요.",
      place: "주택가",
      difficulty: "쉬움",
      ...sources[0],
      id: "q-crop",
    },
  ],
  sources,
  tactile: expandedTactile,
  waste: [
    {
      id: "can",
      name: "빈 음료 캔",
      category: "금속",
      zone: "village",
      x: 10,
      z: 5,
    },
    {
      id: "paper",
      name: "깨끗한 종이",
      category: "종이",
      zone: "village",
      x: 13,
      z: 8,
    },
    {
      id: "bottle",
      name: "빈 플라스틱병",
      category: "플라스틱",
      zone: "village",
      x: 16,
      z: 5,
    },
    {
      id: "lake-can",
      name: "호숫가 빈 캔",
      category: "금속",
      zone: "lake",
      x: 22,
      z: -9,
    },
    {
      id: "lake-paper",
      name: "호숫가 깨끗한 종이",
      category: "종이",
      zone: "lake",
      x: 17,
      z: -11,
    },
  ],
  quests: {
    path: {
      id: "path",
      title: "모두를 위한 안내 길",
      description: "장애물을 치우고 안내 경로를 연결해요.",
      agenda: "a-path",
      target: 1,
      reward: "다정한 길잡이",
    },
    trash: {
      id: "trash",
      title: "깨끗한 주택가",
      description: "주택가 쓰레기 3개를 줍고 분류해요.",
      agenda: "a-trash",
      target: 3,
      reward: "마을 돌봄이",
    },
    lake: {
      id: "lake",
      title: "남생이와 호수 돌보기",
      description:
        "쓰레기를 분류하고 쉼터를 정리한 뒤, 구별 퀴즈와 연습 표본 인계를 해요.",
      agenda: "a-lake",
      target: 5,
      reward: "호수 돌봄 배지",
    },
  },
};
export const habitats = {
  river: { name: "물가", x: -14, z: 10, r: 2 },
  lake: { name: "호숫가", x: 18, z: -8, r: 2 },
  forest: { name: "숲", x: -18, z: -14, r: 3 },
  grass: { name: "풀밭", x: -14, z: 10, r: 3 },
};

for (const q of defaults.quizzes)
  q.contexts = [...(defaultQuizContexts[q.id] || [])];
defaults.quizzes.push(...extraQuizzes);

for (const [id, theme] of Object.entries(residentThemes))
  defaults.dialogues[id].story = theme.text;
