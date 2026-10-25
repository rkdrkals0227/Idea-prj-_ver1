import {escapeHTML as h} from './logic.js';
import {markBriefingRead,saveSchoolPlan,saveWeeklyCheck,seoulDate,weekDates} from './journey.js';
import {copyRule,rulesComplete,normalizeRule} from './classroom.js';
export function showSchool({state,content,ui,persist,onNext,reflection,teacher}) {
 const today=seoulDate(),dates=weekDates(today),plan=state.journey.plan,rules=content.classRules.rules;
 const learned=rulesComplete(state,content),canPlan=state.journey.briefingRead&&(learned||state.journey.schoolReady);
 const root=ui.open('레벨 1 · 우리 학급 회의와 이번 주 실천',`
 <div class="class-chalkboard"><span class="chalk-date">${h(content.classRules.month)} · 학급 회의 결과</span><h3>우리 반이 함께 정한 규칙</h3>
 <p class="chalk-sub">${h(content.classRules.source||'우리 학급 회의 결과')} · 한 줄씩 읽고 바로 아래에 따라 써 보세요.</p>
 ${rules.map((r,i)=>{const copied=normalizeRule(state.journey.ruleCopies?.[r.id])===normalizeRule(r.text);return `<section class="copy-rule ${copied?'copied':''}"><span class="rule-group">${h(r.group)}</span><p class="rule-sentence">${i+1}. ${h(r.text)}</p><label for="rule-${h(r.id)}" class="sr-only">${h(r.text)} 따라 쓰기</label><div class="copy-line"><input id="rule-${h(r.id)}" data-rule-input="${h(r.id)}" value="${copied?h(r.text):''}" maxlength="150" autocomplete="off" spellcheck="false" placeholder="윗줄의 규칙을 여기에 써 보세요"><button data-copy-check="${h(r.id)}">${copied?'✓ 한 번 더 확인':'확인'}</button></div><small data-copy-feedback="${h(r.id)}" role="status">${copied?'✓ 잘 기억했어요! 생활에서도 함께 지켜요.':''}</small></section>`}).join('')}</div>
 <p id="copy-progress" class="small">${learned?'✓ 규칙 네 줄을 모두 떠올렸어요.':'한 문장씩 읽고 직접 입력해요. 띄어쓰기와 쉼표는 조금 달라도 괜찮아요.'}</p>
 <button id="read-meeting" class="primary" ${state.journey.briefingRead||!learned?'disabled':''}>${state.journey.briefingRead?'✓ 회의 결과를 확인했어요':'회의 결과를 읽었어요'}</button>
 <h3 style="margin-top:24px">이번 주, 나는 어떻게 실천할까요?</h3><form id="weekly-form"><fieldset ${canPlan?'':'disabled'}><label>함께 실천할 규칙<select name="agendaId"><optgroup label="우리 학급 규칙">${rules.map(r=>`<option value="${h(r.id)}" ${plan.agendaId===r.id?'selected':''}>${h(r.text)}</option>`).join('')}</optgroup><optgroup label="예시 마을 실천 안건">${content.agendas.map(a=>`<option value="${h(a.id)}" ${plan.agendaId===a.id?'selected':''}>${h(a.title)}</option>`).join('')}</optgroup></select></label>
 <label>내가 지킬 약속<textarea name="promise" required maxlength="500" placeholder="예: 속상할 때 내 마음을 차분히 말해요">${h(plan.promise)}</textarea></label>
 <label>이번 주 체크할 날짜<select name="date">${dates.map((d,i)=>`<option value="${d}" ${d===today?'selected':''} ${d>today?'disabled':''}>${d} (${'월화수목금토일'[i]})</option>`).join('')}</select></label><label class="check"><input name="done" type="checkbox">오늘 이 약속을 실천했어요</label><label>짧은 실천 기록<textarea name="note" maxlength="300" placeholder="어떤 실천을 했나요?"></textarea></label><button class="primary" type="submit">계획과 오늘 체크 저장</button></fieldset></form>
 <div id="school-feedback" class="feedback" role="status">${state.journey.schoolReady?'레벨 1을 완료했어요. 남은 요일에도 실천을 이어가요.':'규칙 따라 쓰기 → 회의 확인 → 내 약속과 첫 체크를 마치면 레벨 2가 열려요.'}</div>
 <div class="weekly-grid">${dates.map((d,i)=>`<article><b>${'월화수목금토일'[i]}</b><small>${d.slice(5)}</small><span>${state.journey.checks[d]?.done?'✓ 실천':'○ 기록 전'}</span><p>${h(state.journey.checks[d]?.note||'')}</p></article>`).join('')}</div>
 <details class="example-meeting"><summary>예시 마을 회의와 활동 안건 살펴보기</summary><span class="badge">예시 회의 결과 · 위 학급 규칙과 구분해요</span><p>${h(content.className)} · ${h(content.topic)}<br>예시 날짜: ${h(content.meetingDate)}</p>${content.agendas.map(a=>`<article class="card"><h3>${h(a.title)}</h3><p>${h(a.problem)}</p><p>${h(a.action)}</p></article>`).join('')}</details>
 <div class="actions"><button id="school-next" ${state.journey.schoolReady?'':'disabled'}>레벨 2 · 통학로로 나가기</button><button id="school-reflect">활동 돌아보기</button><button id="school-teacher">교사용 편집</button></div>`, 'wide');
 const opts={state,content,ui,persist,onNext,reflection,teacher};
 root.querySelectorAll('[data-copy-check]').forEach(button=>button.onclick=()=>{
  const id=button.dataset.copyCheck,input=root.querySelector(`[data-rule-input="${CSS.escape(id)}"]`),feedback=root.querySelector(`[data-copy-feedback="${CSS.escape(id)}"]`);
  if(!copyRule(state,id,input.value,content)){feedback.textContent='다시 읽어 볼까요? 빠진 말이 없는지 윗줄과 비교해요.';input.setAttribute('aria-invalid','true');return}
  input.removeAttribute('aria-invalid');button.textContent='✓ 기억했어요';feedback.textContent='✓ 잘 기억했어요! 생활에서도 함께 지켜요.';button.closest('.copy-rule').classList.add('copied');persist();
  if(rulesComplete(state,content)){root.querySelector('#copy-progress').textContent='✓ 네 줄 모두 썼어요! 회의 결과를 확인하고 이번 주 약속을 정해요.';root.querySelector('#read-meeting').disabled=state.journey.briefingRead;if(state.journey.briefingRead)root.querySelector('#weekly-form fieldset').disabled=false;}
 });
 const form=root.querySelector('#weekly-form');
 function selected(){const c=state.journey.checks[form.elements.date.value]||{};form.elements.done.checked=!!c.done;form.elements.note.value=c.note||''}
 selected();form.elements.date.onchange=selected;
 root.querySelector('#read-meeting').onclick=()=>{if(!rulesComplete(state,content))return;markBriefingRead(state);persist();showSchool(opts)};
 form.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));if(!saveSchoolPlan(state,data,content)||!saveWeeklyCheck(state,data.date,{done:form.elements.done.checked,note:data.note})){ui.toast('규칙을 떠올리고 실천 약속과 날짜를 확인해 주세요.');return}persist();showSchool(opts)};
 root.querySelector('#school-next').onclick=onNext;root.querySelector('#school-reflect').onclick=reflection;root.querySelector('#school-teacher').onclick=teacher;
}
