import { openTools, copyRules } from "./helpers.js";
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
  await page.locator("#camera").click();
  await expect(page.getByRole("dialog")).toContainText("레벨 1");
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
test("Namgang exhibition requires the creature name and protection pledge and appears in the village", async ({
  page,
}) => {
  await ready(page, 4);
  await picture(page);
  await expect(page.locator('[name="protection"]')).toHaveCount(1);
  await page.locator('[name="name"]').fill("남강의 수달 그림");
  await page
    .locator('[name="protection"]')
    .fill("먹이를 주지 않고 거리를 두고 관찰해요");
  await page
    .getByRole("checkbox", { name: "배경 제거 결과를 확인했어요" })
    .check();
  await page.getByRole("button", { name: "마을에 등록하기" }).click();
  await expect(page.locator("#level-title")).toContainText("성공");
  await expect(page.locator("#badge-count")).toHaveText("3 / 3");
  const data = await page.evaluate(async () => {
    const { world, works } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    return {
      work: works[0].protection,
      poster: world.posterGroup.children.some(
        (o) => o.userData.artId === works[0].id,
      ),
    };
  });
  expect(data.poster).toBe(false);
  await openTools(page);
  await page.locator('[data-page="map"]').first().click();
  await expect(page.locator("[data-art]")).toContainText("남강의 수달 그림");
  expect(data.work).toContain("거리를");
});

test("all four levels play in sequence with weekly checks, road solving, legend dialogue and final exhibition", async ({
  page,
}) => {
  // Four complete lessons plus a final full-model reload on software WebGL.
  test.setTimeout(180000);
  const {
    start,
    move: go,
    act,
    close: shut,
    picture: draw,
    publish,
  } = await import("./helpers.js");
  await start(page);
  await act(page, -10, -1, "들어가기");
  await act(page, 0, -3.8, "회의");
  await expect(page.locator("#school-next")).toBeDisabled();
  await copyRules(page);
  await page.locator("#read-meeting").click();
  await page
    .locator('[name="promise"]')
    .fill("안내 길 위에 물건을 놓지 않아요");
  await page.locator('[name="done"]').check();
  await page.locator('[name="note"]').fill("오늘 통행로를 살폈어요");
  await page.getByRole("button", { name: "계획과 오늘 체크 저장" }).click();
  await expect(page.locator("#level-title")).toContainText("레벨 2");
  await expect(page.locator(".weekly-grid")).toContainText("오늘 통행로");
  await page.locator("#school-next").click();
  await act(page, -6, 4.7, "활동하기");
  await page.locator("#check").click();
  await expect(page.locator("#path-feedback")).toContainText("상자");
  await page.locator("#obstacle").click();
  await page.locator('[data-type="1"]').selectOption("line");
  await page.locator('[data-rotate="2"]').click();
  await page.locator("#check").click();
  for (const [x, z] of [
    [10, 5],
    [13, 8],
    [16, 5],
  ])
    await act(page, x, z);
  await openTools(page);
  await page.locator('[data-page="bag"]').click();
  await page.locator("#sort-from-bag").click();
  for (const [id, category] of [
    ["can", "금속"],
    ["paper", "종이"],
    ["bottle", "플라스틱"],
  ])
    await page
      .locator(`[data-sort="${id}"][data-category="${category}"]`)
      .click();
  await shut(page);
  await expect(page.locator("#level-title")).toContainText("레벨 3");
  await act(page, 19, -11, "동물 친구", false);
  await expect(page.getByRole("dialog")).toContainText("안녕, 나는");
  await expect(page.getByRole("dialog")).toContainText("이 게임에서는 금호지");
  await page.locator("#intro-next").click();
  await page.locator("#legend").click();
  for (let i = 0; i < 6; i++) {
    await expect(page.locator("#legend-quiz")).toBeDisabled();
    await page.locator("#legend-next").click();
  }
  await page.locator('[data-legend-answer="1"]').click();
  await expect(page.locator("#legend-feedback")).toContainText("다시 생각");
  await page.locator('[data-legend-answer="0"]').click();
  await expect(page.locator("#level-title")).toContainText("레벨 4");
  await shut(page);
  await draw(page);
  await publish(page, "남강의 생태 친구");
  await expect(page.locator("#level-title")).toContainText("성공");
  await expect(page.locator("#badge-count")).toHaveText("3 / 3");
  await page.locator("#guardian-open").click();
  await expect(
    page.getByRole("heading", {
      name: "우리 동네 수호대 · 미션 성공!",
      exact: true,
    }),
  ).toBeVisible();
  await shut(page);
  await page.reload();
  await expect(page.locator("#level-title")).toContainText("성공");
});

test("weekly plans survive reload and reduced motion makes the current objective steady", async ({
  page,
}) => {
  const { start, act, close } = await import("./helpers.js");
  await start(page);
  await act(page, -10, -1, "들어가기");
  await act(page, 0, -3.8, "회의");
  await copyRules(page);
  await page.locator("#read-meeting").click();
  await page.locator('[name="promise"]').fill("우리 길 살피기");
  await page.locator('[name="done"]').check();
  await page.locator('[name="note"]').fill("실천 기록");
  await page.getByRole("button", { name: "계획과 오늘 체크 저장" }).click();
  await close(page);
  await page.reload();
  await expect(page.locator("#level-title")).toContainText("레벨 2");
  await page.locator("#guardian-open").click();
  await page.locator("#weekly-again").click();
  await expect(page.locator('[name="promise"]')).toHaveValue("우리 길 살피기");
  await expect(page.locator('[name="note"]')).toHaveValue("실천 기록");
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

test("library legend cannot bypass the first meeting with the lakeside friend", async ({
  page,
}) => {
  const { start, act } = await import("./helpers.js");
  await start(page, 3);
  await act(page, 1, -6, "들어가기");
  await act(page, 0, -3.8, "책장");
  await page.locator("#legend-book").click();
  await expect(page.getByRole("dialog")).toContainText(
    "금호지에서 동물 친구와 먼저 인사",
  );
  await expect(page.locator("#legend-next")).toHaveCount(0);
});

test("own newly published artwork and pledge stay visible despite many imported exhibits and low quality", async ({
  page,
}) => {
  const { start, picture, publish } = await import("./helpers.js");
  await start(page, 4);
  await page.evaluate(async () => {
    const m = await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      ),
      { artStore } = await import("/src/storage.js");
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    c.getContext("2d").fillRect(5, 5, 20, 20);
    const blob = await new Promise((r) => c.toBlob(r));
    await artStore.putMany(
      Array.from({ length: 6 }, (_, i) => ({
        id: "!import-" + i,
        name: "학급 작품 " + i,
        protection: "자연을 아껴요",
        exhibition: "namgang",
        habitat: "river",
        kind: "plant",
        blob,
      })),
    );
    m.state.settings.artLimit = 5;
    localStorage.setItem("geumsan-state-v1", JSON.stringify(m.state));
  });
  await page.reload();
  await picture(page);
  await publish(page, "내가 전시한 친구");
  const shown = await page.evaluate(async () => {
    const { world, works, state } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    const id = works.find((w) => w.name === "내가 전시한 친구").id;
    return {
      awarded: state.journey.exhibitIds.includes(id),
      visible: world.art.some((o) => o.data.id === id),
    };
  });
  expect(shown.awarded).toBe(true);
  expect.soft(shown.visible).toBe(true);
  await openTools(page);
  await page.locator('[data-page="map"]').first().click();
  await expect
    .soft(page.locator("[data-art]").filter({ hasText: "내가 전시한 친구" }))
    .toContainText("먹이를 주지 않고 거리를 두고 관찰해요");
});

test("newest work remains readable in the single ecology map without physical poster boards", async ({
  page,
}) => {
  const { start, picture, publish } = await import("./helpers.js");
  await start(page, 4);
  await picture(page);
  await publish(page, "가리지 않는 작품");
  await openTools(page);
  await page.locator('[data-page="map"]').first().click();
  await expect(
    page.getByRole("heading", { name: "우리 반 생태 지도", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-art]")).toContainText("가리지 않는 작품");
  await expect(page.locator("[data-map-image]")).toHaveJSProperty(
    "naturalWidth",
    120,
  );
  expect(
    await page.evaluate(async () => {
      const { world } = await import("/src/main.js");
      return world.posterGroup.children.length;
    }),
  ).toBe(0);
});
