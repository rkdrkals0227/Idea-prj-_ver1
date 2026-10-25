import {test,expect} from '@playwright/test';
import {start,act,close} from './helpers.js';
async function inspect(page,fn){return page.evaluate(async f=>{const m=await import('/src/main.js');return new Function('m',`return (${f})(m)`)(m)},fn.toString())}
test('September chalkboard has four inline copies, safe Korean input and a single current quest',async({page})=>{
 await start(page);await expect(page.locator('#quests [data-level]')).toHaveCount(1);
 await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('#activity-time')).toBeVisible();
 await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('.class-chalkboard')).toContainText('9월');await expect(page.locator('[data-rule-input]')).toHaveCount(4);
 await expect(page.locator('#read-meeting')).toBeDisabled();
 const pos=await inspect(page,m=>m.world.player.position.toArray());
 await page.locator('[data-rule-input]').first().fill('말로 풀기');await page.locator('[data-copy-check]').first().click();
 await expect(page.locator('[data-copy-feedback]').first()).toContainText('다시');
 await page.locator('[data-rule-input]').first().press('w');expect(await inspect(page,m=>m.world.player.position.toArray())).toEqual(pos);
 const rules=await inspect(page,m=>m.content.classRules.rules);
 for(const r of rules){await page.locator(`[data-rule-input="${r.id}"]`).fill(r.text);await page.locator(`[data-copy-check="${r.id}"]`).click()}
 await expect(page.locator('#read-meeting')).toBeEnabled();await page.locator('#read-meeting').click();
 await page.locator('[name="promise"]').fill('친구에게 차분히 말하기');await page.locator('[name="done"]').check();await page.getByRole('button',{name:'계획과 오늘 체크 저장'}).click();
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(true);
 await page.reload();expect(await inspect(page,m=>Object.keys(m.state.journey.ruleCopies).length)).toBe(4);
});
test('lake click opens illustrated book after level2 and reading all pages unlocks quiz',async({page})=>{
 await start(page,3);await inspect(page,m=>{m.world.player.position.set(17,0,-11);m.world.camera.position.set(32,23,14);m.world.camera.lookAt(24,0,-18)});
 const point=await page.evaluate(async()=>{const {world}=await import('/src/main.js'),T=await import('/node_modules/three/build/three.module.js');const p=new T.Vector3(24,.4,-18).project(world.camera),r=world.canvas.getBoundingClientRect();return {x:r.x+(p.x+1)/2*r.width,y:r.y+(1-p.y)/2*r.height}});
 await page.mouse.click(point.x,point.y);await expect(page.locator('.storybook')).toBeVisible();
 await expect(page.locator('#legend-quiz')).toBeDisabled();await expect(page.locator('.story-art svg')).toHaveCount(1);
 for(let i=0;i<5;i++)await page.locator('#legend-next').click();
 await expect(page.locator('#legend-quiz')).toBeDisabled();await page.locator('#legend-next').click();await page.locator('[data-legend-answer="0"]').click();
 expect(await inspect(page,m=>m.state.guardian.legendQuizPassed)).toBe(true);
});
test('expanded multi-row tactile path rejects wrong direction then completes full route',async({page})=>{
 await start(page,2);await act(page,-6,4.7,'활동');await page.locator('#obstacle').click();await page.locator('#check').click();await expect(page.locator('#path-feedback')).toContainText('아직');
 const solution=await inspect(page,m=>m.content.tactile.solution);
 expect(solution.length).toBeGreaterThan(5);await expect(page.locator('.route-grid')).toBeVisible();
 for(let i=0;i<solution.length;i++){
  await page.locator(`[data-type="${i}"]`).selectOption(solution[i].type);
  const rotation=await page.locator(`[data-rotate="${i}"]`).getAttribute('data-direction');
  if(Number(rotation)!==solution[i].rotation%180)await page.locator(`[data-rotate="${i}"]`).click();
 }
 await page.locator('#check').click();expect(await inspect(page,m=>m.state.path)).toBe(true);
});
test('day night is readable, tools collapse and foreground time total restores',async({page})=>{
 test.setTimeout(120000);
 // Playwright forces every tab to report focus by default; restore native tab focus.
 const focusSession=await page.context().newCDPSession(page);await focusSession.send('Emulation.setFocusEmulationEnabled',{enabled:false});
 await page.clock.setFixedTime(new Date('2026-10-24T17:00:00Z'));
 await start(page);await page.locator('#tools-toggle').click();await expect(page.locator('.sidebar')).toBeVisible();await page.locator('[data-page="settings"]').click();await expect(page.locator('.sidebar')).toBeHidden();await close(page);
 const light=await inspect(page,m=>({phase:m.world.dayState.phase,brightness:m.world.hemi.intensity}));
 await expect(page.locator('#day-time')).toContainText('밤');
 expect(light.phase).toBe('night');expect(light.brightness).toBeGreaterThan(.5);
 await expect.poll(()=>inspect(page,m=>m.state.activity.totalMs)).toBeGreaterThan(1000);
 const other=await page.context().newPage();const otherFocus=await page.context().newCDPSession(other);await otherFocus.send('Emulation.setFocusEmulationEnabled',{enabled:false});await other.goto('about:blank');await other.bringToFront();
 await expect.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(false);
 await other.waitForTimeout(1000);const paused=await inspect(page,m=>m.state.activity.totalMs);await other.waitForTimeout(1500);expect(await inspect(page,m=>m.state.activity.totalMs)).toBe(paused);
 await page.bringToFront();await other.close();
 const before=await inspect(page,m=>m.state.activity.totalMs);await page.reload();expect(await inspect(page,m=>m.state.activity.totalMs)).toBeGreaterThanOrEqual(before);
});
test('partly read old school save enables planning immediately after new rule copies',async({page})=>{
 await start(page);await inspect(page,m=>{m.state.journey.briefingRead=true});
 await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('#weekly-form [name=promise]')).toBeDisabled();
 const {copyRules}=await import('./helpers.js');await copyRules(page);
 await expect(page.locator('#weekly-form [name=promise]')).toBeEnabled();
 await page.locator('[name="promise"]').fill('친구를 방해하지 않기');await page.locator('[name="done"]').check();await page.getByRole('button',{name:'계획과 오늘 체크 저장'}).click();
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(true);
});
