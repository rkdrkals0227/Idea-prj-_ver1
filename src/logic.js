import { initialGuardian } from "./guardian.js";
export function initialState() {
  return {
    version: 1,
    guardian: initialGuardian(),
    started: [],
    completed: [],
    collected: [],
    sorted: [],
    badges: [],
    quiz: [],
    read: [],
    lake: { rest: false, identify: false, picked: false, handed: false },
    path: false,
    letters: [],
    letterDraft: {},
    reflections: [],
    settings: {
      quality: "normal",
      motion: false,
      sound: false,
      font: 1,
      artLimit: 30,
      displayName: "creature",
    },
    welcomed: false,
  };
}
export function startQuest(s, id) {
  if (!s.started.includes(id)) s.started.push(id);
}
export function award(s, id, badge) {
  if (!s.completed.includes(id)) s.completed.push(id);
  if (!s.badges.includes(badge)) s.badges.push(badge);
}
export function collect(s, id) {
  if (s.collected.includes(id) || s.sorted.includes(id)) return false;
  s.collected.push(id);
  return true;
}
export function sortWaste(s, item, category) {
  if (!s.collected.includes(item.id) || s.sorted.includes(item.id))
    return false;
  if (item.category !== category) return false;
  s.sorted.push(item.id);
  s.collected = s.collected.filter((id) => id !== item.id);
  return true;
}
export function pathValid(tiles, solution, blocked) {
  return (
    !blocked &&
    tiles.length === solution.length &&
    tiles.every(
      (t, i) =>
        t.type === solution[i].type &&
        (t.type === "dot" || t.rotation % 180 === solution[i].rotation % 180),
    )
  );
}
export function reconcile(s, c) {
  if (s.path) award(s, "path", c.quests.path.reward);
  for (const [id, zone] of [
    ["trash", "village"],
    ["lake", "lake"],
  ]) {
    const required = c.waste.filter((w) => w.zone === zone);
    const n = required.filter((w) => s.sorted.includes(w.id)).length;
    if (id === "trash" && required.length && n === required.length)
      award(s, id, c.quests[id].reward);
    if (
      id === "lake" &&
      n === required.length &&
      s.lake.rest &&
      s.lake.identify &&
      s.lake.handed
    )
      award(s, id, c.quests[id].reward);
  }
}
export function approved(list) {
  return list.filter((x) => x.reviewStatus === "검토 완료");
}
export function escapeHTML(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function mergeArt(existing, incoming) {
  const map = new Map(existing.map((a) => [a.id, a]));
  for (const a of incoming) map.set(a.id, a);
  return [...map.values()];
}
