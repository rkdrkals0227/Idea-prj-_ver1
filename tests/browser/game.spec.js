import { test, expect } from "@playwright/test";
test.setTimeout(90000);
async function boot(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await expect(page.locator("#world canvas")).toBeVisible();
  await page.evaluate(async()=>{const {world}=await import('/src/main.js');world.configure({quality:'low',motion:false,artLimit:30});});
}
async function position(page, x, z) {
  await page.evaluate(
    async ({ x, z }) => {
      const { world } = await import("/src/main.js");
      world.player.position.set(x, 0, z);
    },
    { x, z },
  );
  await page.waitForTimeout(200);
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
  await expect.poll(async()=>page.evaluate(async()=> (await import('/src/main.js')).world.player.position.x)).toBeGreaterThan(-9.8);
  await page.keyboard.up("d");
  expect(
    await page.evaluate(
      async () => (await import("/src/main.js")).world.player.position.x,
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
    [10, 5, '빈 음료 캔'],[13, 8, '깨끗한 종이'],[16, 5, '빈 플라스틱병'],[22, -9,'호숫가 빈 캔'],[17, -11,'호숫가 깨끗한 종이']
  ]) await act(page,x,z,text);
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
    async () => (await import("/src/main.js")).world.player.position.x,
  );
  await page
    .locator('[name="free"]')
    .fill("우리 함께 길을 비워요 <script>alert(1)</script>");
  await page.keyboard.press("a");
  expect(
    await page.evaluate(
      async () => (await import("/src/main.js")).world.player.position.x,
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
      async () => (await import("/src/main.js")).state.letters.length,
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
  await page
    .locator("#image-input")
    .setInputFiles({
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
    const { world, works } = await import("/src/main.js");
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
      async () => (await import("/src/main.js")).world.art.length,
    ),
  ).toBe(0);
});
test("invalid image, transparent PNG and quota error", async ({
  page,
}) => {
  await boot(page);
  await page
    .locator("#image-input")
    .setInputFiles({
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
  await page
    .locator("#image-input")
    .setInputFiles({
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

test('missing GLB falls back without blocking the school', async ({page})=>{
 const {readFile}=await import('node:fs/promises');
 const manifest=JSON.parse(await readFile(new URL('../../src/data/asset-manifest.json',import.meta.url),'utf8'));
 manifest.school.url='models/missing-validation.glb';
 await page.route('**/src/data/asset-manifest.json*',route=>route.fulfill({contentType:'application/javascript',body:`export default ${JSON.stringify(manifest)};`}));
 await page.route('**/models/missing-validation.glb',route=>route.fulfill({status:404,body:'Missing model'}));
 await boot(page);await expect(page.locator('#toast')).toContainText('school 모델을 불러오지 못해');
 await act(page,-10,-.6,'들어가기');await act(page,0,-3.8,'회의 결과');
 await expect(page.getByRole('heading',{name:'우리 학급 회의 결과',exact:true})).toBeVisible();
});

test('teacher JSON editing, content import validation and real collision boundaries', async({page})=>{
 await boot(page);
 await position(page,-10,-1.8);await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');
 expect(await page.evaluate(async()=> (await import('/src/main.js')).world.player.position.z)).toBeGreaterThan(-2.13);
 const collision=await page.evaluate(async()=>{const w=(await import('/src/main.js')).world;return [w.blocked(-10,-5),w.blocked(24,-18),w.blocked(-22,-12),w.blocked(0,3)];});expect(collision).toEqual([true,true,true,false]);
 await page.locator('[data-page="settings"]').click();await page.getByRole('button',{name:'교사용 수업 편집'}).click();
 const editor=page.locator('#json-editor');const data=JSON.parse(await editor.inputValue());data.className='4학년 초록별반';await editor.fill(JSON.stringify(data));await page.getByRole('button',{name:'자료 저장',exact:true}).click();await expect(page.locator('#teacher-result')).toContainText('저장했어요');
 await page.locator('#section').selectOption('quizzes');const q=JSON.parse(await editor.inputValue());q.quizzes[0].answer=999;await editor.fill(JSON.stringify(q));await page.getByRole('button',{name:'자료 저장',exact:true}).click();await expect(page.locator('#teacher-result')).toContainText('저장하지 않았어요');await close(page);await page.reload();
 await act(page,-10,-.6,'들어가기');await act(page,0,-3.8,'회의 결과');await expect(page.getByRole('heading',{name:/4학년 초록별반/})).toBeVisible();
});

test('bundle import replaces same ID atomically, WebGL recovery and small tablet controls',async({page})=>{
 await boot(page);
 const bundle=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=c.height=40;c.getContext('2d').fillRect(5,5,20,20);return {schema:'geumsan-art',version:1,works:[{id:'shared-id',name:'가져온 풀',alias:'친구',habitat:'grass',kind:'plant',image:c.toDataURL()}]};});
 await page.locator('[data-page="catalog"]').click();
 for(const name of ['가져온 풀','이름 바꾼 풀']){bundle.works[0].name=name;const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'작품 묶음 가져오기'}).click();await(await chooser).setFiles({name:'학급.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();}
 expect(await page.evaluate(async()=> (await import('/src/main.js')).works.length)).toBe(1);await close(page);
 await page.setViewportSize({width:768,height:1024});await expect(page.locator('[data-page="catalog"]')).toBeInViewport();
 await page.evaluate(async()=>{(await import('/src/main.js')).world.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));});await expect(page.getByRole('heading',{name:'화면 연결이 잠시 끊겼어요'})).toBeVisible();
});
