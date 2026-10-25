import { gameKey, isTextEntry } from "./input.js";
import * as THREE from "three";
import { ModelLibrary, ModelActor, fitModel, modelVariants } from "./models.js";
import manifest from "./data/asset-manifest.json";
import { habitats } from "./data/content.js";
const C = {
  grass: 0xb9cf8a,
  path: 0xe8d7ad,
  cream: 0xfff3d6,
  roof: 0xdb866b,
  green: 0x5d9872,
  water: 0x84c7cc,
};
// Put the newest local work on the front-center board, clear of the trees.
const exhibitSlots = [
  [-14.3, 16.1],
  [-10.6, 16.1],
  [-18, 16.1],
  [-14.3, 13],
  [-10.6, 13],
  [-18, 13],
];
const mats = new Map();
function mat(c) {
  if (!mats.has(c))
    mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  return mats.get(c);
}
const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 4),
};
function shape(type, color, size, pos, parent) {
  const m = new THREE.Mesh(geo[type], mat(color));
  m.scale.set(...size);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function label(text, color = "#315747") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const c = canvas.getContext("2d");
  c.fillStyle = "#fffbee";
  c.beginPath();
  c.roundRect(5, 5, 502, 82, 30);
  c.fill();
  c.font = "bold 29px sans-serif";
  c.textAlign = "center";
  c.fillStyle = color;
  c.fillText(text, 256, 57);
  const t = new THREE.CanvasTexture(canvas);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, depthTest: false }),
  );
  s.scale.set(4.5, 0.84, 1);
  s.userData.ownedTexture = true;
  return s;
}
export class World {
  constructor(host, { interact, near, warning, state, content }) {
    this.callbacks = { interact, near, warning };
    this.state = state;
    this.content = content;
    this.keys = new Set();
    this.entities = [];
    this.colliders = [];
    this.mixers = [];
    this.models = {};
    this.modelLibrary = new ModelLibrary(import.meta.env.BASE_URL);
    this.modelLoads = [];
    this.modelStatus = new Map();
    this.art = [];
    this.artToken = 0;
    this.indoor = null;
    this.moveEnabled = true;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#d6e8d9");
    this.scene.fog = new THREE.Fog("#d6e8d9", 52, 105);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 180);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute("aria-label", "금산마을 3D 탐험 화면");
    this.canvas.tabIndex = 0;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x788d5d, 1.8));
    const sun = new THREE.DirectionalLight(0xfff5d9, 1.8);
    sun.position.set(-15, 32, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -40,
      right: 40,
      top: 40,
      bottom: -40,
      far: 100,
    });
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.outdoor = new THREE.Group();
    this.scene.add(this.outdoor);
    this.createVillage();
    this.player = this.animal("player");
    this.player.position.set(-10, 0, 1);
    this.scene.add(this.player);
    this.loadRole("player", this.player);
    this.modelsReady = Promise.allSettled(this.modelLoads);
    this.camera.position.set(5, 23, 27);
    this.camera.lookAt(this.player.position);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.78, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff3b3, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.06;
    this.scene.add(this.ring);
    this.objectiveGroup = new THREE.Group();
    this.scene.add(this.objectiveGroup);
    this.objectiveMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd35a,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const goalRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.22, 48),
      this.objectiveMaterial,
    );
    goalRing.rotation.x = -Math.PI / 2;
    goalRing.position.y = 0.09;
    this.objectiveGroup.add(goalRing);
    this.beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe18a,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 1.1, 3, 20, 1, true),
      this.beamMaterial,
    );
    beam.position.y = 1.5;
    this.objectiveGroup.add(beam);
    const diamond = shape(
      "cone",
      0xffd35a,
      [0.28, 0.5, 0.28],
      [0, 3.2, 0],
      this.objectiveGroup,
    );
    diamond.rotation.x = Math.PI;

    window.addEventListener("resize", () => this.resize(host));
    this.resize(host);
    window.addEventListener("keydown", (e) => {
      if (
        isTextEntry(e.target) ||
        !this.moveEnabled ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      const key = gameKey(e);
      if (!key) return;
      e.preventDefault();
      if (key === "e") {
        if (!e.repeat) this.interactNearby();
      } else this.keys.add(key);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(gameKey(e)));
    window.addEventListener("blur", () => this.keys.clear());
    const ray = new THREE.Raycaster();
    this.canvas.addEventListener("pointerdown", (e) => {
      if (!this.moveEnabled) return;
      const r = this.canvas.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        ),
        this.camera,
      );
      const hits = ray.intersectObjects(
        [
          ...this.art.map((a) => a.sprite),
          ...(this.posterGroup?.children.filter((o) => o.userData.artId) || []),
        ],
        false,
      );
      if (hits[0])
        this.callbacks.interact("art:" + hits[0].object.userData.artId);
    });
    this.animate();
  }
  resize(host) {
    const w = host.clientWidth,
      h = host.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  block(x, z, w, d) {
    this.colliders.push({ x, z, w, d });
  }
  entity(id, title, x, z, object = null) {
    const obj = object || new THREE.Group();
    if (!object) this.outdoor.add(obj);
    obj.position.set(x, 0, z);
    const npc = [
      "otter",
      "turtle",
      "crane",
      "postman",
      "resident",
      "manager",
    ].includes(id);
    const displayTitle = npc
      ? id === "manager"
        ? "생태 안내원 · 이야기하기"
        : "동물 친구 · 이야기하기"
      : title;
    if (
      [
        "path",
        "bins",
        "mailbox",
        "eco-map",
        "forest",
        "rest",
        "exhibition",
      ].includes(id)
    )
      this.signpost(id, title, x, z - 0.6, 3.2);
    this.entities.push({ id, title: displayTitle, x, z, obj, tag: null });
    return obj;
  }
  building(id, title, color) {
    const cfg = manifest[id],
      g = new THREE.Group(),
      [x, , z] = cfg.position,
      [w, d] = cfg.collision;
    this.outdoor.add(g);
    g.position.set(x, 0, z);
    const h = id === "apartment" ? 6 : 3.2;
    shape("box", C.cream, [w, h, d], [0, h / 2, 0], g);
    if (id !== "apartment") {
      const roof = shape(
        "cone",
        color,
        [w * 0.85, 2, d * 0.85],
        [0, h + 0.8, 0],
        g,
      );
      roof.rotation.y = Math.PI / 4;
    } else shape("box", color, [w + 0.2, 0.3, d + 0.2], [0, h, 0], g);
    for (let i = -1; i <= 1; i++) {
      shape(
        "box",
        0x80a9aa,
        [0.95, 1, 0.08],
        [i * w * 0.27, 2, d / 2 + 0.04],
        g,
      );
      if (h > 4)
        shape(
          "box",
          0x80a9aa,
          [0.95, 1, 0.08],
          [i * w * 0.27, 4.4, d / 2 + 0.04],
          g,
        );
    }
    shape("box", 0x805d48, [1.2, 1.9, 0.12], [0, 0.95, d / 2 + 0.08], g);
    shape("box", 0xf5e9cb, [2, 0.18, 1], [0, 0.09, d / 2 + 0.45], g);
    this.block(x, z, w, d);
    const sign = this.physicalSign(title, Math.min(w * 0.8, 4.5), 0.9);
    sign.position.set(0, 2.7, d / 2 + 0.09);
    g.add(sign);
    this.signpost(id, title, x + w / 2 + 0.6, z + d / 2, 2.8);
    this.entity(
      id,
      id === "school" || id === "library" ? title + " · 들어가기" : title,
      x,
      z + d / 2 + 1.5,
    );
    this.loadRole(id, g);
    if (id === "school" || id === "library") {
      const entry = shape(
        "box",
        0xf6e2a6,
        [2.2, 0.1, 1.4],
        [x, 0.07, z + d / 2 + 0.8],
        this.outdoor,
      );
      entry.userData.entryFor = id;
    }
    return g;
  }
  physicalSign(text, width = 3, height = 0.8) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff8df";
    ctx.fillRect(0, 0, 1024, 320);
    ctx.strokeStyle = "#917651";
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 1006, 302);
    ctx.textAlign = "center";
    ctx.fillStyle = "#315e4b";
    const lines = String(text)
      .split("\n")
      .flatMap((line) =>
        line.length > 22 ? [line.slice(0, 22), line.slice(22, 44)] : [line],
      )
      .slice(0, 3);
    ctx.textBaseline = "middle";
    ctx.font = `bold ${lines.length > 1 ? 86 : 150}px sans-serif`;
    lines.forEach((line, i) =>
      ctx.fillText(
        line,
        512,
        lines.length === 1
          ? 160
          : lines.length === 2
            ? 105 + i * 110
            : 75 + i * 85,
        950,
      ),
    );
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      geo.plane,
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    mesh.scale.set(width, height, 1);
    mesh.userData.ownsTexture = true;
    return mesh;
  }
  signpost(id, text, x, z, width = 3) {
    const group = new THREE.Group();
    group.userData.signId = id;
    group.position.set(x, 0, z);
    this.outdoor.add(group);
    shape("box", 0x8c7353, [0.13, 1.8, 0.13], [-width * 0.32, 0.9, 0], group);
    shape("box", 0x8c7353, [0.13, 1.8, 0.13], [width * 0.32, 0.9, 0], group);
    const sign = this.physicalSign(text.split(" · ")[0], width, 1.05);
    sign.position.set(0, 1.8, 0.4);
    sign.userData.keepOnModel = true;
    group.add(sign);
    this.loadRole("sign", group);
    return group;
  }
  animal(id) {
    const g = new THREE.Group(),
      isTurtle = id === "turtle",
      isCrane = id === "crane",
      isPlayer = id === "player";
    const color = isPlayer
      ? 0xe9ba84
      : isTurtle
        ? 0x83a879
        : isCrane
          ? 0xeee9d4
          : 0xb99476;
    shape("sphere", color, [0.48, 0.63, 0.4], [0, 0.8, 0], g);
    shape("sphere", color, [0.48, 0.45, 0.43], [0, 1.5, 0], g);
    if (isTurtle)
      shape("sphere", 0x66845c, [0.53, 0.6, 0.28], [0, 0.85, -0.22], g);
    if (isPlayer) {
      shape("sphere", 0x4d7157, [0.52, 0.2, 0.48], [0, 1.87, 0], g);
      shape("box", 0x719e8e, [0.7, 0.6, 0.45], [0, 0.8, 0], g);
      shape("box", 0xdb997b, [0.5, 0.6, 0.3], [0, 0.86, -0.4], g);
    } else if (!isTurtle && !isCrane) {
      for (const x of [-0.35, 0.35])
        shape("sphere", color, [0.17, 0.2, 0.14], [x, 1.82, 0], g);
    }
    for (const x of [-0.17, 0.17]) {
      shape("sphere", 0x333f3b, [0.045, 0.065, 0.04], [x, 1.55, 0.4], g);
      shape("sphere", 0xe2a69a, [0.09, 0.05, 0.04], [x * 1.6, 1.38, 0.36], g);
      shape("sphere", 0x735c48, [0.16, 0.19, 0.25], [x, 0.18, 0.08], g);
    }
    shape(
      isCrane ? "cone" : "sphere",
      isCrane ? 0xd9a453 : 0xf2dac0,
      isCrane ? [0.14, 0.5, 0.13] : [0.23, 0.15, 0.13],
      [0, 1.33, 0.43],
      g,
    );
    return g;
  }
  tree(x, z, s = 1) {
    const g = new THREE.Group();
    this.outdoor.add(g);
    g.position.set(x, 0, z);
    shape("cylinder", 0x9c7a54, [0.22, 1.9, 0.22], [0, 0.9, 0], g);
    shape("sphere", 0x79a171, [1.35, 1.4, 1.25], [0, 2.4, 0], g);
    shape("sphere", 0x92b47d, [1.1, 1.1, 1], [0.6, 2.8, 0.2], g);
    g.scale.setScalar(s);
    this.block(x, z, 1 * s, 1 * s);
    if (manifest.tree.url) this.loadRole("tree", g);
  }
  createVillage() {
    shape("box", C.grass, [66, 0.35, 56], [0, -0.2, 0], this.outdoor);
    shape("box", C.path, [51, 0.04, 4], [1, 0.015, 3], this.outdoor);
    shape("box", C.path, [4, 0.045, 33], [1, 0.018, -3], this.outdoor);
    shape("box", C.path, [17, 0.04, 3], [18, 0.018, -10], this.outdoor);
    shape("box", C.path, [3, 0.04, 11], [-10, 0.018, 0], this.outdoor);
    this.pathPatch = shape(
      "box",
      C.path,
      [2, 0.12, 1.1],
      [-5, 0.1, 3],
      this.outdoor,
    );
    this.pathObstacle = new THREE.Group();
    this.pathObstacle.position.set(-7, 0, 3);
    this.outdoor.add(this.pathObstacle);
    shape("box", 0xc58b61, [0.8, 0.8, 0.8], [0, 0.4, 0], this.pathObstacle);
    this.loadRole("wasteWrapper", this.pathObstacle);
    this.building("school", this.content.schoolName, C.roof);
    this.building("library", "작은 도서관", 0x7fa397);
    this.building("apartment", "햇살 아파트", 0xb7a3bd);
    this.building("house", "꽃담 주택", 0xdbb16e);
    this.lakeModel = new THREE.Group();
    this.lakeModel.position.set(24, 0, -18);
    this.outdoor.add(this.lakeModel);
    shape("cylinder", C.water, [8, 0.12, 6], [0, -0.01, 0], this.lakeModel);
    shape(
      "cylinder",
      0xd7c997,
      [8.5, 0.06, 6.5],
      [0, -0.09, 0],
      this.lakeModel,
    );
    this.loadRole("lake", this.lakeModel);
    this.block(24, -18, 16, 12);
    for (let i = 0; i < 3; i++) {
      const m = shape(
        "cone",
        0x91aa91,
        [12 + i * 2, 13 + i * 2, 10],
        [-20 + i * 20, 5, -31 - i * 2],
        this.outdoor,
      );
      m.rotation.y = 0.6;
    }
    for (const [x, z, s] of [
      [-22, -12, 1.2],
      [-18, -16, 1],
      [-25, 2, 1],
      [-19, 9, 1],
      [-16, 15, 1.1],
      [-6, 17, 1.2],
      [6, 15, 1],
      [27, 9, 1],
      [-24, -23, 1.4],
      [8, -20, 1.2],
      [12, -23, 1.1],
      [29, -4, 1],
    ])
      this.tree(x, z, s);
    for (let i = 0; i < 80; i++) {
      const x = Math.sin(i * 39.7) * 29,
        z = Math.cos(i * 17.2) * 24;
      if (Math.abs(z - 3) < 3 || Math.abs(x - 1) < 3 || (x > 14 && z < -10))
        continue;
      shape(
        "sphere",
        i % 3 === 0 ? 0xf1bcb7 : i % 3 === 1 ? 0xffe7a0 : 0xebead4,
        [0.13, 0.17, 0.13],
        [x, 0.18, z],
        this.outdoor,
      );
    }
    for (const id of ["otter", "turtle", "crane", "postman"]) {
      const g = this.animal(id),
        p = manifest[id].position;
      this.outdoor.add(g);
      this.entity(id, this.content.dialogues[id].name, ...[p[0], p[2]], g);
      this.loadRole(id, g);
    }
    const npc = this.animal("otter");
    this.outdoor.add(npc);
    this.entity("resident", "밤톨 · 주택가 주민", 16, 9, npc);
    this.loadRole("resident", npc);
    this.entity("path", "안내 길 · 살펴보기", -6, 4.7);
    this.entity("bins", "분리수거함", 11, 10);
    for (let i = 0; i < 3; i++)
      shape(
        "box",
        [0x89a89c, 0xd2b578, 0x92a7b5][i],
        [0.8, 1, 0.8],
        [10 + i, 0.5, 11.4],
        this.outdoor,
      );
    this.entity("mailbox", "마을 우체통", 4, 8);
    shape("box", 0xb86853, [0.9, 1, 0.8], [4, 1.2, 8], this.outdoor);
    shape("cylinder", 0x826f57, [0.12, 1, 0.12], [4, 0.5, 8], this.outdoor);
    this.entity("eco-map", "우리 반 생태 지도", -3, 8);
    shape("box", 0x75988a, [2, 1.3, 0.18], [-3, 1.4, 8], this.outdoor);
    this.entity("forest", "월아산이 보이는 숲길", -19, -11);
    this.entity("rest", "남생이 쉼터", 18, -14);
    this.restTrash = shape(
      "box",
      0xe1ae7e,
      [0.4, 0.3, 0.4],
      [18, 0.15, -14],
      this.outdoor,
    );
    const manager = this.animal("crane");
    this.outdoor.add(manager);
    this.entity("manager", "생태 안내원 · 연습 표본 인계", 14, -10, manager);
    this.loadRole("manager", manager);
    this.specimen = shape(
      "sphere",
      0xb789a4,
      [0.4, 0.2, 0.4],
      [21, 0.25, -8],
      this.outdoor,
    );
    this.entity("specimen", "전문가가 지정한 연습 표본", 21, -8);
    for (const w of this.content.waste) {
      const m = shape(
        w.category === "금속" ? "cylinder" : "box",
        w.category === "종이" ? 0xf5eee0 : 0xb8c6c7,
        [0.3, 0.35, 0.3],
        [w.x, 0.2, w.z],
        this.outdoor,
      );
      const obj = this.entity("waste:" + w.id, w.name, w.x, w.z);
      obj.add(m);
      m.position.set(0, 0.25, 0);
      this.loadRole(
        w.category === "종이"
          ? "wastePaper"
          : w.category === "금속"
            ? "wasteCan"
            : w.category === "플라스틱"
              ? "wasteBottle"
              : "wasteWrapper",
        obj,
      );
    }
    shape("box", 0x8bc2c9, [3.5, 0.08, 27], [-28, -0.02, 9], this.outdoor);
    this.block(-28, 9, 3.5, 27);
    shape("box", 0xe1d9bb, [11, 0.08, 7], [-14, 0.01, 13], this.outdoor);
    this.entity("exhibition", "남강 생태 지도 전시", -14, 10);
    this.posterGroup = new THREE.Group();
    this.outdoor.add(this.posterGroup);
    for (let i = 0; i < 6; i++) {
      const [x, z] = exhibitSlots[i];
      shape("box", 0x9b805c, [0.12, 2, 0.15], [x - 1, 0.98, z], this.outdoor);
      shape("box", 0x9b805c, [0.12, 2, 0.15], [x + 1, 0.98, z], this.outdoor);
      shape("box", 0xe9e9d6, [2.5, 2, 0.12], [x, 2, z], this.outdoor);
    }
    this.addUploadedScenery();
    this.sync(this.state);
  }
  loadRole(id, group) {
    const cfg = manifest[id];
    if (!cfg?.url) return;
    const fallback = [...group.children].filter(
      (c) => !c.isSprite && !c.userData.keepOnModel,
    );
    const variants = modelVariants(cfg);
    const actor = new ModelActor(group, cfg);
    if (cfg.variants) this.models[id] = actor;
    for (const [role, variant] of Object.entries(variants)) {
      const key = `${id}:${role}`;
      this.modelStatus.set(key, "loading");
      const task = this.modelLibrary
        .load(variant.url)
        .then((gltf) => {
          actor.add(role, gltf, variant.clip);
          if (role === "idle")
            for (const child of fallback) child.visible = false;
          if (id === "tactileBroken") this.pathPatch.visible = false;
          this.modelStatus.set(key, "loaded");
          group.userData.uploadedRole = id;
          if (!cfg.variants) this.models[id] ||= actor;
        })
        .catch(() => {
          this.modelStatus.set(key, "fallback");
          if (role === "idle") actor.setState("idle");
          this.callbacks.warning(
            `${id} 모델(${role})을 읽지 못했어요. 임시 모형으로 계속할 수 있어요. 새로고침하거나 파일 경로·텍스처를 확인해 주세요.`,
          );
        });
      this.modelLoads.push(task);
    }
    return actor;
  }
  prop(id, x, z, rotation = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    this.outdoor.add(g);
    shape("box", 0xaa9872, [0.5, 0.7, 0.5], [0, 0.35, 0], g);
    this.loadRole(id, g);
    return g;
  }
  tileBatch(id, positions) {
    if (!positions.length || !manifest[id]?.url) return;
    this.modelStatus.set(`tiles:${id}`, "loading");
    const task = this.modelLibrary
      .load(manifest[id].url)
      .then((gltf) => {
        const root = fitModel(gltf.scene, manifest[id]);
        root.updateMatrixWorld(true);
        const group = new THREE.Group();
        group.userData.tileRole = id;
        root.traverse((mesh) => {
          if (!mesh.isMesh) return;
          const instances = new THREE.InstancedMesh(
            mesh.geometry,
            mesh.material,
            positions.length,
          );
          instances.receiveShadow = true;
          const matrix = new THREE.Matrix4();
          positions.forEach(([x, z], i) => {
            matrix.makeTranslation(x, 0, z);
            matrix.multiply(mesh.matrixWorld);
            instances.setMatrixAt(i, matrix);
          });
          instances.instanceMatrix.needsUpdate = true;
          group.add(instances);
        });
        this.outdoor.add(group);
        this.modelStatus.set(`tiles:${id}`, "loaded");
      })
      .catch(() => {
        this.modelStatus.set(`tiles:${id}`, "fallback");
        this.callbacks.warning(
          `${id} 바닥을 읽지 못해 기본 바닥을 사용해요. 새로고침해 주세요.`,
        );
      });
    this.modelLoads.push(task);
  }
  addUploadedScenery() {
    const grass = [],
      paving = [],
      water = [],
      lotus = [];
    for (let x = -30; x <= 30; x += 6)
      for (let z = -24; z <= 24; z += 6) grass.push([x, z]);
    for (let x = -24; x <= 26; x += 2)
      for (const z of [2, 4]) paving.push([x, z]);
    for (let z = -18; z <= 12; z += 2)
      for (const x of [0, 2]) if (z < 2 || z > 4) paving.push([x, z]);
    for (let z = -4; z <= 0; z += 2) paving.push([-10, z]);
    for (let x = 10; x <= 26; x += 2) paving.push([x, -10]);
    if (!manifest.lake?.url) {
      for (let x = 18; x <= 30; x += 3)
        for (let z = -21; z <= -15; z += 3)
          if (Math.hypot((x - 24) / 8, (z + 18) / 6) < 0.9)
            (x === 24 && z === -18 ? lotus : water).push([x, z]);
    }
    for (let z = -1; z <= 20; z += 3)
      (z === 8 || z === 17 ? lotus : water).push([-28, z]);
    this.tileBatch("grass", grass);
    this.tileBatch("paving", paving);
    this.tileBatch("water", water);
    this.tileBatch("lotusWater", lotus);
    for (const [x, z] of [
      [-14, 3],
      [6, 3],
      [23, 4],
      [-5, -10],
    ])
      this.prop("lamp", x, z);
    for (const [x, z] of [
      [-15, -1],
      [9, -12],
      [25, -10],
    ]) {
      this.prop("bench", x, z);
      this.block(x, z, 2.1, 0.8);
    }
    for (const [x, z] of manifest.fence?.placements || []) {
      this.prop("fence", x, z);
      const [w, d] = manifest.fence.collision;
      this.block(x, z, w, d);
    }
    this.tactileTiles = [];
    for (let i = 0; i < 9; i++)
      if (i !== 4) {
        const g = new THREE.Group();
        g.position.set(-9 + i, 0, 3);
        this.outdoor.add(g);
        shape("box", 0xf0db9b, [0.85, 0.09, 0.85], [0, 0.06, 0], g);
        this.loadRole("tactile", g);
        this.tactileTiles.push(g);
      }
    this.brokenTile = new THREE.Group();
    this.brokenTile.position.set(-5, 0, 3);
    this.outdoor.add(this.brokenTile);
    this.loadRole("tactileBroken", this.brokenTile);
    this.fixedTile = new THREE.Group();
    this.fixedTile.position.set(-5, 0, 3);
    this.outdoor.add(this.fixedTile);
    this.loadRole("tactile", this.fixedTile);
  }
  enter(id) {
    this.keys.clear();
    if (this.indoor) this.exit();
    this.indoor = id;
    this.outdoor.visible = false;
    this.room = new THREE.Group();
    this.scene.add(this.room);
    shape("box", 0xe9d8b9, [16, 0.2, 14], [0, -0.1, 0], this.room);
    shape("box", 0xe6e1c8, [16, 4, 0.3], [0, 2, -7], this.room);
    shape("box", 0xe6e1c8, [0.3, 4, 14], [-8, 2, 0], this.room);
    if (id === "school") {
      shape("box", 0x588b75, [7, 2.6, 0.2], [0, 2, -6.7], this.room);
      const t = label("우리 학급 회의 결과");
      t.position.set(0, 3, -6.3);
      this.room.add(t);
    } else {
      for (let i = -1; i <= 1; i++) {
        shape("box", 0x9e7655, [3, 3, 0.7], [i * 4, 1.5, -6], this.room);
        for (let j = 0; j < 9; j++)
          shape(
            "box",
            [0xa1bda7, 0xe3b18b, 0xd3c69d][j % 3],
            [0.22, 1, 0.4],
            [i * 4 - 1 + j * 0.25, 1 + (j % 2), -5.5],
            this.room,
          );
      }
    }
    this.player.position.set(0, 0, 3);
    this.roomEntities = [
      { id: "exit", title: "마을로 나가기", x: 0, z: 5.7 },
      {
        id: id === "school" ? "board" : "books",
        title:
          id === "school"
            ? "회의 결과 · 활동 돌아보기"
            : "책장 · 지역 자료와 도감",
        x: 0,
        z: -4,
      },
    ];
    this.camera.position.set(10, 21, 27);
  }
  exit() {
    if (!this.indoor) return;
    const id = this.indoor;
    this.scene.remove(this.room);
    this.room.traverse((o) => {
      if (o.userData.ownedTexture) o.material.map?.dispose();
    });
    const p = manifest[id].position;
    this.player.position.set(p[0], 0, p[2] + manifest[id].collision[1] / 2 + 2);
    this.indoor = null;
    this.outdoor.visible = true;
    this.keys.clear();
  }
  sync(s) {
    this.state = s;
    this.pathPatch.visible =
      !s.path && this.modelStatus.get("tactileBroken:idle") !== "loaded";
    if (this.brokenTile) this.brokenTile.visible = !s.path;
    if (this.fixedTile) this.fixedTile.visible = !!s.path;
    this.pathObstacle.visible = !s.path;
    this.restTrash.visible = !s.lake.rest;
    this.specimen.visible = !s.lake.picked;
    for (const e of this.entities) {
      if (e.id.startsWith("waste:"))
        e.obj.visible =
          !s.collected.includes(e.id.slice(6)) &&
          !s.sorted.includes(e.id.slice(6));
      if (e.id === "specimen") e.obj.visible = !s.lake.picked;
    }
  }
  blocked(x, z) {
    if (this.indoor) return Math.abs(x) > 7 || z > 6 || z < -5.4;
    return (
      Math.abs(x) > 30 ||
      Math.abs(z) > 25 ||
      this.colliders.some(
        (c) =>
          Math.abs(x - c.x) < c.w / 2 + 0.38 &&
          Math.abs(z - c.z) < c.d / 2 + 0.38,
      )
    );
  }
  setPaused(v) {
    this.moveEnabled = !v;
    this.keys.clear();
  }
  configure(settings) {
    this.settings = settings;
    this.renderer.setPixelRatio(
      settings.quality === "low" ? 1 : Math.min(devicePixelRatio, 1.7),
    );
    this.renderer.shadowMap.enabled = settings.quality !== "low";
  }
  async setArt(works, settings) {
    const token = ++this.artToken;
    for (const child of this.posterGroup.children) {
      child.traverse((o) => {
        if (o.material) {
          if (o.userData.ownsTexture) o.material.map?.dispose();
          o.material.dispose();
        }
      });
    }
    this.posterGroup.clear();
    for (const a of this.art) {
      this.outdoor.remove(a.group);
      a.texture.dispose();
      a.sprite.material.dispose();
      a.tag.material.map.dispose();
      a.tag.material.dispose();
    }
    this.art = [];
    const localIds = this.state.journey?.exhibitIds || [],
      localSet = new Set(localIds);
    const ordered = [
      ...[...localIds]
        .reverse()
        .map((id) => works.find((w) => w.id === id))
        .filter(Boolean),
      ...works.filter((w) => !localSet.has(w.id) && w.exhibition === "namgang"),
      ...works.filter((w) => !localSet.has(w.id) && w.exhibition !== "namgang"),
    ];
    let displayed = 0;
    for (const a of ordered.slice(0, Math.min(30, settings.artLimit))) {
      try {
        const bitmap = await createImageBitmap(a.blob);
        if (token !== this.artToken) {
          bitmap.close();
          return;
        }
        const texture = new THREE.CanvasTexture(bitmap);
        texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.03,
          }),
        );
        texture.addEventListener("dispose", () => bitmap.close());
        sprite.scale.set(
          (2 * bitmap.width) / Math.max(bitmap.width, bitmap.height),
          (2 * bitmap.height) / Math.max(bitmap.width, bitmap.height),
          1,
        );
        sprite.position.y = 1.2;
        sprite.userData.artId = a.id;
        const group = new THREE.Group();
        group.add(sprite);
        const tag = label(
          settings.displayName === "alias" ? a.alias || a.name : a.name,
        );
        tag.position.y = 2.7;
        tag.scale.multiplyScalar(0.55);
        group.add(tag);
        const h = habitats[a.habitat] || habitats.grass;
        group.position.set(h.x, 0, h.z);
        this.outdoor.add(group);
        if (a.exhibition === "namgang" && displayed < 6) {
          const [x, z] = exhibitSlots[displayed++];
          const image = new THREE.Mesh(
            geo.plane,
            new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              alphaTest: 0.03,
              side: THREE.DoubleSide,
            }),
          );
          image.scale.set(
            (1.6 * bitmap.width) / Math.max(bitmap.width, bitmap.height),
            (1.6 * bitmap.height) / Math.max(bitmap.width, bitmap.height),
            1,
          );
          image.position.set(x, 2.1, z + 0.08);
          image.userData.artId = a.id;
          this.posterGroup.add(image);
          const caption = this.physicalSign(
            `${a.name}\n${a.protection || "보호 약속을 적어 주세요"}`,
            2.5,
            1.1,
          );
          caption.position.set(x, 0.72, z + 0.09);
          this.posterGroup.add(caption);
        }
        this.art.push({
          data: a,
          group,
          sprite,
          tag,
          texture,
          phase: this.art.length * 2.3,
        });
      } catch {
        this.callbacks.warning(
          "작품 이미지 한 장을 읽지 못했어요. 도감에서 삭제하거나 다시 등록해 주세요.",
        );
      }
    }
  }
  handover() {
    this.transfer?.mesh.removeFromParent();
    const mesh = shape(
      "box",
      0xc9ab78,
      [0.55, 0.4, 0.45],
      [this.player.position.x, 1.3, this.player.position.z],
      this.scene,
    );
    this.transfer = { mesh, from: mesh.position.clone(), elapsed: 0 };
  }
  setObjective(target) {
    this.activeObjective = target;
    this.objectiveGroup.visible = !!target;
    if (target) this.objectiveGroup.position.set(target.x, 0, target.z);
  }
  updateObjective(t) {
    if (!this.objectiveGroup) return;
    const pulse = this.settings?.motion ? 1 : 0.8 + 0.2 * Math.sin(t * 2.5);
    this.objectiveMaterial.opacity = this.settings?.motion
      ? 0.85
      : 0.5 + pulse * 0.35;
    this.beamMaterial.opacity = this.settings?.motion
      ? 0.22
      : 0.14 + pulse * 0.12;
    this.objectiveGroup.scale.setScalar(
      this.settings?.motion ? 1 : 0.96 + pulse * 0.07,
    );
  }
  interactNearby() {
    if (!this.moveEnabled) return;
    const target = this.updateNearby();
    if (target) {
      this.models[target.id]?.setState("greet");
      this.callbacks.interact(target.id);
    } else
      this.callbacks.warning(
        "문이나 주민 가까이 가 주세요. 아래에 대상 이름이 나타나면 E키나 그 버튼으로 이야기할 수 있어요.",
      );
  }
  updateNearby() {
    const p = this.player.position;
    let near = null,
      min = 3.2;
    for (const e of this.indoor ? this.roomEntities : this.entities) {
      if (e.obj && !e.obj.visible) continue;
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < min) {
        near = e;
        min = d;
      }
    }
    if (near?.id !== this.nearest?.id) {
      this.nearest = near;
      this.callbacks.near(near);
    }
    if (this.ring) {
      this.ring.visible = !!near;
      if (near) this.ring.position.set(near.x, 0.07, near.z);
    }
    return near;
  }
  animate = () => {
    requestAnimationFrame(this.animate);
    const elapsed = this.clock.getDelta(),
      dt = Math.min(elapsed, 0.05),
      animationDt = Math.min(elapsed, 1),
      t = this.clock.elapsedTime;
    let dx = 0,
      dz = 0;
    if (this.moveEnabled) {
      dx =
        (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
        (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
      dz =
        (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
        (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0);
    }
    const length = Math.hypot(dx, dz);
    if (length) {
      dx /= length;
      dz /= length;
      const x = this.player.position.x + dx * dt * 5,
        z = this.player.position.z + dz * dt * 5;
      if (!this.blocked(x, this.player.position.z)) this.player.position.x = x;
      if (!this.blocked(this.player.position.x, z)) this.player.position.z = z;
      this.player.rotation.y = Math.atan2(dx, dz);
    }
    const reduced = this.settings?.motion;
    this.player.position.y = length && !reduced ? Math.sin(t * 14) * 0.06 : 0;
    this.models.player?.setState(length ? "walk" : "idle");
    for (const [id, actor] of Object.entries(this.models)) {
      if (["otter", "turtle", "crane", "resident", "manager"].includes(id)) {
        const entity = this.entities.find((e) => e.id === id);
        const patrol =
          this.moveEnabled &&
          !this.indoor &&
          !reduced &&
          Math.sin(t * 0.28 + entity.x) > 0.7;
        if (actor.current?.role !== "greet") {
          actor.setState(patrol ? "walk" : "idle");
          entity.obj.position.x =
            entity.x + (patrol ? Math.sin(t * 0.8) * 0.35 : 0);
          entity.obj.rotation.y = patrol
            ? Math.cos(t * 0.8) > 0
              ? Math.PI / 2
              : -Math.PI / 2
            : 0;
        }
      }
      if (id === "postman" && actor.current?.role !== "greet")
        actor.setState(this.delivery ? "walk" : "idle");
      actor.update(
        reduced && actor.current?.role !== "greet" ? 0 : animationDt,
      );
    }
    const p = this.player.position;
    const target = new THREE.Vector3(p.x + 13, p.y + 21, p.z + 23);
    this.camera.position.lerp(target, 1 - Math.exp(-dt * 5));
    this.camera.lookAt(p.x, p.y, p.z - 1);
    this.updateNearby();
    this.updateObjective(t);
    for (const a of this.art) {
      const h = habitats[a.data.habitat] || habitats.grass,
        move = a.data.kind === "animal" && !reduced;
      const q = t * 0.22 + a.phase;
      const step = Math.sin(q) * 0.5 + 0.5;
      if (move && step > 0.16) {
        a.group.position.x = h.x + Math.sin(q) * h.r;
        a.group.position.z = h.z + Math.sin(q * 1.7) * h.r * 0.5;
      }
      a.sprite.position.y =
        1.2 + (reduced ? 0 : Math.sin(t * 2 + a.phase) * 0.07);
      a.sprite.material.rotation =
        a.data.kind === "plant" && !reduced ? Math.sin(t + a.phase) * 0.04 : 0;
      if (move)
        a.sprite.scale.x =
          Math.abs(a.sprite.scale.x) * (Math.cos(q) > 0 ? 1 : -1);
    }
    if (this.transfer) {
      const a = this.transfer;
      a.elapsed += dt;
      const f = Math.min(a.elapsed / 1.5, 1);
      a.mesh.position.lerpVectors(a.from, new THREE.Vector3(14, 1.3, -10), f);
      a.mesh.position.y += Math.sin(f * Math.PI) * 0.8;
      if (f === 1) {
        a.mesh.removeFromParent();
        this.transfer = null;
      }
    }
    if (this.delivery) {
      const e = this.entities.find((e) => e.id === "postman");
      e.obj.position.x = e.x + Math.sin(Math.min(this.delivery, Math.PI)) * 3;
      this.delivery += dt * 1.5;
      if (this.delivery > Math.PI) {
        e.obj.position.x = e.x;
        this.delivery = 0;
      }
    }
    this.renderer.render(this.scene, this.camera);
  };
}
