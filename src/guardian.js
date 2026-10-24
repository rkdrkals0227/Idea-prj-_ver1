import { guardianStamps } from "./data/guardian.js";
export function initialGuardian() {
  return { legendSeen: [], legendQuizPassed: false, introSeen: false };
}
export function normalizeGuardian(value) {
  return { ...initialGuardian(), ...value };
}
export function hasReadLegend(state, lesson) {
  return lesson.pages.every((p) => state.guardian?.legendSeen.includes(p.id));
}
export function readLegendPage(state, lesson, id) {
  const i = lesson.pages.findIndex((p) => p.id === id);
  if (
    i < 0 ||
    !lesson.pages
      .slice(0, i)
      .every((p) => state.guardian?.legendSeen.includes(p.id))
  )
    return false;
  state.guardian = normalizeGuardian(state.guardian);
  if (!state.guardian.legendSeen.includes(id))
    state.guardian.legendSeen.push(id);
  return true;
}
export function answerLegend(state, lesson, choice) {
  if (!hasReadLegend(state, lesson)) return "locked";
  if (choice !== lesson.quiz.answer) return "wrong";
  state.guardian = normalizeGuardian(state.guardian);
  if (state.guardian.legendQuizPassed) return "already";
  state.guardian.legendQuizPassed = true;
  return "earned";
}
export function earnedGuardianStamps(state) {
  const conditions = {
    story: !!state.guardian?.legendQuizPassed,
    village:
      state.completed.includes("path") && state.completed.includes("trash"),
    ecology: state.completed.includes("lake"),
  };
  return guardianStamps.filter((s) => conditions[s.id]);
}
export function isGuardian(state) {
  return earnedGuardianStamps(state).length === guardianStamps.length;
}
export function validateGuardian(value) {
  if (
    !value ||
    !Array.isArray(value.legendSeen) ||
    !value.legendSeen.every((id) => typeof id === "string") ||
    typeof value.legendQuizPassed !== "boolean" ||
    typeof value.introSeen !== "boolean"
  )
    throw new Error("수호대 이야기·스탬프 기록 형식을 확인해 주세요.");
}
export function validateGuardianLesson(lesson) {
  if (
    !lesson ||
    !["id", "title", "notice", "sourceTitle", "reviewStatus"].every(
      (k) => typeof lesson[k] === "string",
    ) ||
    !Array.isArray(lesson.pages) ||
    !lesson.pages.length ||
    lesson.pages.length > 12
  )
    throw new Error("금호지 전설의 제목·출처·대화(1~12장)를 확인해 주세요.");
  const ids = lesson.pages.map((p) => p.id);
  if (
    new Set(ids).size !== ids.length ||
    lesson.pages.some(
      (p) =>
        !["id", "speaker", "text"].every(
          (k) => typeof p[k] === "string" && p[k].trim(),
        ),
    )
  )
    throw new Error(
      "전설 대화의 ID는 고유해야 하며 말하는 이와 내용을 적어 주세요.",
    );
  const q = lesson.quiz;
  if (
    !q ||
    typeof q.question !== "string" ||
    typeof q.explanation !== "string" ||
    !Array.isArray(q.options) ||
    q.options.length !== 3 ||
    !q.options.every((o) => typeof o === "string") ||
    !Number.isInteger(q.answer) ||
    q.answer < 0 ||
    q.answer >= 3
  )
    throw new Error("전설 퀴즈의 선택지 3개와 정답 번호(0~2)를 확인해 주세요.");
}
