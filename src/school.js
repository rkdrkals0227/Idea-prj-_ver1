import { escapeHTML as h } from "./logic.js";
import {
  markBriefingRead,
  saveSchoolPlan,
  saveWeeklyCheck,
  seoulDate,
  weekDates,
} from "./journey.js";
export function showSchool({
  state,
  content,
  ui,
  persist,
  onNext,
  reflection,
  teacher,
}) {
  const today = seoulDate(),
    dates = weekDates(today),
    plan = state.journey.plan;
  const root = ui.open(
    "레벨 1 · 우리 학급 회의와 이번 주 실천",
    `<span class="badge">예시 회의 결과</span><h3>${h(content.className)} · ${h(content.topic)}</h3><p class="small">회의 날짜: ${h(content.meetingDate)}<br>역할: ${h(content.meeting.roles)}<br>약속: ${h(content.meeting.promise)}<br>활동 기간: ${h(content.meeting.period)}</p><div class="cards">${content.agendas.map((a) => `<article class="card"><h3>${h(a.title)}</h3><p>${h(a.problem)}</p><p><b>우리의 결정</b><br>${h(a.action)}</p></article>`).join("")}</div><button id="read-meeting" class="primary" ${state.journey.briefingRead ? "disabled" : ""}>${state.journey.briefingRead ? "✓ 회의 결과를 확인했어요" : "회의 결과를 읽었어요"}</button><h3 style="margin-top:24px">이번 주, 나는 어떻게 실천할까요?</h3><form id="weekly-form"><fieldset ${state.journey.briefingRead ? "" : "disabled"}><label>함께 실천할 안건<select name="agendaId">${content.agendas.map((a) => `<option value="${h(a.id)}" ${plan.agendaId === a.id ? "selected" : ""}>${h(a.title)}</option>`).join("")}</select></label><label>내가 지킬 약속<textarea name="promise" required maxlength="500" placeholder="예: 점자블록 위에 물건을 놓지 않아요">${h(plan.promise)}</textarea></label><label>이번 주 체크할 날짜<select name="date">${dates.map((d, i) => `<option value="${d}" ${d === today ? "selected" : ""} ${d > today ? "disabled" : ""}>${d} (${["월", "화", "수", "목", "금", "토", "일"][i]})</option>`).join("")}</select></label><label class="check"><input name="done" type="checkbox">오늘 이 약속을 실천했어요</label><label>짧은 실천 기록<textarea name="note" maxlength="300" placeholder="어떤 실천을 했나요?"></textarea></label><button class="primary" type="submit">계획과 오늘 체크 저장</button></fieldset></form><div id="school-feedback" class="feedback" role="status">${state.journey.schoolReady ? "레벨 1을 완료했어요. 남은 요일에도 실천을 이어가요." : "회의 읽기 → 내 약속 → 첫 실천 체크를 마치면 레벨 2가 열려요."}</div><div class="weekly-grid">${dates.map((d, i) => `<article><b>${["월", "화", "수", "목", "금", "토", "일"][i]}</b><small>${d.slice(5)}</small><span>${state.journey.checks[d]?.done ? "✓ 실천" : "○ 기록 전"}</span><p>${h(state.journey.checks[d]?.note || "")}</p></article>`).join("")}</div><div class="actions"><button id="school-next" ${state.journey.schoolReady ? "" : "disabled"}>레벨 2 · 통학로로 나가기</button><button id="school-reflect">활동 돌아보기</button><button id="school-teacher">교사용 편집</button></div>`,
    "wide",
  );
  const form = root.querySelector("form");
  function selected() {
    const c = state.journey.checks[form.elements.date.value] || {};
    form.elements.done.checked = !!c.done;
    form.elements.note.value = c.note || "";
  }
  selected();
  form.elements.date.onchange = selected;
  root.querySelector("#read-meeting").onclick = () => {
    markBriefingRead(state);
    persist();
    showSchool({ state, content, ui, persist, onNext, reflection, teacher });
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (
      !saveSchoolPlan(state, data, content) ||
      !saveWeeklyCheck(state, data.date, {
        done: form.elements.done.checked,
        note: data.note,
      })
    ) {
      ui.toast(
        "회의를 확인하고 실천 약속과 오늘 또는 지난 날짜를 선택해 주세요.",
      );
      return;
    }
    persist();
    showSchool({ state, content, ui, persist, onNext, reflection, teacher });
  };
  root.querySelector("#school-next").onclick = onNext;
  root.querySelector("#school-reflect").onclick = reflection;
  root.querySelector("#school-teacher").onclick = teacher;
}
