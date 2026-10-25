import { openTools, copyRules, solveRoad } from "./helpers.js";
import { test, expect } from "@playwright/test";
async function app(page) {
  return page.evaluate(async () => {
    const m = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    return { state: m.state, level: m.state.journey?.schoolReady };
  });
}
async function move(page, x, z) {
  await page.evaluate(
    async ({ x, z }) => {
      const m = await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      );
      const npc = m.world.entities.find(
        (e) =>
          e.kind === "npc" &&
          e.patrol.points[0][0] === x &&
          e.patrol.points[0][1] === z,
      );
      m.world.player.position.set(npc ? npc.x : x, 0, npc ? npc.z : z);
    },
    { x, z },
  );
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}
test("school is mandatory and future activities explain the current level rather than opening", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".modal-body")).toContainText("레벨 1");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await move(page, 19, -11);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("레벨 1");
  await expect(page.locator("#legend")).toHaveCount(0);
  await page.getByRole("button", { name: "창 닫기", exact: true }).click();
  await openTools(page);
  await expect(page.locator('#camera,#image-input')).toHaveCount(0);
  expect((await app(page)).state.guardian.legendQuizPassed).toBe(false);
});

test("buildings use physical signs, animals have no floating name sprites and the current destination is highlighted", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  const visuals = await page.evaluate(async () => {
    const { world } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    return {
      npcNameSprites: world.entities.filter(
        (e) =>
          ["otter", "turtle", "crane", "postman", "resident"].includes(e.id) &&
          e.tag?.isSprite,
      ).length,
      schoolSign: world.outdoor.children.some(
        (o) => o.userData?.signId === "school",
      ),
      objective: world.activeObjective?.id,
    };
  });
  expect(visuals.npcNameSprites).toBe(0);
  expect(visuals.schoolSign).toBe(false);
  expect(visuals.objective).toBe("school");
});

async function ready(page, n) {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await page.evaluate(async (n) => {
    const m = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    const s = m.state;
    s.journey.schoolReady = n >= 2;
    s.journey.briefingRead = true;
    s.journey.plan = { agendaId: "a-path", promise: "길을 막지 않아요" };
    s.journey.introSeen = true;
    if (n >= 3) {
      s.path = true;
      s.completed = ["path", "trash"];
      s.sorted = ["can", "paper", "bottle"];
    }
    if (n >= 4) s.guardian.legendQuizPassed = true;
    localStorage.setItem("geumsan-state-v1", JSON.stringify(s));
  }, n);
  await page.reload();
}
async function picture(page) {
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 120;
    c.getContext("2d").fillRect(20, 20, 60, 60);
    return c.toDataURL().split(",")[1];
  });
  await page.locator("#image-input").setInputFiles({
    name: "친구.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
}
test("typed rules survive reload and reduced motion makes the current objective steady", async ({
  page,
}) => {
  const { start, act, close } = await import("./helpers.js");
  await start(page);
  await act(page, -10, -1, "들어가기");
  await act(page, 0, -3.8, "회의");
  await copyRules(page);
  await close(page);
  await page.reload();
  await expect(page.locator("#level-title")).toContainText("레벨 2");
  await page.locator("#guardian-open").click();
  await page.locator("#rules-again").click();
  await expect(page.locator('[data-rule-input]').first()).toHaveValue("싸울 경우, 말로 풀기");
  await close(page);
  await openTools(page);
  await page.locator('[data-page="settings"]').click();
  await page.locator('[name="motion"]').check();
  await page.getByRole("button", { name: "설정 적용" }).click();
  await close(page);
  const samples = await page.evaluate(async () => {
    const { world } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    world.updateObjective(0);
    const first = world.objectiveMaterial.opacity;
    world.updateObjective(10);
    return [first, world.objectiveMaterial.opacity, world.activeObjective.id];
  });
  expect(samples).toEqual([0.85, 0.85, "path"]);
});
