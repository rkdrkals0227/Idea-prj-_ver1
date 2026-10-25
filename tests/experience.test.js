import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as classroom from '../src/classroom.js';
import * as experience from '../src/experience.js';
import {defaults} from '../src/data/content.js';
import {initialState,pathValid} from '../src/logic.js';
import {upgradeQuizContent} from '../src/data/learning.js';
test('four actual September rules require each complete sentence, tolerate Korean spacing and preserve completed saves',()=>{
 const s=initialState(),rules=defaults.classRules.rules;
 assert.equal(rules.length,4);assert.equal(defaults.classRules.month,'9월');
 assert.equal(classroom.rulesComplete(s,defaults),false);
 assert.equal(classroom.copyRule(s,rules[0].id,'말로 풀기',defaults),false);
 for(const r of rules)assert.equal(classroom.copyRule(s,r.id,r.text.replaceAll(' ','').replaceAll(',',''),defaults),true);
 assert.equal(classroom.rulesComplete(s,defaults),true);
 const c=structuredClone(defaults);c.classRules.rules[0].text+=' 약속';assert.equal(classroom.rulesComplete(s,c),false);
 assert.equal(classroom.copyRule(s,rules[0].id,'<script>'+rules[0].text,defaults),false);
});
test('old teacher material receives provided rules without overwriting custom rules or September labels',()=>{
 const old=structuredClone(defaults);delete old.classRules;assert.equal(upgradeQuizContent(old).classRules.rules.length,4);
 old.classRules={month:'우리 반',rules:[{id:'custom',group:'우리',text:'친구 이야기 듣기'}]};assert.equal(upgradeQuizContent(old).classRules.rules[0].id,'custom');
});
test('Korean real time has readable night, day, sunset and midnight phases',()=>{
 assert.equal(experience.dayPhase(new Date('2026-10-25T03:00:00Z')).phase,'day');
 assert.equal(experience.dayPhase(new Date('2026-10-24T17:00:00Z')).phase,'night');
 assert.equal(experience.dayPhase(new Date('2026-10-25T09:00:00Z')).phase,'dusk');
 assert.ok(experience.dayPhase(new Date('2026-10-24T17:00:00Z')).light>0);
});
test('foreground activity pauses in background, survives total restoration and uses monotonic elapsed time',()=>{
 const state={totalMs:5000},c=new experience.ActivityClock(state,0);
 c.tick(1000,true);c.tick(11000,false);assert.equal(state.totalMs,15000);
 c.tick(71000,false);assert.equal(state.totalMs,15000);
 c.tick(72000,true);c.tick(74000,false);assert.equal(state.totalMs,17000);
 assert.equal(c.sessionMs,12000);assert.equal(experience.formatDuration(state.totalMs),'00:17');
 const restored=new experience.ActivityClock(state,0);assert.equal(restored.sessionMs,0);assert.equal(restored.totalMs,17000);
});
test('default tactile route spans multiple rows and rejects wrong direction and missing cells',()=>{
 const t=defaults.tactile.solution;
 assert.ok(t.length>5);assert.ok(new Set(t.map(x=>x.row)).size>=3);
 assert.equal(pathValid(t,t,false),true);const wrong=structuredClone(t);wrong.find(x=>x.type==='line'&&x.rotation===90).rotation=0;
 assert.equal(pathValid(wrong,t,false),false);assert.equal(pathValid(t.slice(1),t,false),false);
 for(let i=1;i<t.length;i++)assert.equal(Math.abs(t[i].col-t[i-1].col)+Math.abs(t[i].row-t[i-1].row),1);
});
test('only untouched old tactile defaults migrate; teacher tile edits survive even with old explanation',()=>{
 const oldText='게임용 직선 연결 체험이에요. 실제 시설 수리는 담당 기관이 해요. 선형은 방향을 안내하고 점형은 주의를 알리는 역할을 해요. 아래 배치는 실제 시공 기준이 아니며 교사의 검토가 필요해요.';
 const c=structuredClone(defaults);c.tactile={text:oldText,solution:[{type:'dot',rotation:0},{type:'line',rotation:90},{type:'line',rotation:90},{type:'line',rotation:90},{type:'dot',rotation:0}]};
 assert.deepEqual(upgradeQuizContent(c).tactile,c.tactile);
 c.tactile.solution.forEach(t=>t.rotation=0);assert.equal(upgradeQuizContent(c).tactile.solution.length,11);
});
test('route imports reject HTML dimension payloads, out of range and disconnected or wrong-facing cells',async()=>{
 const api=await import('../src/tactile.js');assert.equal(typeof api.validateTactile,'function');
 assert.doesNotThrow(()=>api.validateTactile(defaults.tactile));
 for(const patch of [{cols:'5" onpointerover="alert(1)'},{rows:999},{solution:defaults.tactile.solution.map((t,i)=>i===1?{...t,row:'1" onmouseover="alert(1)'}:t)},{solution:defaults.tactile.solution.map((t,i)=>i===1?{...t,rotation:0}:t)}])assert.throws(()=>api.validateTactile({...structuredClone(defaults.tactile),...patch}));
});
