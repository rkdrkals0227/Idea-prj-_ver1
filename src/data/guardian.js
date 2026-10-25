export const guardianStamps = [
  {
    id: "story",
    name: "이야기 수호대",
    icon: "☾",
    description: "느루에게 금호지 전설을 끝까지 듣고 퀴즈 맞히기",
    location: "금호지 · 남생이 느루",
  },
  {
    id: "village",
    name: "마을 수호대",
    icon: "⌂",
    description: "안내 길을 잇고 주택가 쓰레기 3개를 모두 분류하기",
    location: "학교 앞 안내 길 · 주택가",
  },
  {
    id: "ecology",
    name: "생태 수호대",
    icon: "♧",
    description: "그림에 이름과 보호 약속을 적고 우리 반 생태 지도에 등록하기",
    location: "우리 반 생태 지도",
  },
];
export const defaultGuardianLegend = {
  id: "geumho-two-dragons",
  title: "금호지의 청룡과 황룡",
  sourceTitle: "교사가 제공한 금호지 청룡·황룡 설화",
  sourceUrl: null,
  sourceYear: null,
  checkedAt: null,
  reviewStatus: "수업용 제공 설화",
  adaptedAt: "2026-10-24",
  notice:
    "선생님이 전해준 설화를 어린이용 대화로 다시 썼어요. 전해지는 이야기이며, 실제 호수가 만들어진 과정이나 역사적 사실을 설명하는 자료는 아니에요.",
  pages: [
    {
      id: "legend-1",
      speaker: "느루",
      text: "금호지에 전해진다는 두 용 이야기를 들려줄게. 오래전부터 전해지는 전설로 들어 보자.",
    },
    {
      id: "legend-2",
      speaker: "느루",
      text: "이야기 속 금호지 자리에는 청룡과 황룡이 살았대. 두 용은 누가 더 힘이 센지 겨루며 다투기 시작했어.",
    },
    {
      id: "legend-3",
      speaker: "나와 느루",
      text: "“두 용이 다투면 마을 사람들은 걱정됐겠어요.” “맞아. 이야기에서는 용이 꼬리로 땅을 치자 깊게 팬 자리에 물이 고여 못이 되었다고 해.”",
    },
    {
      id: "legend-4",
      speaker: "느루",
      text: "용들의 다툼으로 마을이 어지러워지자, 용맹한 장군이 나타났대. 장군은 “이제 싸움을 멈추어라!” 하고 두 용을 타일렀어.",
    },
    {
      id: "legend-5",
      speaker: "느루",
      text: "이 설화에서는 청룡이 못에 남아 금호지를 지키는 존재가 되고, 황룡은 하늘로 올라갔다고 전해져. 함께 지내는 마을을 소중히 여기자는 마음을 떠올려 볼 수 있겠지?",
    },
    {
      id: "legend-6",
      speaker: "나와 느루",
      text: "“우리도 마을을 지키는 사람이 될래요!” “좋아. 이야기를 기억하는지 퀴즈로 확인해 보자. 실제 물가에서는 안전한 길을 걷고 어른의 안내를 지키는 것도 잊지 마.”",
    },
  ],
  quiz: {
    id: "q-guardian-geumho",
    question:
      "이 전설에서 청룡과 황룡의 싸움을 멈추게 하려고 나선 사람은 누구였나요?",
    options: ["용맹한 장군", "장터의 상인", "나무꾼"],
    answer: 0,
    explanation:
      "제공된 전설에서는 장군이 나타나 두 용에게 싸움을 멈추라고 했어요. 전해지는 이야기의 내용이지, 확인된 역사적 사건은 아니에요.",
  },
};
