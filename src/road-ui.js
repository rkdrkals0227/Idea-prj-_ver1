import {createRoadLesson,chooseRoadStep,roadLessonComplete} from './road-lesson.js';
import {escapeHTML as h} from './logic.js';
export function blockPicture(type,rotation=0){
 if(type==='empty')return '<span class="road-empty" aria-label="빈칸">?</span>';
 const shape=type==='dot'?Array.from({length:9},(_,i)=>`<circle cx="${30+i%3*30}" cy="${30+Math.floor(i/3)*30}" r="9" fill="#b98a2f"/>`).join(''):`<g transform="rotate(${rotation} 60 60)">${[30,60,90].map(y=>`<path d="M18 ${y}H102" stroke="#b98a2f" stroke-width="13" stroke-linecap="round"/>`).join('')}</g>`;
 return `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="3" y="3" width="114" height="114" rx="17" fill="#f5d483" stroke="#d8ad58" stroke-width="5"/>${shape}</svg>`;
}
export function showRoadLesson({tactile,ui,onComplete,onExit}){
 const lesson=createRoadLesson(tactile),root=ui.open('점자블록 · 그림을 보며 한 단계씩', '', 'wide');
 let awarded=false;
 const norm=n=>((n%180)+180)%180;
 function demo(type,rotation,middle){
  const vertical=type==='line'&&norm(rotation)===90;
  const describe=t=>t.type==='empty'?'빈칸':t.type==='dot'?'점무늬 블록':`${norm(t.rotation)===90?'위아래로':'옆으로'} 줄무늬 블록`;
  const description=[{type,rotation},middle,{type,rotation}].map(describe).join(', ');
  return `<div class="road-demo-wrap"><p class="walking-arrow">걷는 방향 ${vertical?'↑ 위아래':'→ 옆으로'}</p><div class="road-demo ${vertical?'vertical':''}" role="img" aria-label="${description}"><span>${blockPicture(type,rotation)}</span><span class="road-target">${blockPicture(middle.type,middle.rotation)}<small>여기를 살펴봐요</small></span><span>${blockPicture(type,rotation)}</span></div></div>`;
 }
 function draw(){
  const steps=['길 비우기','무늬 고르기',...(lesson.directionIndex>=0?['방향 맞추기']:[])];
  const progress=`<ol class="road-steps">${steps.map((s,i)=>`<li class="${lesson.stage>i?'done':lesson.stage===i?'active':''}">${lesson.stage>i?'✓':i+1} ${s}</li>`).join('')}</ol>`;
  let html='';
  if(lesson.stage===0)html=`<h3 class="road-question">먼저 길을 막은 상자를 치워요.</h3><p>친구가 지나갈 수 있도록 상자를 길 옆으로 옮겨 주세요.</p><div class="road-obstacle-picture" aria-hidden="true"><span>🏫</span>${blockPicture('line')}<span class="road-crate">▣</span>${blockPicture('line')}<span>🏘️</span></div><button id="obstacle" class="primary big-road-action">상자를 옆으로 옮기기 →</button>`;
  else if(lesson.stage===1){
   const target=lesson.solution[lesson.gapIndex];
   html=`<h3 class="road-question">빈칸에는 어떤 무늬가 들어갈까요?</h3><p>양옆 블록과 <b>같은 무늬</b>를 골라 길을 이어요.</p>${demo(target.type,target.rotation,{type:'empty'})}<div class="road-choices">${['line','dot'].map(type=>`<button data-road-shape="${type}">${blockPicture(type,target.rotation)}<b>${type==='line'?'줄무늬 블록':'점무늬 블록'}</b></button>`).join('')}</div>`;
  }else if(lesson.stage===2){
   const target=lesson.solution[lesson.directionIndex],angle=norm(target.rotation);
   html=`<h3 class="road-question">화살표와 나란한 줄무늬를 골라요.</h3><p>줄무늬가 걷는 방향을 알려 줘요. <b>${angle===90?'위아래 ↑':'옆으로 →'}</b> 이어지는 그림을 찾아요.</p>${demo('line',angle,lesson.tiles[lesson.directionIndex])}<div class="road-choices">${[0,90].map(rotation=>`<button data-road-direction="${rotation}">${blockPicture('line',rotation)}<b>${rotation===90?'위아래로 놓기 ↑':'옆으로 놓기 →'}</b></button>`).join('')}</div>`;
  }else html='<div id="road-success" class="road-success"><span aria-hidden="true">✓</span><h3>점자블록 수리 완료!</h3><p>학교에서 아파트까지 길이 이어졌어요.<br>이제 주변 쓰레기도 모아 분리배출해 볼까요?</p><button id="road-finish" class="primary">마을로 돌아가기</button></div>';
  root.innerHTML=`${progress}${html}<p id="path-feedback" class="road-feedback" role="status"></p><p class="small road-note">게임 속 체험이에요. 실제로 고칠 곳은 어른과 담당 기관에 알려요.</p><details class="road-more"><summary>점자블록 더 알아보기</summary><p class="small">${h(tactile.text)}</p></details>`;
  root.querySelector('#obstacle')?.addEventListener('click',()=>choose('clear'));
  root.querySelectorAll('[data-road-shape]').forEach(b=>b.onclick=()=>choose('shape',b.dataset.roadShape));
  root.querySelectorAll('[data-road-direction]').forEach(b=>b.onclick=()=>choose('direction',Number(b.dataset.roadDirection)));
  root.querySelector('#road-finish')?.addEventListener('click',onExit);
 }
 function choose(action,value){
  if(!chooseRoadStep(lesson,action,value)){
   ui.sound?.('wrong');root.querySelector('#path-feedback').textContent=lesson.stage===1?'다시 살펴볼까요? 양옆과 같은 무늬를 골라요.':'화살표와 줄무늬가 같은 방향인지 비교해 보세요.';return;
  }
  if(action!=='clear')ui.sound?.('correct');
  if(roadLessonComplete(lesson)&&!awarded){awarded=true;onComplete()}
  draw();
  root.querySelector('[data-road-shape],[data-road-direction],#road-finish')?.focus();
 }
 draw();
}
