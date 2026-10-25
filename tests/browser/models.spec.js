import { test, expect } from "@playwright/test";
async function inspect(page, fn) {
  return page.evaluate(async (fn) => {
    const m = await import("/src/main.js");
    return new Function("m", `return (${fn})(m)`)(m);
  }, fn.toString());
}
test("uploaded characters and scenery load with real geometry and state-specific clips", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await expect
    .poll(
      () =>
        inspect(page, (m) => !!m.world.models.turtle && !!m.world.models.crane),
      { timeout: 60000 },
    )
    .toBe(true);
  await inspect(page, async (m) => {
    await m.world.modelsReady;
  });
  const result = await inspect(page, (m) => ({
    turtle: [...m.world.models.turtle.variants.keys()],
    crane: [...m.world.models.crane.variants.keys()],
    loaded: [...m.world.modelStatus.entries()],
    tiles: m.world.outdoor.children
      .filter((o) => o.userData.tileRole)
      .map((o) => o.userData.tileRole),
    names: m.world.entities.filter((e) => e.tag?.isSprite).length,
  }));
  expect(result.turtle).toEqual(
    expect.arrayContaining(["idle", "walk", "greet"]),
  );
  expect(result.crane).toEqual(
    expect.arrayContaining(["idle", "walk", "greet"]),
  );
  expect(result.tiles).toEqual(
    expect.arrayContaining(["grass", "paving", "water", "lotusWater"]),
  );
  expect(result.loaded.every(([, s]) => s === "loaded")).toBe(true);
  await inspect(page, (m) => {
    m.world.player.position.set(19, 0, -9);
    m.world.updateNearby();
    m.world.interactNearby();
  });
  expect(await inspect(page, (m) => m.world.models.turtle.current.role)).toBe(
    "greet",
  );
  await expect
    .poll(() => inspect(page, (m) => m.world.models.turtle.current.role), {
      timeout: 15000,
    })
    .toBe("idle");
  const repaired = await inspect(page, m => {
    m.state.path = true;
    m.state.collected.push('paper');
    m.world.sync(m.state);
    return {broken:m.world.brokenTile.visible,fixed:m.world.fixedTile.visible,paper:m.world.entities.find(e=>e.id==='waste:paper').obj.visible};
  });
  expect(repaired).toEqual({broken:false,fixed:true,paper:false});
  expect(errors).toEqual([]);
});
test("model failure leaves the target placeholder and does not block school interaction", async ({
  page,
}) => {
  await page.route("**/models/uploaded/turtle-idle.glb", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await expect
    .poll(() => inspect(page, (m) => m.world.modelStatus?.get("turtle:idle")), {
      timeout: 60000,
    })
    .toBe("fallback");
  const fallback = await inspect(page, async m => {
    await m.world.modelsReady;
    const actor = m.world.models.turtle;
    actor.setState('walk');
    const overlap = actor.fallback.some(o => o.visible);
    actor.setState('greet');actor.update(6);
    return {overlap,idle:actor.current === null,placeholder:actor.fallback.some(o => o.visible),greet:actor.variants.get('greet').wrapper.visible};
  });
  expect(fallback).toEqual({overlap:false,idle:true,placeholder:true,greet:false});
  await page.keyboard.press("e");
  await expect(page.locator("#place")).toContainText("학교");
  const meshes = await inspect(
    page,
    (m) =>
      m.world.entities
        .find((e) => e.id === "turtle")
        .obj.children.filter((o) => o.visible).length,
  );
  expect(meshes).toBeGreaterThan(0);
});
