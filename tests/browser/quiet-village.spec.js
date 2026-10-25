import { openTools, copyRules } from "./helpers.js";
import { test, expect } from "@playwright/test";
import { start, move, close, picture, publish } from "./helpers.js";
async function inspect(page, fn) {
  return page.evaluate(async (fn) => {
    const m = await import("/src/main.js");
    return new Function("m", `return (${fn})(m)`)(m);
  }, fn.toString());
}
test("village has proximity labels, requested names and no removed signs or facilities", async ({
  page,
}) => {
  await start(page);
  const data = await inspect(page, (m) => ({
    removed: m.world.entities
      .filter((e) =>
        [
          "house",
          "bins",
          "neighborhood",
          "eco-station",
          "exhibition",
          "eco-map",
        ].includes(e.id),
      )
      .map((e) => e.id),
    signs: m.world.outdoor.children.filter((o) => o.userData.signId).length,
    school: m.content.schoolName,
    library: m.world.entities.find((e) => e.id === "library").title,
    forest: m.world.entities.find((e) => e.id === "forest").title,
    lake: m.world.entities.find((e) => e.id === "rest").title,
    posters: m.world.posterGroup.children.length,
  }));
  expect(data.removed).toEqual([]);
  expect(data.signs).toBe(0);
  expect(data.school).toBe("금호초등학교");
  expect(data.library).toContain("도서관");
  expect(data.forest).toBe("월아산");
  expect(data.lake).toBe("금호지");
  expect(data.posters).toBe(0);
  await expect(page.locator(".place-bubble")).toBeVisible();
  await expect(page.locator(".place-bubble")).toHaveText("금호초등학교");
  await move(page, -24, 22);
  await expect(page.locator(".place-bubble")).toBeHidden();
  const space = await inspect(page, (m) => ({
    oldHouse: m.world.blocked(20, 8),
    road: m.world.blocked(18, 3),
    apt: m.world.blocked(18, -3.2),
  }));
  expect(space).toEqual({ oldHouse: false, road: false, apt: true });
});
test("village map keeps bag sorting without removed exhibition controls",async({page})=>{
 await start(page,2);await inspect(page,m=>{m.state.path=true;m.state.completed=['path'];m.state.collected=['can','paper','bottle']});
 await page.locator('[data-level="2"]').click();await page.locator('#road-trash').click();await page.locator('#track').click();await expect(page.locator('#map-sort')).toBeVisible();await expect(page.locator('#map-upload,[data-map-image]')).toHaveCount(0);await close(page);await openTools(page);await page.locator('[data-page="bag"]').click();await page.locator('#sort-from-bag').click();
 for(const [id,c] of [['can','금속'],['paper','종이'],['bottle','플라스틱']])await page.locator(`[data-sort="${id}"][data-category="${c}"]`).click();expect(await inspect(page,m=>m.state.completed.includes('trash'))).toBe(true);
});
