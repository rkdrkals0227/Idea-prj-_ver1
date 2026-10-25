import { openTools, copyRules } from "./helpers.js";
import { test, expect } from "@playwright/test";
import {
  start,
  move,
  act,
  close,
  picture,
  publish,
  sortBag,
  lakeCare,
} from "./helpers.js";
test.setTimeout(90000);

test("missing GLB keeps the physical school, collision and class meeting usable", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(
    await readFile(
      new URL("../../src/data/asset-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  manifest.school.url = "models/missing-test.glb";
  await page.route("**/src/data/asset-manifest.json*", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: `export default ${JSON.stringify(manifest)};`,
    }),
  );
  await page.route("**/models/missing-test.glb", (r) =>
    r.fulfill({ status: 404, body: "missing" }),
  );
  await start(page);
  await expect(page.locator("#toast")).toContainText("school 모델");
  await move(page, -10, -1.8);
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  expect(
    await page.evaluate(
      async () =>
        (
          await import(
            document.querySelector('script[type="module"][src*="/src/main.js"]')
              .src
          )
        ).world.player.position.z,
    ),
  ).toBeGreaterThan(-2.13);
  await act(page, -10, -1, "들어가기");
  await act(page, 0, -3.8, "회의");
  await expect(
    page.getByRole("heading", { name: /레벨 1 · 우리 학급 회의/ }),
  ).toBeVisible();
});

test("residents introduce themselves once and keep distinct scoped story and quiz topics", async ({
  page,
}) => {
  // Five NPC lessons, quiz completion and a full model reload on software WebGL.
  test.setTimeout(150000);
  await start(page, 3);
  const seen = new Set();
  for (const [x, z, topic, word] of [
    [-4, 1, "강과 마을 문화", "물결과 강가"],
    [19, -11, "호수 생태", "야생 생물"],
  ]) {
    await act(page, x, z, "동물 친구", false);
    await expect(
      page.getByRole("heading", { name: "동물 친구와 첫 만남", exact: true }),
    ).toBeVisible();
    await page.locator("#intro-next").click();
    await page.locator("#story").click();
    const text = await page.locator(".modal-body>p").first().textContent();
    expect(seen.has(text)).toBe(false);
    seen.add(text);
    await page.locator("#topic-quiz").click();
    await expect(page.locator(".modal-header h2")).toContainText(topic);
    await expect(page.locator(".modal-body h3")).toContainText(word);
    await close(page);
  }
  for (const [x, z, topic, word] of [
    [16, 9, "쓰레기와 생활", "빈 음료 캔"],
    [4, 8, "주민 의견과 편지", "불편한 길"],
  ]) {
    await act(page, x, z, "", false);
    await expect(page.locator("#intro-next")).toHaveCount(0);
    await page.locator("#story").click();
    const text = await page.locator(".modal-body>p").first().textContent();
    expect(seen.has(text)).toBe(false);
    seen.add(text);
    await page.locator("#topic-quiz").click();
    await expect(page.locator(".modal-header h2")).toContainText(topic);
    await expect(page.locator(".modal-body h3")).toContainText(word);
    await close(page);
  }
  await act(page, 4, 8, "우체통", false);
  await expect(page.locator("#intro-next")).toHaveCount(0);
  await page.locator("#quiz").click();
  for (const [i, answer] of [
    [0, 0],
    [1, 1],
    [2, 2],
  ]) {
    await page.locator(`[data-answer="${answer}"]`).click();
    await page
      .getByRole("button", {
        name: i === 2 ? "이 주제 마무리" : "이 주제의 다음 문제",
        exact: true,
      })
      .click();
  }
  await expect(page.locator("[data-review]")).toHaveCount(3);
  await close(page);
  await page.reload();
  await act(page, 4, 8, "우체통", false);
  await expect(page.locator("#intro-next")).toHaveCount(0);
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-header h2")).toContainText("주제 마무리");
});

test("library, forest and apartment have own learning; letters save, escape HTML and only submit in game", async ({
  page,
}) => {
  await start(page, 3);
  await act(page, -19, -11, "숲길");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-body h3")).toContainText("숲길 옆");
  await close(page);
  await act(page, 18, 1.8, "아파트");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-body h3")).toContainText("아파트 복도");
  await close(page);
  await act(page, 1, -6, "들어가기");
  await act(page, 0, -3.8, "책장");
  await expect(page.locator("[data-library-book]")).toHaveCount(5);
  await page.locator('[data-library-book="jinju-history"]').click();
  await expect(page.locator(".reading-copy")).toContainText("남강");
  await close(page);
  await act(page, 0, 5, "나가기");
  await act(page, 4, 8, "우체통");
  await page.locator("#write-letter").click();
  await page.locator('[name="recipient"]').fill("마을 주민");
  await page.locator('[name="problem"]').fill("학교 앞 안내 길");
  await page.locator('[name="alias"]').fill("초록이");
  await page.locator('[name="free"]').fill("<script>마음을 전해요</script>");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await openTools(page);
  await page.locator('[data-page="bag"]').click();
  await page.getByRole("button", { name: "편지 이어 쓰기" }).click();
  await expect(page.locator('[name="recipient"]')).toHaveValue("마을 주민");
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".paper-letter")).toContainText("<script>");
  await page
    .getByRole("button", { name: "게임 속 우체통 접수", exact: true })
    .click();
  await page.reload();
  expect(
    await page.evaluate(
      async () =>
        (
          await import(
            document.querySelector('script[type="module"][src*="/src/main.js"]')
              .src
          )
        ).state.letters.length,
    ),
  ).toBe(1);
});

test("optional lake care requires cleanup, identification and expert handover without replacing legend", async ({
  page,
}) => {
  await start(page, 3);
  for (const [x, z] of [
    [22, -9],
    [17, -11],
  ])
    await act(page, x, z);
  await sortBag(page);
  await page.locator('[data-sort="lake-can"][data-category="종이"]').click();
  await expect(page.locator(".result").first()).toContainText("금속");
  await page.locator('[data-sort="lake-can"][data-category="금속"]').click();
  await page.locator('[data-sort="lake-paper"][data-category="종이"]').click();
  await close(page);
  await lakeCare(page);
  await page.locator("#clean-rest").click();
  await page
    .getByRole("button", { name: "거리를 두고 관찰·기록하고 어른에게 알리기" })
    .click();
  await close(page);
  await act(page, 21, -8, "표본");
  await lakeCare(page);
  await page
    .getByRole("button", { name: "담아 온 연습 표본 인계하기" })
    .click();
  await close(page);
  const s = await page.evaluate(
    async () =>
      (
        await import(
          document.querySelector('script[type="module"][src*="/src/main.js"]')
            .src
        )
      ).state,
  );
  expect(s.completed).toContain("lake");
  await expect(page.locator("#badge-count")).toHaveText("2 / 3");
});

test("teacher edits and invalid quiz validation persist while WebGL loss shows recovery", async ({
  page,
}) => {
  await start(page, 3);
  await openTools(page);
  await page.locator('[data-page="settings"]').click();
  await page.getByRole("button", { name: "교사용 수업 편집" }).click();
  const editor = page.locator("#json-editor"),
    c = JSON.parse(await editor.inputValue());
  c.className = "4학년 초록별반";
  await editor.fill(JSON.stringify(c));
  await page.getByRole("button", { name: "자료 저장", exact: true }).click();
  await expect(page.locator("#teacher-result")).toContainText("저장했어요");
  await page.locator("#section").selectOption("quizzes");
  const q = JSON.parse(await editor.inputValue());
  q.quizzes[0].answer = 999;
  await editor.fill(JSON.stringify(q));
  await page.getByRole("button", { name: "자료 저장", exact: true }).click();
  await expect(page.locator("#teacher-result")).toContainText(
    "저장하지 않았어요",
  );
  await close(page);
  await page.reload();
  await act(page, -10, -1, "들어가기");
  await act(page, 0, -3.8, "회의");
  await expect(
    page.getByRole("heading", { name: /4학년 초록별반/ }),
  ).toBeVisible();
  await close(page);
  await page.evaluate(async () => {
    (
      await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      )
    ).world.canvas.dispatchEvent(
      new Event("webglcontextlost", { cancelable: true }),
    );
  });
  await expect(
    page.getByRole("heading", { name: "화면 연결이 잠시 끊겼어요" }),
  ).toBeVisible();
});
