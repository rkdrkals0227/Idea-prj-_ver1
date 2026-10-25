import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

// One request per file, including repeated furniture and tile instances.
export class ModelLibrary {
  constructor(base = "./") {
    this.base = base;
    this.cache = new Map();
  }
  load(url) {
    if (!this.cache.has(url)) {
      this.cache.set(
        url,
        (async () => {
          const manager = new THREE.LoadingManager();
          let failed = false;
          manager.onError = () => {
            failed = true;
          };
          const gltf = await new GLTFLoader(manager).loadAsync(
            this.base + url.replace(/^\//, ""),
          );
          if (failed) throw new Error("외부 텍스처·버퍼 누락");
          return gltf;
        })(),
      );
    }
    return this.cache.get(url);
  }
}
export function fitModel(source, cfg = {}) {
  const model = clone(source);
  const rotated = new THREE.Group();
  rotated.rotation.y = cfg.rotation || 0;
  rotated.add(model);
  rotated.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rotated),
    size = box.getSize(new THREE.Vector3());
  if (
    ![size.x, size.y, size.z].every(Number.isFinite) ||
    Math.max(size.x, size.y, size.z) <= 0
  )
    throw new Error("유효하지 않은 모델 크기");
  const scale = cfg.footprint
    ? Math.min(cfg.footprint[0] / size.x, cfg.footprint[1] / size.z)
    : cfg.targetHeight
      ? cfg.targetHeight / size.y
      : (cfg.targetSize || 1) / Math.max(size.x, size.y, size.z);
  const s = cfg.fit
    ? new THREE.Vector3(...cfg.fit).divide(size)
    : new THREE.Vector3(scale, scale, scale);
  if (![s.x, s.y, s.z].every(Number.isFinite))
    throw new Error("유효하지 않은 모델 비율");
  const wrapper = new THREE.Group();
  wrapper.scale.copy(s);
  wrapper.add(rotated);
  const center = box.getCenter(new THREE.Vector3());
  wrapper.position.set(
    -center.x * s.x,
    -box.min.y * s.y + (cfg.groundHeight || 0),
    -center.z * s.z,
  );
  wrapper.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = !cfg.tile;
      o.receiveShadow = true;
    }
  });
  return wrapper;
}
export class ModelActor {
  constructor(parent, cfg) {
    this.parent = parent;
    this.cfg = cfg;
    this.variants = new Map();
    this.current = null;
    this.state = "idle";
    this.fallback = [...parent.children].filter(
      (c) => !c.isSprite && !c.userData.keepOnModel,
    );
  }
  add(role, gltf, clipName) {
    const wrapper = fitModel(gltf.scene, this.cfg);
    wrapper.visible = false;
    this.parent.add(wrapper);
    // Animation tracks target original node names under the fitting wrapper.
    const mixer = new THREE.AnimationMixer(wrapper);
    const clip = clipName
      ? THREE.AnimationClip.findByName(gltf.animations, clipName)
      : null;
    const action = clip ? mixer.clipAction(clip) : null;
    const variant = { role, wrapper, mixer, action };
    this.variants.set(role, variant);
    mixer.addEventListener("finished", () => {
      if (this.current === variant && role === "greet") this.setState("idle");
    });
    if (!this.current || this.state === role) this.setState(this.state, true);
  }
  setState(role, force = false) {
    this.state = role;
    const next = this.variants.get(role) || this.variants.get("idle");
    if (!force && next === this.current) return;
    if (this.current) {
      this.current.wrapper.visible = false;
      this.current.action?.stop();
    }
    this.current = next || null;
    for (const child of this.fallback) child.visible = !next;
    if (!next) return;
    next.wrapper.visible = true;
    if (next.action) {
      next.action.reset();
      next.action.setLoop(
        next.role === "greet" ? THREE.LoopOnce : THREE.LoopRepeat,
        Infinity,
      );
      next.action.clampWhenFinished = next.role === "greet";
      next.action.play();
    }
  }
  update(dt) {
    this.current?.mixer.update(dt);
  }
}

export function modelVariants(cfg) {
  if (cfg.variants) return cfg.variants;
  const roles = Object.entries(cfg.animations || {});
  return roles.length
    ? Object.fromEntries(
        roles.map(([role, clip]) => [role, { url: cfg.url, clip }]),
      )
    : { idle: { url: cfg.url } };
}
