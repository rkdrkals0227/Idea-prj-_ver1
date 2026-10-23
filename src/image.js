export function floodBackground(data, width, height, color, tolerance) {
  const out = new Uint8ClampedArray(data),
    seen = new Uint8Array(width * height),
    queue = new Uint32Array(width * height);
  let head = 0,
    tail = 0;
  function add(i) {
    if (seen[i]) return;
    seen[i] = 1;
    const j = i * 4,
      dist = Math.hypot(
        data[j] - color[0],
        data[j + 1] - color[1],
        data[j + 2] - color[2],
      );
    if (data[j + 3] === 0 || dist <= tolerance) {
      queue[tail++] = i;
      out[j + 3] = 0;
    }
  }
  for (let x = 0; x < width; x++) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++],
      x = i % width,
      y = Math.floor(i / width);
    if (x) add(i - 1);
    if (x < width - 1) add(i + 1);
    if (y) add(i - width);
    if (y < height - 1) add(i + width);
  }
  return out;
}
export function imageDimensions(buffer) {
  const v = new DataView(buffer),
    b = new Uint8Array(buffer);
  if (b[0] === 137 && b[1] === 80 && b.length >= 24)
    return [v.getUint32(16), v.getUint32(20)];
  if (b[0] === 255 && b[1] === 216) {
    let p = 2;
    while (p + 8 < b.length) {
      if (b[p] !== 255) {
        p++;
        continue;
      }
      const marker = b[p + 1];
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      )
        return [v.getUint16(p + 7), v.getUint16(p + 5)];
      if (marker === 0xd9 || marker === 0xda) break;
      const len = v.getUint16(p + 2);
      if (len < 2) break;
      p += 2 + len;
    }
  }
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && b.length >= 30) {
    const kind = String.fromCharCode(...b.slice(12, 16));
    if (kind === "VP8X")
      return [
        1 + b[24] + (b[25] << 8) + (b[26] << 16),
        1 + b[27] + (b[28] << 8) + (b[29] << 16),
      ];
    if (kind === "VP8L" && b[20] === 0x2f)
      return [
        1 + ((b[21] | (b[22] << 8)) & 0x3fff),
        1 + (((b[22] >> 6) | (b[23] << 2) | (b[24] << 10)) & 0x3fff),
      ];
    if (kind === "VP8 " && b.length >= 30)
      return [v.getUint16(26, true) & 0x3fff, v.getUint16(28, true) & 0x3fff];
  }
  return null;
}
export async function readImage(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("PNG, JPEG, WebP 그림 파일을 선택해 주세요.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("그림은 한 장에 10MB까지 선택할 수 있어요.");
  if (!file.size) throw new Error("빈 파일이에요. 다른 그림을 골라 주세요.");
  const dimensions = imageDimensions(await file.arrayBuffer());
  if (
    !dimensions ||
    dimensions.some((n) => !n) ||
    dimensions[0] * dimensions[1] > 40e6
  )
    throw new Error(
      "이미지 크기를 확인할 수 없거나 4천만 화소를 넘어요. 작은 이미지로 저장해 주세요.",
    );
  let b;
  try {
    b = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("그림을 읽지 못했어요. 파일을 다시 저장해 선택해 주세요.");
  }
  if (b.width * b.height > 40e6) {
    b.close();
    throw new Error("그림이 너무 커요. 크기를 줄여 주세요.");
  }
  const ratio = Math.min(1, 1024 / Math.max(b.width, b.height)),
    c = document.createElement("canvas");
  c.width = Math.round(b.width * ratio);
  c.height = Math.round(b.height * ratio);
  c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
  b.close();
  return c;
}
