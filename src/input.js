// Physical keys remain stable across Korean/English layouts and IME Process events.
const codes = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  KeyE: "e",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
};
const keys = new Set(Object.values(codes));
export function gameKey(event) {
  if (codes[event.code]) return codes[event.code];
  const key = event.key?.toLowerCase();
  return keys.has(key) ? key : null;
}
export function isTextEntry(target) {
  return !!(
    target?.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName) ||
    target?.closest?.('[contenteditable]:not([contenteditable="false"])')
  );
}
