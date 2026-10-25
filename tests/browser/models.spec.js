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
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
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
  expect(result.tiles).toEqual([]);
  expect(await inspect(page,m=>!!m.world.nature.ground&&!!m.world.nature.stream)).toBe(true);
  expect(result.loaded.every(([, s]) => s === "loaded")).toBe(true);
  await inspect(page, (m) => {
    const e = m.world.entities.find((e) => e.id === "turtle");
    m.world.player.position.set(e.x, 0, e.z);
    m.world.updateNearby();
    m.world.interactNearby();
  });
  expect(await inspect(page, (m) => m.world.models.turtle.current.role)).toBe(
    "greet",
  );
  await expect
    .poll(() => inspect(page, (m) => m.world.models.turtle.current.role), {
      timeout: 30000,
    })
    .toBe("idle");
  const repaired = await inspect(page, (m) => {
    m.state.path = true;
    m.state.collected.push("paper");
    m.world.sync(m.state);
    return {
      broken: m.world.brokenTile.visible,
      fixed: m.world.fixedTile.visible,
      paper: m.world.entities.find((e) => e.id === "waste:paper").obj.visible,
    };
  });
  expect(repaired).toEqual({ broken: false, fixed: true, paper: false });
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
  const fallback = await inspect(page, async (m) => {
    await m.world.modelsReady;
    const actor = m.world.models.turtle;
    actor.setState("walk");
    const overlap = actor.fallback.some((o) => o.visible);
    actor.setState("greet");
    actor.update(6);
    return {
      overlap,
      idle: actor.current === null,
      placeholder: actor.fallback.some((o) => o.visible),
      greet: actor.variants.get("greet").wrapper.visible,
    };
  });
  expect(fallback).toEqual({
    overlap: false,
    idle: true,
    placeholder: true,
    greet: false,
  });
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

test("complete upload pack uses player, otter, buildings, tree, lake and fence while keeping entrances usable", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: "탐험을 시작할까요? →" }).click();
  await inspect(page, async (m) => {
    m.world.configure({ ...m.state.settings, quality: "low" });
    await m.world.modelsReady;
  });
  const loaded = await inspect(page, (m) => ({
    roles: [
      "player",
      "otter",
      "turtle",
      "crane",
      "school",
      "library",
      "apartment",
      "tree",
      "lake",
      "fence",
    ].filter((id) => m.world.models[id]?.current),
    count: m.world.modelLibrary.cache.size,
  }));
  expect(loaded.roles).toEqual([
    "player",
    "otter",
    "turtle",
    "crane",
    "school",
    "library",
    "apartment",
    "tree",
    "lake",
    "fence",
  ]);
  expect(loaded.count).toBe(25);
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await page.keyboard.down("d");
  await expect
    .poll(() => inspect(page, (m) => m.world.models.player?.current?.role), {timeout: 15000})
    .toBe("walk");
  expect(
    await inspect(
      page,
      (m) => m.world.models.player.current.action.getClip().name,
    ),
  ).toBe("Running");
  await page.keyboard.up("d");
  await expect
    .poll(() => inspect(page, (m) => m.world.models.player.current.role), {timeout: 15000})
    .toBe("idle");
  const bounds = await inspect(page, async (m) => {
    const T = await import("/node_modules/three/build/three.module.js");
    return ["school", "library", "apartment"].map((id) => {
      const a = m.world.models[id],
        box = new T.Box3().setFromObject(a.current.wrapper),
        s = box.getSize(new T.Vector3());
      return { id, x: s.x, z: s.z };
    });
  });
  for (const b of bounds) {
    expect(b.x).toBeLessThanOrEqual(
      b.id === "school" ? 7.01 : b.id === "library" ? 6.01 : 8.01,
    );
    expect(b.z).toBeLessThanOrEqual(b.id === "apartment" ? 7.01 : 5.01);
  }
  for (const [id, x, z] of [
    ["school", -10, -1],
    ["library", 1, -6],
  ]) {
    await inspect(page, (m) => {
      if (m.world.indoor) m.world.exit();
    });
    await page.evaluate(
      async ({ x, z }) => {
        const { world } = await import("/src/main.js");
        world.player.position.set(x, 0, z);
      },
      { x, z },
    );
    await page.keyboard.press("e");
    await expect.poll(() => inspect(page, (m) => m.world.indoor)).toBe(id);
    await inspect(page, (m) => m.world.player.position.set(0, 0, 5.6));
    await page.keyboard.press("e");
    await expect.poll(() => inspect(page, (m) => m.world.indoor)).toBe(null);
  }
  const targets = await inspect(page, (m) => ({
    school: m.world.blocked(-10, -5),
    oldPond: m.world.outdoor.children.filter(
      (o) =>
        o.isMesh && o.position.x === 24 && o.position.z === -18 && o.visible,
    ).length,
    lake: m.world.blocked(24, -18),
    fences: m.world.outdoor.children.filter(
      (o) => o.userData.uploadedRole === "fence",
    ).length,
  }));
  expect(targets.oldPond).toBe(0);
  expect(targets.school).toBe(true);
  expect(targets.lake).toBe(true);
  expect(targets.fences).toBeGreaterThan(0);
});
