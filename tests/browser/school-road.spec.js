import {test,expect} from '@playwright/test';import {start,act} from './helpers.js';
const inspect=(page,fn)=>page.evaluate(async f=>{const m=await import('/src/main.js');return new Function('m',`return (${f})(m)`)(m)},fn.toString());
test('opening explains three missions and pupils can type numbered class rules',async({page})=>{
 await page.goto('/');await expect(page.locator('.mission-briefing')).toHaveCount(3);await expect(page.locator('.briefing-finale')).toContainText('생태 지도');
 await page.getByRole('button',{name:'탐험을 시작할까요? →'}).click();await act(page,-10,-1,'학교');await act(page,0,-4,'회의');
 await expect(page.locator('.class-chalkboard')).toContainText('4-4반 아이들');
 const rules=await inspect(page,m=>m.content.classRules.rules);
 for(let i=0;i<rules.length;i++){await page.locator(`[data-rule-input="${rules[i].id}"]`).fill(`${i+1}. ${rules[i].text}.`);await page.locator(`[data-copy-check="${rules[i].id}"]`).click()}
 await expect(page.locator('#read-meeting')).toBeEnabled();
});
test('continuous school-apartment route, enlarged buildings and repaired lake stay playable',async({page})=>{
 test.setTimeout(120000);await start(page,3);await inspect(page,async m=>{await m.world.modelsReady});
 const data=await inspect(page,async m=>{
  const T=await import('/node_modules/three/build/three.module.js'),w=m.world,r=w.tactileRoute;
  const apartment=new T.Box3().setFromObject(w.models.apartment.current.wrapper),lake=new T.Box3().setFromObject(w.models.lake.current.wrapper);let vertices=0,material;
  w.models.lake.current.wrapper.traverse(o=>{if(o.isMesh){vertices+=o.geometry.attributes.position.count;material={metalness:o.material.metalness,roughness:o.material.roughness,normal:o.material.normalScale.x}}});
  return {route:r,lampOnRoute:w.outdoor.children.filter(o=>o.userData.uploadedRole==="lamp" && r.some(t=>Math.hypot(t.x-o.position.x,t.z-o.position.z)<.8)).length,blocked:r.filter(p=>w.blocked(p.x,p.z)).length,depth:apartment.max.z-apartment.min.z,lakeBottom:lake.min.y,vertices,material,patrolBlocked:w.entities.filter(e=>e.patrol).flatMap(e=>e.patrol.points.flatMap((p,i)=>Array.from({length:10},(_,j)=>{const next=e.patrol.points[(i+1)%e.patrol.points.length],f=j/10;return w.blocked(p[0]+(next[0]-p[0])*f,p[1]+(next[1]-p[1])*f)}))).filter(Boolean).length};
 });
 expect(data.route.length).toBeGreaterThan(30);expect(data.route[0].x).toBe(-10);expect(data.route.at(-1).x).toBe(18);expect(data.blocked).toBe(0);expect(data.lampOnRoute).toBe(0);expect(data.patrolBlocked).toBe(0);expect(data.depth).toBeGreaterThan(9);expect(data.vertices).toBe(72009);expect(data.lakeBottom).toBeGreaterThan(.02);expect(data.material.metalness).toBe(0);
 await act(page,15.5,-14,'금호지');await expect(page.locator('.storybook')).toBeVisible();
});
