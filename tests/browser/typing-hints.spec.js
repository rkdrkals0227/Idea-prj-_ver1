import {test,expect} from '@playwright/test';import {start,act,copyRules,close} from './helpers.js';
async function inspect(p,fn){return p.evaluate(async f=>{const m=await import('/src/main.js');return new Function('m',`return (${f})(m)`)(m)},fn.toString())}
test('level1 has only typing and clears immediately after final committed Korean answer',async({page})=>{
 await start(page);await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('#weekly-form,#read-meeting,.example-meeting,#school-teacher,#school-reflect')).toHaveCount(0);
 const rules=await inspect(page,m=>m.content.classRules.rules);
 for(const r of rules.slice(0,3))await page.locator(`[data-rule-input="${r.id}"]`).fill('1. '+r.text+'.');
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(false);
 await page.locator(`[data-rule-input="${rules[3].id}"]`).evaluate((el,text)=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));el.value=text;el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}))},rules[3].text);
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(false);
 await page.locator(`[data-rule-input="${rules[3].id}"]`).dispatchEvent('compositionend');await expect(page.locator('#school-feedback')).toContainText('미션 클리어');await expect(page.locator('#level-title')).toContainText('레벨 2');
 await page.reload();await expect(page.locator('#level-title')).toContainText('레벨 1');expect(await inspect(page,m=>m.state.journey.checks)).toEqual({});
});
test('minute status says where and how, pauses in typing modal and uses the new level',async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await start(page);await page.clock.fastForward(61000);
 await expect(page.locator('#mission-reminder')).toBeVisible();await expect(page.locator('#mission-reminder-text')).toContainText('학교');await expect(page.locator('#mission-reminder-text')).toContainText('E키');
 // Under fast-forward, teleport fixtures publish proximity before pressing the real E key.
 await inspect(page,m=>{m.world.player.position.set(-10,0,-1);m.world.updateNearby()});await page.keyboard.press('e');
 await inspect(page,m=>{m.world.player.position.set(0,0,-4);m.world.updateNearby()});await page.keyboard.press('e');await expect(page.locator('.class-chalkboard')).toBeVisible();await page.clock.fastForward(61000);await expect(page.locator('#mission-reminder')).toBeHidden();await copyRules(page);await close(page);await page.clock.fastForward(61000);
 await expect(page.locator('#mission-reminder-text')).toContainText('레벨 2');await expect(page.locator('#mission-reminder-text')).toContainText('점자블록');
});
