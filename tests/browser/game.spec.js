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

test("drawings preserve interior white, resize large images, restore and synchronize edits/deletion", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, 4);
  await picture(page, { large: true });
  await expect(page.locator("#art-canvas")).toHaveJSProperty("width", 1024);
  await page.locator("#remove-bg").click();
  expect(
    await page.locator("#art-canvas").evaluate((c) => {
      const x = c.getContext("2d");
      return [
        x.getImageData(0, 0, 1, 1).data[3],
        x.getImageData(400, 300, 1, 1).data[3],
      ];
    }),
  ).toEqual([0, 255]);
  await publish(page, "흰 나비");
  await page.reload();
  await openTools(page);
  await page.locator('[data-page="catalog"]').click();
  await expect(
    page.getByRole("heading", { name: "흰 나비", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "작품 살펴보기" }).click();
  await page.getByRole("button", { name: "이름·설명·위치 수정" }).click();
  await page.locator('[name="name"]').fill("호수 나비");
  await page.locator('[name="habitat"]').selectOption("lake");
  await page.getByRole("button", { name: "변경 저장" }).click();
  await page.getByRole("button", { name: "지도 위치" }).click();
  await expect(page.locator("[data-art]")).toContainText("호수 나비");
  const ids = await page.evaluate(async () => {
    const { world, works } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    return [
      works[0].id,
      world.art[0].data.id,
      document.querySelector("[data-art]")?.dataset.art,
    ];
  });
  expect(new Set(ids).size).toBe(1);
  await close(page);
  await openTools(page);
  await page.locator('[data-page="catalog"]').click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "학급 작품 묶음 내보내기" }).click();
  expect((await dl).suggestedFilename()).toContain("학급작품");
  await page.getByRole("button", { name: "작품 살펴보기" }).click();
  await page.getByRole("button", { name: "작품 삭제" }).click();
  await page.getByRole("button", { name: "삭제하기", exact: true }).click();
  await expect(page.getByText("첫 번째 생태 친구를 기다려요")).toBeVisible();
  await expect(page.locator("#level-title")).toContainText("레벨 4");
  await expect(page.locator("#badge-count")).toHaveText("2 / 3");
  expect(errors).toEqual([]);
});

test("image failures, transparent PNG, storage quota feedback and paused Korean input remain usable", async ({
  page,
}) => {
  await start(page, 4);
  await page.locator("#image-input").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.locator("#toast")).toContainText("이미지 크기");
  await picture(page, { transparent: true });
  expect(
    await page
      .locator("#art-canvas")
      .evaluate((c) => c.getContext("2d").getImageData(0, 0, 1, 1).data[3]),
  ).toBe(0);
  await page.locator('[name="name"]').fill("한글 이름");
  const before = await page.evaluate(
    async () =>
      (
        await import(
          document.querySelector('script[type="module"][src*="/src/main.js"]')
            .src
        )
      ).world.player.position.x,
  );
  await page.keyboard.press("a");
  expect(
    await page.evaluate(
      async () =>
        (
          await import(
            document.querySelector('script[type="module"][src*="/src/main.js"]')
              .src
          )
        ).world.player.position.x,
    ),
  ).toBe(before);
  await close(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await openTools(page);
  await page.locator('[data-page="settings"]').click();
  await page.getByRole("button", { name: "설정 적용" }).click();
  await expect(page.locator("#toast")).toContainText("저장 공간이 부족");
});

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
    [4, -6, "사실과 전설", "전해 내려오는"],
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
  await page.getByRole("button", { name: "자료 읽기 퀴즈" }).click();
  await expect(page.locator(".modal-body h3")).toContainText(
    "오래된 생태 조사",
  );
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

test("lake care still requires cleanup, identification and expert handover but does not replace the level 4 exhibition", async ({
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
  await expect(page.locator("#badge-count")).toHaveText("1 / 3");
});

test("bundle metadata and duplicate IDs round-trip without awarding a stamp on import; edit is explicit publication", async ({
  page,
}) => {
  await start(page, 4);
  const image = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 30;
    c.getContext("2d").fillRect(5, 5, 20, 20);
    return c.toDataURL();
  });
  const bundle = {
    schema: "geumsan-art",
    version: 1,
    works: [
      {
        id: "shared",
        name: "가져온 풀",
        alias: "친구",
        habitat: "river",
        kind: "plant",
        protection: "밟지 않아요",
        exhibition: "namgang",
        image,
      },
    ],
  };
  await openTools(page);
  await page.locator('[data-page="catalog"]').click();
  for (const name of ["가져온 풀", "새 이름 풀"]) {
    bundle.works[0].name = name;
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "작품 묶음 가져오기" }).click();
    await (
      await chooser
    ).setFiles({
      name: "학급.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(bundle)),
    });
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      async () =>
        (
          await import(
            document.querySelector('script[type="module"][src*="/src/main.js"]')
              .src
          )
        ).works.length,
    ),
  ).toBe(1);
  await expect(page.locator("#badge-count")).toHaveText("2 / 3");
  await page.getByRole("button", { name: "작품 살펴보기" }).click();
  await expect(page.getByText("밟지 않아요", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "이름·설명·위치 수정" }).click();
  await page.getByRole("button", { name: "변경 저장" }).click();
  await expect(page.locator("#badge-count")).toHaveText("3 / 3");
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
