import {test,expect} from '@playwright/test';import {start,act,close} from './helpers.js';
const inspect=(p,fn)=>p.evaluate(async f=>{const m=await import('/src/main.js');return new Function('m',`return (${f})(m)`)(m)},fn.toString());
test('easy road uses pictured two-choice steps and only correct answers complete repair',async({page})=>{
 await start(page,2);await act(page,-6,4.7,'활동');await expect(page.locator('[data-type], [data-rotate]')).toHaveCount(0);await page.locator('#obstacle').click();await expect(page.locator('[data-road-shape]')).toHaveCount(2);await expect(page.getByRole('img',{name:/줄무늬 블록.*빈칸.*줄무늬 블록/})).toBeVisible();
 await page.locator('[data-road-shape="dot"]').click();await expect(page.locator('#path-feedback')).toContainText('같은');expect(await inspect(page,m=>m.state.path)).toBe(false);
 await page.locator('[data-road-shape="line"]').click();await expect(page.locator('[data-road-direction]')).toHaveCount(2);await page.locator('[data-road-direction="0"]').click();expect(await inspect(page,m=>m.state.path)).toBe(false);
 await page.locator('[data-road-direction="90"]').click();await expect(page.locator('#road-success')).toContainText('수리 완료');expect(await inspect(page,m=>m.state.path)).toBe(true);await page.locator('#road-finish').click();
});
test('third village pickup immediately opens sorting, wrong answers retry and level clears after sorting',async({page})=>{
 await start(page,2);await inspect(page,m=>{m.state.path=true;m.state.completed=['path']});
 await act(page,10,5);await expect(page.locator('[data-auto-sorting]')).toHaveCount(0);await act(page,13,8);await expect(page.locator('[data-auto-sorting]')).toHaveCount(0);await act(page,16,5);
 await expect(page.locator('[data-auto-sorting]')).toBeVisible();await expect(page.getByRole('dialog')).toContainText('3개');await page.locator('[data-sort="can"][data-category="종이"]').click();await expect(page.locator('.result').first()).toContainText('금속');
 for(const [id,c] of [['can','금속'],['paper','종이'],['bottle','플라스틱']])await page.locator(`[data-sort="${id}"][data-category="${c}"]`).click();
 await expect(page.locator('#sorting-success')).toContainText('레벨 2 클리어');expect(await inspect(page,m=>m.state.sorted.filter(id=>['can','paper','bottle'].includes(id)).length)).toBe(3);await expect(page.locator('#level-title')).toContainText('레벨 3');await close(page);await page.reload();await expect(page.locator('#level-title')).toContainText('레벨 1');
});

test('custom dot route describes the matching pattern accessibly and skips direction',async({page})=>{
 await start(page,2);await inspect(page,m=>{m.content.tactile={text:'교사 점무늬 구간',solution:[{type:'dot',rotation:0},{type:'dot',rotation:0}]}});await act(page,-6,4.7,'활동');await page.locator('#obstacle').click();
 await expect(page.getByRole('img',{name:/점무늬 블록.*빈칸.*점무늬 블록/})).toBeVisible();await page.locator('[data-road-shape="dot"]').click();await expect(page.locator('#road-success')).toBeVisible();await expect(page.locator('[data-road-direction]')).toHaveCount(0);
});
