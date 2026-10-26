import{test,expect}from'@playwright/test';
test('footstep produces an audible short waveform at the default effects volume',async({page})=>{
 await page.goto('/src/audio.js');const measured=await page.evaluate(async()=>{
  const{VillageAudio}=await import('/src/audio.js');const ctx=new OfflineAudioContext(1,11025,22050);Object.defineProperty(ctx,'state',{value:'running'});
  const sound=new VillageAudio();sound.context=ctx;sound.effectsGain=ctx.createGain();sound.effectsGain.gain.value=.65;sound.effectsGain.connect(ctx.destination);const played=sound.play('step');const buffer=await ctx.startRendering(),data=buffer.getChannelData(0),window=data.slice(0,3308);let square=0,peak=0,tail=0;for(const v of window){square+=v*v;peak=Math.max(peak,Math.abs(v))}for(const v of data.slice(6615))tail=Math.max(tail,Math.abs(v));return{played,rms:Math.sqrt(square/window.length),peak,tail};
 });console.log('footstep waveform',JSON.stringify(measured));expect(measured.played).toBe(true);expect(measured.rms).toBeGreaterThan(.03);expect(measured.peak).toBeLessThan(.4);expect(measured.tail).toBeLessThan(.0001);
});

test('walking triggers steps and releasing keys or opening a dialog stops them',async({page})=>{
 const{start,openTools,close}=await import('./helpers.js');await start(page);
 const inspect=fn=>page.evaluate(async f=>{const m=await import([...document.scripts].find(s=>s.src.includes('/src/main.js')).src);return new Function('m',`return (${f})(m)`)(m)},fn.toString());
 await expect.poll(()=>inspect(m=>!!m.sound.source)).toBe(true);expect(await inspect(m=>m.sound.last.has('step'))).toBe(false);
 await page.keyboard.down('d');await expect.poll(()=>inspect(m=>m.sound.last.has('step'))).toBe(true);await page.keyboard.up('d');await page.waitForTimeout(400);const last=await inspect(m=>m.sound.last.get('step'));await page.waitForTimeout(500);expect(await inspect(m=>m.sound.last.get('step'))).toBe(last);
 await openTools(page);await page.locator('[data-page="settings"]').click();await page.keyboard.press('d');await page.waitForTimeout(400);expect(await inspect(m=>m.sound.last.get('step'))).toBe(last);await close(page);
 await page.keyboard.down('d');await expect.poll(()=>inspect(m=>m.sound.last.get('step'))).toBeGreaterThan(last);await page.keyboard.up('d');
});
