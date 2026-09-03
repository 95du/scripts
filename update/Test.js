// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'typhoon');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const tilePath = fm.joinPath(mainPath, 'tiles');
if (!fm.fileExists(tilePath)) fm.createDirectory(tilePath);
const settingPath = fm.joinPath(mainPath, 'setting.json');

const writeSettings = (setting) => {
  fm.writeString(settingPath, JSON.stringify(setting, null, 2));
};

const getSetting = () => {
  if (fm.fileExists(settingPath)) {
    const data = fm.readString(settingPath);
    return JSON.parse(data) || {};
  }
};
const setting = getSetting();

const useFileManager = (type) => ({
  read: (name) => {
    const filePath = fm.joinPath(mainPath, name);
    if (!fm.fileExists(filePath)) return null;
    return type ? fm.readString(filePath) && JSON.parse(fm.readString(filePath)) : fm.readImage(filePath);
  },
  write: (name, content) => {
    const filePath = fm.joinPath(mainPath, name);
    if (fm.fileExists(filePath)) fm.remove(filePath);
    type ? fm.writeString(filePath, JSON.stringify(content)) : fm.writeImage(filePath, content);
  }
});

const getCacheData = async (name, url, type, cacheTime = 0) => {
  const cache = useFileManager(type);
  const filePath = fm.joinPath(mainPath, name);
  const data = cache.read(name);
  const expired = cacheTime > 0 &&
    (!fm.fileExists(filePath) ||
      (Date.now() - fm.creationDate(filePath).getTime()) / 36e5 > cacheTime);
  if (data && !expired) return data;
  try {
    const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
    if (response) {
      cache.write(name, response);
      console.log(name)
      return response;
    }
  } catch (e) {}
  return data;
};

const getFormattedTime = () => {
  const df = new DateFormatter();
  df.dateFormat = 'HH:mm';
  return df.string(new Date());
};

// https://tf03.istrongcloud.com/typhoonVisual/js/chunk-0ecd511e.js
const tyIcon = await getCacheData('typhoon.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/typhoon_1.png`);
const tcIcon = await getCacheData('tc.png', `https://tf03.istrongcloud.com/typhoonVisual/img/tfpt.png`);
const tyIconUrl = 'https://raw.githubusercontent.com/95du/scripts/master/update/typhoon_icons.json';
const typhoonIcons = await getCacheData('icon.json', tyIconUrl, 'json', 24);

const getRadarImage = async () => {
  try {
    const radarUrl = 'https://tf03.istrongcloud.com/data/images/radar/mingle/sc_tran_1x.json';
    const item = await new Request(radarUrl).loadJSON();
    if (!item || !item.length || !item[0].url) return null;
    const r = item?.at(-1);
    return await getCacheData(`radar.png`, r.url, null, 1);
  } catch (e) {
    console.log(`Radar failed: ${e}`);
    return null;
  }
};

const safeRemove = (p) => { try { fm.remove(p); } catch (e) {} };

const getTileDir = (z, x) => {
  const dir = fm.joinPath(tilePath, `${z}_${x}`);
  if (!fm.fileExists(dir)) fm.createDirectory(dir);
  return dir;
};

const getTileFile = (z, x, y, style) => fm.joinPath(getTileDir(z, x), `${y}_${style}.png`);

const getTileURL = (z, x, y, style) => {
  const s = ['1', '2', '3', '4'][Math.abs(x + y) % 4];
  const host = style === 6 || style === 8 ? `webst0${s}` : `wprd0${s}`;
  return `https://${host}.is.autonavi.com/appmaptile?lang=zh_cn&style=${style}&x=${x}&y=${y}&z=${z}`;
};

const isValidTile = (img) => img && img.size.width === 256 && img.size.height === 256;

const readTile = async (z, x, y, style, time) => {
  const file = getTileFile(z, x, y, style);
  if (fm.fileExists(file)) {
    const date = fm.creationDate(file);
    const expired = time != null && date && (Date.now() - date.getTime()) / 36e5 > time;
    if (!expired) {
      try {
        const image = fm.readImage(file);
        if (isValidTile(image)) 
          return image;
      } catch (e) {}
    }
    safeRemove(file);
  }
  try {
    const image = await new Request(getTileURL(z, x, y, style)).loadImage();
    if (!isValidTile(image)) throw new Error('invalid tile');

    const tmp = file + '.tmp';
    safeRemove(tmp);
    fm.writeImage(tmp, image);
    let verify = null;
    try { verify = fm.readImage(tmp); } catch (e) {}
    if (!isValidTile(verify)) { safeRemove(tmp); throw new Error('verify failed'); }

    try {
      safeRemove(file);
      fm.move(tmp, file);
    } catch (e) {
      fm.writeImage(file, image);
      safeRemove(tmp);
    }
    return image;
  } catch (e) {
    console.log(`Tile failed ${z}/${x}/${y}/${style}`);
    return null;
  }
};

const lngToWorldX = (lng, z) => (lng + 180) / 360 * 256 * Math.pow(2, z);
const latToWorldY = (lat, z) => {
  const r = lat * Math.PI / 180;
  return (0.5 - Math.log((1 + Math.sin(r)) / (1 - Math.sin(r))) / (4 * Math.PI)) * 256 * Math.pow(2, z);
};

const getTileList = (lat, lng, z, radius = 3) => {
  const max = Math.pow(2, z), cx = Math.floor(lngToWorldX(lng, z) / 256), cy = Math.floor(latToWorldY(lat, z) / 256), list = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      let x = ((cx + dx) % max + max) % max, y = cy + dy;
      if (y >= 0 && y < max) list.push({ z, x, y });
    }
  }
  return list;
};

const prepareTiles = async (viewport, styles, tileCacheHours = 24) => {
  const z = Math.round(viewport.zoom), tiles = getTileList(viewport.lat, viewport.lng, z, 3), jobs = [];
  for (const t of tiles) for (const style of styles) jobs.push([t, style]);
  const ready = new Map(), batchSize = 8;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const result = await Promise.all(batch.map(([t, style]) => readTile(t.z, t.x, t.y, style, tileCacheHours)));
    batch.forEach(([t, style], j) => result[j] && ready.set(`${t.z}/${t.x}/${t.y}/${style}`, result[j]));
  }
  const valid = tiles.filter(t => styles.every(style => ready.has(`${t.z}/${t.x}/${t.y}/${style}`)));
  return { tiles: valid, images: ready };
};

// 独立出来的 7 级风圈绘制函数
const drawWindCircles = (ctx, point, project, EXPORT_SCALE) => {
  let quad = point.radius7_quad;
  if (!quad && point.radius7) {
    const r = point.radius7;
    quad = { ne: r, se: r, sw: r, nw: r };
  }
  if (!quad) return;

  const SCALE = 1.5;
  const sectors = [
    { start: 0, end: 90, r: quad.ne * SCALE },  // 东北方向风圈
    { start: 90, end: 180, r: quad.se * SCALE }, // 东南方向风圈
    { start: 180, end: 270, r: quad.sw * SCALE },// 西南方向风圈
    { start: 270, end: 360, r: quad.nw * SCALE } // 西北方向风圈
  ];

  const kmToLng = (km, lat) => km / (111 * Math.cos(lat * Math.PI / 180));
  const kmToLat = (km) => km / 111;
  const path = new Path();
  let firstPoint = true;

  sectors.forEach(sector => {
    if (!sector.r) return;
    const step = 5;
    for (let angle = sector.start; angle <= sector.end; angle += step) {
      const rad = angle * Math.PI / 180;
      const dLat = kmToLat(sector.r * Math.cos(rad));
      const dLng = kmToLng(sector.r * Math.sin(rad), point.lat);
      const pt = project(point.lat + dLat, point.lng + dLng);
      if (firstPoint) {
        path.move(pt);
        firstPoint = false;
      } else {
        path.addLine(pt);
      }
    }
  });
  
  if (!firstPoint) {
    path.closeSubpath();
    ctx.setFillColor(new Color('#4caf50', 0.2));
    ctx.addPath(path);
    ctx.fillPath();
    ctx.setStrokeColor(new Color('#2e7d32', 1));
    ctx.setLineWidth(1.2 * EXPORT_SCALE);
    ctx.addPath(path);
    ctx.strokePath();
  }
};

// 绘制台风预测路径（带黑色外框的蓝色圆点）
const getStationColor = country => {
  const colors = {
    中国: '#FF4050', 香港: '#FF66FF',
    日本: '#43FF4B', 台湾: '#FFA040',
    美国: '#40DDFF', 韩国: '#669999',
    欧洲: '#246ED4'
  };
  return colors[country] || '#FF66FF';
};

const getLevelColor = gradeEname => {
  const colors = {
    TD: '#68FF8C', TS: '#38ABFF',
    STS: '#FBFF6B', TY: '#FDAC03',
    STY: '#F95AFF', SUPERTY: '#FF0C0C'
  };
  return colors[gradeEname] || '#68FF8C';
};

// 绘制台风预测路径
const drawForecastPath = (ctx, typhoon, project, EXPORT_SCALE, drawPathFn) => {
  if (!typhoon.forecast || !typhoon.forecast.length) return;
  const currentPos = project(typhoon.lat, typhoon.lng);
  const pointRadius = 3.5 * EXPORT_SCALE;
  const strokeWidth = 1.0 * EXPORT_SCALE;
  // 1. 遍历 forecast 数组中的每一个预报机构/国家
  for (const forecastSet of typhoon.forecast) {
    if (!forecastSet.points || !forecastSet.points.length) continue;
    // 获取当前预报机构对应的虚线颜色
    const lineHex = getStationColor(forecastSet.sets);
    // 映射预测点坐标
    const forecastPoints = forecastSet.points.map(p => project(p.lat, p.lng));
    const allPathPoints = [currentPos, ...forecastPoints];
    // 绘制当前机构的预测路径虚线
    drawPathFn(allPathPoints, lineHex, 1.5, 0.8, [4, 3]);
    // 2. 绘制该路线上的各个预测节点
    for (let i = 0; i < forecastSet.points.length; i++) {
      const p = forecastSet.points[i];
      const pt = forecastPoints[i];
      // 【核心修改】从 p.strong (如 "热带风暴(TS)") 中解析出括号内的缩写 (如 "TS")
      const level = p.strong?.match(/\((.*?)\)/)?.[1] || p.type;
      // 动态获取预测点对应的强度颜色
      const pointHex = getLevelColor(level);
      // A. 绘制黑框底层圆点
      const outerRadius = pointRadius + strokeWidth;
      const outerRect = new Rect(pt.x - outerRadius, pt.y - outerRadius, outerRadius * 2, outerRadius * 2);
      ctx.setFillColor(new Color('#000000', 0.9));
      ctx.fillEllipse(outerRect);
      // B. 绘制内层对应强度颜色的实心点
      const innerRect = new Rect(pt.x - pointRadius, pt.y - pointRadius, pointRadius * 2, pointRadius * 2);
      ctx.setFillColor(new Color(pointHex, 1.0));
      ctx.fillEllipse(innerRect);
    }
  }
};

// 绘制登陆位置信息框
const drawLandInfoBox = (ctx, pos, text, iconSize, EXPORT_SCALE) => {
  const fontSize = 14 * EXPORT_SCALE;
  const paddingH = 10 * EXPORT_SCALE;
  const paddingV = 5 * EXPORT_SCALE;
  const arrowHeight = 8 * EXPORT_SCALE;
  const arrowWidth = 12 * EXPORT_SCALE;
  const boxHeight = fontSize * 1.3 + paddingV * 2;
  // 1. 估算文本和背景框的实际宽度
  const estimatedTextWidth = text.length * fontSize;
  const boxWidth = estimatedTextWidth + paddingH * 2;
  // 2. 三角指针位置右移设置
  // 设定三角指针距离气泡框左边缘的比例或固定距离（此处设置指针位于气泡框左侧 25% 处，相当于气泡框整体右移）
  const arrowOffsetX = boxWidth * 0.25;
  // 气泡框 X 坐标：向右移动，使得 pos.x 对准 arrowOffsetX
  const boxX = pos.x - arrowOffsetX;
  const boxY = pos.y - iconSize / 2 - boxHeight - arrowHeight + (4 * EXPORT_SCALE);

  // 3. 绘制主矩形/圆角背景框
  const rectPath = new Path();
  rectPath.addRoundedRect(new Rect(boxX, boxY, boxWidth, boxHeight), 12 * EXPORT_SCALE, 12 * EXPORT_SCALE);
  ctx.setFillColor(new Color('#38ABFF', 0.7));
  ctx.addPath(rectPath);
  ctx.fillPath();
  // 4. 绘制底部指向小三角（精准指向台风中心 pos.x）
  const arrowPath = new Path();
  const arrowTopY = boxY + boxHeight;
  arrowPath.move(new Point(pos.x - arrowWidth / 2, arrowTopY));
  arrowPath.addLine(new Point(pos.x + arrowWidth / 2, arrowTopY));
  arrowPath.addLine(new Point(pos.x, arrowTopY + arrowHeight));
  arrowPath.closeSubpath();
  ctx.setFillColor(new Color('#38ABFF', 0.7));
  ctx.addPath(arrowPath);
  ctx.fillPath();
  ctx.setFont(Font.boldSystemFont(fontSize));
  ctx.setTextColor(new Color('#ffffff'));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(text, new Rect(boxX + paddingH, boxY + paddingV, boxWidth - paddingH * 2, boxHeight));
};

// 绘制单个台风的所有登陆点旗帜（一个台风可能多次登陆）
const drawLandingFlags = (ctx, typhoon, flagIcon, project, EXPORT_SCALE) => {
  if (!flagIcon || !typhoon.land || !typhoon.land.length) return;
  const FLAG_SCALE = 0.85;
  const FLAG_W = 32 * FLAG_SCALE * EXPORT_SCALE;
  const FLAG_H = 34 * FLAG_SCALE * EXPORT_SCALE;
  for (const p of typhoon.land) {
    const landLat = parseFloat(p.lat);
    const landLng = parseFloat(p.lng);
    if (Number.isNaN(landLat) || Number.isNaN(landLng)) continue;
    const flagPos = project(landLat, landLng);
    ctx.drawImageInRect(flagIcon, new Rect(flagPos.x - FLAG_W / 2, flagPos.y - FLAG_H, FLAG_W, FLAG_H));
  }
};

/**
 * 矩形碰撞检测函数（包含 Margin 边距保护）
 */
const isOverlapping = (rectA, rectB, margin = 10) => {
  return !(rectA.x + rectA.width + margin <= rectB.x || rectA.x >= rectB.x + rectB.width + margin || rectA.y + rectA.height + margin <= rectB.y || rectA.y >= rectB.y + rectB.height + margin);
};

const drawBadge = (ctx, badgeText, subscriptType, boxX, boxY, boxW, badgeFS, EXPORT_SCALE) => {
  if (!badgeText) return;

  const badgeW = badgeText.length * badgeFS * 0.85 + 10 * EXPORT_SCALE;
  const badgeH = badgeFS + 6 * EXPORT_SCALE;
  const badgeX = boxX + boxW - badgeW - 6 * EXPORT_SCALE;
  const badgeY = boxY - badgeH / 2;
  const typeUpper = (subscriptType || "").toUpperCase();
  const badgeBg = typeUpper === 'TOP' 
    ? new Color('#f5a623') 
    : (typeUpper === 'NEW' ? new Color('#2b88e6') : new Color('#a255ff'));
  ctx.setFillColor(badgeBg);
  // 绘制圆角背景
  const baseBadgePath = new Path();
  baseBadgePath.addRoundedRect(new Rect(badgeX, badgeY, badgeW, badgeH), badgeH / 2, badgeH / 2);
  ctx.addPath(baseBadgePath);
  ctx.fillPath();
  // 绘制角标左下角的小尾巴
  const tailExt = 1.5 * EXPORT_SCALE;
  const tailPath = new Path();
  tailPath.move(new Point(badgeX, badgeY + badgeH / 2));
  tailPath.addLine(new Point(badgeX, badgeY + badgeH));
  tailPath.addLine(new Point(badgeX - tailExt, badgeY + badgeH));
  tailPath.addLine(new Point(badgeX + (8 * EXPORT_SCALE), badgeY + badgeH));
  tailPath.addLine(new Point(badgeX + (8 * EXPORT_SCALE), badgeY + badgeH / 2));
  tailPath.closeSubpath();
  ctx.addPath(tailPath);
  ctx.fillPath();
  // 绘制角标文字
  const badgeFont = Font.boldSystemFont(badgeFS);
  ctx.setFont(badgeFont);
  ctx.setTextColor(new Color('#ffffff'));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(badgeText, new Rect(badgeX, badgeY + (badgeH - badgeFS) / 2 - EXPORT_SCALE, badgeW, badgeFS * 1.5));
};

// 裁剪圆形头像
const getCircleAvatar = async (title, imageUrl) => {
  if (!imageUrl) return null;
  const rawAvatar = await getCacheData(`avatar_raw_${title}.png`, imageUrl, false, 2);
  if (!rawAvatar) return null;
  const cache = useFileManager(false);
  const circleName = `avatar_circle_${title}.png`;
  const cached = cache.read(circleName);
  if (cached) return cached;
  try {
    const sz = Math.min(rawAvatar.size.width, rawAvatar.size.height);
    const wv = new WebView();
    await wv.loadHTML(`<canvas id="c" width="${sz}" height="${sz}"></canvas><script>const i=new Image();i.onload=()=>{const c=document.getElementById('c');const x=c.getContext('2d');x.beginPath();x.arc(${sz/2},${sz/2},${sz/2},0,Math.PI*2);x.clip();x.drawImage(i,0,0,${sz},${sz});document.body.setAttribute('d',c.toDataURL('image/png'));};i.src="data:image/png;base64,${Data.fromPNG(rawAvatar).toBase64String()}";</script>`);
    let b64 = "";
    for (let i = 0; i < 30; i++) {
      b64 = await wv.evaluateJavaScript("document.body.getAttribute('d')");
      if (b64) break;
      await new Promise(r => setTimeout(r, 50));
    }
    if (!b64) return rawAvatar;
    const img = Image.fromData(Data.fromBase64String(b64.replace(/^data:image\/\w+;base64,/, "")));
    cache.write(circleName, img);
    return img;
  } catch {
    return rawAvatar;
  }
};

/**
 * 智能筛选并绘制最多 3 个互不重叠的卡片
 */
const drawFeedbackInfoBoxes = async (
  ctx, 
  feedbackData, 
  project, 
  EXPORT_SCALE, 
  canvasW = 1000, 
  canvasH = 1000
) => {
  if (!feedbackData?.length) return;

  // 1. 基础尺寸与配置
  const titleFS = 13 * EXPORT_SCALE;
  const subFS = 10 * EXPORT_SCALE;
  const badgeFS = 8 * EXPORT_SCALE;
  const lineSpacing = 4 * EXPORT_SCALE;
  const padH = 6 * EXPORT_SCALE, padV = 5 * EXPORT_SCALE;
  const avatarSize = 34 * EXPORT_SCALE, arrowSize = 16 * EXPORT_SCALE, pointerSize = 22 * EXPORT_SCALE;
  const triW = 10 * EXPORT_SCALE, triH = 6 * EXPORT_SCALE;

  const loadBase64 = str => (str && Data.fromBase64String(str.trim())) ? Image.fromData(Data.fromBase64String(str.trim())) : null;
  const arrowImg = loadBase64(typhoonIcons?.arrow);
  const pointerImg = loadBase64(typhoonIcons?.blueCircle);

  // 💡【核心修复：权重分组 + 组内随机打乱】
  const shuffledData = [...feedbackData];
  for (let i = shuffledData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
  }
  
  const drawnRects = [];
  const TARGET_COUNT = 3; 
  let drawnCount = 0;

  for (const item of shuffledData) {
    if (drawnCount >= TARGET_COUNT) break; 
    const lat = parseFloat(item.lat), lon = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lon)) continue;
    const pos = project(lat, lon);
    if (isNaN(pos.x) || isNaN(pos.y)) continue;
    
    const margin = 10 * EXPORT_SCALE;
    if (pos.x < margin || pos.x > canvasW - margin || pos.y < margin || pos.y > canvasH - margin) {
      continue;
    }

    const titleText = item.title || "", subTitleText = item.subTitle || "";
    const badgeText = item.subscriptTypeLabel || item.subscriptType || "";
    
    // 2. 动态计算卡片尺寸
    const textW = Math.max(titleText.length * titleFS * 1.05, subTitleText.length * subFS * 1.05);
    const boxW = avatarSize + textW + arrowSize + padH * 6;
    const boxH = avatarSize + padV * 2;
    
    // 3. 计算坐标与智能贴边
    let boxX = pos.x - boxW / 2;
    let boxY = pos.y - boxH - triH - (pointerSize / 2);
    let isFlippedVertically = false;
    boxX = Math.max(margin, Math.min(boxX, canvasW - boxW - margin));
    if (boxY < margin) {
      boxY = pos.y + (pointerSize / 2) + triH;
      isFlippedVertically = true;
    }
    const currentCardRect = { x: boxX, y: boxY, width: boxW, height: boxH };
    
    // 💡 防重叠碰撞检测
    const safeGap = 12 * EXPORT_SCALE;
    if (drawnRects.some(rect => isOverlapping(currentCardRect, rect, safeGap))) {
      continue; 
    }
    
    drawnRects.push(currentCardRect);
    drawnCount++;

    // 4. 绘制主卡片背景
    const mainRectPath = new Path();
    mainRectPath.addRoundedRect(new Rect(boxX, boxY, boxW, boxH), boxH / 2, boxH / 2);
    ctx.setFillColor(new Color('#ffffff'));
    ctx.addPath(mainRectPath);
    ctx.fillPath();

    ctx.setStrokeColor(new Color('#e0e0e0'));
    ctx.setLineWidth(1 * EXPORT_SCALE);
    ctx.addPath(mainRectPath);
    ctx.strokePath();

    // 5. 绘制卡片指向小三角
    const triCenterX = Math.max(boxX + triW, Math.min(boxX + boxW - triW, pos.x));
    const triPath = new Path();
    let triTopY, triBottomY;

    if (!isFlippedVertically) {
      triTopY = boxY + boxH - (1 * EXPORT_SCALE);
      triBottomY = triTopY + triH;
      triPath.move(new Point(triCenterX - triW / 2, triTopY));
      triPath.addLine(new Point(triCenterX + triW / 2, triTopY));
      triPath.addLine(new Point(triCenterX, triBottomY));
    } else {
      triBottomY = boxY + (1 * EXPORT_SCALE);
      triTopY = triBottomY - triH;
      triPath.move(new Point(triCenterX - triW / 2, triBottomY));
      triPath.addLine(new Point(triCenterX + triW / 2, triBottomY));
      triPath.addLine(new Point(triCenterX, triTopY));
    }
    triPath.closeSubpath();
    ctx.setFillColor(new Color('#ffffff'));
    ctx.addPath(triPath);
    ctx.fillPath();

    const triBorder = new Path();
    if (!isFlippedVertically) {
      triBorder.move(new Point(triCenterX - triW / 2, triTopY));
      triBorder.addLine(new Point(triCenterX, triBottomY));
      triBorder.addLine(new Point(triCenterX + triW / 2, triTopY));
    } else {
      triBorder.move(new Point(triCenterX - triW / 2, triBottomY));
      triBorder.addLine(new Point(triCenterX, triTopY));
      triBorder.addLine(new Point(triCenterX + triW / 2, triBottomY));
    }
    ctx.addPath(triBorder);
    ctx.strokePath();

    // 6. 绘制左侧圆形头像
    const circleAvatar = await getCircleAvatar(item.title, item.imageUrl);
    if (circleAvatar) {
      ctx.drawImageInRect(circleAvatar, new Rect(boxX + padH, boxY + padV, avatarSize, avatarSize));
    }

    // 7. 绘制标题和副标题
    const textX = boxX + padH + avatarSize + 6 * EXPORT_SCALE;
    const startTextY = boxY + (boxH - (subTitleText ? titleFS + subFS + lineSpacing : titleFS)) / 2 - EXPORT_SCALE;
    const titleFont = Font.boldSystemFont(titleFS);
    ctx.setFont(titleFont);
    ctx.setTextColor(new Color('#38b6ff'));
    ctx.setTextAlignedLeft();
    ctx.drawTextInRect(titleText, new Rect(textX, startTextY, textW, titleFS * 1.2));
    if (subTitleText) {
      const subTitleFont = Font.systemFont(subFS);
      ctx.setFont(subTitleFont);
      ctx.setTextColor(new Color('#222222'));
      ctx.drawTextInRect(subTitleText, new Rect(textX, startTextY + titleFS + lineSpacing, textW, subFS * 1.2));
    }

    // 8. 绘制右侧箭头
    if (arrowImg) {
      ctx.drawImageInRect(arrowImg, new Rect(boxX + boxW - padH * 2 - arrowSize, boxY + (boxH - arrowSize) / 2, arrowSize, arrowSize));
    }

    // 9. 绘制右上角角标
    drawBadge(ctx, badgeText, item.subscriptType, boxX, boxY, boxW, badgeFS, EXPORT_SCALE);

    // 10. 绘制定位圆点
    if (pointerImg) {
      const ptrX = pos.x - pointerSize / 2;
      const ptrY = pos.y - pointerSize / 2;
      ctx.drawImageInRect(pointerImg, new Rect(ptrX, ptrY, pointerSize, pointerSize));
    }
  }
};

// 绘制逻辑
const generateMapImage = async (tcPoints = [], typhoons = [], isDay = 0, locationPoint = null, feedbackData = []) => {
  // 1. 台风与热带扰动列表（仅包含气象数据）
  const typhoonPoints = [
    ...tcPoints.map(p => ({ ...p, isTyphoon: false })),
    ...typhoons.map(p => ({ ...p, isTyphoon: true }))
  ];

  // 2. 结合 feedback 坐标计算地图视角
  const allViewPoints = [
    ...typhoonPoints,
    ...(feedbackData || []).map(f => ({ lat: f.lat, lng: f.lon }))
  ];

  const W = 364, H = 382, MAP_W = 546, MAP_H = 573, EXPORT_SCALE = 2 / 3, TILE = 256;
  const styles = isDay === 0 ? [6, 8] : [7], TILE_CACHE_HOURS = 24;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const getViewport = points => {
    if (!points || !points.length) {
      return { lng: 104.5, lat: 30.5, zoom: 3.5 };
    }
    const lngs = points.map(p => p.lng);
    const lats = points.map(p => p.lat);
    const maxLng = Math.max(...lngs);
    const minLng = Math.min(...lngs);
    const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const lngSpan = maxLng - minLng;
    const t = clamp((maxLng - 112) / 58, 0, 1);
    let centerLng = 117.5 + t * 14 + clamp((maxLng - 155) * 0.5, 0, 10);
    if (maxLng > 160) {
      const extra = (maxLng - 160) * 0.42;
      const spanFactor = clamp(1 - (lngSpan - 30) / 50, 0.35, 1);
      centerLng += extra * spanFactor;
    }
    const OFFSET_EAST = 3.5; 
    centerLng = clamp(centerLng + OFFSET_EAST, 112, 165);
    let centerLat = 21.5 + (avgLat - 22.5) * 0.12;
    const OFFSET_NORTH = 2.0; 
    centerLat = clamp(centerLat + OFFSET_NORTH, 19.5, 27.0);
    let zoom = 4.15 - 1.25 * Math.pow(t, 0.72);
    if (maxLng > 165) zoom = Math.max(zoom, 3.02);
    if (lngSpan > 50) zoom -= 0.08 * clamp((lngSpan - 50) / 30, 0, 1);
    zoom = clamp(zoom, 2.95, 4.4);
    if (zoom < 3.5) centerLng = Math.max(centerLng, 132.2);
    return { lng: centerLng, lat: centerLat, zoom };
  };

  const viewport = getViewport(typhoonPoints);
  const z = Math.round(viewport.zoom);
  const { tiles, images } = await prepareTiles(viewport, styles, TILE_CACHE_HOURS);
  const radarImage = await getRadarImage();
  const fractionalScale = Math.pow(2, viewport.zoom - z);
  const centerX = lngToWorldX(viewport.lng, z), centerY = latToWorldY(viewport.lat, z);
  const worldSize = TILE * Math.pow(2, z) * fractionalScale * EXPORT_SCALE;

  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = true;
  ctx.respectScreenScale = true;
  ctx.setFillColor(new Color('#80bde3'));
  ctx.fillRect(new Rect(0, 0, W, H));

  const worldToScreen = (wx, wy) => ({
    x: ((wx - centerX) * fractionalScale + MAP_W / 2) * EXPORT_SCALE,
    y: ((wy - centerY) * fractionalScale + MAP_H / 2) * EXPORT_SCALE
  });
  const project = (lat, lng) => {
    const { x, y } = worldToScreen(lngToWorldX(lng, z), latToWorldY(lat, z));
    return new Point(x, y);
  };

  const drawTiles = style => {
    const OVERLAP = .75, ox = OVERLAP / 2, size = TILE * fractionalScale * EXPORT_SCALE;
    for (const tile of tiles) {
      const image = images.get(`${tile.z}/${tile.x}/${tile.y}/${style}`);
      if (!image) continue;
      let { x, y } = worldToScreen(tile.x * TILE, tile.y * TILE);
      while (x + size < 0) x += worldSize;
      while (x > W) x -= worldSize;
      ctx.drawImageInRect(image, new Rect(x - ox, y - ox, size + OVERLAP, size + OVERLAP));
      if (x + size < 0) ctx.drawImageInRect(image, new Rect(x + worldSize - ox, y - ox, size + OVERLAP, size + OVERLAP));
      if (x > W - size) ctx.drawImageInRect(image, new Rect(x - worldSize - ox, y - ox, size + OVERLAP, size + OVERLAP));
    }
  };
  drawTiles(styles[0]);
  if (styles.length > 1) drawTiles(styles[1]);

  if (radarImage) {
    const radarRange = [
      [12.316339, 69.646079],
      [54.376029, 140.209411]
    ];
    const radarNW = project(
      radarRange[1][0], 
      radarRange[0][1]
    );
    const radarSE = project(
      radarRange[0][0], 
      radarRange[1][1]
    );
    const radarRect = new Rect(radarNW.x, radarNW.y, radarSE.x - radarNW.x, radarSE.y - radarNW.y);
    ctx.drawImageInRect(radarImage, radarRect);
  }
  
  const drawPath = (points, color, width, opacity, dash) => {
    if (points.length < 2) return;
    ctx.setStrokeColor(new Color(color, opacity));
    ctx.setLineWidth(width * EXPORT_SCALE);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (!dash) {
        const path = new Path();
        path.move(a); path.addLine(b);
        ctx.addPath(path); ctx.strokePath();
        continue;
      }
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (!len) continue;
      const ux = dx / len, uy = dy / len;
      let pos = 0, draw = true;
      while (pos < len) {
        const step = (draw ? dash[0] : dash[1]) * EXPORT_SCALE;
        const end = Math.min(pos + step, len);
        if (draw) {
          const path = new Path();
          path.move(new Point(a.x + ux * pos, a.y + uy * pos));
          path.addLine(new Point(a.x + ux * end, a.y + uy * end));
          ctx.addPath(path); ctx.strokePath();
        }
        pos = end; draw = !draw;
      }
    }
  };

  const warnLineConfig = [
    { color: '#ff0000', weight: 1.5, opacity: .8, points: [[0, 105], [4.5, 113], [11, 119], [18, 119], [22, 127], [34, 127]] },
    { color: '#008000', weight: 1.5, opacity: .9, dashArray: [8, 2], points: [[0, 105], [0, 120], [15, 132], [34, 132]] }
  ];
  for (const item of warnLineConfig) {
    drawPath(item.points.map(p => project(p[0], p[1])), item.color, item.weight, item.opacity, item.dashArray);
  }

  // 1. 仅对标记为台风的点绘制风圈与预测路径
  for (const p of typhoonPoints) {
    if (p.isTyphoon) {
      drawWindCircles(ctx, p, project, EXPORT_SCALE);
      drawForecastPath(ctx, p, project, EXPORT_SCALE, drawPath);
    }
  }
  
  // 3. 仅对台风/热带扰动绘制图标（不再混入 feedbackData）
  for (const p of typhoonPoints) {
    const pos = project(p.lat, p.lng);
    const ICON_SIZE = (p.isTyphoon ? 40 : 42) * EXPORT_SCALE;
    const iconImage = p.isTyphoon ? p.icon : tcIcon;
    if (iconImage) {
      ctx.drawImageInRect(iconImage, new Rect(pos.x - ICON_SIZE / 2, pos.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE));
    }
    
    const name = p.name || p.ename;
    if (name) {
      const fs = 11 * EXPORT_SCALE;
      const textColor = new Color(isDay === 1 ? '#555555' : '#eeeeee');
      ctx.setFont(Font.systemFont(fs));
      ctx.setTextColor(textColor);
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(name, new Rect(pos.x - 100, pos.y + ICON_SIZE / 2 + 2 * EXPORT_SCALE, 200, fs * 1.5));
    }
  }
  
  // 5. 绘制登陆点旗帜标记
  const flagBase64 = typhoonIcons.flag;
  const flagIcon = flagBase64 ? Image.fromData(Data.fromBase64String(flagBase64)) : null;
  for (const p of typhoonPoints) {
    if (p.isTyphoon) drawLandingFlags(ctx, p, flagIcon, project, EXPORT_SCALE);
  }
  
  // 4. 绘制当前定位图标
  if (locationPoint) {
    const locKey = isDay === 1 ? 'loc_light' : 'loc_night';
    const locBase64 = typhoonIcons[locKey];
    if (locBase64) {
      const locImg = Image.fromData(Data.fromBase64String(locBase64));
      const locPos = project(locationPoint.lat, locationPoint.lon);
      const LOC_W = 22 * EXPORT_SCALE; 
      const LOC_H = 33 * EXPORT_SCALE; 
      const BOTTOM_PADDING = 3.3 * EXPORT_SCALE; 
      ctx.drawImageInRect(locImg, new Rect(locPos.x - LOC_W / 2, locPos.y - LOC_H + BOTTOM_PADDING, LOC_W, LOC_H));
    }
  }

  // 5. 绘制登陆 location 提示框（最顶层）
  for (const p of typhoonPoints) {
    if (p.isTyphoon && p.land && p.land.length > 0 && p.latest && p.latest.location) {
      const pos = project(p.lat, p.lng);
      const ICON_SIZE = 40 * EXPORT_SCALE;
      drawLandInfoBox(ctx, pos, p.latest.location, ICON_SIZE, EXPORT_SCALE);
    }
  }

  // 6. 出行推荐提示框绘制
  await drawFeedbackInfoBoxes(ctx, feedbackData, project, EXPORT_SCALE, 1000, 1000);

  return ctx.getImage();
};

// 1. 你的 JSON 反馈/推荐数据
const feedbackJson = await getCacheData('travelRecommend.json', 'https://tf03.istrongcloud.com/data/travelRecommend/data.json', 'json', 1);
// 显示接口返回的所有城市/卡片数据
const feedbackData = feedbackJson.data ?? [];

// 2. 热带扰动与台风测试数据...
const tcPoints = []
// [{ id: 3, ename: '98w', lat: 15, lng: 149.2 }];
const data = 
[{"speed":12,"move_dir":"南西南","move_speed":20,"time":"2026-08-30T08:00:00","lat":24.4,"strong":"热带低压(TD)","power":6,"lng":111.8,"pressure":998,"land":[{"land_time":"2026-08-28T08:05:00","wind_grade":12,"lng":"121.295443","wind_speed":35,"position":"浙江省台州玉环市坎门街道沿海","pressure":975,"lat":"28.098484"}],"latest":{"speed":18,"lon":164.8,"tm":"2026-08-30T11:00:00","tfbh":"202622","lat":30.9,"strong":"热带风暴","power":8,"location":"位于广西梧州市境内"},"forecast":[]}];


const locationPoint = { lat: 19.9992, lon: 110.5292 };

const typhoons = data.map(item => {
  const type = item.strong?.match(/\((.*?)\)/)?.[1];
  const base64 = typhoonIcons[type];
  const icon = base64 ? Image.fromData(Data.fromBase64String(base64)) : null;
  return {...item, icon};
});

// 传入 feedbackData
const isDay = 1;
const image = await generateMapImage(tcPoints, typhoons, isDay, locationPoint, feedbackData);

if (image) {
  const widget = new ListWidget();
  widget.backgroundImage = image;
  if (config.runsInWidget) Script.setWidget(widget);
  else widget.presentLarge();
}
Script.complete();