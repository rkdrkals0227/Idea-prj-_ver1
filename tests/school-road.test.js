import {test} from 'node:test';import assert from 'node:assert/strict';
import {initialState} from '../src/logic.js';import {defaults} from '../src/data/content.js';import {copyRule} from '../src/classroom.js';import {upgradeQuizContent} from '../src/data/learning.js';import * as tactile from '../src/tactile.js';
import {readFileSync} from 'node:fs';const manifest=JSON.parse(readFileSync(new URL('../src/data/asset-manifest.json',import.meta.url)));
test('numbered rule answers ignore spacing and punctuation, but keep all words',()=>{
 const s=initialState(),r=defaults.classRules.rules[0];
 for(const text of ['1. 싸울 경우, 말로 풀기.','１） 싸울 경우 말로 풀기!','① 싸울 경우 : 말로 풀기','1번. 싸울 경우, 말로 풀기','  싸울경우말로풀기... '])assert.equal(copyRule(s,r.id,text,defaults),true,text);
 for(const text of ['1. 싸울 경우 말로','1. 싸울 경우 말로 풀기 안 하기','<script>싸울 경우 말로 풀기'])assert.equal(copyRule(s,r.id,text,defaults),false,text);
});
test('class attribution credits 4-4 pupils, migrates only old default and keeps custom sources',()=>{
 assert.match(defaults.classRules.source,/4-4반 아이들/);const c=structuredClone(defaults);c.classRules.source='선생님이 제공한 학급 회의 결과';assert.match(upgradeQuizContent(c).classRules.source,/4-4반 아이들/);
 c.classRules.source='우리 모둠의 새 회의';assert.equal(upgradeQuizContent(c).classRules.source,c.classRules.source);
});
test('world tactile route joins actual school and apartment entrances without gaps',()=>{
 assert.equal(typeof tactile.schoolRoadRoute,'function');const route=tactile.schoolRoadRoute(manifest);assert.ok(route.length>30);
 assert.equal(route[0].x,manifest.school.position[0]);assert.ok(Math.abs(route[0].z-(-1))<.01);
 assert.equal(route.at(-1).x,manifest.apartment.position[0]);assert.ok(Math.abs(route.at(-1).z-(manifest.apartment.position[2]+manifest.apartment.collision[1]/2+1.8))<.01);
 for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z)<=.901);
 assert.equal(route.filter(x=>x.type==='dot').length,3);
});
test('meaningful numeric rule content must match even when an extra list number is allowed',()=>{
 const c=structuredClone(defaults);c.classRules.rules=[{id:'number-rule',group:'우리 반',text:'하루 2번 손 씻기'}];const s=initialState();
 assert.equal(copyRule(s,'number-rule','1. 하루 2번 손 씻기.',c),true);
 assert.equal(copyRule(s,'number-rule','하루 3번 손 씻기',c),false);
 assert.equal(copyRule(s,'number-rule','하루 번 손 씻기',c),false);
 c.classRules.rules[0].text='2명씩 줄 서기';assert.equal(copyRule(s,'number-rule','1. 2명씩 줄 서기.',c),true);assert.equal(copyRule(s,'number-rule','3명씩 줄 서기',c),false);
});
