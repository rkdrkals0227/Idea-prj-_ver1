import{test}from'node:test';import assert from'node:assert/strict';import{initialState}from'../src/logic.js';import{freshRun}from'../src/play-session.js';
test('fresh run clears completed lessons and personal activity but retains independent preferences',()=>{
 const old=initialState();old.journey.schoolReady=true;old.journey.roadReading=['read'];old.journey.sessionEnded=true;old.guardian.legendQuizPassed=true;old.completed=['path','trash'];old.collected=['can'];old.sorted=['paper'];old.path=true;old.letters=[{id:'old'}];old.letterDraft={free:'이전 학생'};old.read=['library:old'];old.reflections=[{problem:'x'}];old.activity.totalMs=50000;old.welcomed=true;old.settings={mapZoom:2,quality:'low',font:1.3,motion:true,sound:true,artLimit:15,displayName:'alias'};
 const next=freshRun(old),expected=initialState();expected.settings={...old.settings};assert.deepEqual(next,expected);next.settings.sound=false;assert.equal(old.settings.sound,true);assert.equal(old.journey.schoolReady,true);assert.equal(next.journey.sessionEnded,false);
});
test('fresh run uses safe defaults for absent or invalid settings',()=>{
 assert.deepEqual(freshRun(null),initialState());const next=freshRun({settings:{quality:'huge',font:99,artLimit:0,displayName:'html',motion:'yes',sound:'true'}});assert.deepEqual(next,initialState());assert.equal(freshRun({settings:{font:'1.15'}}).settings.font,1.15);
});
