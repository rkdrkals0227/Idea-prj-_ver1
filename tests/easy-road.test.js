import {test} from 'node:test';import assert from 'node:assert/strict';import * as easy from '../src/road-lesson.js';import {initialState,pathValid} from '../src/logic.js';import {defaults} from '../src/data/content.js';
test('guided repair requires clearing, correct shape and correct direction before completing the full route',()=>{
 const l=easy.createRoadLesson(defaults.tactile);assert.equal(easy.roadLessonComplete(l),false);assert.equal(easy.chooseRoadStep(l,'shape','line'),false);assert.equal(easy.chooseRoadStep(l,'clear'),true);
 assert.equal(easy.chooseRoadStep(l,'shape','dot'),false);assert.equal(l.stage,1);assert.equal(easy.chooseRoadStep(l,'shape','line'),true);assert.equal(easy.chooseRoadStep(l,'direction',0),false);
 assert.equal(easy.chooseRoadStep(l,'direction',90),true);assert.equal(easy.roadLessonComplete(l),true);assert.equal(pathValid(l.tiles,l.solution,l.blocked),true);assert.equal(easy.chooseRoadStep(l,'direction',90),false);
});
test('teacher dot-only routes do not ask an impossible line rotation question',()=>{
 const l=easy.createRoadLesson({text:'교사 구성',solution:[{type:'dot',rotation:0},{type:'dot',rotation:0}]});easy.chooseRoadStep(l,'clear');assert.equal(easy.chooseRoadStep(l,'shape','line'),false);easy.chooseRoadStep(l,'shape','dot');assert.equal(easy.roadLessonComplete(l),true);
});
test('automatic village sorting waits for every required ID and never opens for completed or empty missions',()=>{
 const s=initialState();assert.equal(easy.villageReadyToSort(s,defaults),false);s.collected=['can','paper','lake-can'];assert.equal(easy.villageReadyToSort(s,defaults),false);s.collected.push('bottle');assert.equal(easy.villageReadyToSort(s,defaults),true);
 s.sorted=['can'];s.collected=['paper','bottle'];assert.equal(easy.villageReadyToSort(s,defaults),true);s.completed=['trash'];assert.equal(easy.villageReadyToSort(s,defaults),false);s.completed=[];assert.equal(easy.villageReadyToSort(s,{waste:[]}),false);
});
test('teacher negative rotations remain solvable after pictured normalized-direction choices',()=>{
 for(const rotation of [-90,-270]){
  const l=easy.createRoadLesson({text:'교사 세로 길',solution:[{type:'dot',rotation:0},{type:'line',rotation},{type:'dot',rotation:0}]});
  easy.chooseRoadStep(l,'clear');easy.chooseRoadStep(l,'shape','line');assert.equal(easy.chooseRoadStep(l,'direction',90),true);assert.equal(easy.roadLessonComplete(l),true);
 }
});
