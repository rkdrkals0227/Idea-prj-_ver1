import {journeyLevel} from './journey.js';
import {hasReadRoadIntro} from './road-reading.js';
export class MissionReminders {
 constructor(intervalMs=60000){this.intervalMs=intervalMs;this.level=null;this.lastMs=0}
 poll(activeMs,level,eligible){
  if(this.level!==level||activeMs<this.lastMs){this.level=level;this.lastMs=activeMs;return false}
  if(level>=4||!eligible||activeMs-this.lastMs<this.intervalMs)return false;
  this.lastMs=activeMs;return true;
 }
}
export function missionHint(state,content,indoor){
 const level=journeyLevel(state);
 if(level>=4)return null;
 if(level===1)return indoor==='school'
  ? '레벨 1 · 교실 앞 칠판에서 E키를 눌러 규칙 네 줄을 타자로 써 보세요. 네 줄을 모두 맞히면 바로 미션 클리어!'
  : '레벨 1 · 금호초등학교 문 앞에서 E키로 들어가세요. 교실 앞 칠판에서 E키를 누르고 규칙 네 줄을 타자로 맞히면 완료돼요.';
 const exit=indoor?'먼저 실내 출구에서 E키로 마을로 나가요. ':'';
 if(level===2){
  if(!hasReadRoadIntro(state))return exit+'레벨 2 · 학교 앞 점자블록에서 E키를 눌러 점자블록 설명 세 장을 먼저 읽어요. 설명을 모두 확인하면 미션이 열려요.';
  if(!state.path)return exit+'레벨 2 · 학교 앞 점자블록의 끊어진 곳에 가까이 가서 E키를 눌러요. 상자를 치우고 그림 두 개 중 같은 무늬·화살표 방향을 골라요.';
  const remaining=content.waste.filter(w=>w.zone==='village'&&!state.sorted.includes(w.id));
  if(remaining.some(w=>!state.collected.includes(w.id)))return exit+'레벨 2 · 햇살 아파트 앞 길에서 쓰레기를 찾아 가까이에서 E키로 주워요. 모두 모으면 분리배출 화면이 바로 열려요.';
  return exit+'레벨 2 · 주운 쓰레기를 분류할 차례예요. 탐험 도구 → 내 가방 → 쓰레기 분류하기에서 각 물건의 재질을 골라요.';
 }
 if(level===3){
  const read=content.guardianLegend.pages.every(p=>state.guardian.legendSeen.includes(p.id));
  return exit+(read?'레벨 3 · 금호지를 눌러 이야기책을 다시 열고 전설 퀴즈에 도전해요. 틀려도 다시 고를 수 있어요.':'레벨 3 · 금호지로 가서 호수를 누르거나 가까이에서 E키를 눌러요. 두 용 이야기책을 끝까지 읽고 전설 퀴즈를 맞혀 보세요.');
 }
 return null;
}
