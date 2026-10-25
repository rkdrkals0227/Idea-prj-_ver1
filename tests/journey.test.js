import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/logic.js";
import { defaults } from "../src/data/content.js";
import * as journey from "../src/journey.js";
test("school must be completed before road and legend unlock", () => {
  const s = initialState();
  assert.equal(journey.journeyLevel(s), 1);
  assert.equal(journey.canEnterLevel(s, 3), false);
  assert.equal(
    journey.saveSchoolPlan(
      s,
      { agendaId: "a-path", promise: "길을 막지 않기" },
      defaults,
    ),
    false,
  );
  journey.markBriefingRead(s);
  s.journey.ruleCopies=Object.fromEntries(defaults.classRules.rules.map(r=>[r.id,r.text]));
  assert.equal(
    journey.saveSchoolPlan(s, { agendaId: "bad", promise: "약속" }, defaults),
    false,
  );
  assert.equal(
    journey.saveSchoolPlan(
      s,
      { agendaId: "a-path", promise: "길을 막지 않기" },
      defaults,
    ),
    true,
  );
  assert.equal(journey.journeyLevel(s), 1);
  assert.equal(
    journey.saveWeeklyCheck(
      s,
      "2026-10-24",
      { done: true, note: "길을 살폈어요" },
      "2026-10-24",
    ),
    true,
  );
  assert.equal(journey.journeyLevel(s), 2);
  s.completed = ["path"];
  assert.equal(journey.journeyLevel(s), 2);
  s.completed.push("trash");
  assert.equal(journey.journeyLevel(s), 3);
  s.guardian.legendQuizPassed = true;
  assert.equal(journey.journeyLevel(s), 4);
});
test("week boundaries use Seoul dates, reject future checks, and never relock school on a new week", () => {
  assert.equal(
    journey.seoulDate(new Date("2026-10-23T16:00:00Z")),
    "2026-10-24",
  );
  assert.deepEqual(journey.weekDates("2026-10-24"), [
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
  ]);
  const s = initialState();
  journey.markBriefingRead(s);
  s.journey.ruleCopies=Object.fromEntries(defaults.classRules.rules.map(r=>[r.id,r.text]));
  journey.saveSchoolPlan(
    s,
    { agendaId: "a-path", promise: "길 살피기" },
    defaults,
  );
  assert.equal(
    journey.saveWeeklyCheck(s, "2026-10-25", { done: true }, "2026-10-24"),
    false,
  );
  assert.equal(
    journey.saveWeeklyCheck(s, "not-a-date", { done: true }, "2026-10-24"),
    false,
  );
  assert.equal(
    journey.saveWeeklyCheck(
      s,
      "2026-10-24",
      { done: true, note: "관찰" },
      "2026-10-24",
    ),
    true,
  );
  journey.saveWeeklyCheck(
    s,
    "2026-10-24",
    { done: false, note: "내일도 실천" },
    "2026-10-24",
  );
  assert.equal(journey.journeyLevel(JSON.parse(JSON.stringify(s))), 2);
  assert.deepEqual(journey.weekDates("2026-10-26").slice(0, 2), [
    "2026-10-26",
    "2026-10-27",
  ]);
  assert.equal(s.journey.checks["2026-10-24"].note, "내일도 실천");
});
test("archived exhibits cannot become a current mission or change three-lesson completion",()=>{
 const s=initialState(),work={id:'legacy',name:'그림',protection:'약속',exhibition:'namgang',blob:new Blob(['x'])};
 assert.equal(journey.registerExhibit(s,work),false);s.journey.schoolReady=true;s.completed=['path','trash'];s.guardian.legendQuizPassed=true;s.journey.exhibitIds=['legacy'];
 journey.reconcileExhibits(s,[work]);assert.deepEqual(s.journey.exhibitIds,['legacy']);assert.equal(journey.journeyLevel(s),4);journey.reconcileExhibits(s,[]);assert.equal(journey.journeyLevel(s),4);assert.equal(journey.canEnterLevel(s,4),false);
});

test("collected road waste points to bag and three-lesson success has no destination", async () => {
  const { objective } = await import("../src/journey.js");
  const { initialState } = await import("../src/logic.js");
  const { defaults } = await import("../src/data/content.js");
  const s = initialState();
  s.journey.schoolReady = true;
  s.path = true;
  s.completed = ["path"];
  s.collected = defaults.waste
    .filter((w) => w.zone === "village")
    .map((w) => w.id);
  assert.equal(objective(s, defaults, null).id, "bag");
  s.completed.push("trash");
  s.guardian.legendQuizPassed = true;
  assert.equal(objective(s, defaults, null), null);
});

test("tracked trash locations follow remaining items and switch to bag instead of deleted board", () => {
  const s = initialState();
  assert.equal(typeof journey.activityTarget, "function");
  assert.equal(journey.activityTarget(s, defaults, "trash").id, "waste:can");
  s.collected = defaults.waste
    .filter((w) => w.zone === "village")
    .map((w) => w.id);
  assert.deepEqual(journey.activityTarget(s, defaults, "trash"), {
    id: "bag",
    ui: true,
  });
});
