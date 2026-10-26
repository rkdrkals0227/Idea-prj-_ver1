import{test}from'node:test';import assert from'node:assert/strict';import{VillageAudio}from'../src/audio.js';
test('music fallback works without AbortSignal.timeout and concurrent requests start only one loop',async()=>{
 const timeout=AbortSignal.timeout,fetch=globalThis.fetch;let requests=0,starts=0;try{
  AbortSignal.timeout=undefined;globalThis.fetch=async url=>{requests++;return{ok:url.endsWith('.wav'),arrayBuffer:async()=>new ArrayBuffer(1)}};
  const sound=new VillageAudio();sound.context={decodeAudioData:async()=>({duration:45}),createBufferSource:()=>({connect(){},start(){starts++}})};
  await Promise.all([sound.loadMusic(),sound.loadMusic()]);assert.equal(requests,2);assert.equal(starts,1);assert.equal(sound.source.loop,true);
 }finally{AbortSignal.timeout=timeout;globalThis.fetch=fetch}
});
test('failed music load can retry instead of retaining a rejected loading promise',async()=>{
 const fetch=globalThis.fetch;let failed=true;try{globalThis.fetch=async()=>({ok:!failed,arrayBuffer:async()=>new ArrayBuffer(1)});const messages=[],sound=new VillageAudio({report:m=>messages.push(m)});sound.context={decodeAudioData:async()=>({duration:45}),createBufferSource:()=>({connect(){},start(){}})};await sound.loadMusic();assert.equal(sound.source,null);assert.equal(sound.loading,null);assert.equal(messages.length,1);failed=false;await sound.loadMusic();assert.equal(sound.source.loop,true)}finally{globalThis.fetch=fetch}
});
