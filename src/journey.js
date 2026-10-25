import { rulesComplete } from "./classroom.js";
export const levels = [
  {
    id: 1,
    title: "학교 · 우리 반의 약속",
    description: "학교 칠판의 규칙 네 줄을 타자로 맞히면 바로 완료돼요.",
  },
  {
    id: 2,
    title: "학교와 집 사이 · 안전한 길",
    description: "안내 길을 잇고 주택가 쓰레기를 알맞게 분류해요.",
  },
  {
    id: 3,
    title: "금호지 · 전설을 만나요",
    description:
      "동물 친구와 인사하고 금호지 전설을 끝까지 읽은 뒤 퀴즈를 풀어요.",
  },
  {
    id: 4,
    title: "우리 반 생태 지도",
    description: "지도에 그림·이름·보호 약속을 등록해요.",
  },
];
export function initialJourney() {
  return {
    version: 1,
    introSeen: false,
    briefingRead: false,
    schoolReady: false,
    plan: { agendaId: "", promise: "" },
    checks: {},
    ruleCopies: {},
    openedLakeBook:false,
    met: [],
    exhibitIds: [],
  };
}
export function normalizeJourney(value) {
  return {
    ...initialJourney(),
    ...value,
    plan: { ...initialJourney().plan, ...value?.plan },
    checks: value?.checks || {},
    ruleCopies: value?.ruleCopies || {},
    met: value?.met || [],
    exhibitIds: value?.exhibitIds || [],
  };
}
export function journeyLevel(s) {
  if (!s.journey?.schoolReady) return 1;
  if (!s.completed.includes("path") || !s.completed.includes("trash")) return 2;
  if (!s.guardian?.legendQuizPassed) return 3;
  if (!s.journey.exhibitIds.length) return 4;
  return 5;
}
export function canEnterLevel(s, n) {
  return Number.isInteger(n) && n >= 1 && n <= 4 && journeyLevel(s) >= n;
}
export function markBriefingRead(s) {
  s.journey = normalizeJourney(s.journey);
  s.journey.briefingRead = true;
}
export function saveSchoolPlan(s, plan, content) {
  if (
    !s.journey?.briefingRead ||
    !(content.agendas.some((a) => a.id === plan.agendaId) || content.classRules?.rules.some(r=>r.id===plan.agendaId)) ||
    (!s.journey.schoolReady && !rulesComplete(s, content)) ||
    !String(plan.promise || "").trim()
  )
    return false;
  s.journey.plan = {
    agendaId: plan.agendaId,
    promise: String(plan.promise).trim().slice(0, 500),
  };
  return true;
}
export function seoulDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function weekDates(date = seoulDate()) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) =>
    new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10),
  );
}
export function saveWeeklyCheck(s, date, entry, today = seoulDate()) {
  if (
    !s.journey?.briefingRead ||
    !s.journey.plan.promise?.trim() ||
    !validDate(date) ||
    date > today ||
    !weekDates(today).includes(date)
  )
    return false;
  s.journey.checks[date] = {
    done: !!entry.done,
    note: String(entry.note || "").slice(0, 300),
  };
  if (entry.done) s.journey.schoolReady = true;
  return true;
}
export function validExhibit(work) {
  return !!(
    work &&
    typeof work.id === "string" &&
    work.id &&
    work.blob instanceof Blob &&
    work.exhibition === "namgang" &&
    work.name?.trim() &&
    work.protection?.trim()
  );
}
export function registerExhibit(s, work) {
  if (!canEnterLevel(s, 4) || !validExhibit(work)) return false;
  s.journey.exhibitIds = [
    ...s.journey.exhibitIds.filter((id) => id !== work.id),
    work.id,
  ];
  return true;
}
export function reconcileExhibits(s, works) {
  s.journey = normalizeJourney(s.journey);
  s.journey.exhibitIds = s.journey.exhibitIds.filter((id) =>
    works.some((w) => w.id === id && validExhibit(w)),
  );
}
export function validateJourney(j) {
  if (
    !j ||
    typeof j.schoolReady !== "boolean" ||
    typeof j.briefingRead !== "boolean" ||
    !j.plan ||
    typeof j.plan.promise !== "string" ||
    typeof j.plan.agendaId !== "string" ||
    !j.checks ||
    typeof j.checks !== "object" ||
    Array.isArray(j.checks) ||
    !Array.isArray(j.met) ||
    !j.met.every((id) => typeof id === "string") ||
    !Array.isArray(j.exhibitIds) ||
    !j.exhibitIds.every((id) => typeof id === "string")
  )
    throw new Error("레벨·주간 체크 기록을 확인해 주세요.");
  for (const [date, c] of Object.entries(j.checks))
    if (
      !validDate(date) ||
      !c ||
      typeof c.done !== "boolean" ||
      typeof c.note !== "string"
    )
      throw new Error("주간 체크 날짜와 내용을 확인해 주세요.");
}
export function objective(s, content, indoor) {
  const level = journeyLevel(s);
  if (indoor)
    return level === 1 && indoor === "school"
      ? { id: "board", x: 0, z: -4 }
      : { id: "exit", x: 0, z: 5.7 };
  if (level === 1) return { id: "school", x: -10, z: -1 };
  if (level === 2) {
    if (!s.completed.includes("path")) return { id: "path", x: -6, z: 4.7 };
    const w = content.waste.find(
      (w) =>
        w.zone === "village" &&
        !s.collected.includes(w.id) &&
        !s.sorted.includes(w.id),
    );
    return w
      ? { id: "waste:" + w.id, x: w.x, z: w.z }
      : { id: "bag", ui: true };
  }
  if (level === 3) return { id: "turtle", x: 19, z: -11 };
  if (level === 4) return { id: "eco-map", ui: true };
  return null;
}

export function activityTarget(s, content, id) {
  if (id === "path") return { id: "path", x: -6, z: 4.7 };
  if (id === "lake") return { id: "turtle", x: 19, z: -11 };
  if (id === "trash") {
    if (s.completed.includes("trash")) return null;
    const w = content.waste.find(
      (w) =>
        w.zone === "village" &&
        !s.collected.includes(w.id) &&
        !s.sorted.includes(w.id),
    );
    return w
      ? { id: "waste:" + w.id, x: w.x, z: w.z }
      : { id: "bag", ui: true };
  }
  return null;
}
