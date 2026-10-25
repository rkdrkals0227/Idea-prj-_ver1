import {test,expect} from '@playwright/test';
import {start,act,close} from './helpers.js';
async function inspect(page,fn){return page.evaluate(async f=>{const m=await import('/src/main.js');return new Function('m',`return (${f})(m)`)(m)},fn.toString())}
test('September chalkboard has four inline copies, safe Korean input and a single current quest',async({page})=>{
 await start(page);await expect(page.locator('#quests [data-level]')).toHaveCount(1);
 await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('#activity-time')).toBeVisible();
 await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('.class-chalkboard')).toContainText('9월');await expect(page.locator('[data-rule-input]')).toHaveCount(4);
 await expect(page.locator('#school-next')).toBeDisabled();
 const pos=await inspect(page,m=>m.world.player.position.toArray());
 await page.locator('[data-rule-input]').first().fill('말로 풀기');
 await expect(page.locator('[data-copy-feedback]').first()).toContainText('윗줄');
 await page.locator('[data-rule-input]').first().press('w');expect(await inspect(page,m=>m.world.player.position.toArray())).toEqual(pos);
 const rules=await inspect(page,m=>m.content.classRules.rules);
 for(const r of rules){await page.locator(`[data-rule-input="${r.id}"]`).fill(r.text)}
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(true);
 await page.reload();expect(await inspect(page,m=>Object.keys(m.state.journey.ruleCopies).length)).toBe(0);
});
test('lake click opens illustrated book after level2 and reading all pages unlocks quiz',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:1200,height:900});
 await start(page,3);await inspect(page,m=>{m.world.player.position.set(17,0,-11);m.world.camera.position.set(32,23,14);m.world.camera.lookAt(24,0,-18)});
 const point=await page.evaluate(async()=>{const {world}=await import('/src/main.js'),T=await import('/node_modules/three/build/three.module.js');const p=new T.Vector3(24,.4,-18).project(world.camera),r=world.canvas.getBoundingClientRect();return {x:r.x+(p.x+1)/2*r.width,y:r.y+(1-p.y)/2*r.height}});
 await page.mouse.click(point.x,point.y);await expect(page.locator('.storybook')).toBeVisible();
 await expect(page.locator('#legend-quiz')).toBeDisabled();await expect(page.locator('.story-atlas.ready')).toHaveCount(1);await expect(page.locator('.story-atlas')).toHaveCSS('opacity','1');
 const sizing=await page.locator('.story-scene').evaluate(e=>({scene:e.clientWidth,atlas:e.querySelector('img').getBoundingClientRect().width}));expect(Math.abs(sizing.atlas-sizing.scene*3)).toBeLessThan(1);
 await page.evaluate(()=>document.fonts.load('22px "Geumho Jua"'));expect(await page.evaluate(()=>document.fonts.check('22px "Geumho Jua"'))).toBe(true);
 await expect(page.locator('.story-scene')).toHaveAttribute('aria-label',/청룡과 황룡이 만나요/);
 await page.screenshot({path:'docs/illustrated-lake-book.png'});
 for(let i=1;i<6;i++){await page.locator('#legend-next').click();await expect(page.locator('.story-scene')).toHaveAttribute('data-story-scene',String(i));await expect(page.locator('.story-atlas.ready')).toHaveCount(1)}
 await page.locator('#legend-prev').click();await expect(page.locator('.story-scene')).toHaveAttribute('data-story-scene','4');await expect(page.locator('#legend-text')).toContainText('황룡');await page.locator('#legend-next').click();
 await expect(page.locator('#legend-quiz')).toBeDisabled();await page.locator('#legend-next').click();await page.locator('[data-legend-answer="0"]').click();
 expect(await inspect(page,m=>m.state.guardian.legendQuizPassed)).toBe(true);
});
test('guided road repair updates the actual full-length world path',async({page})=>{
 await start(page,2);await act(page,-6,4.7,'활동');
 const {solveRoad}=await import('./helpers.js');await solveRoad(page);
 const result=await inspect(page,m=>({path:m.state.path,broken:m.world.brokenTile.visible,fixed:m.world.fixedTile.visible,count:m.world.tactileRoute.length}));
 expect(result).toEqual({path:true,broken:false,fixed:true,count:38});
});
test('day night is readable, tools collapse and foreground time resets on reload',async({page})=>{
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
 await page.reload();expect(await inspect(page,m=>m.state.activity.totalMs)).toBe(0);
});
test('partly read old school save finishes with typing alone',async({page})=>{
 await start(page);await inspect(page,m=>{m.state.journey.briefingRead=true});
 await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('#weekly-form')).toHaveCount(0);
 const {copyRules}=await import('./helpers.js');await copyRules(page);
 expect(await inspect(page,m=>m.state.journey.schoolReady)).toBe(true);
});

test('small storybook remains readable and uses vector fallback when illustration fails',async({page})=>{
 await page.setViewportSize({width:800,height:900});await page.route('**/illustrations/geumho-story.webp',route=>route.abort());await start(page,3);await act(page,19,-11,'동물 친구');await page.locator('#legend').click();
 await expect(page.locator('.storybook')).toBeVisible();await expect(page.locator('.story-atlas')).toHaveCount(0);await expect(page.locator('.story-art svg')).toHaveCount(1);await expect(page.locator('#legend-text')).toContainText('금호지');
 expect(await page.locator('.storybook').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.locator('#legend-next').click();await expect(page.locator('.story-scene')).toHaveAttribute('data-story-scene','1');
});
