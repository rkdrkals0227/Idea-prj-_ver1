import {roadPages} from './road-reading.js';
import {blockPicture} from './road-ui.js';
export function showRoadIntro({state,ui,onRead,onDone}){
 let current=roadPages.findIndex(p=>!state.journey.roadReading?.includes(p.id));if(current<0)current=0;
 function draw(){
  const page=roadPages[current];
  const root=ui.open('레벨 2를 시작하기 전 · 점자블록 알아보기',`<article class="road-reading" data-reading-page="${current}"><p class="eyebrow">먼저 읽어요 · ${current+1} / ${roadPages.length}</p><h3>${page.title}</h3><div class="tactile-examples"><figure>${blockPicture('line',90)}<figcaption>선형 블록 · 방향 안내</figcaption></figure><figure>${blockPicture('dot')}<figcaption>점형 블록 · 주의 안내</figcaption></figure></div><p class="reading-copy">${page.text}</p>${current===2?'<p class="notice">길을 막지 않기 · 불편한 곳은 어른에게 알리기</p>':''}<div class="actions"><button id="road-read-prev" ${current===0?'disabled':''}>앞 설명</button><button id="road-read-next" class="primary">${current===roadPages.length-1?'설명을 읽었어요 · 미션 시작':'읽었어요 · 다음 설명 →'}</button></div><p class="small">설명 세 장을 모두 읽고 확인해야 통학로 활동을 시작할 수 있어요.</p></article>`,'wide');
  root.querySelector('#road-read-prev').onclick=()=>{ui.sound?.('page');current--;draw()};
  root.querySelector('#road-read-next').onclick=()=>{if(!onRead(page.id))return;ui.sound?.('page');if(current===roadPages.length-1){ui.close();onDone?.()}else{current++;draw()}};
 }
 draw();
}
