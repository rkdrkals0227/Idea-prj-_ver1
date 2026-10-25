import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { fitModel, ModelActor } from "../src/models.js";
const mesh = () => {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 2));
  m.position.set(12, 7, -4);
  g.add(m);
  return g;
};
test("uploaded models are centered, grounded and rotated before footprint fitting", () => {
  const model = fitModel(mesh(), {
    targetSize: 2,
    rotation: Math.PI / 2,
    groundHeight: 0.1,
  });
  const box = new THREE.Box3().setFromObject(model),
    size = box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(box.min.y - 0.1) < 1e-6);
  assert.ok(Math.abs(size.y - 2) < 1e-6);
  assert.ok(Math.abs(box.getCenter(new THREE.Vector3()).x) < 1e-6);
  const tile = fitModel(mesh(), { fit: [2, 0.12, 3] });
  const s = new THREE.Box3().setFromObject(tile).getSize(new THREE.Vector3());
  assert.ok(
    Math.abs(s.x - 2) < 1e-6 &&
      Math.abs(s.y - 0.12) < 1e-6 &&
      Math.abs(s.z - 3) < 1e-6,
  );
});
test("walking swaps uploaded variants, repeated state does not restart animation, greeting returns to idle", () => {
  const make = () => ({
    scene: mesh(),
    animations: [
      new THREE.AnimationClip("Walking", 1, []),
      new THREE.AnimationClip("Big_Wave_Hello", 0.3, []),
    ],
  });
  const parent = new THREE.Group();
  const actor = new ModelActor(parent, { targetSize: 2 });
  actor.add("idle", make());
  actor.add("walk", make(), "Walking");
  actor.add("greet", make(), "Big_Wave_Hello");
  actor.setState("walk");
  actor.update(0.2);
  const action = actor.current.action;
  actor.setState("walk");
  assert.ok(action.time > 0);
  assert.equal(actor.current.role, "walk");
  actor.setState("greet");
  actor.update(0.4);
  assert.equal(actor.current.role, "idle");
  assert.equal(actor.variants.get("walk").wrapper.visible, false);
});
test("missing walking or greeting variants retain the usable idle model", () => {
  const actor = new ModelActor(new THREE.Group(), { targetSize: 2 });
  actor.add("idle", { scene: mesh(), animations: [] });
  actor.setState("walk");
  assert.equal(actor.current.role, "idle");
});
test("missing idle never overlaps the placeholder, and greeting restores procedural idle", () => {
  const parent = new THREE.Group(),
    placeholder = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  parent.add(placeholder);
  const actor = new ModelActor(parent, { targetSize: 2 });
  const make = () => ({
    scene: mesh(),
    animations: [new THREE.AnimationClip("Big_Wave_Hello", 0.3, [])],
  });
  actor.add("walk", make());
  actor.add("greet", make(), "Big_Wave_Hello");
  actor.setState("walk");
  assert.equal(placeholder.visible, false);
  actor.setState("greet");
  actor.update(0.4);
  assert.equal(actor.state, "idle");
  assert.equal(actor.current, null);
  assert.equal(placeholder.visible, true);
  assert.equal(actor.variants.get("greet").wrapper.visible, false);
});
test("single-file legacy manifest keeps idle and walking animation roles", async () => {
  const module = await import("../src/models.js");
  assert.equal(typeof module.modelVariants, "function");
  assert.deepEqual(
    module.modelVariants({
      url: "models/player.glb",
      animations: { idle: "Rest", walk: "Walking" },
    }),
    {
      idle: { url: "models/player.glb", clip: "Rest" },
      walk: { url: "models/player.glb", clip: "Walking" },
    },
  );
});

test("building footprint fitting preserves proportions and stays inside collision width and depth", () => {
  const model = fitModel(mesh(), { footprint: [3, 2] });
  const size = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x - 3) < 1e-6);
  assert.ok(Math.abs(size.y - 6) < 1e-6);
  assert.ok(size.z <= 2);
});
test('lake material overrides are local to the fitted model and geometry sits above terrain',()=>{
 const source=mesh();source.children[0].material=new THREE.MeshStandardMaterial();const original=source.children[0].material;
 const model=fitModel(source,{fit:[16,1.35,12],groundHeight:.03,materialOverrides:{metalness:0,roughness:.85,normalScale:.25},castShadow:false});
 let loaded;model.traverse(o=>{if(o.isMesh)loaded=o});
 assert.notEqual(loaded.material,original);assert.equal(loaded.material.metalness,0);assert.equal(loaded.material.roughness,.85);assert.equal(loaded.material.normalScale.x,.25);assert.equal(loaded.castShadow,false);
 assert.ok(new THREE.Box3().setFromObject(model).min.y>=.029);
});
