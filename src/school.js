import {escapeHTML as h} from './logic.js';
import {copyRule,completeSchoolTyping,normalizeRule} from './classroom.js';
export function showSchool({state,content,ui,persist,onNext}) {
 const rules=content.classRules.rules;
 const wasReady=state.journey.schoolReady;
 completeSchoolTyping(state,content);
 if(!wasReady&&state.journey.schoolReady)persist();
 const copied=r=>normalizeRule(state.journey.ruleCopies?.[r.id])===normalizeRule(r.text);
 const root=ui.open('레벨 1 · 우리 반 규칙 타이핑',`
 <div class="class-chalkboard"><span class="chalk-date">${h(content.classRules.month)} · 학급 회의 결과</span><h3>우리 반이 함께 정한 규칙</h3>
 <p class="chalk-sub">${h(content.classRules.source||'우리 학급 회의 결과')}<br>각 문장 바로 아래에 따라 써요. 네 줄을 모두 맞히면 바로 완료!</p>
 ${rules.map((r,i)=>`<section class="copy-rule ${copied(r)?'copied':''}"><span class="rule-group">${h(r.group)}</span><p class="rule-sentence">${i+1}. ${h(r.text)}</p><label for="rule-${h(r.id)}" class="sr-only">${h(r.text)} 따라 쓰기</label><div class="copy-line"><input id="rule-${h(r.id)}" data-rule-input="${h(r.id)}" value="${copied(r)?h(r.text):''}" ${copied(r)?'readonly':''} maxlength="150" autocomplete="off" spellcheck="false" placeholder="윗줄의 규칙을 여기에 써 보세요"></div><small data-copy-feedback="${h(r.id)}" role="status">${copied(r)?'✓ 잘 기억했어요!':''}</small></section>`).join('')}</div>
 <p id="copy-progress" class="small">앞의 번호·띄어쓰기·문장부호는 달라도 괜찮아요.</p>
 <div id="school-feedback" class="feedback" role="status"></div>
 <div class="actions"><button id="school-next" class="primary" ${state.journey.schoolReady?'':'disabled'}>레벨 2 · 통학로로 나가기</button></div>`, 'wide');
 function progress(){
  const n=rules.filter(copied).length;
  root.querySelector('#copy-progress').textContent=`${n} / ${rules.length}줄 확인 · 번호·띄어쓰기·문장부호는 달라도 괜찮아요.`;
  root.querySelector('#school-feedback').textContent=state.journey.schoolReady?'✓ 미션 클리어! 규칙을 모두 익혔어요. 이제 레벨 2로 나가 볼까요?':'윗줄을 보고 한 문장씩 타자로 써 보세요.';
  root.querySelector('#school-next').disabled=!state.journey.schoolReady;
 }
 for(const input of root.querySelectorAll('[data-rule-input]')){
  let composing=false;
  const validate=()=>{
   if(composing||input.readOnly)return;
   const id=input.dataset.ruleInput,feedback=root.querySelector(`[data-copy-feedback="${CSS.escape(id)}"]`),wasReady=state.journey.schoolReady;
   if(!copyRule(state,id,input.value,content)){feedback.textContent=input.value?'윗줄을 보고 천천히 이어 써요.':'';return}
   input.readOnly=true;input.closest('.copy-rule').classList.add('copied');feedback.textContent='✓ 잘 기억했어요!';persist();progress();
   if(!wasReady&&state.journey.schoolReady)ui.toast('미션 1 클리어! 규칙 네 줄을 모두 맞혔어요.');
  };
  input.addEventListener('compositionstart',()=>{composing=true});
  input.addEventListener('compositionend',()=>{composing=false;validate()});
  input.addEventListener('input',e=>{if(!e.isComposing)validate()});
 }
 root.querySelector('#school-next').onclick=onNext;
 progress();
}
