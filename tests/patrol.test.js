import test from "node:test";
import assert from "node:assert/strict";
import { createPatrol, stepPatrol } from "../src/patrol.js";
test("resident traverses metres of a bounded loop rather than swaying in place", () => {
  const p = createPatrol(
    [
      [0, 0],
      [3, 0],
      [3, 2],
      [0, 2],
    ],
    1,
  );
  for (let i = 0; i < 20; i++) stepPatrol(p, 0.1, {});
  assert.ok(p.x > 1.8);
  assert.ok(p.z === 0);
  for (let i = 0; i < 200; i++) {
    stepPatrol(p, 0.1, {});
    assert.ok(p.x >= 0 && p.x <= 3 && p.z >= 0 && p.z <= 2);
  }
});
test("proximity, pause and collisions stop walking without teleportation", () => {
  const p = createPatrol(
    [
      [0, 0],
      [3, 0],
    ],
    1,
  );
  stepPatrol(p, 0.5, { paused: true });
  assert.equal(p.x, 0);
  assert.equal(p.moving, false);
  stepPatrol(p, 0.5, { player: { x: 1, z: 0 } });
  assert.equal(p.x, 0);
  stepPatrol(p, 0.5, { blocked: () => true });
  assert.equal(p.x, 0);
  assert.equal(p.moving, false);
  stepPatrol(p, 0.5, {});
  assert.ok(p.x > 0 && p.x < 1);
  assert.equal(p.moving, true);
});
