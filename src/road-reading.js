export const roadPages=[
 {id:'braille-purpose-v1',title:'점자블록은 길을 느끼게 도와줘요',text:'점자블록은 눈으로 길을 보기 어려운 사람이 발바닥이나 흰지팡이로 길을 느끼도록 돕는 바닥 시설이에요. 우리가 함께 쓰는 안전한 길이에요.',picture:'both'},
 {id:'braille-pattern-v1',title:'줄은 방향, 점은 주의를 알려요',text:'줄무늬가 길게 이어진 선형 블록은 이동하는 방향을 안내해요. 점무늬가 있는 점형 블록은 멈추거나 주변을 살펴야 하는 곳을 알려 줘요. 실제 설치 위치는 전문가가 정해요.',picture:'patterns'},
 {id:'braille-care-v1',title:'점자블록 위는 비워 두어요',text:'점자블록 위에 자전거나 쓰레기를 놓으면 길을 찾는 데 방해가 돼요. 망가진 곳은 어른과 담당 기관에 알려요. 게임에서는 함께 고쳐 보지만, 실제 수리는 담당 기관이 해요.',picture:'care'},
];
export function hasReadRoadIntro(state){return roadPages.every(p=>state.journey?.roadReading?.includes(p.id))}
export function readRoadPage(state,id){
 if(!state.journey?.schoolReady)return false;
 const i=roadPages.findIndex(p=>p.id===id);if(i<0||!roadPages.slice(0,i).every(p=>state.journey.roadReading?.includes(p.id)))return false;
 state.journey.roadReading??=[];if(!state.journey.roadReading.includes(id))state.journey.roadReading.push(id);return true;
}
