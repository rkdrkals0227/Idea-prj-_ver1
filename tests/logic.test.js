import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  collect,
  sortWaste,
  reconcile,
  pathValid,
  approved,
  escapeHTML,
  mergeArt,
} from "../src/logic.js";
import { defaults } from "../src/data/content.js";
import { floodBackground, imageDimensions } from "../src/image.js";
test("collection, sorting and badges are idempotent and enforce category", () => {
  const s = initialState(),
    w = defaults.waste[0];
  assert.equal(collect(s, w.id), true);
  assert.equal(collect(s, w.id), false);
  assert.equal(sortWaste(s, w, "종이"), false);
  assert.equal(sortWaste(s, w, w.category), true);
  assert.equal(sortWaste(s, w, w.category), false);
  assert.equal(collect(s, w.id), false);
  for (const i of defaults.waste.filter((w) => w.zone === "village").slice(1)) {
    collect(s, i.id);
    sortWaste(s, i, i.category);
  }
  reconcile(s, defaults);
  reconcile(s, defaults);
  assert.deepEqual(s.completed, ["trash"]);
  assert.equal(s.badges.length, 1);
});
test("path requires every tile, direction and no obstruction", () => {
  const p = structuredClone(defaults.tactile.solution);
  assert.equal(pathValid(p, p, true), false);
  assert.equal(pathValid(p, p, false), true);
  const bad = structuredClone(p);
  bad[1].rotation = 90;
  assert.equal(pathValid(bad, p, false), false);
  bad[1].rotation = 180;
  assert.equal(pathValid(bad, p, false), true);
  bad[2].type = "empty";
  assert.equal(pathValid(bad, p, false), false);
});
test("lake badge requires sorting, rest, identification and handover", () => {
  const s = initialState();
  s.sorted = defaults.waste.filter((w) => w.zone === "lake").map((w) => w.id);
  reconcile(s, defaults);
  assert.ok(!s.completed.includes("lake"));
  s.lake = { rest: true, identify: true, picked: true, handed: true };
  reconcile(s, defaults);
  reconcile(s, defaults);
  assert.equal(s.badges.filter((b) => b === "호수 돌봄 배지").length, 1);
});
test("edge-connected flood preserves enclosed white animal and transparent alpha", () => {
  const w = 7,
    d = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 1; y <= 5; y++)
    for (let x = 1; x <= 5; x++) {
      if (x === 1 || x === 5 || y === 1 || y === 5) {
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 0;
      }
    }
  d[3] = 0;
  const out = floodBackground(d, w, w, [255, 255, 255], 30);
  assert.equal(out[3], 0);
  assert.equal(out[(3 * w + 3) * 4 + 3], 255);
  assert.equal(out[7], 0);
  assert.equal(out[(1 * w + 1) * 4 + 3], 255);
});
test("review gate, literal text and duplicate work ID merge", () => {
  assert.equal(approved(defaults.sources).length, 0);
  assert.equal(approved(defaults.quizzes).length, 3);
  assert.equal(
    escapeHTML('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );
  assert.deepEqual(
    mergeArt([{ id: "a", name: "old" }], [{ id: "a", name: "new" }]),
    [{ id: "a", name: "new" }],
  );
});
test("predecode PNG dimensions", () => {
  const b = new ArrayBuffer(24),
    v = new DataView(b);
  v.setUint8(0, 137);
  v.setUint8(1, 80);
  v.setUint32(16, 8000);
  v.setUint32(20, 6000);
  assert.deepEqual(imageDimensions(b), [8000, 6000]);
});
