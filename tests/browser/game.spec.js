import { test, expect } from "@playwright/test";
test.setTimeout(90000);
async function boot(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await expect(page.locator("#world canvas")).toBeVisible();
  await page.evaluate(async () => {
    const { world } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    world.configure({ quality: "low", motion: false, artLimit: 30 });
  });
}
async function position(page, x, z) {
  await page.evaluate(
    async ({ x, z }) => {
      const { world } = await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      );
      world.player.position.set(x, 0, z);
    },
    { x, z },
  );
  // Wait for the game's proximity update, even under software WebGL rendering.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function act(page, x, z, text) {
  await position(page, x, z);
  await expect(page.locator("#interact")).toContainText(text);
  await page.keyboard.press("e");
}
async function close(page) {
  await page.getByRole("button", { name: "창 닫기", exact: true }).click();
}
test("school, movement, collisions, puzzle, quizzes and local restoration", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await page.keyboard.down("d");
  await expect
    .poll(async () =>
      page.evaluate(
        async () =>
          (
            await import(
              document.querySelector(
                'script[type="module"][src*="/src/main.js"]',
              ).src
            )
          ).world.player.position.x,
      ),
    )
    .toBeGreaterThan(-9.8);
  await page.keyboard.up("d");
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
  ).toBeGreaterThan(-10);
  await act(page, -10, -0.6, "들어가기");
  await expect(page.locator("#place")).toContainText("교실");
  await act(page, 0, -3.8, "회의 결과");
  await page.getByRole("button", { name: /길을 막은 물건/ }).click();
  await page
    .getByRole("button", { name: "이 활동 해 보기", exact: true })
    .click();
  await act(page, 0, 5, "나가기");
  await act(page, -6, 4.7, "안내 길");
  await page.getByRole("button", { name: "경로가 이어졌는지 확인" }).click();
  await expect(page.locator("#path-feedback")).toContainText("상자");
  await page.getByRole("button", { name: "상자 옮겨 통행로 비우기" }).click();
  await page.locator('[data-type="1"]').selectOption("line");
  await page.locator('[data-rotate="2"]').click();
  await page.getByRole("button", { name: "경로가 이어졌는지 확인" }).click();
  await expect(page.locator('[data-quest="path"]')).toContainText("완료했어요");
  await act(page, -4, 1, "물결");
  await page.getByRole("button", { name: "퀴즈 풀기", exact: true }).click();
  await page.locator('[data-answer="1"]').click();
  await expect(page.locator("#answer")).toContainText("다시");
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator("#answer")).toContainText("맞았어요");
  await close(page);
  await page.reload();
  await expect(page.locator('[data-quest="path"]')).toContainText("완료했어요");
  expect(errors).toEqual([]);
});
test("trash and lake full objectives, repeated pickup, library and letter drafts pause movement", async ({
  page,
}) => {
  await boot(page);
  for (const [x, z, text] of [
    [10, 5, "빈 음료 캔"],
    [13, 8, "깨끗한 종이"],
    [16, 5, "빈 플라스틱병"],
    [22, -9, "호숫가 빈 캔"],
    [17, -11, "호숫가 깨끗한 종이"],
  ])
    await act(page, x, z, text);
  await act(page, 11, 10, "수거함");
  await page.locator('[data-sort="can"][data-category="종이"]').click();
  await expect(page.locator(".result").first()).toContainText("금속");
  for (const [id, category] of [
    ["can", "금속"],
    ["paper", "종이"],
    ["bottle", "플라스틱"],
    ["lake-can", "금속"],
    ["lake-paper", "종이"],
  ])
    await page
      .locator(`[data-sort="${id}"][data-category="${category}"]`)
      .click();
  await close(page);
  await expect(page.locator('[data-quest="trash"]')).toContainText("완료");
  await act(page, 15.5, -14, "쉼터");
  await act(page, 14, -10, "안내원");
  await page
    .getByRole("button", { name: "거리를 두고 관찰·기록하고 어른에게 알리기" })
    .click();
  await close(page);
  await act(page, 21, -8, "표본");
  await act(page, 14, -10, "안내원");
  await page
    .getByRole("button", { name: "담아 온 연습 표본 인계하기" })
    .click();
  await close(page);
  await expect(page.locator('[data-quest="lake"]')).toContainText("완료");
  await act(page, 1, -6, "들어가기");
  await act(page, 0, -3.8, "책장");
  await expect(
    page.getByRole("heading", { name: "♧ 우리 반 생태 도감" }),
  ).toBeVisible();
  await close(page);
  await act(page, 0, 5, "나가기");
  await act(page, 4, 8, "우체통");
  await page.locator('[name="recipient"]').fill("마을 주민");
  await page.locator('[name="problem"]').fill("학교 앞 안내 길");
  await page.locator('[name="alias"]').fill("초록이");
  const before = await page.evaluate(
    async () =>
      (
        await import(
          document.querySelector('script[type="module"][src*="/src/main.js"]')
            .src
        )
      ).world.player.position.x,
  );
  await page
    .locator('[name="free"]')
    .fill("우리 함께 길을 비워요 <script>alert(1)</script>");
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
  ).toEqual(before);
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
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
test("image editor, IndexedDB restoration, ID sync, bundle export and deletion", async ({
  page,
}) => {
  await boot(page);
  const buffer = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1400;
    c.height = 1100;
    const x = c.getContext("2d");
    x.fillStyle = "white";
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "black";
    x.lineWidth = 12;
    x.strokeRect(350, 200, 600, 600);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#image-input").setInputFiles({
    name: "흰동물.png",
    mimeType: "image/png",
    buffer: Buffer.from(buffer, "base64"),
  });
  await expect(page.locator("#art-canvas")).toHaveJSProperty("width", 1024);
  await page.getByRole("button", { name: "가장자리 배경 지우기" }).click();
  const alpha = await page.locator("#art-canvas").evaluate((c) => {
    const x = c.getContext("2d");
    return [
      x.getImageData(0, 0, 1, 1).data[3],
      x.getImageData(400, 300, 1, 1).data[3],
    ];
  });
  expect(alpha).toEqual([0, 255]);
  await page.locator('[name="name"]').fill("흰 나비");
  await page.locator('[name="alias"]').fill("푸름");
  await page.locator('[name="description"]').fill("꽃밭에서 관찰한 작품");
  await page
    .getByRole("checkbox", { name: "배경 제거 결과를 확인했어요" })
    .check();
  await page.getByRole("button", { name: "마을에 등록하기" }).click();
  await expect(page.locator(".overlay")).toHaveCount(0);
  await page.reload();
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
  await close(page);
  const art = await page.evaluate(async () => {
    const { world, works } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    return {
      id: works[0].id,
      worldId: world.art[0].data.id,
      habitat: world.art[0].data.habitat,
    };
  });
  expect(art.id).toEqual(art.worldId);
  expect(art.habitat).toEqual("lake");
  await page.locator('[data-page="catalog"]').click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "학급 작품 묶음 내보내기",
    })
    .click();
  expect((await dl).suggestedFilename()).toContain("학급작품");
  await page.getByRole("button", { name: "작품 살펴보기" }).click();
  await page.getByRole("button", { name: "작품 삭제" }).click();
  await page.getByRole("button", { name: "삭제하기", exact: true }).click();
  await expect(page.getByText("첫 번째 생태 친구를 기다려요")).toBeVisible();
  await close(page);
  expect(
    await page.evaluate(
      async () =>
        (
          await import(
            document.querySelector('script[type="module"][src*="/src/main.js"]')
              .src
          )
        ).world.art.length,
    ),
  ).toBe(0);
});
test("invalid image, transparent PNG and quota error", async ({ page }) => {
  await boot(page);
  await page.locator("#image-input").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a png"),
  });
  await expect(page.locator("#toast")).toContainText("이미지 크기");
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 100;
    c.getContext("2d").fillRect(30, 30, 30, 30);
    return c.toDataURL().split(",")[1];
  });
  await page.locator("#image-input").setInputFiles({
    name: "transparent.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
  expect(
    await page
      .locator("#art-canvas")
      .evaluate((c) => c.getContext("2d").getImageData(0, 0, 1, 1).data[3]),
  ).toBe(0);
  await close(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.locator('[data-page="settings"]').click();
  await page.getByRole("button", { name: "설정 적용" }).click();
  await expect(page.locator("#toast")).toContainText("저장 공간이 부족");
  await expect(page.locator(".overlay")).toBeVisible();
});

test("missing GLB falls back without blocking the school", async ({ page }) => {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(
    await readFile(
      new URL("../../src/data/asset-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  manifest.school.url = "models/missing-validation.glb";
  await page.route("**/src/data/asset-manifest.json*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `export default ${JSON.stringify(manifest)};`,
    }),
  );
  await page.route("**/models/missing-validation.glb", (route) =>
    route.fulfill({ status: 404, body: "Missing model" }),
  );
  await boot(page);
  await expect(page.locator("#toast")).toContainText(
    "school 모델을 불러오지 못해",
  );
  await act(page, -10, -0.6, "들어가기");
  await act(page, 0, -3.8, "회의 결과");
  await expect(
    page.getByRole("heading", { name: "우리 학급 회의 결과", exact: true }),
  ).toBeVisible();
});

test("teacher JSON editing, content import validation and real collision boundaries", async ({
  page,
}) => {
  await boot(page);
  await position(page, -10, -1.8);
  await page.keyboard.down("w");
  await page.waitForTimeout(700);
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
  const collision = await page.evaluate(async () => {
    const w = (
      await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      )
    ).world;
    return [
      w.blocked(-10, -5),
      w.blocked(24, -18),
      w.blocked(-22, -12),
      w.blocked(0, 3),
    ];
  });
  expect(collision).toEqual([true, true, true, false]);
  await page.locator('[data-page="settings"]').click();
  await page.getByRole("button", { name: "교사용 수업 편집" }).click();
  const editor = page.locator("#json-editor");
  const data = JSON.parse(await editor.inputValue());
  data.className = "4학년 초록별반";
  await editor.fill(JSON.stringify(data));
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
  await act(page, -10, -0.6, "들어가기");
  await act(page, 0, -3.8, "회의 결과");
  await expect(
    page.getByRole("heading", { name: /4학년 초록별반/ }),
  ).toBeVisible();
});

test("bundle import replaces same ID atomically, WebGL recovery and small tablet controls", async ({
  page,
}) => {
  await boot(page);
  const bundle = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    c.getContext("2d").fillRect(5, 5, 20, 20);
    return {
      schema: "geumsan-art",
      version: 1,
      works: [
        {
          id: "shared-id",
          name: "가져온 풀",
          alias: "친구",
          habitat: "grass",
          kind: "plant",
          image: c.toDataURL(),
        },
      ],
    };
  });
  await page.locator('[data-page="catalog"]').click();
  for (const name of ["가져온 풀", "이름 바꾼 풀"]) {
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
  await close(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('[data-page="catalog"]')).toBeInViewport();
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

test("residents have distinct stories and quiz topics; next stays with the same resident", async ({
  page,
}) => {
  await boot(page);
  const seen = new Set(),
    stories = new Set();
  for (const [x, z, name, topic, question] of [
    [-4, 1, "물결", "강과 마을 문화", "물결과 강가를"],
    [19, -11, "느루", "호수 생태", "야생 생물을"],
    [4, -6, "다온", "사실과 전설", "전해 내려오는"],
    [16, 9, "밤톨", "쓰레기와 생활", "빈 음료 캔을"],
    [3, 6, "솔솔", "주민 의견과 편지", "불편한 길을"],
  ]) {
    await act(page, x, z, name);
    await page.locator("#story").click();
    const story = await page.locator(".modal-body>p").first().textContent();
    expect(stories.has(story)).toBe(false);
    stories.add(story);
    await page.locator("#topic-quiz").click();
    await expect(page.locator(".modal-header h2")).toContainText(topic);
    const q = await page.locator(".modal-body h3").textContent();
    expect(q).toContain(question);
    expect(seen.has(q)).toBe(false);
    seen.add(q);
    await close(page);
  }
  // The postman has three own questions; never cycles into a librarian's question.
  for (const [index, answer] of [
    [0, 0],
    [1, 1],
    [2, 2],
  ]) {
    await act(page, 3, 6, "솔솔");
    await page.locator("#quiz").click();
    await expect(page.locator(".modal-header h2")).toContainText(
      "주민 의견과 편지",
    );
    await page.locator(`[data-answer="${answer}"]`).click();
    if (index === 2) {
      await page
        .getByRole("button", { name: "이 주제 마무리", exact: true })
        .click();
      await expect(page.locator(".modal-header h2")).toContainText(
        "주제 마무리",
      );
      await expect(page.locator("[data-review]")).toHaveCount(3);
    }
    await close(page);
  }
  await page.reload();
  await act(page, 3, 6, "솔솔");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-header h2")).toContainText("주제 마무리");
});

test("forest, apartment and library have their own questions; unavailable context does not fall back", async ({
  page,
}) => {
  await boot(page);
  await act(page, -19, -11, "숲길");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-header h2")).toContainText("숲길");
  await expect(page.locator(".modal-body h3")).toContainText("숲길 옆");
  await close(page);
  await act(page, 14, 3, "아파트");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-header h2")).toContainText("공동생활");
  await expect(page.locator(".modal-body h3")).toContainText("아파트 복도");
  await close(page);
  await act(page, 1, -6, "들어가기");
  await act(page, 0, -3.8, "책장");
  await page.getByRole("button", { name: "자료 읽기 퀴즈" }).click();
  await expect(page.locator(".modal-header h2")).toContainText("자료 읽기");
  await expect(page.locator(".modal-body h3")).toContainText(
    "오래된 생태 조사",
  );
  await close(page);
  await act(page, 0, 5, "나가기");
  await page.evaluate(async () => {
    const { content } = await import(
      document.querySelector('script[type="module"][src*="/src/main.js"]').src
    );
    for (const q of content.quizzes)
      if (q.contexts.includes("otter")) q.reviewStatus = "검토 필요";
  });
  await act(page, -4, 1, "물결");
  await page.locator("#quiz").click();
  await expect(page.locator(".modal-header h2")).toContainText("퀴즈 준비 중");
  await expect(page.locator("[data-answer]")).toHaveCount(0);
});

test("physical E and WASD work with Korean keyboard events without affecting text input", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ㄷ",
        code: "KeyE",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await expect(page.locator("#place")).toContainText("교실");
  await position(page, 0, -3.8);
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Process",
        code: "KeyE",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await expect(
    page.getByRole("heading", { name: "우리 학급 회의 결과", exact: true }),
  ).toBeVisible();
  await close(page);
  await act(page, 0, 5, "나가기");
  await position(page, 0, 3);
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ㅇ",
        code: "KeyD",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (
            await import(
              document.querySelector(
                'script[type="module"][src*="/src/main.js"]',
              ).src
            )
          ).world.player.position.x,
      ),
    )
    .toBeGreaterThan(0.2);
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "ㅇ", code: "KeyD", bubbles: true }),
    ),
  );
  await act(page, 4, 8, "우체통");
  const input = page.locator('[name="recipient"]');
  await input.fill("주민 여러분");
  await input.dispatchEvent("keydown", {
    key: "ㄷ",
    code: "KeyE",
    isComposing: true,
  });
  await expect(input).toHaveValue("주민 여러분");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await close(page);
  await position(page, -29, 23);
  await page.keyboard.press("e");
  await expect(page.locator("#toast")).toContainText("가까이");
  await position(page, -10, -1);
  await page.locator("#interact").click();
  await expect(page.locator("#place")).toContainText("교실");
  await act(page, 0, 5, "나가기");
  await page.setViewportSize({ width: 768, height: 1024 });
  await position(page, -10, -1);
  await page.locator("#interact").click();
  await expect(page.locator("#place")).toContainText("교실");
});

test("guardian intro, sequential legend dialogue, quiz lock, stamp reward and reload restoration", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /스탬프 3개를 모아/ }),
  ).toBeVisible();
  await expect(page.locator(".guardian-intro li")).toHaveCount(3);
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await page.evaluate(async () => {
    (
      await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      )
    ).world.configure({ quality: "low" });
  });
  await expect(page.locator("#badge-count")).toHaveText("0 / 3");
  await act(page, 19, -11, "느루");
  await page.locator("#legend").click();
  await expect(page.locator("#legend-quiz")).toBeDisabled();
  await expect(page.locator("#legend-text")).toContainText("두 용");
  await page.locator("#legend-next").click();
  await close(page);
  await page.reload();
  await page.evaluate(async () => {
    (
      await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      )
    ).world.configure({ quality: "low" });
  });
  await act(page, 19, -11, "느루");
  await page.locator("#legend").click();
  await expect(page.locator("#legend-text")).toContainText("청룡과 황룡");
  // Five remaining pages; the quiz cannot be reached by skipping the dialogue.
  for (let i = 1; i < 6; i++) {
    await expect(page.locator("#legend-quiz")).toBeDisabled();
    await page.locator("#legend-next").click();
  }
  await expect(page.locator("[data-legend-answer]")).toHaveCount(3);
  await page.locator('[data-legend-answer="1"]').click();
  await expect(page.locator("#legend-feedback")).toContainText("다시 생각");
  await expect(page.locator("#badge-count")).toHaveText("0 / 3");
  await page.locator('[data-legend-answer="0"]').click();
  await expect(
    page.getByRole("heading", {
      name: "이야기 수호대 스탬프를 받았어요!",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#badge-count")).toHaveText("1 / 3");
  await expect(page.locator(".stamp-mini.earned")).toHaveCount(1);
  await page.getByRole("button", { name: /스탬프 모음/ }).click();
  await expect(page.locator(".guardian-card")).toHaveCount(3);
  await close(page);
  await page.reload();
  await expect(page.locator("#badge-count")).toHaveText("1 / 3");
  await act(page, 19, -11, "느루");
  await page.locator("#legend").click();
  await page.locator("#legend-quiz").click();
  await expect(
    page.getByRole("heading", {
      name: "이미 받은 이야기 수호대 스탬프",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("#badge-count")).toHaveText("1 / 3");
});

test("existing save retains civic/ecology progress; third stamp grants guardian success and teacher story edits persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("geumsan-state-v1"));
    s.completed = ["path", "trash", "lake"];
    s.path = true;
    delete s.guardian;
    localStorage.setItem("geumsan-state-v1", JSON.stringify(s));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /스탬프 3개를 모아/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await expect(page.locator("#badge-count")).toHaveText("2 / 3");
  await expect(page.locator('[data-quest="lake"]')).toContainText("완료");
  await page.evaluate(async () => {
    (
      await import(
        document.querySelector('script[type="module"][src*="/src/main.js"]').src
      )
    ).world.configure({ quality: "low" });
  });
  await page.locator("#guardian-open").click();
  await page.locator('[data-stamp="story"]').click();
  for (let i = 0; i < 6; i++) await page.locator("#legend-next").click();
  await page.locator('[data-legend-answer="0"]').click();
  await expect(page.locator("#badge-count")).toHaveText("3 / 3");
  await page.getByRole("button", { name: /스탬프 모음/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "우리 동네 수호대 · 미션 성공!",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".stamp-seal.earned")).toHaveCount(3);
  await close(page);
  await page.reload();
  await expect(page.locator("#guardian-open")).toContainText("수호대 성공");
  await page.locator('[data-page="settings"]').click();
  await page.getByRole("button", { name: "교사용 수업 편집" }).click();
  await page.locator("#section").selectOption("legend");
  const editor = page.locator("#json-editor"),
    data = JSON.parse(await editor.inputValue());
  data.guardianLegend.pages[0].text = "선생님이 고친 금호지 전설 도입이에요.";
  await editor.fill(JSON.stringify(data));
  await page.getByRole("button", { name: "자료 저장", exact: true }).click();
  await expect(page.locator("#teacher-result")).toContainText("저장했어요");
  await close(page);
  await page.reload();
  await page.locator("#guardian-open").click();
  await page.locator('[data-stamp="story"]').click();
  await expect(page.locator("#legend-text")).toContainText("선생님이 고친");
});
