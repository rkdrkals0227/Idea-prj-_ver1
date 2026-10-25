import {test} from 'node:test';import assert from 'node:assert/strict';
import {initialState} from '../src/logic.js';import {defaults} from '../src/data/content.js';import {copyRule} from '../src/classroom.js';import {journeyLevel} from '../src/journey.js';import * as hints from '../src/hints.js';import {roadPages} from '../src/road-reading.js';
test('typing all rules alone completes school immediately and repeated answers do not change progress',()=>{
 const s=initialState(),rules=defaults.classRules.rules;for(const r of rules.slice(0,3))copyRule(s,r.id,r.text,defaults);assert.equal(journeyLevel(s),1);
 copyRule(s,rules[3].id,'4. '+rules[3].text+'.',defaults);assert.equal(journeyLevel(s),2);assert.deepEqual(s.journey.checks,{});assert.equal(s.journey.plan.promise,'');
 copyRule(s,rules[3].id,rules[3].text,defaults);assert.equal(journeyLevel(s),2);
});
test('minute hints defer during editors, reset per level and stop after success without catchup spam',()=>{
 const r=new hints.MissionReminders();assert.equal(r.poll(0,1,true),false);assert.equal(r.poll(59999,1,true),false);assert.equal(r.poll(60000,1,true),true);assert.equal(r.poll(60001,1,true),false);
 assert.equal(r.poll(120000,1,false),false);assert.equal(r.poll(140000,1,true),true);assert.equal(r.poll(140001,2,true),false);assert.equal(r.poll(200001,2,true),true);
 assert.equal(r.poll(260001,4,true),false);assert.equal(r.poll(999999,4,true),false);assert.equal(r.poll(0,2,true),false);
});
test('hints tell the current destination and action, including bag sorting and final success',()=>{
 const s=initialState();assert.match(hints.missionHint(s,defaults,null),/학교.*E/);assert.match(hints.missionHint(s,defaults,'school'),/칠판.*타자/);
 s.journey.schoolReady=true;assert.match(hints.missionHint(s,defaults,null),/점자블록/);s.journey.roadReading=roadPages.map(p=>p.id);s.path=true;s.completed=['path'];assert.match(hints.missionHint(s,defaults,null),/아파트.*쓰레기/);
 s.collected=defaults.waste.filter(w=>w.zone==='village').map(w=>w.id);assert.match(hints.missionHint(s,defaults,null),/가방.*분류/);s.completed.push('trash');assert.match(hints.missionHint(s,defaults,null),/금호지.*이야기/);
 s.guardian.legendQuizPassed=true;assert.equal(hints.missionHint(s,defaults,null),null);
});
