import { expect } from "@playwright/test";
export async function start(page, level = 1) {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  if (level > 1) {
    await page.evaluate(async (level) => {
      const m = await import(
          document.querySelector('script[type="module"][src*="/src/main.js"]')
            .src
        ),
        s = m.state;
      // Focused regression fixtures represent prior, already completed lessons.
      s.journey.schoolReady = true;
      const {roadPages}=await import('/src/road-reading.js');s.journey.roadReading=roadPages.map(p=>p.id);
      s.journey.briefingRead = true;
      s.journey.plan = { agendaId: "a-path", promise: "길을 막지 않아요" };
      if (level >= 3) {
        s.path = true;
        s.completed = ["path", "trash"];
        s.sorted = ["can", "paper", "bottle"];
      }
      if (level >= 4) {
        s.guardian.legendQuizPassed = true;
        s.guardian.legendSeen = m.content.guardianLegend.pages.map((p) => p.id);
      }
      localStorage.setItem("geumsan-state-v1", JSON.stringify(s));
    }, level);
    await page.reload();
  }
  await page.evaluate(async () => {
    const m = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    // Functional fixtures keep low graphics after reload as a real saved setting.
    m.state.settings.quality = "low";
    localStorage.setItem("geumsan-state-v1", JSON.stringify(m.state));
    m.world.configure(m.state.settings);
  });
}
export async function move(page, x, z) {
  await page.evaluate(
    async ({ x, z }) => {
      const { world } = await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      );
      const npc = world.entities.find(
        (e) =>
          e.kind === "npc" &&
          e.patrol.points[0][0] === x &&
          e.patrol.points[0][1] === z,
      );
      world.player.position.set(npc ? npc.x : x, 0, npc ? npc.z : z);
    },
    { x, z },
  );
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}
export async function act(page, x, z, text = "", intro = true) {
  await move(page, x, z);
  await expect(page.locator("#interact")).toBeVisible();
  if (text) await expect(page.locator("#interact")).toContainText(text);
  await page.keyboard.press("e");
  if (intro && (await page.locator("#intro-next").count()))
    await page.locator("#intro-next").click();
}
export async function close(page) {
  await page.getByRole("button", { name: "창 닫기", exact: true }).click();
}
export async function picture(
  page,
  { large = false, transparent = false } = {},
) {
  const data = await page.evaluate(
    ({ large, transparent }) => {
      const c = document.createElement("canvas");
      c.width = large ? 1400 : 120;
      c.height = large ? 1100 : 120;
      const x = c.getContext("2d");
      if (!transparent) {
        x.fillStyle = "white";
        x.fillRect(0, 0, c.width, c.height);
      }
      x.strokeStyle = "black";
      x.lineWidth = large ? 12 : 3;
      x.strokeRect(
        large ? 350 : 25,
        large ? 200 : 25,
        large ? 600 : 70,
        large ? 600 : 70,
      );
      return c.toDataURL().split(",")[1];
    },
    { large, transparent },
  );
  await page.locator("#image-input").setInputFiles({
    name: "생태그림.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
}
export async function publish(page, name = "우리 생태 친구") {
  await page.locator('[name="name"]').fill(name);
  await page
    .locator('[name="protection"]')
    .fill("먹이를 주지 않고 거리를 두고 관찰해요");
  await page
    .getByRole("checkbox", { name: "배경 제거 결과를 확인했어요" })
    .check();
  await page.getByRole("button", { name: "마을에 등록하기" }).click();
  await expect(page.locator(".overlay")).toHaveCount(0, { timeout: 15000 });
}

export async function sortBag(page) {
  if(await page.locator("[data-sort],#sorting-success").count())return;
  await openTools(page);
  await page.locator('[data-page="bag"]').click();
  await page.locator("#sort-from-bag").click();
}
export async function lakeCare(page) {
  await act(page, 19, -11, "동물 친구");
  await page.locator("#lake-care").click();
}

export async function openTools(page) {
  if(await page.locator('#explore-tools').isHidden())await page.locator('#tools-toggle').click();
}
export async function copyRules(page) {
 const rules=await page.evaluate(async()=>{const m=await import('/src/main.js');return m.content.classRules.rules});
 for(const r of rules){const input=page.locator(`[data-rule-input="${r.id}"]`);if(await input.isEditable())await input.fill(r.text)}
}
export async function solveRoad(page) {
 await page.locator('#obstacle').click();
 await page.locator('[data-road-shape="line"]').click();
 await page.locator('[data-road-direction="90"]').click();
 await expect(page.locator('#road-success')).toContainText('수리 완료');
 await page.locator('#road-finish').click();
}
