import { floodBackground, readImage } from "./image.js";
import { escapeHTML as h } from "./logic.js";
export async function imageEditor(file, ui, onSave) {
  let input;
  try {
    input = await readImage(file);
  } catch (e) {
    ui.toast(e.message);
    return;
  }
  const root = ui.open(
    "내 그림에 생명을 불어넣어요",
    `<p class="eyebrow">그림 연구소 · 기기 안에서만 편집해요</p><div class="editor-grid"><div><div class="canvas-wrap"><canvas id="art-canvas" aria-label="그림 편집 미리보기"></canvas></div><div class="toolbar"><button data-tool="rotate">↻ 회전</button><button data-tool="crop">영역 자르기</button><button data-tool="erase">지우개</button><button data-tool="restore">복원</button><button data-tool="undo">되돌리기</button></div><label>미리보기 확대 <input id="zoom" type="range" min="1" max="2.5" value="1" step=".1"></label><label>브러시 크기 <input id="brush" type="range" min="4" max="100" value="24"></label></div><div><label>종이 배경색 <input id="bg" type="color" value="#ffffff"></label><label>제거 강도 <input id="strength" type="range" min="5" max="220" value="65"></label><button id="remove-bg" class="primary">가장자리 배경 지우기</button><p class="small">가장자리와 연결된 배경만 지워요. 흰 동물의 안쪽은 남겨요. 그림자·복잡한 사진은 지우개와 복원으로 고쳐 주세요. 투명 PNG는 투명도를 유지해요.</p><form id="art-form"><label>생물 이름 <input name="name" required maxlength="60" placeholder="예: 풀밭의 나비"></label><label>별명 또는 작품 이름 <input name="alias" maxlength="40" placeholder="전체 실명은 쓰지 않아도 돼요"></label><label>이 친구를 지키기 위해 내가 노력할 일 <textarea name="protection" required maxlength="500" placeholder="예: 먹이를 주지 않고 거리를 두고 관찰해요"></textarea></label><input type="hidden" name="exhibition" value="namgang"><label>생태 설명 <textarea name="description" maxlength="500" placeholder="직접 관찰한 내용을 적어요"></textarea></label><label>관찰 장소 <input name="observed" maxlength="100" placeholder="예: 학교 꽃밭"></label><label>서식 구역 <select name="habitat"><option value="river">남강 생태 전시</option><option value="grass">풀밭</option><option value="lake">호숫가</option><option value="forest">숲</option></select></label><label>그림 종류 <select name="kind"><option value="animal">움직이는 동물</option><option value="plant">자리에서 흔들리는 식물</option></select></label><label class="check"><input type="checkbox" required> 배경 제거 결과를 확인했어요</label><button class="primary" type="submit">마을에 등록하기</button></form></div></div>`,
    "wide",
  );
  const canvas = root.querySelector("#art-canvas"),
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = input.width;
  canvas.height = input.height;
  ctx.drawImage(input, 0, 0);
  let original = ctx.getImageData(0, 0, canvas.width, canvas.height),
    history = [],
    mode = "erase",
    drawing = false,
    start = null;
  const snapshot = () => {
    history.push({
      image: ctx.getImageData(0, 0, canvas.width, canvas.height),
      original: new ImageData(
        new Uint8ClampedArray(original.data),
        original.width,
        original.height,
      ),
    });
    if (history.length > 8) history.shift();
  };
  const tools = root.querySelectorAll("[data-tool]");
  function setMode(m) {
    mode = m;
    tools.forEach((b) => b.classList.toggle("selected", b.dataset.tool === m));
    canvas.style.cursor = m === "crop" ? "crosshair" : "cell";
  }
  setMode("erase");
  root.querySelector("#zoom").oninput = (e) => {
    canvas.style.width = `${e.target.value * 100}%`;
    canvas.style.maxWidth = "none";
  };
  tools.forEach(
    (b) =>
      (b.onclick = () => {
        const t = b.dataset.tool;
        if (t === "undo") {
          const v = history.pop();
          if (!v) return;
          canvas.width = v.image.width;
          canvas.height = v.image.height;
          ctx.putImageData(v.image, 0, 0);
          original = v.original;
        } else if (t === "rotate") {
          snapshot();
          function rotate(img) {
            const a = document.createElement("canvas");
            a.width = img.width;
            a.height = img.height;
            a.getContext("2d").putImageData(img, 0, 0);
            const b = document.createElement("canvas");
            b.width = img.height;
            b.height = img.width;
            const c = b.getContext("2d");
            c.translate(b.width, 0);
            c.rotate(Math.PI / 2);
            c.drawImage(a, 0, 0);
            return c.getImageData(0, 0, b.width, b.height);
          }
          const next = rotate(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
          );
          original = rotate(original);
          canvas.width = next.width;
          canvas.height = next.height;
          ctx.putImageData(next, 0, 0);
        } else setMode(t);
      }),
  );
  root.querySelector("#remove-bg").onclick = () => {
    snapshot();
    const color = root.querySelector("#bg").value,
      rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)),
      img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    img.data.set(
      floodBackground(
        img.data,
        canvas.width,
        canvas.height,
        rgb,
        +root.querySelector("#strength").value,
      ),
    );
    ctx.putImageData(img, 0, 0);
    ui.toast("배경을 지웠어요. 그림을 확인하고 필요한 부분을 복원해 주세요.");
  };
  function point(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          canvas.width - 1,
          Math.floor(((e.clientX - r.left) / r.width) * canvas.width),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          canvas.height - 1,
          Math.floor(((e.clientY - r.top) / r.height) * canvas.height),
        ),
      ),
    };
  }
  function brush(p) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height),
      radius = +root.querySelector("#brush").value;
    for (
      let y = Math.max(0, p.y - radius);
      y < Math.min(canvas.height, p.y + radius);
      y++
    )
      for (
        let x = Math.max(0, p.x - radius);
        x < Math.min(canvas.width, p.x + radius);
        x++
      ) {
        if ((x - p.x) ** 2 + (y - p.y) ** 2 > radius ** 2) continue;
        const i = (y * canvas.width + x) * 4;
        if (mode === "erase") img.data[i + 3] = 0;
        else for (let j = 0; j < 4; j++) img.data[i + j] = original.data[i + j];
      }
    ctx.putImageData(img, 0, 0);
  }
  canvas.onpointerdown = (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    snapshot();
    drawing = true;
    start = point(e);
    if (mode !== "crop") brush(start);
  };
  canvas.onpointermove = (e) => {
    if (drawing && mode !== "crop") brush(point(e));
  };
  canvas.onpointerup = (e) => {
    if (!drawing) return;
    drawing = false;
    if (mode === "crop") {
      const end = point(e),
        x = Math.min(start.x, end.x),
        y = Math.min(start.y, end.y),
        w = Math.abs(start.x - end.x),
        h = Math.abs(start.y - end.y);
      if (w < 8 || h < 8) {
        ui.toast("자를 부분을 대각선으로 길게 끌어 주세요.");
        history.pop();
        return;
      }
      const img = ctx.getImageData(x, y, w, h),
        oc = document.createElement("canvas");
      oc.width = original.width;
      oc.height = original.height;
      oc.getContext("2d").putImageData(original, 0, 0);
      original = oc.getContext("2d").getImageData(x, y, w, h);
      canvas.width = w;
      canvas.height = h;
      ctx.putImageData(img, 0, 0);
    }
  };
  canvas.onpointercancel = () => {
    drawing = false;
  };
  root.querySelector("#art-form").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.name.trim()) {
      ui.toast("생물 이름을 적어 주세요.");
      return;
    }
    if (!data.protection?.trim()) {
      ui.toast("이 친구를 지킬 보호 약속을 적어 주세요.");
      return;
    }
    data.protection = data.protection.trim();
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!pixels.some((v, i) => i % 4 === 3 && v > 0)) {
      ui.toast("그림이 모두 투명해요. 되돌리기나 복원으로 그림을 남겨 주세요.");
      return;
    }
    const button = e.submitter;
    button.disabled = true;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        ui.toast("그림 저장에 실패했어요. 다시 시도해 주세요.");
        button.disabled = false;
        return;
      }
      try {
        await onSave({
          id: crypto.randomUUID(),
          ...data,
          name: data.name.trim(),
          blob,
          updatedAt: Date.now(),
        });
        ui.close();
        ui.toast("새로운 생태 친구가 마을에 도착했어요!");
      } catch {
        ui.toast(
          "작품을 저장하지 못했어요. 저장 공간과 브라우저 권한을 확인해 주세요. 그림을 PNG로 내보낼 수 있어요.",
        );
        const b = document.createElement("button");
        b.textContent = "편집 그림 PNG 저장";
        b.onclick = () => {
          const a = document.createElement("a"),
            u = URL.createObjectURL(blob);
          a.href = u;
          a.download = "내-생태-그림.png";
          a.click();
          setTimeout(() => URL.revokeObjectURL(u), 1000);
        };
        e.target.append(b);
        button.disabled = false;
      }
    }, "image/png");
  };
}
