// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// Scriptable：Zoom Earth 台风图标合成导出
const URL = "https://zoom.earth/assets/images/icons/cyclone.4.svg";
const COUNT = 6;
const SIZE = 512;
const PADDING = 0;
const ALPHA = 8;
const COLOR_SCALE = 1;

// 新增颜色，使用第一个彩色图标的形状
const EXTRA_COLORS = [
  { name: "blue", color: "#2196F3" },
  { name: "green", color: "#01EF61" }
];

const req = new Request(URL);
req.timeoutInterval = 30;
const svgText = await req.loadString();

if (!/<svg[\s>]/i.test(svgText)) {
  throw new Error("SVG 下载失败");
}

const web = new WebView();
await web.loadHTML("<html><body></body></html>");

const raw = await web.evaluateJavaScript(`
void (async () => {
  try {
    const COUNT = ${COUNT}, SIZE = ${SIZE};
    const PAD = ${PADDING}, ALPHA = ${ALPHA};
    const COLOR_SCALE = ${COLOR_SCALE};
    const EXTRA_COLORS = ${JSON.stringify(EXTRA_COLORS)};

    if (
      SIZE <= 0 || PAD < 0 || PAD * 2 >= SIZE ||
      !Number.isFinite(COLOR_SCALE) || COLOR_SCALE <= 0
    ) throw new Error("尺寸、边距或彩色倍率无效");

    const doc = new DOMParser().parseFromString(
      ${JSON.stringify(svgText)}, "image/svg+xml"
    );
    const root = doc.documentElement;

    if (doc.querySelector("parsererror") || root.localName !== "svg") {
      throw new Error("SVG 解析失败");
    }

    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const serializer = new XMLSerializer();

    function load(node) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("SVG 渲染失败"));
        img.src = "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(serializer.serializeToString(node));
      });
    }

    function canvas(w, h) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    }

    const original = await load(root);
    const vb = root.hasAttribute("viewBox")
      ? root.getAttribute("viewBox").trim().split(/[\\s,]+/).map(Number)
      : [0, 0, original.naturalWidth, original.naturalHeight];

    if (
      vb.length !== 4 || !vb.every(Number.isFinite) ||
      vb[2] <= 0 || vb[3] <= 0
    ) throw new Error("SVG viewBox 无效");

    const [vx, vy, vw, vh] = vb;
    const scanScale = Math.min(4, 4096 / Math.max(vw, vh));
    const w = Math.max(1, Math.ceil(vw * scanScale));
    const h = Math.max(1, Math.ceil(vh * scanScale));

    const scanRoot = root.cloneNode(true);
    scanRoot.setAttribute("viewBox", vb.join(" "));
    scanRoot.setAttribute("width", w);
    scanRoot.setAttribute("height", h);
    scanRoot.setAttribute("preserveAspectRatio", "none");

    const scan = canvas(w, h);
    const sc = scan.getContext("2d", { willReadFrequently: true });
    sc.drawImage(await load(scanRoot), 0, 0, w, h);

    const pixels = sc.getImageData(0, 0, w, h).data;
    const rows = new Uint8Array(h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (pixels[(y * w + x) * 4 + 3] > ALPHA) {
          rows[y] = 1;
          break;
        }
      }
    }

    const top = rows.indexOf(1);
    const bottom = rows.lastIndexOf(1);
    if (top < 0) throw new Error("未检测到图标");

    const gaps = [];
    for (let y = top; y <= bottom;) {
      if (rows[y]) {
        y++;
        continue;
      }

      const start = y;
      while (y <= bottom && !rows[y]) y++;
      gaps.push({ start, end: y, length: y - start });
    }

    if (gaps.length < COUNT - 1) {
      throw new Error("空白带不足，无法切分 " + COUNT + " 个图标");
    }

    const cuts = [
      top,
      ...gaps
        .sort((a, b) => b.length - a.length)
        .slice(0, COUNT - 1)
        .sort((a, b) => a.start - b.start)
        .map(g => Math.floor((g.start + g.end) / 2)),
      bottom + 1
    ];

    const margin = Math.max(vw / w, vh / h);
    const layers = [];

    for (let i = 0; i < COUNT; i++) {
      let left = w, right = -1, topY = h, bottomY = -1;
      let total = 0, white = 0;

      for (let y = cuts[i]; y < cuts[i + 1]; y++) {
        for (let x = 0; x < w; x++) {
          const p = (y * w + x) * 4;
          const a = pixels[p + 3];
          if (a <= ALPHA) continue;

          left = Math.min(left, x);
          right = Math.max(right, x);
          topY = Math.min(topY, y);
          bottomY = Math.max(bottomY, y);
          total += a;

          if (
            pixels[p] >= 235 &&
            pixels[p + 1] >= 235 &&
            pixels[p + 2] >= 235
          ) white += a;
        }
      }

      if (right < 0) throw new Error("第 " + (i + 1) + " 个区域为空");

      layers.push({
        x: vx + left * vw / w - margin,
        y: vy + topY * vh / h - margin,
        w: (right - left + 1) * vw / w + margin * 2,
        h: (bottomY - topY + 1) * vh / h + margin * 2,
        whiteRatio: white / total
      });
    }

    const base = layers.reduce((a, b) =>
      a.whiteRatio >= b.whiteRatio ? a : b
    );

    if (base.whiteRatio < 0.8) {
      throw new Error("无法可靠识别白色底图");
    }

    const colors = layers.filter(layer => layer !== base);
    const inner = SIZE - PAD * 2;
    const factor = Math.min(
      inner / Math.max(...layers.map(l => l.w)),
      inner / Math.max(...layers.map(l => l.h))
    );

    for (const layer of layers) {
      const node = root.cloneNode(true);
      node.setAttribute(
        "viewBox", [layer.x, layer.y, layer.w, layer.h].join(" ")
      );

      const resolution = factor * 2 *
        (layer === base ? 1 : Math.max(1, COLOR_SCALE));

      node.setAttribute("width", layer.w * resolution);
      node.setAttribute("height", layer.h * resolution);
      node.setAttribute("preserveAspectRatio", "xMidYMid meet");
      layer.image = await load(node);
    }

    const output = canvas(SIZE, SIZE);
    const ctx = output.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    function draw(context, layer, scale = 1) {
      const dw = layer.w * factor * scale;
      const dh = layer.h * factor * scale;

      context.drawImage(
        layer.image,
        (SIZE - dw) / 2,
        (SIZE - dh) / 2,
        dw,
        dh
      );
    }

    const images = [];

    function save(name) {
      images.push({
        name,
        data: output.toDataURL("image/png").split(",")[1]
      });
    }

    // 原有 5 个彩色图标
    for (let i = 0; i < colors.length; i++) {
      ctx.clearRect(0, 0, SIZE, SIZE);
      draw(ctx, base);
      draw(ctx, colors[i], COLOR_SCALE);

      save("composite-" + String(i + 1).padStart(2, "0"));
    }

    // 单独制作彩色层遮罩，避免对白色底图着色
    const tint = canvas(SIZE, SIZE);
    const tc = tint.getContext("2d");
    tc.imageSmoothingEnabled = true;
    tc.imageSmoothingQuality = "high";

    for (const extra of EXTRA_COLORS) {
      tc.globalCompositeOperation = "source-over";
      tc.clearRect(0, 0, SIZE, SIZE);

      draw(tc, colors[0], COLOR_SCALE);

      tc.globalCompositeOperation = "source-in";
      tc.fillStyle = extra.color;
      tc.fillRect(0, 0, SIZE, SIZE);
      tc.globalCompositeOperation = "source-over";

      ctx.clearRect(0, 0, SIZE, SIZE);
      draw(ctx, base);
      ctx.drawImage(tint, 0, 0);

      save("composite-" + extra.name);
    }

    completion(JSON.stringify({ images }));
  } catch (e) {
    completion(JSON.stringify({ error: String(e.message || e) }));
  }
})();
`, true);

if (!raw) throw new Error("未收到处理结果");

const result = JSON.parse(raw);
if (result.error) throw new Error(result.error);

if (result.images?.length !== COUNT - 1 + EXTRA_COLORS.length) {
  throw new Error("合成图标数量不正确");
}

const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), "ZoomEarthIcons");
if (!fm.fileExists(dir)) fm.createDirectory(dir, true);

for (const item of result.images) {
  const path = fm.joinPath(dir, item.name + ".png");
  fm.write(path, Data.fromBase64String(item.data));
  await QuickLook.present(path);
}

Script.complete();