import { test, expect } from "@playwright/test";
import { start, act, close } from "./helpers.js";
async function inspect(page, fn) {
  return page.evaluate(async (fn) => {
    const m = await import("/src/main.js");
    return new Function("m", `return (${fn})(m)`)(m);
  }, fn.toString());
}
test("exactly three residents walk real routes, stop nearby and retain functional facilities", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page, 3);
  await inspect(page, async (m) => {
    await m.world.modelsReady;
    m.world.player.position.set(-22, 0, 22);
  });
  const npcs = await inspect(page, (m) =>
    Object.keys(m.world.models)
      .filter((id) =>
        ["otter", "turtle", "crane", "postman", "resident", "manager"].includes(
          id,
        ),
      )
      .sort(),
  );
  expect(npcs).toEqual(["crane", "otter", "turtle"]);
  const before = await inspect(page, (m) =>
    m.world.entities
      .filter((e) => ["otter", "turtle", "crane"].includes(e.id))
      .map((e) => ({ id: e.id, x: e.x, z: e.z })),
  );
  await expect
    .poll(
      () =>
        inspect(page, (m) =>
          m.world.entities
            .find((e) => e.id === "otter")
            .obj.position.distanceTo(m.world.player.position),
        ),
      { timeout: 1000 },
    )
    .toBeGreaterThan(2);
  await page.waitForTimeout(5000);
  const after = await inspect(page, (m) =>
    m.world.entities
      .filter((e) => ["otter", "turtle", "crane"].includes(e.id))
      .map((e) => ({
        id: e.id,
        x: e.x,
        z: e.z,
        role: m.world.models[e.id].current.role,
      })),
  );
  for (const p of after) {
    const a = before.find((q) => q.id === p.id);
    expect(Math.hypot(p.x - a.x, p.z - a.z)).toBeGreaterThan(0.7);
    expect(p.role).toBe("walk");
  }
  await inspect(page, (m) => {
    const e = m.world.entities.find((e) => e.id === "otter");
    m.world.player.position.set(e.x, 0, e.z + 1.5);
  });
  await expect
    .poll(() => inspect(page, (m) => m.world.models.otter.current.role))
    .toBe("idle");
  await page.keyboard.press("e");
  await expect(
    page.getByRole("heading", { name: "동물 친구와 첫 만남", exact: true }),
  ).toBeVisible();
  await close(page);
  await act(page, 18, 1.8, "아파트");
  await page.getByRole("button", { name: "아파트 생활 문제 살펴보기" }).click();
  await expect(page.getByRole("dialog")).toContainText("아파트");
  await close(page);
  await act(page, 19, -11, "동물 친구");
  await page.locator("#lake-care").click();
  await expect(page.locator("#protect")).toBeVisible();
  await close(page);
  await act(page, 4, 8, "우체통");
  await page.locator("#write-letter").click();
  await expect(page.locator('[name="alias"]')).toBeVisible();
});
test("buildings retain the original upload topology rather than destructive decimation", async ({
  page,
}) => {
  await start(page);
  const sizes = await inspect(page, async (m) => {
    await m.world.modelsReady;
    return ["school", "library", "apartment"].map((id) => {
      let n = 0;
      m.world.models[id].current.wrapper.traverse((o) => {
        if (o.isMesh) n += o.geometry.attributes.position.count;
      });
      return n;
    });
  });
  expect(sizes).toEqual([73835, 71399, 75933]);
});
