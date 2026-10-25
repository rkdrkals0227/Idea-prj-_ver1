import {pathValid} from './logic.js';
import {validateTactile} from './tactile.js';
export function createRoadLesson(tactile){
 validateTactile(tactile);
 const solution=structuredClone(tactile.solution),norm=n=>((n%180)+180)%180;
 let gapIndex=solution.findIndex(t=>t.type==='line'&&norm(t.rotation)===0);
 if(gapIndex<0)gapIndex=solution.findIndex(t=>t.type==='line');if(gapIndex<0)gapIndex=0;
 let directionIndex=solution.findIndex((t,i)=>t.type==='line'&&norm(t.rotation)===90&&i!==gapIndex);
 if(directionIndex<0)directionIndex=solution.findIndex(t=>t.type==='line');
 const tiles=structuredClone(solution);tiles[gapIndex].type='empty';
 if(directionIndex>=0)tiles[directionIndex].rotation=solution[directionIndex].rotation+90;
 return {solution,tiles,gapIndex,directionIndex,blocked:true,stage:0};
}
export function chooseRoadStep(lesson,action,value){
 if(lesson.stage===0&&action==='clear'){lesson.blocked=false;lesson.stage=1;return true}
 if(lesson.stage===1&&action==='shape'&&value===lesson.solution[lesson.gapIndex].type){
  lesson.tiles[lesson.gapIndex].type=value;lesson.stage=lesson.directionIndex<0?3:2;return true;
 }
 if(lesson.stage===2&&action==='direction'){
  const desired=((lesson.solution[lesson.directionIndex].rotation%180)+180)%180;
  if(value!==desired)return false;
  lesson.tiles[lesson.directionIndex].rotation=lesson.solution[lesson.directionIndex].rotation;lesson.stage=3;return true;
 }
 return false;
}
export function roadLessonComplete(lesson){return lesson.stage===3&&pathValid(lesson.tiles,lesson.solution,lesson.blocked)}
export function villageReadyToSort(state,content){
 const required=content.waste.filter(w=>w.zone==='village');
 return !state.completed.includes('trash')&&required.length>0&&required.every(w=>state.collected.includes(w.id)||state.sorted.includes(w.id))&&required.some(w=>state.collected.includes(w.id)&&!state.sorted.includes(w.id));
}
