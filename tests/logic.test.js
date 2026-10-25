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
  bad[1].rotation += 90;
  assert.equal(pathValid(bad, p, false), false);
  bad[1].rotation = p[1].rotation + 180;
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
  assert.equal(approved(defaults.quizzes).length, 25);
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

import {
  quizPool,
  upgradeQuizContent,
  extraQuizzes,
} from "../src/data/learning.js";
test("each resident and place owns a distinct reviewed quiz pool; no unrelated fallback", () => {
  const ids = new Set();
  for (const context of [
    "otter",
    "turtle",
    "crane",
    "house",
    "postman",
    "library",
    "forest",
    "apartment",
  ]) {
    const pool = quizPool(defaults, context);
    assert.equal(pool.length, 3, context);
    for (const q of pool) {
      assert.ok(!ids.has(q.id), q.id);
      ids.add(q.id);
    }
  }
  assert.deepEqual(quizPool(defaults, "unknown"), []);
  assert.deepEqual(quizPool(defaults, "source:festival"), []);
  const c = structuredClone(defaults);
  c.quizzes = c.quizzes.map((q) => ({
    ...q,
    reviewStatus: q.contexts.includes("postman") ? "검토 필요" : q.reviewStatus,
  }));
  assert.deepEqual(quizPool(c, "postman"), []);
});
test("older teacher data upgrades once without losing custom text, reviews or deleted questions", () => {
  const c = structuredClone(defaults);
  delete c.quizRoutingVersion;
  c.quizzes = c.quizzes.filter((q) => !extraQuizzes.some((e) => e.id === q.id));
  for (const q of c.quizzes) delete q.contexts;
  c.dialogues.otter.story = "선생님이 쓴 물결 이야기";
  c.quizzes[0].question = "수정한 안전 문제";
  const upgraded = upgradeQuizContent(c);
  assert.equal(upgraded.dialogues.otter.story, c.dialogues.otter.story);
  assert.equal(upgraded.quizzes[0].question, c.quizzes[0].question);
  assert.equal(quizPool(upgraded, "otter").length, 3);
  assert.equal(
    upgraded.quizzes.find((q) => q.id === "q-river").reviewStatus,
    "검토 필요",
  );
  upgraded.quizzes = upgraded.quizzes.filter((q) => q.id !== "q-river-care");
  assert.deepEqual(upgradeQuizContent(upgraded), upgraded);
});

test("source quizzes require both approved source and its own approved question", () => {
  const c = structuredClone(defaults),
    source = c.sources.find((s) => s.id === "festival");
  source.reviewStatus = "검토 완료";
  source.checkedAt = "2026-10-23";
  assert.deepEqual(quizPool(c, "source:festival"), []);
  c.quizzes.find((q) => q.id === "q-river").reviewStatus = "검토 완료";
  assert.deepEqual(
    quizPool(c, "source:festival").map((q) => q.id),
    ["q-river"],
  );
  source.reviewStatus = "검토 필요";
  assert.deepEqual(quizPool(c, "source:festival"), []);
});

import { gameKey, isTextEntry } from "../src/input.js";
test("physical game keys accept Korean and IME events, with safe legacy fallback", () => {
  assert.equal(gameKey({ key: "ㄷ", code: "KeyE" }), "e");
  assert.equal(
    gameKey({ key: "Process", code: "KeyE", isComposing: true }),
    "e",
  );
  assert.equal(gameKey({ key: "ㅇ", code: "KeyD" }), "d");
  assert.equal(gameKey({ key: "E" }), "e");
  assert.equal(gameKey({ key: "ArrowUp" }), "arrowup");
  assert.equal(gameKey({ key: "Enter", code: "Enter" }), null);
  assert.equal(isTextEntry({ tagName: "INPUT" }), true);
  assert.equal(isTextEntry({ tagName: "TEXTAREA" }), true);
  assert.equal(isTextEntry({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isTextEntry({ tagName: "CANVAS" }), false);
});

import {
  initialGuardian,
  readLegendPage,
  hasReadLegend,
  answerLegend,
  earnedGuardianStamps,
  isGuardian,
  validateGuardianLesson,
} from "../src/guardian.js";
import { defaultGuardianLegend } from "../src/data/guardian.js";
test("guardian legend requires all sequential dialogue pages before quiz; wrong answers and repeats never add stamps", () => {
  const s = initialState(),
    lesson = defaultGuardianLegend;
  s.journey.schoolReady = true;
  s.completed = ["path", "trash"];
  s.journey.met = ["turtle"];
  assert.equal(answerLegend(s, lesson, 0), "locked");
  assert.equal(readLegendPage(s, lesson, lesson.pages.at(-1).id), false);
  assert.equal(readLegendPage(s, lesson, "unknown-page"), false);
  assert.equal(hasReadLegend(s, lesson), false);
  for (const p of lesson.pages)
    assert.equal(readLegendPage(s, lesson, p.id), true);
  readLegendPage(s, lesson, lesson.pages[0].id);
  assert.equal(s.guardian.legendSeen.length, lesson.pages.length);
  assert.equal(answerLegend(s, lesson, 1), "wrong");
  assert.equal(earnedGuardianStamps(s).length, 2);
  assert.equal(answerLegend(s, lesson, 0), "earned");assert.equal(answerLegend(s, lesson, 0), "already");
  assert.deepEqual(earnedGuardianStamps(s).map(s=>s.id),['school','story','village']);assert.equal(isGuardian(s),true);
  s.completed=['path'];assert.equal(earnedGuardianStamps(s).length,1);s.completed.push('trash');assert.equal(earnedGuardianStamps(s).length,3);
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(isGuardian(restored), true);
  assert.equal(hasReadLegend(restored, lesson), true);
});
test("old records gain guardian defaults without inventing legend completion; teacher legend IDs and answers validate", () => {
  const old = initialState();
  delete old.guardian;
  old.completed = ["path", "trash", "lake"];
  assert.equal(earnedGuardianStamps(old).length, 0);
  assert.equal(hasReadLegend(old, defaultGuardianLegend), false);
  old.guardian = initialGuardian();
  assert.equal(old.guardian.legendQuizPassed, false);
  const c = structuredClone(defaults);
  delete c.guardianLegend;
  const upgraded = upgradeQuizContent(c);
  assert.deepEqual(upgraded.guardianLegend, defaultGuardianLegend);
  assert.doesNotThrow(() => validateGuardianLesson(defaultGuardianLegend));
  const bad = structuredClone(defaultGuardianLegend);
  bad.pages[1].id = bad.pages[0].id;
  assert.throws(() => validateGuardianLesson(bad));
});

test("legend cannot award a stamp before the school and road levels even when dialogue IDs are already read", () => {
  const s = initialState();
  s.guardian.legendSeen = defaultGuardianLegend.pages.map((p) => p.id);
  assert.equal(answerLegend(s, defaultGuardianLegend, 0), "locked");
  assert.equal(s.guardian.legendQuizPassed, false);
});

test("legend content cannot be completed without meeting the turtle friend after road level", () => {
  const s = initialState();
  s.journey.schoolReady = true;
  s.completed = ["path", "trash"];
  s.guardian.legendSeen = defaultGuardianLegend.pages.map((p) => p.id);
  assert.equal(answerLegend(s, defaultGuardianLegend, 0), "locked");
});

test("removed-place quiz defaults migrate while teacher custom wording survives", async () => {
  const { upgradeQuizContent } = await import("../src/data/learning.js");
  const c = structuredClone(defaults);
  c.quizzes.find((q) => q.id === "q-sort-can").place = "꽃담 주택가";
  c.quizzes.find((q) => q.id === "q-sort-can").question =
    "빈 음료 캔을 주웠어요. 이 게임에서 알맞은 수거함은?";
  c.quizzes.find((q) => q.id === "q-trash-danger").place =
    "선생님이 정한 관찰 장소";
  c.quizzes.find((q) => q.id === "q-library-date").place = "작은 도서관";
  c.quizzes.find((q) => q.id === "q-forest-trail").place = "월아산이 보이는 숲길";
  const next = upgradeQuizContent(c);
  assert.equal(next.quizzes.find((q) => q.id === "q-library-date").place, "도서관");
  assert.equal(next.quizzes.find((q) => q.id === "q-forest-trail").place, "월아산");
  assert.equal(
    next.quizzes.find((q) => q.id === "q-sort-can").place,
    "햇살 아파트 주변",
  );
  assert.match(
    next.quizzes.find((q) => q.id === "q-sort-can").question,
    /가방/,
  );
  assert.equal(
    next.quizzes.find((q) => q.id === "q-trash-danger").place,
    "선생님이 정한 관찰 장소",
  );
});
