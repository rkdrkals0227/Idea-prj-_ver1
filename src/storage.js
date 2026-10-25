import { normalizeJourney } from "./journey.js";
import { normalizeGuardian } from "./guardian.js";
import { initialState } from "./logic.js";
const KEY = "geumsan-state-v1",
  CONTENT = "geumsan-content-v1";
let report = () => {};
export function setStorageReporter(fn) {
  report = fn;
}
export function loadState() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    return d
      ? {
          ...initialState(),
          ...d,
          activity: {totalMs:Number.isFinite(d.activity?.totalMs)&&d.activity.totalMs>=0?d.activity.totalMs:0},
          guardian: normalizeGuardian(d.guardian),
          journey: normalizeJourney(d.journey),
          lake: { ...initialState().lake, ...d.lake },
          settings: { ...initialState().settings, ...d.settings },
        }
      : initialState();
  } catch {
    report(
      "이전 설정을 읽지 못해 기본 설정을 사용해요. 이번 게임은 처음부터 시작해요.",
    );
    return initialState();
  }
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    report(
      "저장 공간이 부족하거나 저장이 차단되었어요. 설정에서 기록을 내보낸 뒤 공간을 확보해 주세요. 지금 기록은 새로고침하면 사라질 수 있어요.",
    );
    return false;
  }
}
export function loadContent(fallback) {
  try {
    return (
      JSON.parse(localStorage.getItem(CONTENT)) || structuredClone(fallback)
    );
  } catch {
    return structuredClone(fallback);
  }
}
export function saveContent(c) {
  try {
    localStorage.setItem(CONTENT, JSON.stringify(c));
    return true;
  } catch {
    report("교사 자료를 저장하지 못했어요. JSON으로 내보내 보관해 주세요.");
    return false;
  }
}
function db() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("geumsan-art-v1", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("works", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error("다른 탭을 닫고 다시 시도해 주세요."));
  });
}
async function transaction(mode, fn) {
  const d = await db();
  try {
    return await new Promise((resolve, reject) => {
      const t = d.transaction("works", mode);
      let result;
      const r = fn(t.objectStore("works"));
      if (r)
        r.onsuccess = () => {
          result = r.result;
        };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error("저장 취소"));
    });
  } finally {
    d.close();
  }
}
export const artStore = {
  all: () => transaction("readonly", (s) => s.getAll()),
  put: (a) => transaction("readwrite", (s) => s.put(a)),
  remove: (id) => transaction("readwrite", (s) => s.delete(id)),
  putMany: (items) =>
    transaction("readwrite", (s) => {
      for (const a of items) s.put(a);
    }),
};
export function download(name, data, type = "application/json") {
  const b = data instanceof Blob ? data : new Blob([data], { type });
  const u = URL.createObjectURL(b),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function blobData(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("이미지를 읽지 못했어요."));
    r.readAsDataURL(blob);
  });
}
export async function exportWorks(works) {
  return {
    schema: "geumsan-art",
    version: 1,
    works: await Promise.all(
      works.map(async ({ blob, ...rest }) => ({
        ...rest,
        image: await blobData(blob),
      })),
    ),
  };
}
export async function decodeBundle(bundle) {
  if (
    bundle?.schema !== "geumsan-art" ||
    bundle.version !== 1 ||
    !Array.isArray(bundle.works) ||
    bundle.works.length > 200
  )
    throw new Error("금산마을 작품 묶음(최대 200개)을 선택해 주세요.");
  const ids = new Set();
  return Promise.all(
    bundle.works.map(async (a) => {
      if (
        typeof a.id !== "string" ||
        !a.id ||
        ids.has(a.id) ||
        !/^data:image\/(png|jpeg|webp);base64,/.test(a.image) ||
        a.image.length > 15 * 1024 * 1024 ||
        !["lake", "forest", "grass", "river"].includes(a.habitat)
      )
        throw new Error("작품 ID·이미지·서식 구역을 확인해 주세요.");
      ids.add(a.id);
      const blob = await (await fetch(a.image)).blob();
      const bitmap = await createImageBitmap(blob);
      if (bitmap.width > 2048 || bitmap.height > 2048) {
        bitmap.close();
        throw new Error("가져올 그림의 크기는 2048px 이하여야 해요.");
      }
      bitmap.close();
      return {
        id: a.id,
        name: String(a.name || "이름 없는 생물").slice(0, 60),
        alias: String(a.alias || "탐험가").slice(0, 40),
        description: String(a.description || "").slice(0, 500),
        observed: String(a.observed || "").slice(0, 100),
        protection: String(a.protection || "").slice(0, 500),
        exhibition: a.exhibition === "namgang" ? "namgang" : null,
        habitat: a.habitat,
        kind: a.kind === "plant" ? "plant" : "animal",
        blob,
        updatedAt: Date.now(),
      };
    }),
  );
}
