// Context IDs are independent of model IDs and saved progress. No global fallback.
export const quizContextLabels = {
  otter: "물결 · 강과 마을 문화",
  turtle: "느루 · 호수 생태",
  crane: "다온 · 사실과 전설",
  house: "밤톨 · 쓰레기와 생활",
  postman: "솔솔 · 주민 의견과 편지",
  library: "도서관 · 자료 읽기",
  forest: "숲길 · 관찰과 서식지",
  apartment: "아파트 · 공동생활",
  path: "학교 앞 · 안전한 안내 길",
};
const base = {
  difficulty: "쉬움",
  sourceTitle: "금산마을 제작 학습 상황 예시",
  sourceUrl: "",
  sourceYear: 2026,
  checkedAt: "2026-10-23",
  reviewStatus: "검토 완료",
  kind: "상황 판단",
};
const question = (
  id,
  context,
  place,
  question,
  options,
  answer,
  explanation,
) => ({
  ...base,
  id,
  contexts: [context],
  place,
  question,
  options,
  answer,
  explanation,
});
export const extraQuizzes = [
  question(
    "q-river-care",
    "otter",
    "마을 산책길",
    "물결과 강가를 산책해요. 강을 아끼는 행동은?",
    [
      "쓰레기를 되가져와요",
      "남은 음료를 강에 부어요",
      "물가에 포장지를 두어요",
    ],
    0,
    "강으로 쓰레기와 오염 물질이 들어가지 않도록 작은 것부터 실천해요.",
  ),
  question(
    "q-festival-care",
    "otter",
    "마을 산책길",
    "마을 축제를 구경할 때 주민과 관람객을 함께 배려하려면?",
    [
      "사진을 찍으려고 길을 막아요",
      "정해진 길을 따라가고 통행로를 비워요",
      "줄 앞에 끼어들어요",
    ],
    1,
    "축제도 함께 쓰는 공간이에요. 통행과 안전 안내를 지키며 문화를 즐겨요.",
  ),
  question(
    "q-culture-listen",
    "otter",
    "마을 산책길",
    "주민에게 마을의 옛이야기를 들을 때 좋은 태도는?",
    [
      "끝까지 듣고 궁금한 점을 여쭤봐요",
      "내 생각만 계속 말해요",
      "들은 내용을 무조건 역사적 사실로 적어요",
    ],
    0,
    "주민의 경험과 이야기를 존중해 들어요. 확인할 사실은 다른 자료와도 비교해요.",
  ),
  question(
    "q-lake-food",
    "turtle",
    "금호지 호숫가",
    "호수의 생물에게 과자를 주고 싶어요. 어떻게 할까요?",
    [
      "많이 나누어 줘요",
      "가까이 오도록 던져요",
      "먹이를 주지 않고 거리를 두고 관찰해요",
    ],
    2,
    "사람의 음식이나 무분별한 먹이 주기는 생물과 서식 환경에 영향을 줄 수 있어요.",
  ),
  question(
    "q-lake-report",
    "turtle",
    "금호지 호숫가",
    "처음 보는 생물을 발견했어요. 이름을 모르겠다면?",
    [
      "바로 해로운 생물이라고 정해요",
      "관찰한 장소와 특징을 기록하고 어른에게 물어요",
      "잡아서 다른 곳에 풀어요",
    ],
    1,
    "외래생물이라는 이유만으로 모두 제거 대상이 되지는 않아요. 판단과 관리는 전문가에게 맡겨요.",
  ),
  question(
    "q-legend-evidence",
    "crane",
    "도서관 앞",
    "전설 속 일을 실제 역사로 소개하려면 무엇이 필요할까요?",
    [
      "이야기가 재미있으면 충분해요",
      "별도의 역사 자료와 근거를 확인해요",
      "여러 번 말하면 사실이 돼요",
    ],
    1,
    "전설은 전해지는 이야기로 소개해요. 역사적 사실로 말하려면 별도의 확인 자료가 필요해요.",
  ),
  question(
    "q-crane-name",
    "crane",
    "도서관 앞",
    "월아산 이름에 대한 설명을 찾았어요. 사서 다온은 무엇부터 확인할까요?",
    [
      "가장 멋진 설명만 골라요",
      "그림의 색을 봐요",
      "누가 쓴 자료인지와 출처를 확인해요",
    ],
    2,
    "지명 설명은 출처에 따라 표현이 다를 수 있어요. 확인된 자료와 전해지는 이야기를 구분해요.",
  ),
  question(
    "q-sort-can",
    "house",
    "꽃담 주택가",
    "빈 음료 캔을 주웠어요. 이 게임에서 알맞은 수거함은?",
    ["종이", "금속", "플라스틱"],
    1,
    "게임의 예시 기준에서 캔은 금속이에요. 실제 배출은 우리 지역 안내를 확인해요.",
  ),
  question(
    "q-trash-danger",
    "house",
    "꽃담 주택가",
    "깨진 유리 조각을 발견했어요. 어떻게 할까요?",
    ["맨손으로 주워요", "장난감처럼 만져요", "다가가지 않고 어른에게 알려요"],
    2,
    "위험한 쓰레기는 직접 만지지 않아요. 안전한 것만 어른의 안내에 따라 정리해요.",
  ),
  question(
    "q-trash-prevent",
    "house",
    "꽃담 주택가",
    "깨끗해진 골목을 유지하려면?",
    [
      "쓰레기를 정해진 방법으로 버리고 다시 버리지 않아요",
      "다른 골목에 옮겨 놓아요",
      "한 번 치웠으니 더는 신경 쓰지 않아요",
    ],
    0,
    "줍기뿐 아니라 쓰레기를 만들거나 버리는 습관을 바꾸는 것도 중요해요.",
  ),
  question(
    "q-letter-specific",
    "postman",
    "마을 우체국",
    "불편한 길을 알리는 편지에 어떤 내용을 쓰면 좋을까요?",
    [
      "문제가 있는 장소와 겪는 어려움",
      "상대방을 놀리는 말",
      "장소 없이 빨리 고쳐 달라는 말만",
    ],
    0,
    "어디에서 어떤 어려움이 있었는지 구체적으로 쓰면 제안을 이해하기 쉬워요.",
  ),
  question(
    "q-letter-send",
    "postman",
    "마을 우체국",
    "게임 우체통에 접수한 편지는 실제 주민센터로도 보내질까요?",
    ["자동으로 발송돼요", "게임 속에서만 접수돼요", "친구의 이메일로 전송돼요"],
    1,
    "실제 기관에 전달하려면 초안을 내보내 선생님과 확인한 뒤 별도로 보내야 해요.",
  ),
  question(
    "q-letter-promise",
    "postman",
    "마을 우체국",
    "주민에게 제안하며 우리가 지킬 약속으로 알맞은 것은?",
    [
      "모든 수리를 학생이 직접 하기",
      "다른 사람의 이름으로 보내기",
      "우리가 실천할 수 있는 일을 구체적으로 적기",
    ],
    2,
    "예를 들어 “안내 길 위에 물건을 놓지 않겠습니다”처럼 스스로 할 수 있는 약속을 적어요.",
  ),
  question(
    "q-library-date",
    "library",
    "작은 도서관",
    "오래된 생태 조사 자료를 읽을 때 함께 적어야 할 것은?",
    ["조사연도와 출처", "친구의 생일", "책 표지 색만"],
    0,
    "과거의 조사 기록을 지금의 상황과 같다고 단정하지 않도록 조사 시점을 함께 살펴요.",
  ),
  question(
    "q-library-observation",
    "library",
    "작은 도서관",
    "친구가 올린 생물 그림은 어떤 자료일까요?",
    [
      "현재 마을의 모든 개체 수를 증명해요",
      "학생이 관찰하거나 표현한 작품이에요",
      "전문가의 조사 결과와 항상 같아요",
    ],
    1,
    "학생 작품은 소중한 관찰·표현 기록이에요. 확인된 지역 서식 자료와는 구분해요.",
  ),
  question(
    "q-library-opinion",
    "library",
    "작은 도서관",
    "“나는 호숫가가 가장 좋아”는 어떤 문장일까요?",
    [
      "정답을 정해야 하는 사실 문제",
      "조사로 확인한 개체 수",
      "사람마다 다를 수 있는 생각",
    ],
    2,
    "느낌이나 의견에는 서로 다른 답이 있을 수 있어요. 사실 퀴즈와 구분해서 이야기해요.",
  ),
  question(
    "q-forest-trail",
    "forest",
    "월아산이 보이는 숲길",
    "숲길 옆에 작은 싹이 올라왔어요. 어떻게 걸을까요?",
    [
      "싹을 밟아 길을 넓혀요",
      "정해진 길로 걸으며 싹을 피해요",
      "기념으로 뽑아 가요",
    ],
    1,
    "작은 식물도 숲의 일부예요. 정해진 길을 이용하면 서식지를 덜 방해해요.",
  ),
  question(
    "q-forest-sound",
    "forest",
    "월아산이 보이는 숲길",
    "숲에서 새소리를 자세히 듣고 싶어요. 좋은 방법은?",
    [
      "큰 소리로 계속 불러요",
      "나무를 두드려 새를 나오게 해요",
      "조용히 멈춰 서서 귀 기울여요",
    ],
    2,
    "조용히 기다리면 생물을 방해하지 않고 소리와 모습을 관찰할 수 있어요.",
  ),
  question(
    "q-forest-record",
    "forest",
    "월아산이 보이는 숲길",
    "숲에서 관찰한 것을 기록할 때 알맞은 것은?",
    [
      "본 시간·장소·특징을 적고 모르는 것은 모른다고 써요",
      "못 본 생물도 봤다고 써요",
      "색만 보고 종 이름을 확정해요",
    ],
    0,
    "관찰한 것과 추측한 것을 나누어 기록하면 나중에 확인하고 비교하기 좋아요.",
  ),
  question(
    "q-apartment-hall",
    "apartment",
    "햇살 아파트",
    "아파트 복도에 큰 상자를 놓아도 될까요?",
    [
      "공동 통행로를 막지 않도록 정리해요",
      "우리 집 앞이면 항상 괜찮아요",
      "계단으로 밀어 놓아요",
    ],
    0,
    "복도와 계단은 이웃이 함께 쓰는 길이에요. 이동과 대피에 방해가 되지 않게 해요.",
  ),
  question(
    "q-apartment-noise",
    "apartment",
    "햇살 아파트",
    "이웃의 생활 소음이 불편해요. 어떻게 의견을 전할까요?",
    [
      "더 큰 소리로 되갚아요",
      "어른과 상의해 정중히 불편과 제안을 전해요",
      "이웃을 놀리는 글을 붙여요",
    ],
    1,
    "서로의 어려움을 듣고 약속을 정하면 함께 해결할 방법을 찾을 수 있어요.",
  ),
  question(
    "q-apartment-meeting",
    "apartment",
    "햇살 아파트",
    "함께 쓰는 화단의 규칙을 정할 때 좋은 방법은?",
    [
      "한 사람만 마음대로 정해요",
      "아무에게도 알리지 않아요",
      "여러 주민의 의견을 듣고 함께 정해요",
    ],
    2,
    "공동 공간의 문제는 영향을 받는 사람들의 의견을 듣고 실천 방법을 정해요.",
  ),
];
export const defaultQuizContexts = {
  "q-path": ["path"],
  "q-wild": ["turtle"],
  "q-legend": ["crane"],
  "q-river": ["otter"],
  "q-crop": ["house"],
};
export function quizPool(content, context) {
  const sourceId = context.startsWith("source:") ? context.slice(7) : null;
  const source = sourceId
    ? content.sources.find(
        (s) => s.id === sourceId && s.reviewStatus === "검토 완료",
      )
    : null;
  return content.quizzes.filter(
    (q) =>
      q.reviewStatus === "검토 완료" &&
      (sourceId
        ? source && source.sourceUrl && q.sourceUrl === source.sourceUrl
        : q.contexts?.includes(context)),
  );
}
// Upgrade old browser content once. Preserve teacher wording, review status and IDs.
export function upgradeQuizContent(content) {
  const c = structuredClone(content);
  for (const [id, theme] of Object.entries(residentThemes)) {
    const d = c?.dialogues?.[id];
    if (d && d.story === theme.old) d.story = theme.text;
  }

  if (!Array.isArray(c?.quizzes)) return c;
  for (const q of c.quizzes)
    if (q.contexts === undefined)
      q.contexts = [...(defaultQuizContexts[q.id] || [])];
  if ((c.quizRoutingVersion || 0) < 2) {
    const ids = new Set(c.quizzes.map((q) => q.id));
    c.quizzes.push(
      ...structuredClone(extraQuizzes.filter((q) => !ids.has(q.id))),
    );
    c.quizRoutingVersion = 2;
  }
  return c;
}

export const residentThemes = {
  otter: {
    title: "강과 마을 문화를 함께 즐겨요",
    old: "안녕! 나는 이야기 듣기를 좋아하는 가상의 수달 주민 물결이야. 도서관에서 우리 지역 자료를 함께 살펴보자.",
    text: "강가와 마을 축제에서는 여러 사람이 함께 길을 써. 쓰레기를 되가져오고 통행로를 비우면 모두가 편하게 즐길 수 있어. 주민에게 들은 옛이야기는 존중해서 듣고, 확인할 사실은 자료와 비교해 보자.",
  },
  turtle: {
    title: "호수의 생물을 조용히 관찰해요",
    old: "나는 가상의 남생이 느루야. 실제 생물은 거리를 두고 관찰해 줘. 내 등장이 실제 서식의 증거는 아니야.",
    text: "호수의 생물은 각자 쉬고 먹이를 찾는 공간이 필요해. 먹이를 주거나 잡아 옮기지 말고, 거리를 두고 본 장소와 특징을 기록해 줘. 이름을 모르거나 도움이 필요한 생물을 보면 어른과 전문가에게 알려 보자.",
  },
  crane: {
    title: "전설과 확인된 사실을 나눠 읽어요",
    old: "도서관에 온 걸 환영해. 사실, 전설, 관찰 기록은 서로 달라. 출처와 확인한 날짜를 함께 살펴보자.",
    text: "용이 나오는 전설은 전해지는 이야기로 읽어 봐. 지명이나 역사에 대한 설명은 누가 쓴 자료인지 확인하고, 관찰 기록은 언제 어디에서 조사했는지 함께 살펴보자. 모르는 것은 아직 확인하지 못했다고 적어도 괜찮아.",
  },
  house: {
    title: "깨끗한 골목을 함께 지켜요",
    old: "모두가 함께 쓰는 길이 깨끗하면 좋겠어.",
    text: "이 골목은 이웃들이 매일 함께 걷는 길이야. 안전한 쓰레기는 재질을 살펴 알맞게 분류하고, 깨진 유리처럼 위험한 물건은 어른에게 알려 줘. 치운 뒤에도 다시 버리지 않는 약속을 함께 지키면 좋겠어.",
  },
  postman: {
    title: "불편과 제안을 편지로 전해요",
    old: "말하기 어려운 생각도 편지에 담을 수 있어. 이 우체통은 게임 속에서만 편지를 받아.",
    text: "편지에는 어느 장소에서 누가 어떤 어려움을 겪는지 구체적으로 적어 봐. 해결 제안과 우리가 지킬 수 있는 약속을 정중하게 덧붙이면 마음이 더 잘 전해져. 여기서는 게임 속 접수만 하고, 실제 기관에 보낼 초안은 선생님과 확인하자.",
  },
};
